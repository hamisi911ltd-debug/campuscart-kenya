// Product photo URLs come in three shapes; this picks the right size of each.
//
//  1. Our own storage, two sizes:  /api/images/products/<name>-1200-<rand>.webp
//     (the product page size) with a card-size twin at  ...-400-<rand>.webp
//  2. Older single-size files in our storage - used as they are.
//  3. The source site's image server (https://img.kilimall.com/...), which we
//     only reach through the allow-listed relay /api/img (cached 30 days).
//
// Anything else (placeholder, other hosts) is returned untouched.
const PLACEHOLDER = "/placeholder.svg";
const SOURCE_HOST = /^https:\/\/(img|image)\.kilimall\.com\//;

export const sizedImage = (url: string | undefined | null, width: number): string => {
  if (!url) return PLACEHOLDER;
  if (url.startsWith("/api/images/")) {
    return url.includes("-1200-") && width <= 600 ? url.replace("-1200-", "-400-") : url;
  }
  if (SOURCE_HOST.test(url)) {
    return `/api/img?u=${encodeURIComponent(url.split("?")[0])}&w=${width}`;
  }
  return url;
};

/** srcset (400w + 1200w) when the photo has both sizes, otherwise undefined. */
export const srcSetFor = (url: string | undefined | null): string | undefined => {
  if (!url) return undefined;
  const small = sizedImage(url, 400);
  const large = sizedImage(url, 1200);
  return small !== large ? `${small} 400w, ${large} 1200w` : undefined;
};

export const cdnImgProps = { referrerPolicy: "no-referrer" as const, decoding: "async" as const };
