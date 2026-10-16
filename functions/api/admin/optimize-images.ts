// Cloudflare Pages Function - move ONE imported product's photos into our own
// fast storage (admin-only).
//
// Older products point at heavy copies in R2 (up to ~800 KB each, single
// size) or, briefly, straight at the source site's image server. This re-reads
// the product's Kilimall listing and stores each photo in our R2 at two sizes
// (400px for cards, 1200px for the product page) with immutable caching, then
// points the product at them. The previous files are left in place, because
// past orders keep the image URL they were bought with.
import { enforceAdminDomain } from "../_lib/adminDomain";
import { hasPermission } from "../_lib/teamAuth";
import { fetchKilimallHtml, parseProductPage } from "../_lib/kilimall";
import { copyPhotoToStorage } from "../_lib/imageStore";
import { ensureSourceTables, kilimallListingUrl, listingIdFromImages } from "../_lib/productSources";

interface Env {
  DB: D1Database;
  STORAGE: R2Bucket;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const alreadyOptimized = (images: string | null) => !!images && images.includes("-1200-");

export async function onRequestPost(context: { env: Env; request: Request }) {
  const { env, request } = context;

  const domainCheck = enforceAdminDomain(request);
  if (domainCheck) return domainCheck;
  if (!(await hasPermission(request, env, "products"))) return json({ error: "Unauthorized" }, 401);

  try {
    const body = await request.json() as { productId?: string };
    const productId = String(body.productId || "");
    await ensureSourceTables(env);

    const product = await env.DB.prepare("SELECT id, images FROM products WHERE id = ?")
      .bind(productId)
      .first<{ id: string; images: string | null }>();
    if (!product) return json({ error: "Product not found" }, 404);
    if (alreadyOptimized(product.images)) return json({ skipped: true, reason: "Already optimized" });

    // The listing id comes from the source row, or from the old R2 file names.
    const source = await env.DB.prepare("SELECT listing_id FROM product_sources WHERE product_id = ?")
      .bind(productId)
      .first<{ listing_id: string }>();
    const listingId = source?.listing_id || listingIdFromImages(product.images);
    if (!listingId) return json({ skipped: true, reason: "Not a Kilimall import" });

    const listing = parseProductPage(await fetchKilimallHtml(`/listing/${listingId}`), listingId);
    const stored = await Promise.all(
      listing.images.map((src, i) => copyPhotoToStorage(env, src, `km-${listingId}-${i}`))
    );
    const photos = stored.filter((p): p is NonNullable<typeof p> => Boolean(p));
    if (photos.length === 0) return json({ error: "Could not download the photos from the listing" }, 502);

    // Make sure the source row exists BEFORE the old file names (the only
    // link back to the listing for old products) are replaced.
    await env.DB.prepare(
      `INSERT OR IGNORE INTO product_sources (product_id, source, listing_id, source_url) VALUES (?, 'kilimall', ?, ?)`
    ).bind(productId, listingId, kilimallListingUrl(listingId)).run();
    await env.DB.prepare("UPDATE product_sources SET image_width = ? WHERE product_id = ?")
      .bind(photos[0].width, productId).run();

    const urls = photos.map((p) => p.url);
    await env.DB.prepare("UPDATE products SET image_url = ?, images = ?, updated_at = ? WHERE id = ?")
      .bind(urls[0], JSON.stringify(urls), new Date().toISOString(), productId)
      .run();

    return json({ success: true, images: urls.length, coverWidth: photos[0].width });
  } catch (error) {
    console.error("Optimize images error:", error);
    return json({ error: error instanceof Error ? error.message : "Could not move the photos" }, 502);
  }
}
