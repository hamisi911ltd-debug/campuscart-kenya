// Cloudflare Pages Function - refresh ONE imported product's full details (admin-only).
// Re-reads the product's Kilimall listing and rebuilds its description: the seller's text,
// every specification, the available options and what's in the box. The admin page calls
// this for every product ("Add more details to all products"). Nothing else on the product
// (name, price, photos, category) is touched.
import { enforceAdminDomain } from "../_lib/adminDomain";
import { hasPermission } from "../_lib/teamAuth";
import { fetchKilimallHtml, parseProductPage } from "../_lib/kilimall";
import { ensureSourceTables, getSourceForProduct } from "../_lib/productSources";

interface Env {
  DB: D1Database;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

export async function onRequestPost(context: { env: Env; request: Request }) {
  const { env, request } = context;

  const domainCheck = enforceAdminDomain(request);
  if (domainCheck) return domainCheck;
  if (!(await hasPermission(request, env, "products"))) return json({ error: "Unauthorized" }, 401);

  try {
    const body = await request.json() as { productId?: string };
    const productId = String(body.productId || "");
    await ensureSourceTables(env);

    const product = await env.DB.prepare("SELECT id, title, description FROM products WHERE id = ?")
      .bind(productId)
      .first<{ id: string; title: string; description: string | null }>();
    if (!product) return json({ error: "Product not found" }, 404);

    const source = await getSourceForProduct(env, productId);
    if (!source) return json({ skipped: true, reason: "Not a Kilimall import" });

    const listing = parseProductPage(await fetchKilimallHtml(`/listing/${source.listing_id}`), source.listing_id);
    const fresh = (listing.description || "").trim();
    if (fresh.length < 20) return json({ skipped: true, reason: "The listing has no extra details" });

    const before = (product.description || "").length;
    await env.DB.prepare("UPDATE products SET description = ?, updated_at = ? WHERE id = ?")
      .bind(fresh, new Date().toISOString(), productId)
      .run();

    return json({ success: true, charsBefore: before, charsAfter: fresh.length });
  } catch (error) {
    console.error("Enrich details error:", error);
    return json({ error: error instanceof Error ? error.message : "Could not refresh details" }, 502);
  }
}
