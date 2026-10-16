// Marketplace titles are written to stuff in keywords ("OFFER!! AILYONS LS-A1-5L,
// 900Watts Microwave | Digital Control | 20L | Stainless Steel Cavity ..."). Shoppers
// need the part that says WHAT it is: brand + model (+ the one spec that matters).
// This trims a title down to that.
//
// NOTE: functions/api/_lib/productTitle.ts is a copy of this file - the browser and the
// Pages Functions are built separately and can't share a module. Keep them identical.

const PROMO_WORDS = [
  "offer", "offers", "massive sale", "mega sale", "big sale", "super sale", "flash sale", "hot sale", "hot deal", "hot",
  "sale", "new arrival", "new", "brand new", "original", "100% original", "genuine", "authentic", "best seller", "bestseller",
  "free gift", "free shipping", "free delivery", "limited offer", "promo", "clearance", "discount", "wholesale",
];

const TRAILING_CONNECTORS = /\s+(with|and|for|in|of|the|a|an|&|\+|\/|-|–|—|,)$/i;

const decode = (s: string) =>
  s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");

export function shortProductTitle(raw: string | null | undefined, maxLen = 46, maxWords = 6): string {
  let t = decode(String(raw || ""));

  // emojis and decorative symbols
  t = t.replace(/[\p{Extended_Pictographic}‍️★☆❤]/gu, " ");
  // [Free Gift] / 【Hot】 style tags
  t = t.replace(/\[[^\]]*\]|【[^】]*】|「[^」]*」/g, " ");
  t = t.replace(/\s+/g, " ").trim();

  // promo words at the very start, repeatedly ("OFFER!! MASSIVE SALE Brand New ...")
  const promo = new RegExp(`^(?:(?:${PROMO_WORDS.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\b[\\s!:.,\\-–|]*)+`, "i");
  for (let i = 0; i < 4; i++) {
    const next = t.replace(promo, "").replace(/^[\s!:.,\-–|]+/, "");
    if (next === t) break;
    t = next;
  }

  // keep the first meaningful segment: cut at a pipe, dash, comma, or bracket
  const cuts = [" | ", " – ", " — ", " - ", ", ", " (", " ["];
  let end = t.length;
  for (const cut of cuts) {
    const at = t.indexOf(cut);
    // a cut too early (e.g. "TV, 43 inch") would leave too little - need a real name first
    if (at >= 10 && at < end) end = at;
  }
  t = t.slice(0, end);

  // a screen size (6.7") starts the spec list too
  const size = t.search(/\s\d+(?:\.\d+)?["”]/);
  if (size >= 10) t = t.slice(0, size);

  // " with ..." / " for ..." starts the feature list, not the name
  const feature = t.search(/\s(?:with|for|featuring|including)\s/i);
  if (feature >= 10) t = t.slice(0, feature);

  // word and length caps
  const words = t.split(" ").filter(Boolean);
  let out = words.slice(0, maxWords).join(" ");
  if (out.length > maxLen) {
    out = out.slice(0, maxLen);
    out = out.slice(0, Math.max(out.lastIndexOf(" "), 10));
  }

  // a half-cut spec like 6.7" at the end reads as noise
  out = out.replace(/\s+[\d.]+["”]$/, "");
  out = out.replace(TRAILING_CONNECTORS, "").replace(/[\s,;:|\-–—/]+$/, "").trim();
  // never end up empty: fall back to a hard cut of the original
  if (out.length < 3) return decode(String(raw || "")).replace(/\s+/g, " ").trim().slice(0, maxLen);
  return out;
}
