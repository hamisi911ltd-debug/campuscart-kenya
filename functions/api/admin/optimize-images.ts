// Cloudflare Pages Function - re-download ONE imported product's photos in a
// compressed form (admin-only), replacing the heavy originals in R2.
//
// Photos imported earlier were saved at up to ~800 KB each, so product grids
// took several seconds to fill in. Kilimall's image CDN can return the same
// picture at 640-720 px and a quality cap for ~60 KB, so this re-fetches the
// product's listing, downloads the compressed set, and swaps the product over
// to it (the old files stay, so order history keeps its pictures). Called once per product by the admin page
// (stays well inside Workers' subrequest limit).
import { enforceAdminDomain } from "../_lib/adminDomain";
import { hasPermission } from "../_lib/teamAuth";
import { fetchKilimallHtml, parseProductPage } from "../_lib/kilimall";
import { listingIdFromImages } from "../_lib/productSources";

interface Env {
  DB: D1Database;
  STORAGE: R2Bucket;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const isOptimizedKey = (images: string | null) => !!images && /\/km-\d+-\d+o-/.test(images);

export async function onRequestPost(context: { env: Env; request: Request }) {
  const { env, request } = context;

  const domainCheck = enforceAdminDomain(request);
  if (domainCheck) return domainCheck;
  if (!(await hasPermission(request, env, "products"))) return json({ error: "Unauthorized" }, 401);

  try {
    const body = await request.json() as { productId?: string };
    const productId = String(body.productId || "");
    const product = await env.DB.prepare("SELECT id, images, image_url FROM products WHERE id = ?")
      .bind(productId)
      .first<{ id: string; images: string | null; image_url: string | null }>();
    if (!product) return json({ error: "Product not found" }, 404);

    const listingId = listingIdFromImages(product.images);
    if (!listingId) return json({ skipped: true, reason: "Not a Kilimall import" });
    if (isOptimizedKey(product.images)) return json({ skipped: true, reason: "Already optimized" });

    const listing = parseProductPage(await fetchKilimallHtml(`/listing/${listingId}`), listingId);

    const downloaded = (await Promise.all(
      listing.images.map(async (sourceUrl, index) => {
        try {
          const response = await fetch(sourceUrl, { headers: { Referer: "https://www.kilimall.co.ke/" } });
          if (!response.ok || !response.body) return null;
          const contentType = (response.headers.get("Content-Type") || "image/webp").split(";")[0];
          if (!contentType.startsWith("image/")) return null;
          const extension = contentType.includes("png") ? "png" : contentType.includes("jpeg") ? "jpg" : "webp";
          const key = `products/km-${listingId}-${index}o-${Math.random().toString(36).slice(2, 8)}.${extension}`;
          await env.STORAGE.put(key, response.body, { httpMetadata: { contentType } });
          return { key, url: `/api/images/${key}` };
        } catch (err) {
          console.error(`Optimize: failed to download ${sourceUrl}:`, err);
          return null;
        }
      })
    )).filter((x): x is { key: string; url: string } => Boolean(x));

    if (downloaded.length === 0) return json({ error: "Could not download the compressed photos" }, 502);

    // Point the product at the new photos first, then clear out the old files.
    const urls = downloaded.map((d) => d.url);
    await env.DB.prepare("UPDATE products SET image_url = ?, images = ?, updated_at = ? WHERE id = ?")
      .bind(urls[0], JSON.stringify(urls), new Date().toISOString(), productId)
      .run();

    // The old files are deliberately left in R2: past orders store the image
    // URL they were bought with, and deleting it would blank those orders.
    return json({ success: true, images: urls.length });
  } catch (error) {
    console.error("Optimize images error:", error);
    return json({ error: error instanceof Error ? error.message : "Optimize failed" }, 502);
  }
}
