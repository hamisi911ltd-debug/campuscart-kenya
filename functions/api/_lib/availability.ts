// Live availability check against the original Kilimall listing.
// Used by checkout (so nobody pays for something the supplier has run out of) and by the
// /api/availability endpoint the checkout page calls to tell the customer up front.
import { fetchKilimallHtml, parseProductPage } from "./kilimall";
import { ensureSourceTables, listingIdFromImages } from "./productSources";

interface Env {
  DB: D1Database;
}

export type Availability = "available" | "unavailable" | "unknown";

export interface AvailabilityResult {
  product_id: string;
  title: string;
  status: Availability;
  stock: number | null;
}

// Listings checked in the last few minutes are not fetched again, so a busy checkout (or someone
// pressing the button repeatedly) does not hammer Kilimall.
const CACHE_MS = 3 * 60 * 1000;
const cache = new Map<string, { at: number; status: Availability; stock: number | null }>();
export const resetAvailabilityCache = () => cache.clear();

/** Checks each product's live Kilimall listing. A product that is not a Kilimall import, or whose
 *  listing cannot be read right now, is "unknown" - and unknown never blocks an order. */
export async function checkLiveAvailability(env: Env, productIds: string[]): Promise<AvailabilityResult[]> {
  try { await ensureSourceTables(env); } catch { /* checked per product below */ }

  const out: AvailabilityResult[] = [];
  for (const productId of productIds) {
    let title = "This item";
    let status: Availability = "unknown";
    let stock: number | null = null;
    try {
      const product = await env.DB.prepare("SELECT title, images FROM products WHERE id = ?")
        .bind(productId).first<{ title: string; images: string | null }>();
      if (product?.title) title = product.title;
      const source = await env.DB.prepare("SELECT listing_id FROM product_sources WHERE product_id = ?")
        .bind(productId).first<{ listing_id: string }>();
      const listingId = source?.listing_id || (product ? listingIdFromImages(product.images) : null);

      if (listingId) {
        const hit = cache.get(listingId);
        if (hit && Date.now() - hit.at < CACHE_MS) {
          status = hit.status;
          stock = hit.stock;
        } else {
          const live = parseProductPage(await fetchKilimallHtml(`/listing/${listingId}`), listingId);
          if (live.inStock === true) status = "available";
          else if (live.inStock === false) status = "unavailable";
          stock = live.stock;
          cache.set(listingId, { at: Date.now(), status, stock });
          // remember what we saw, so the admin sees it too
          try {
            await env.DB.prepare("UPDATE product_sources SET source_stock = ?, in_stock = ?, checked_at = ? WHERE product_id = ?")
              .bind(live.stock, live.inStock === null ? null : live.inStock ? 1 : 0, new Date().toISOString(), productId).run();
          } catch { /* not essential */ }
        }
      }
    } catch (err) {
      console.error(`Availability check failed for ${productId}:`, err);
    }
    out.push({ product_id: productId, title, status, stock });
  }
  return out;
}
