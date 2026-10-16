// Kilimall Kenya reader used by the admin "Import from Kilimall" feature.
//
// Kilimall is a Nuxt app that server-renders its pages and embeds the page
// data as a "devalue"-serialised flat array in <script id="__NUXT_DATA__">.
// That's much more stable than scraping CSS classes, so we resolve that
// array back into plain objects and pick the fields we need.
//
// Only pages Kilimall's robots.txt allows are requested: search/category
// listings and /listing/<id> detail pages (it disallows /api, /product*
// and /item*).

const BASE = "https://www.kilimall.co.ke";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

export interface KilimallListing {
  listingId: string;
  title: string;
  image: string;
  price: number;
  listPrice: number | null;
  rating: number;
  reviews: number;
}

export interface KilimallProduct {
  listingId: string;
  title: string;
  description: string;
  images: string[];
  price: number | null;
  listPrice: number | null;
  /** Units available across sellable variants, or null if Kilimall didn't say. */
  stock: number | null;
  inStock: boolean | null;
}

export async function fetchKilimallHtml(pathOrUrl: string): Promise<string> {
  const url = normaliseKilimallUrl(pathOrUrl);
  const response = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      "Accept": "text/html,application/xhtml+xml",
      "Accept-Language": "en-KE,en;q=0.9",
    },
    redirect: "follow",
  });
  if (!response.ok) {
    throw new Error(`Kilimall returned ${response.status} for ${url}`);
  }
  return response.text();
}

/** Accepts a keyword-free path or a full URL, but only ever on kilimall.co.ke. */
export function normaliseKilimallUrl(pathOrUrl: string): string {
  if (pathOrUrl.startsWith("/")) return BASE + pathOrUrl;
  const parsed = new URL(pathOrUrl);
  if (parsed.protocol !== "https:" || (parsed.hostname !== "www.kilimall.co.ke" && parsed.hostname !== "kilimall.co.ke")) {
    throw new Error("Only https://www.kilimall.co.ke URLs are supported");
  }
  parsed.hostname = "www.kilimall.co.ke";
  return parsed.toString();
}

export function buildListingUrl(opts: { query?: string; url?: string; page?: number }): string {
  const page = Math.max(1, opts.page || 1);
  let target: URL;
  if (opts.url && opts.url.trim()) {
    target = new URL(normaliseKilimallUrl(opts.url.trim()));
  } else if (opts.query && opts.query.trim()) {
    target = new URL(`${BASE}/search`);
    target.searchParams.set("q", opts.query.trim());
  } else {
    throw new Error("Provide a search keyword or a Kilimall URL");
  }
  if (page > 1) target.searchParams.set("page", String(page));
  return target.toString();
}

// ---------------------------------------------------------------------------
// __NUXT_DATA__ (devalue) resolver

type Json = unknown;

