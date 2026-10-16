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

  // A query can carry at most ~100 bound values, and a batch is now up to 200
  // listings - so look them up 80 at a time.
  for (let i = 0; i < listingIds.length; i += 80) {
    const chunk = listingIds.slice(i, i + 80);

    const marks = chunk.map(() => "?").join(",");
    const tracked = await env.DB.prepare(`SELECT listing_id FROM product_sources WHERE listing_id IN (${marks})`)
      .bind(...chunk)
      .all<{ listing_id: string }>();
    for (const row of tracked.results || []) imported.add(String(row.listing_id));

    const clauses = chunk.map(() => "images LIKE ?").join(" OR ");
    const { results } = await env.DB.prepare(`SELECT images FROM products WHERE ${clauses}`)
      .bind(...chunk.map((id) => `%/${prefix}-${id}-%`))
      .all<{ images: string | null }>();
    for (const row of results || []) {
      for (const id of chunk) {
        if (row.images && row.images.includes(`/${prefix}-${id}-`)) imported.add(id);
      }
    }
  }
  return imported;
}

// Search keywords per CampusCart category. Discover picks one at random per
// category, so every run surfaces a different spread of products.
export const DISCOVER_KEYWORDS: Record<string, string[]> = {
  phones: ["smartphone", "android phone", "phone case", "earphones", "power bank", "phone charger", "bluetooth earbuds", "screen protector", "phone stand", "phone holder", "usb cable", "type c cable", "fast charger", "wireless charger", "selfie stick", "ring light", "phone tripod", "car phone holder", "airpods", "bluetooth headset", "memory card", "phone cover", "tecno phone", "infinix phone", "samsung phone", "redmi phone", "itel phone", "oppo phone", "phone camera lens", "gimbal stabilizer"],
  electronics: ["bluetooth speaker", "led light", "security camera", "television", "projector", "microphone", "extension cable", "torch", "soundbar", "home theatre", "radio", "karaoke speaker", "led strip lights", "solar light", "solar panel", "power inverter", "voltage stabilizer", "wifi camera", "dash cam", "walkie talkie", "digital camera", "action camera", "drone", "tv stand", "tv wall mount", "hdmi cable", "universal remote", "digital decoder", "rechargeable battery", "smart plug"],
  computing: ["laptop bag", "wireless mouse", "keyboard", "flash disk", "laptop stand", "webcam", "router", "external hard drive", "usb hub", "laptop charger", "laptop cooling pad", "monitor", "printer", "ink cartridge", "mouse pad", "usb c hub", "sd card reader", "wifi adapter", "network cable", "laptop sleeve", "tablet", "tablet case", "stylus pen", "graphics tablet", "computer speakers", "laptop battery", "mechanical keyboard", "hard disk enclosure", "ssd", "usb extension"],
  appliances: ["blender", "electric kettle", "air fryer", "iron box", "rice cooker", "toaster", "hair dryer", "fan", "microwave oven", "juicer", "food processor", "sandwich maker", "electric cooker", "induction cooker", "gas cooker", "water dispenser", "vacuum cleaner", "water heater", "standing fan", "table fan", "heater", "coffee maker", "egg boiler", "popcorn maker", "deep fryer", "meat grinder", "hand mixer", "steam iron", "air cooler", "refrigerator"],
  fashion: ["sneakers", "handbag", "t-shirt", "sunglasses", "backpack", "wallet", "hoodie", "sandals", "mens shoes", "womens shoes", "dress", "jeans", "jacket", "sweater", "leather belt", "cap", "hat", "scarf", "socks", "sports shoes", "heels", "boots", "slippers", "mens shirt", "tracksuit", "leggings", "crossbody bag", "tote bag", "sports bag", "school shoes"],
  home: ["bedsheets", "kitchen organizer", "storage box", "cookware set", "curtains", "wall clock", "water bottle", "lunch box", "duvet", "blanket", "pillow", "mattress cover", "dinner set", "cups", "mugs", "knife set", "chopping board", "spice rack", "laundry basket", "dustbin", "doormat", "carpet", "wall art", "photo frame", "flower vase", "table lamp", "shoe rack", "hanger", "bathroom set", "towel set"],
  beauty: ["face cream", "perfume", "hair oil", "makeup kit", "lipstick", "body lotion", "shaving kit", "nail kit", "foundation", "eyeshadow palette", "mascara", "hair straightener", "hair curler", "beard trimmer", "hair clipper", "serum", "sunscreen", "face wash", "body scrub", "shampoo", "hair extensions", "wig", "makeup brushes", "nail polish", "deodorant", "body spray", "massage gun", "face mask", "toothbrush", "electric shaver"],
  baby: ["baby clothes", "kids toys", "diapers", "baby feeding bottle", "school bag", "kids shoes", "baby blanket", "puzzle", "baby stroller", "baby carrier", "baby bath", "baby monitor", "teddy bear", "building blocks", "toy car", "doll", "kids bicycle", "baby shoes", "kids clothes", "baby bedding", "pacifier", "kids water bottle", "kids lunch box", "play mat", "baby walker", "remote control car", "board game", "kids backpack", "baby wipes", "children books"],
  gaming: ["game controller", "gaming headset", "gaming mouse", "ps5 accessories", "gaming chair", "console", "joystick", "gaming keyboard", "ps4 controller", "xbox controller", "nintendo switch", "gaming mouse pad", "gaming monitor", "steering wheel", "vr headset", "gaming laptop", "controller charger", "game console stand", "gaming desk", "usb gamepad", "retro game console", "gaming speaker", "capture card", "gaming microphone", "thumb grips", "ps5 console", "gaming pc case", "rgb keyboard", "headset stand", "pubg controller"],
  watches: ["smart watch", "wrist watch", "necklace", "bracelet", "earrings", "ring", "watch strap", "jewellery set", "mens watch", "womens watch", "fitness tracker", "smart band", "gold chain", "pendant", "anklet", "couple rings", "silver necklace", "pearl earrings", "bangle", "watch box", "digital watch", "leather watch", "sports watch", "kids smart watch", "jewellery box", "cufflinks", "brooch", "charm bracelet", "choker necklace", "hair accessories"],
};

export function pickRandom<T>(items: T[], count: number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
}
