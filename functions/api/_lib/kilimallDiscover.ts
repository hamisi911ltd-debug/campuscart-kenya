// Helpers shared by the Kilimall search and "Discover" endpoints.
import { ensureSourceTables } from "./productSources";

/**
 * Which of these listings were already imported? Products imported now have a
 * product_sources row; ones imported earlier are recognised by their R2 photo
 * names (products/km-<listingId>-<n>-<rand>.<ext>).
 */
export async function findImportedListingIds(
  env: { DB: D1Database },
  listingIds: string[],
  prefix = "km"
): Promise<Set<string>> {
  const imported = new Set<string>();
  if (listingIds.length === 0) return imported;

  await ensureSourceTables(env);
  const marks = listingIds.map(() => "?").join(",");
  const tracked = await env.DB.prepare(`SELECT listing_id FROM product_sources WHERE listing_id IN (${marks})`)
    .bind(...listingIds)
    .all<{ listing_id: string }>();
  for (const row of tracked.results || []) imported.add(String(row.listing_id));

  const clauses = listingIds.map(() => "images LIKE ?").join(" OR ");
  const { results } = await env.DB.prepare(`SELECT images FROM products WHERE ${clauses}`)
    .bind(...listingIds.map((id) => `%/${prefix}-${id}-%`))
    .all<{ images: string | null }>();
  for (const row of results || []) {
    for (const id of listingIds) {
      if (row.images && row.images.includes(`/${prefix}-${id}-`)) imported.add(id);
    }
  }
  return imported;
}

// Search keywords per CampusCart category. Discover picks one at random per
// category, so every run surfaces a different spread of products.
export const DISCOVER_KEYWORDS: Record<string, string[]> = {
  phones: ["smartphone", "phone case", "earphones", "power bank", "phone charger", "bluetooth earbuds", "screen protector", "phone stand"],
  electronics: ["bluetooth speaker", "led light", "security camera", "television", "projector", "microphone", "extension cable", "torch"],
  computing: ["laptop bag", "wireless mouse", "keyboard", "flash disk", "laptop stand", "webcam", "router", "external hard drive"],
  appliances: ["blender", "electric kettle", "air fryer", "iron box", "rice cooker", "toaster", "hair dryer", "fan"],
  fashion: ["sneakers", "handbag", "t-shirt", "sunglasses", "backpack", "wallet", "hoodie", "sandals"],
  home: ["bedsheets", "kitchen organizer", "storage box", "cookware set", "curtains", "wall clock", "water bottle", "lunch box"],
  beauty: ["face cream", "perfume", "hair oil", "makeup kit", "lipstick", "body lotion", "shaving kit", "nail kit"],
  baby: ["baby clothes", "kids toys", "diapers", "baby feeding bottle", "school bag", "kids shoes", "baby blanket", "puzzle"],
  gaming: ["game controller", "gaming headset", "gaming mouse", "ps5 accessories", "gaming chair", "console", "joystick", "gaming keyboard"],
  watches: ["smart watch", "wrist watch", "necklace", "bracelet", "earrings", "ring", "watch strap", "jewellery set"],
};

export function pickRandom<T>(items: T[], count: number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
}
