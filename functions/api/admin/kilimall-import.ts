// Cloudflare Pages Function - import ONE Kilimall product into the catalog
// (admin-only). The admin page calls this once per selected product so each
// request stays well inside Workers' subrequest limit (1 page fetch + up to
// 8 image downloads).
//
// Product photos are downloaded and re-hosted on this site's own R2 bucket
// (served at /api/images/...) instead of hotlinking Kilimall's CDN, so
// listings don't break when Kilimall rotates image URLs.
import { OWNER_ID, ensureOwnerUser } from "../_lib/owner";
import { enforceAdminDomain } from "../_lib/adminDomain";
import { hasPermission } from "../_lib/teamAuth";
import { fetchKilimallHtml, parseProductPage } from "../_lib/kilimall";
import { ensureSourceTables, kilimallListingUrl } from "../_lib/productSources";

interface Env {
  DB: D1Database;
  STORAGE: R2Bucket;
}

const VALID_CATEGORIES = new Set([
  "phones", "electronics", "computing", "appliances", "fashion",
  "home", "beauty", "baby", "gaming", "watches",
]);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

async function rehostImage(env: Env, listingId: string, sourceUrl: string, index: number): Promise<string | null> {
  try {
    const response = await fetch(sourceUrl, { headers: { Referer: "https://www.kilimall.co.ke/" } });
    if (!response.ok || !response.body) return null;

    const contentType = (response.headers.get("Content-Type") || "image/jpeg").split(";")[0];
    if (!contentType.startsWith("image/")) return null;
    const extension = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
    // "o" after the index marks the photo as already compressed (see optimize-images.ts).
    const key = `products/km-${listingId}-${index}o-${Math.random().toString(36).slice(2, 8)}.${extension}`;

    await env.STORAGE.put(key, response.body, { httpMetadata: { contentType } });
    return `/api/images/${key}`;
  } catch (err) {
    console.error(`Failed to rehost image ${sourceUrl}:`, err);
    return null;
  }
}

export async function onRequestPost(context: { env: Env; request: Request }) {
  const { env, request } = context;

  const domainCheck = enforceAdminDomain(request);
  if (domainCheck) return domainCheck;

  if (!(await hasPermission(request, env, "products"))) {
    return json({ error: "Unauthorized" }, 401);
  }

  try {
    const body = await request.json() as {
      listingId?: string;
      category?: string;
      markupPercent?: number;
      fallbackPrice?: number;
    };
    const listingId = String(body.listingId || "").trim();
    const category = body.category || "";
    const markup = Math.min(Math.max(Number(body.markupPercent) || 0, 0), 500);

    if (!/^\d{3,15}$/.test(listingId)) return json({ error: "Invalid Kilimall listing id" }, 400);
    if (!VALID_CATEGORIES.has(category)) return json({ error: `Unknown category "${category}"` }, 400);

    // Already imported? (see kilimall-search.ts for how this is detected)
    const existing = await env.DB.prepare("SELECT id FROM products WHERE images LIKE ? LIMIT 1")
      .bind(`%/km-${listingId}-%`)
      .first<{ id: string }>();
    if (existing) return json({ error: "Already imported", id: existing.id, duplicate: true }, 409);

    const product = parseProductPage(await fetchKilimallHtml(`/listing/${listingId}`), listingId);

    const sourcePrice = product.price ?? Number(body.fallbackPrice) ?? 0;
    if (!(sourcePrice > 0)) return json({ error: "Could not determine a price for this product" }, 422);
    const sellPrice = Math.round(sourcePrice * (1 + markup / 100));

    const hosted = (await Promise.all(
      product.images.map((url, i) => rehostImage(env, listingId, url, i))
    )).filter((url): url is string => Boolean(url));

    if (hosted.length === 0) return json({ error: "Could not download any product images" }, 502);

    await ensureOwnerUser(env);
    await ensureSourceTables(env);

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await env.DB.prepare(
      `INSERT INTO products (id, seller_id, title, description, category, price, original_price, image_url, images, quantity_available, location, rating, reviews_count, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, NULL, 0, 0, ?, ?)`
    ).bind(
      id,
      OWNER_ID,
      product.title,
      product.description || product.title,
      category,
      sellPrice,
      hosted[0],
      JSON.stringify(hosted),
      10,
      now,
      now
    ).run();

    // Remember where it came from and what it cost, so the admin can open the
    // original listing, see the margin, and re-check price/stock before buying.
    await env.DB.prepare(
      `INSERT OR REPLACE INTO product_sources
        (product_id, source, listing_id, source_url, source_price, source_list_price, markup_percent, source_stock, in_stock, checked_at)
       VALUES (?, 'kilimall', ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id,
      listingId,
      kilimallListingUrl(listingId),
      sourcePrice,
      product.listPrice,
      markup,
      product.stock,
      product.inStock === null ? null : product.inStock ? 1 : 0,
      now
    ).run();

    return json({ success: true, id, title: product.title, price: sellPrice, images: hosted.length }, 201);
  } catch (error) {
    console.error("Kilimall import error:", error);
    return json({ error: error instanceof Error ? error.message : "Import failed" }, 502);
  }
}
