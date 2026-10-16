// Decides which store category a product belongs in, from its title (and a
// little from its description). Used when products are imported, so each one
// lands in its own category instead of whatever the admin happened to pick, and
// by the "Fix categories" tool for products that are already in the store.
//
// Scoring: every keyword found in the title scores by how specific it is
// (a longer phrase beats a single word); words in the description count for
// much less. The highest-scoring category wins; with no match at all it returns
// null so the caller can fall back to a hint.

export const CATEGORY_SLUGS = [
  "phones", "electronics", "computing", "appliances", "fashion",
  "home", "beauty", "baby", "gaming", "watches",
] as const;
export type CategorySlug = typeof CATEGORY_SLUGS[number];

const KEYWORDS: Record<CategorySlug, string[]> = {
  phones: [
    "smartphone", "smart phone", "smart phones", "phone", "phones", "mobile phone", "iphone", "android phone", "galaxy",
    "redmi", "tecno", "infinix", "itel", "oppo", "vivo", "realme", "xiaomi", "poco", "nokia", "oneplus", "honor",
    "earbuds", "earbud", "earphone", "earphones", "airpods", "bluetooth earphone", "headset", "power bank", "powerbank",
    "phone charger", "fast charger", "charging cable", "usb cable", "type-c cable", "lightning cable", "phone case",
    "back cover", "screen protector", "tempered glass", "phone holder", "phone stand", "selfie stick", "sim card",
  ],
  electronics: [
    "television", "tv", "smart tv", "led tv", "soundbar", "home theatre", "bluetooth speaker", "speaker", "speakers",
    "woofer", "subwoofer", "amplifier", "radio", "decoder", "set top box", "projector", "cctv", "security camera",
    "camera", "dash cam", "drone", "gopro", "microphone", "karaoke", "led light", "bulb", "torch", "flashlight",
    "led strip", "strip light", "led lights", "lights", "led", "extension cable", "extension", "socket", "surge", "solar", "inverter", "ups", "stabilizer", "remote control",
    "battery", "batteries", "walkie talkie", "ring light", "tripod", "headphones", "headphone",
  ],
  computing: [
    "laptop", "laptops", "notebook", "macbook", "chromebook", "desktop", "all in one", "monitor", "keyboard",
    "mouse", "wireless mouse", "mousepad", "printer", "scanner", "ink cartridge", "toner", "flash disk", "flash drive",
    "usb drive", "pen drive", "memory card", "sd card", "hard drive", "hard disk", "external hard", "ssd", "ram",
    "router", "wifi", "wi-fi", "modem", "network", "ethernet", "hdmi", "laptop bag", "laptop stand", "laptop charger",
    "tablet", "ipad", "webcam", "usb hub", "docking", "cpu", "motherboard", "graphics card", "pc case",
  ],
  appliances: [
    "blender", "juicer", "kettle", "electric kettle", "microwave", "oven", "toaster", "fridge", "refrigerator",
    "freezer", "washing machine", "dishwasher", "cooker", "rice cooker", "pressure cooker", "air fryer", "deep fryer",
    "induction", "hot plate", "hotplate", "cooktop", "gas cooker", "electric stove", "iron box", "steam iron", "heater",
    "water heater", "fan", "standing fan", "air cooler", "air conditioner", "dispenser", "water dispenser", "vacuum",
    "mixer", "food processor", "coffee maker", "sandwich maker", "popcorn", "meat grinder", "chopper", "slow cooker",
  ],
  fashion: [
    "shirt", "t-shirt", "tshirt", "polo", "dress", "gown", "skirt", "trouser", "trousers", "jeans", "shorts", "leggings",
    "jacket", "hoodie", "sweater", "sweatshirt", "coat", "blazer", "suit", "shoes", "shoe", "sneakers", "sneaker",
    "sandals", "slippers", "heels", "boots", "loafers", "handbag", "bag", "backpack", "purse", "wallet", "belt", "cap",
    "hat", "scarf", "sunglasses", "glasses", "socks", "underwear", "boxers", "bra", "bikini", "pyjamas", "tracksuit",
    "uniform", "t shirt", "kitenge", "ankara",
  ],
  home: [
    "bedsheet", "bed sheet", "bedding", "duvet", "blanket", "comforter", "curtain", "curtains", "pillow", "mattress",
    "cookware", "sufuria", "pot", "pan", "frying pan", "saucepan", "plate", "plates", "dinner set", "cup", "mug",
    "glass", "glasses set", "bottle", "water bottle", "flask", "lunch box", "storage", "organizer", "organiser",
    "hanger", "mat", "doormat", "carpet", "rug", "towel", "mop", "broom", "bucket", "basin", "kitchen", "utensil",
    "knife", "spoon", "fork", "cutlery", "chopping board", "lamp", "wall clock", "clock", "decor", "frame", "shelf",
    "rack", "basket", "laundry", "dustbin", "mirror", "sofa", "chair", "stool", "table", "wardrobe", "cabinet",
  ],
  beauty: [
    "cream", "face cream", "lotion", "body lotion", "perfume", "fragrance", "cologne", "body spray", "deodorant",
    "serum", "moisturizer", "moisturiser", "sunscreen", "lipstick", "lip gloss", "lipgloss", "makeup", "make up",
    "foundation", "concealer", "mascara", "eyeliner", "eyeshadow", "blush", "nail polish", "nail", "shampoo",
    "conditioner", "hair oil", "hair", "wig", "braids", "weave", "beard", "shaving", "razor", "trimmer", "clipper",
    "facial", "skincare", "skin care", "soap", "face wash", "scrub", "sanitizer", "toothbrush", "toothpaste",
    "massage", "massager", "vitamin", "supplement", "essential oil", "hair dryer", "straightener", "curler",
  ],
  baby: [
    "baby", "babies", "newborn", "infant", "toddler", "kids", "kid", "children", "childrens", "child", "diaper",
    "diapers", "nappy", "nappies", "wipes", "stroller", "pram", "car seat", "crib", "cot", "feeding bottle",
    "pacifier", "teether", "onesie", "baby bag", "school bag", "toy", "toys", "doll", "teddy", "plush", "puzzle",
    "lego", "building blocks", "rattle", "play mat", "playmat",
  ],
  gaming: [
    "gaming", "gamer", "game controller", "controller", "gamepad", "joystick", "playstation", "ps4", "ps5", "ps3",
    "xbox", "nintendo", "switch", "console", "game console", "video game", "fifa", "cod", "gaming mouse",
    "gaming keyboard", "gaming headset", "gaming chair", "steering wheel",
  ],
  watches: [
    "smart watch", "smartwatch", "watch", "watches", "wristwatch", "wrist watch", "fitness tracker", "smart band",
    "necklace", "bracelet", "bangle", "earring", "earrings", "ring", "rings", "jewellery", "jewelry", "pendant",
    "chain", "anklet", "brooch", "cufflinks", "watch strap",
  ],
};

