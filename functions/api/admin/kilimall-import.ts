// Cloudflare Pages Function - import ONE Kilimall product into the catalog
// (admin-only). Called once per selected product by the admin page.
//
// Product photos are copied into our own R2 storage in two sizes (400px for
// cards, 1200px for the product page) and served from our domain with
// immutable, one-year caching - so pages never wait on, or break with, the
// source site. The cover photo's width is measured and photos under 500px are
// rejected (they'd look blurry).
import { OWNER_ID, ensureOwnerUser } from "../_lib/owner";
import { enforceAdminDomain } from "../_lib/adminDomain";
import { hasPermission } from "../_lib/teamAuth";
import { fetchKilimallHtml, parseProductPage } from "../_lib/kilimall";
import { ensureSourceTables, kilimallListingUrl } from "../_lib/productSources";
import { findImportedListingIds } from "../_lib/kilimallDiscover";
import { MIN_COVER_WIDTH, copyPhotoToStorage } from "../_lib/imageStore";

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

    await ensureSourceTables(env);

    // Already imported?
    if ((await findImportedListingIds(env, [listingId])).has(listingId)) {
      const existing = await env.DB.prepare("SELECT product_id FROM product_sources WHERE listing_id = ?")
        .bind(listingId)
        .first<{ product_id: string }>();
      return json({ error: "Already imported", id: existing?.product_id, duplicate: true }, 409);
    }

    const product = parseProductPage(await fetchKilimallHtml(`/listing/${listingId}`), listingId);

    const sourcePrice = product.price ?? Number(body.fallbackPrice) ?? 0;
    if (!(sourcePrice > 0)) return json({ error: "Could not determine a price for this product" }, 422);
    const sellPrice = Math.round(sourcePrice * (1 + markup / 100));

    if (product.images.length === 0) return json({ error: "This listing has no photos" }, 422);

    // Copy every photo into our storage (cover first - it decides acceptance).
    const stored = (await Promise.all(
      product.images.map((source, i) => copyPhotoToStorage(env, source, `km-${listingId}-${i}`))
    ));
    const cover = stored[0];
    if (!cover) return json({ error: "Could not download the cover photo" }, 502);
    if (cover.width !== null && cover.width < MIN_COVER_WIDTH) {
      return json({ error: `Cover photo is only ${cover.width}px wide (needs ${MIN_COVER_WIDTH}px+) - skipped`, tooSmall: true }, 422);
    }
    const photoUrls = stored.filter((p): p is NonNullable<typeof p> => Boolean(p)).map((p) => p.url);

    await ensureOwnerUser(env);

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
      photoUrls[0],
      JSON.stringify(photoUrls),
      10,
      now,
      now
    ).run();

    // Remember where it came from and what it cost, so the admin can open the
    // original listing, see the margin, and re-check price/stock before buying.
    await env.DB.prepare(
      `INSERT OR REPLACE INTO product_sources
        (product_id, source, listing_id, source_url, source_price, source_list_price, markup_percent, source_stock, in_stock, checked_at, image_width)
       VALUES (?, 'kilimall', ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id,
      listingId,
      kilimallListingUrl(listingId),
      sourcePrice,
      product.listPrice,
      markup,
      product.stock,
      product.inStock === null ? null : product.inStock ? 1 : 0,
      now,
      cover.width
    ).run();

    return json({ success: true, id, title: product.title, price: sellPrice, images: photoUrls.length, coverWidth: cover.width }, 201);
  } catch (error) {
    console.error("Kilimall import error:", error);
    return json({ error: error instanceof Error ? error.message : "Import failed" }, 502);
  }
}