function resolveNuxtData(html: string): { arr: Json[]; resolve: (index: number) => any } {
  const match = html.match(/<script[^>]*id="__NUXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!match) throw new Error("Kilimall page has no embedded data (layout may have changed)");
  const arr = JSON.parse(match[1]) as Json[];
  const memo = new Map<number, any>();
  const wrappers = new Set(["Reactive", "ShallowReactive", "Ref", "ShallowRef"]);

  const resolve = (index: number): any => {
    if (index === -1 || index == null) return undefined;
    if (memo.has(index)) return memo.get(index);
    const value = arr[index];
    if (value === null || typeof value !== "object") {
      memo.set(index, value);
      return value;
    }
    if (Array.isArray(value)) {
      if (typeof value[0] === "string" && wrappers.has(value[0])) {
        const inner = resolve(value[1] as number);
        memo.set(index, inner);
        return inner;
      }
      const out: any[] = [];
      memo.set(index, out);
      for (const item of value) out.push(typeof item === "number" ? resolve(item) : item);
      return out;
    }
    const out: Record<string, any> = {};
    memo.set(index, out);
    for (const key of Object.keys(value as object)) {
      out[key] = resolve((value as Record<string, number>)[key]);
    }
    return out;
  };

  return { arr, resolve };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

// ---------------------------------------------------------------------------
// Listing page (search / category)

export function parseListingPage(html: string): KilimallListing[] {
  const { arr, resolve } = resolveNuxtData(html);
  const seen = new Set<string>();
  const results: KilimallListing[] = [];

  for (let i = 0; i < arr.length; i++) {
    const raw = arr[i];
    if (!isPlainObject(raw) || !("listingId" in raw) || !("price" in raw) || !("title" in raw)) continue;
    const item = resolve(i);
    const id = String(item.listingId);
    if (seen.has(id) || !item.title || !item.image || !(Number(item.price) > 0)) continue;
    seen.add(id);
    const listPrice = Number(item.minListPrice) > 0 ? Number(item.minListPrice) : null;
    results.push({
      listingId: id,
      title: cleanText(String(item.title)),
      image: cleanImageUrl(String(item.image), 360),
      price: Number(item.price),
      listPrice: listPrice && listPrice > Number(item.price) ? listPrice : null,
      rating: Number(item.reviewStar) || 0,
      reviews: Number(item.reviews) || 0,
    });
  }
  return results;
}

// ---------------------------------------------------------------------------
// Product detail page

export function parseProductPage(html: string, listingId: string): KilimallProduct {
  const { arr, resolve } = resolveNuxtData(html);

  let detail: any = null;
  for (let i = 0; i < arr.length; i++) {
    const raw = arr[i];
    if (isPlainObject(raw) && "imageUrls" in raw && "specs" in raw && "details" in raw) {
      detail = resolve(i);
      break;
    }
  }
  if (!detail || !detail.title) throw new Error("Could not read product details from Kilimall");

  // Gallery: de-duplicated, capped so a single import stays within Workers'
  // subrequest limit (1 page fetch + up to 8 image downloads).
  const gallery: string[] = Array.isArray(detail.imageUrls) ? detail.imageUrls : [];
  const images = [...new Set(gallery.map((u: string) => cleanImageUrl(u, 720)).filter(Boolean))].slice(0, 6);
  if (images.length === 0 && detail.imageUrl) images.push(cleanImageUrl(detail.imageUrl, 720));

  // Price of the selected variant.
  let price: number | null = null;
  let listPrice: number | null = null;
  const skus: any[] = Array.isArray(detail.skus) ? detail.skus : [];
  const selected = skus.find((s) => s.skuId === detail.selectedSkuId) || skus[0];
  if (selected) {
    if (Number(selected.salePrice) > 0) price = Number(selected.salePrice);
    if (Number(selected.listPrice) > 0) listPrice = Number(selected.listPrice);
  }

  // Live stock: units across every variant that is on sale.
  let stock: number | null = null;
  const sellable = skus.filter((s) => s && s.isSale !== false && s.inventory != null);
  if (sellable.length > 0) stock = sellable.reduce((sum, s) => sum + skuStock(s.inventory), 0);

  return {
    listingId,
    title: cleanText(String(detail.title)),
    description: buildDescription(detail),
    images,
    price,
    listPrice,
    stock,
    inStock: stock === null ? null : stock > 0,
  };
}

// A variant's inventory is split across Kilimall's warehouses; each channel
// (gs / ds / fbk) only counts when its has* flag is on.
function skuStock(inventory: any): number {
  if (typeof inventory === "number") return Math.max(0, inventory);
  if (!inventory || typeof inventory !== "object") return 0;
  let total = 0;
  for (const channel of ["gs", "ds", "fbk"]) {
    if (inventory[`has${channel[0].toUpperCase()}${channel.slice(1)}`]) {
      total += Math.max(0, Number(inventory[`${channel}Available`]) || 0);
    }
  }
  return total;
}

function buildDescription(detail: any): string {
  const parts: string[] = [];

  const textBlocks: string[] = (Array.isArray(detail.details) ? detail.details : [])
    .filter((d: any) => d && d.content_type === "text" && typeof d.content === "string")
    .map((d: any) => htmlToText(d.content))
    .filter(Boolean);
  if (textBlocks.length) parts.push(textBlocks.join("\n\n"));

  const props: any[] = Array.isArray(detail.props) ? detail.props : [];
  const specLines = props
    .map((p) => {
      const values = Array.isArray(p.values) ? p.values.map((v: any) => v.value).filter(Boolean) : [];
      return p.name && values.length ? `• ${p.name}: ${values.join(", ")}` : "";
    })
    .filter(Boolean);
  if (specLines.length) parts.push(`Specifications\n${specLines.join("\n")}`);

  const specs: any[] = Array.isArray(detail.specs) ? detail.specs : [];
  const optionLines = specs
    .map((s) => {
      const values = Array.isArray(s.values) ? s.values.map((v: any) => v.value).filter(Boolean) : [];
      return s.name && values.length > 1 ? `• ${s.name}: ${values.join(", ")}` : "";
    })
    .filter(Boolean);
  if (optionLines.length) parts.push(`Available options\n${optionLines.join("\n")}`);

  if (typeof detail.box === "string" && detail.box.trim()) {
    parts.push(`In the box\n${htmlToText(detail.box)}`);
  }

  // Seller copy sometimes names other marketplaces ("order at Jumia Kenya").
  const text = parts.join("\n\n").replace(/\b(Jumia|Kilimall)( Kenya)?\b/gi, "CampusMart").trim();
  return text.length > 4000 ? text.slice(0, 3997).trimEnd() + "..." : text;
}

// ---------------------------------------------------------------------------
// helpers

function cleanText(value: string): string {
  return decodeEntities(value).replace(/\s+/g, " ").trim();
}

function htmlToText(html: string): string {
  return decodeEntities(
    html
      .replace(/<\s*br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li|h[1-6])>/gi, "\n")
      .replace(/<li[^>]*>/gi, "• ")
      .replace(/<[^>]+>/g, "")
  )
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function decodeEntities(value: string): string {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

/**
 * Drops the trailing "#" and asks Kilimall's image CDN for a WebP at the given
 * width AND a quality cap. Without the quality cap some images come back at
 * 600-800 KB even when resized (a 797 KB original becomes ~60 KB at q_72),
 * which made product grids slow and patchy to load.
 */
export const IMAGE_QUALITY = 72;
function cleanImageUrl(url: string, width: number): string {
  if (!url) return "";
  let out = url.replace(/#.*$/, "");
  if (out.startsWith("//")) out = "https:" + out;
  if (out.startsWith("http://")) out = "https://" + out.slice(7);
  const base = out.split("?")[0];
  return `${base}?x-image-process=image/format,webp/resize,w_${width}/quality,q_${IMAGE_QUALITY}`;
}

/** Same CDN transform, exposed for the image optimizer. */
export const compressedImageUrl = cleanImageUrl;
