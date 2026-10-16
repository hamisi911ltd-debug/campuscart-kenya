// Source tracking + stock enquiries for imported products.
//
// `products` has no columns for "where did this come from", and adding them
// would need a migration run against the live database. These two tables are
// created on demand (CREATE TABLE IF NOT EXISTS) so nothing has to be run by
// hand.
//
//  - product_sources: one row per imported product - the original listing,
//    what it cost at the source, the markup applied, and the last live check.
//  - product_enquiries: a customer asking "is this in stock?" before paying.

interface DbEnv {
  DB: D1Database;
}

let ensured = false;

export async function ensureSourceTables(env: DbEnv): Promise<void> {
  if (ensured) return;
  await env.DB.batch([
    env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS product_sources (
        product_id TEXT PRIMARY KEY,
        source TEXT NOT NULL DEFAULT 'kilimall',
        listing_id TEXT NOT NULL,
        source_url TEXT NOT NULL,
        source_price REAL,
        source_list_price REAL,
        markup_percent REAL,
        source_stock INTEGER,
        in_stock INTEGER,
        checked_at TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `),
    env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS product_enquiries (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL,
        product_title TEXT,
        user_id TEXT,
        name TEXT,
        phone TEXT NOT NULL,
        message TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        reply TEXT,
        auto_checked INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        answered_at TEXT
      )
    `),
    env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_enquiries_product ON product_enquiries(product_id)`),
    env.DB.prepare(`CREATE INDEX IF NOT EXISTS idx_enquiries_phone ON product_enquiries(phone, created_at)`),
  ]);
  ensured = true;
}

export const kilimallListingUrl = (listingId: string) => `https://www.kilimall.co.ke/listing/${listingId}`;

/**
 * Imported photos are stored as products/km-<listingId>-<n>-<rand>.<ext>, so
 * products imported before source tracking existed can still be traced back
 * to their Kilimall listing.
 */
export function listingIdFromImages(images: unknown): string | null {
  if (typeof images !== "string") return null;
  const match = images.match(/\/km-(\d+)-/);
  return match ? match[1] : null;
}

export interface SourceInfo {
  listing_id: string;
  source_url: string;
  source_price: number | null;
  source_list_price: number | null;
  markup_percent: number | null;
  source_stock: number | null;
  in_stock: number | null;
  checked_at: string | null;
}

/** Source row for a product, falling back to the id embedded in its photo keys. */
export async function getSourceForProduct(env: DbEnv, productId: string): Promise<SourceInfo | null> {
  await ensureSourceTables(env);
  const row = await env.DB.prepare("SELECT * FROM product_sources WHERE product_id = ?")
    .bind(productId)
    .first<SourceInfo>();
  if (row) return row;

  const product = await env.DB.prepare("SELECT images FROM products WHERE id = ?")
    .bind(productId)
    .first<{ images: string | null }>();
  const listingId = listingIdFromImages(product?.images);
  if (!listingId) return null;
  return {
    listing_id: listingId,
    source_url: kilimallListingUrl(listingId),
    source_price: null,
    source_list_price: null,
    markup_percent: null,
    source_stock: null,
    in_stock: null,
    checked_at: null,
  };
}