// First wins when scores tie: more specific categories before the broad ones.
const TIE_ORDER: CategorySlug[] = ["gaming", "baby", "watches", "phones", "computing", "appliances", "electronics", "beauty", "fashion", "home"];

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Build one regex per keyword up front (word-boundary match, plural-tolerant).
const MATCHERS: Record<CategorySlug, { re: RegExp; weight: number }[]> = Object.fromEntries(
  (Object.keys(KEYWORDS) as CategorySlug[]).map((slug) => [
    slug,
    KEYWORDS[slug].map((kw) => ({
      re: new RegExp(`(?:^|[^a-z0-9])${escape(kw)}(?:s|es)?(?=$|[^a-z0-9])`, "i"),
      // a multi-word phrase says more than a single word
      weight: 2 + kw.split(" ").length * 2,
    })),
  ])
) as Record<CategorySlug, { re: RegExp; weight: number }[]>;

export function scoreCategories(title: string, description = ""): Record<CategorySlug, number> {
  const t = title.toLowerCase();
  const d = description.toLowerCase().slice(0, 300);
  const scores = Object.fromEntries(CATEGORY_SLUGS.map((s) => [s, 0])) as Record<CategorySlug, number>;
  for (const slug of CATEGORY_SLUGS) {
    for (const { re, weight } of MATCHERS[slug]) {
      if (re.test(t)) scores[slug] += weight;
      else if (d && re.test(d)) scores[slug] += weight * 0.15;
    }
  }
  return scores;
}

/** The best category for a product, or null if nothing in it points anywhere. */
export function classifyProduct(title: string, description = ""): CategorySlug | null {
  const scores = scoreCategories(title, description);
  let best: CategorySlug | null = null;
  for (const slug of TIE_ORDER) {
    if (scores[slug] > 0 && (best === null || scores[slug] > scores[best])) best = slug;
  }
  return best;
}

/** Classify, falling back to the caller's hint (e.g. the search the product came from). */
export function pickCategory(title: string, description: string, hint?: string | null): CategorySlug {
  const found = classifyProduct(title, description);
  if (found) return found;
  if (hint && (CATEGORY_SLUGS as readonly string[]).includes(hint)) return hint as CategorySlug;
  return "home";
}
