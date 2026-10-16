// Cloudflare Pages Function - live-check one imported product against its
// original Kilimall listing (admin-only). Reports Kilimall's current price
// and stock so the admin can verify before buying, and can optionally apply
// the new price (cost + the product's markup) to the store listing.
import { enforceAdminDomain } from "../_lib/adminDomain";
import { hasPermission } from "../_lib/teamAuth";
import { fetchKilimallHtml, parseProductPage } from "../_lib/kilimall";
import { ensureSourceTables, getSourceForProduct } from "../_lib/productSources";
import { MARKUP_PERCENT, sellPriceFor } from "../_lib/pricing";

interface Env {
  DB: D1Database;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

export async function onRequestPost(context: { env: Env; request: Request }) {
  const { env, request } = context;

  const domainCheck = enforceAdminDomain(request);
  if (domainCheck) return domainCheck;

  if (!(await hasPermission(request, env, "products"))) {
    return json({ error: "Unauthorized" }, 401);
  }

  try {
    const body = await request.json() as { productId?: string; apply?: boolean };
    const productId = String(body.productId || "");
    if (!productId) return json({ error: "productId is required" }, 400);

    await ensureSourceTables(env);

    const product = await env.DB.prepare("SELECT id, price FROM products WHERE id = ?")
      .bind(productId)
      .first<{ id: string; price: number }>();
    if (!product) return json({ error: "Product not found" }, 404);

    const source = await getSourceForProduct(env, productId);
    if (!source) return json({ error: "This product wasn't imported from Kilimall" }, 404);

    const live = parseProductPage(await fetchKilimallHtml(`/listing/${source.listing_id}`), source.listing_id);
    const now = new Date().toISOString();
    const markup = MARKUP_PERCENT;
    const suggestedPrice = live.price ? sellPriceFor(live.price) : null;

    // Always record what Kilimall says right now; make sure legacy products
    // (imported before tracking existed) get a row so they're tracked too.
    await env.DB.prepare(
      `INSERT OR IGNORE INTO product_sources (product_id, source, listing_id, source_url, markup_percent)
       VALUES (?, 'kilimall', ?, ?, ?)`
    ).bind(productId, source.listing_id, source.source_url, markup).run();

    await env.DB.prepare(
      `UPDATE product_sources
       SET source_stock = ?, in_stock = ?, checked_at = ?, source_list_price = ?
       WHERE product_id = ?`
    ).bind(
      live.stock,
      live.inStock === null ? null : live.inStock ? 1 : 0,
      now,
      live.listPrice,
      productId
    ).run();

    let applied = false;
    let currentPrice = product.price;
    if (body.apply && live.price && suggestedPrice) {
      await env.DB.prepare("UPDATE product_sources SET source_price = ?, markup_percent = ? WHERE product_id = ?")
        .bind(live.price, markup, productId).run();
      await env.DB.prepare("UPDATE products SET price = ?, updated_at = ? WHERE id = ?")
        .bind(suggestedPrice, now, productId).run();
      currentPrice = suggestedPrice;
      applied = true;
    }

    return json({
      success: true,
      applied,
      checkedAt: now,
      url: source.source_url,
      live: {
        title: live.title,
        price: live.price,
        listPrice: live.listPrice,
        stock: live.stock,
        inStock: live.inStock,
      },
      recordedCost: applied ? live.price : source.source_price,
      markupPercent: markup,
      storePrice: currentPrice,
      suggestedPrice,
    });
  } catch (error) {
    console.error("Kilimall check error:", error);
    return json({ error: error instanceof Error ? error.message : "Could not check Kilimall" }, 502);
  }
}
