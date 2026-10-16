// Copies product photos into our own R2 storage in two sizes, so pages serve
// them from our own domain (with far-future caching) instead of depending on
// the source site:
//   - 400px  for cards and thumbnails
//   - 1200px for the product page
// A photo is stored as products/<name>-1200-<rand>.webp, and its card version
// as products/<name>-400-<rand>.webp. Only the 1200 URL is saved on the
// product; the 400 URL is derived from it by swapping "-1200-" for "-400-"
// (see src/lib/imageUrl.ts), so no schema change is needed.

export const CARD_WIDTH = 400;
export const DETAIL_WIDTH = 1200;
export const MIN_COVER_WIDTH = 500;

const CACHE_CONTROL = "public, max-age=31536000, immutable";

/** The source CDN resizes + re-encodes through the URL: ask for WebP at a width and quality. */
export function cdnVariantUrl(url: string, width: number): string {
  const base = url.split("?")[0];
  const quality = width <= 600 ? 72 : 78;
  return `${base}?x-image-process=image/format,webp/resize,w_${width}/quality,q_${quality}`;
}

/** Pixel width of a WebP / PNG / JPEG from its first bytes, or null if unrecognised. */
export function imageWidth(bytes: Uint8Array): number | null {
  const b = bytes;
  // WebP: "RIFF" .... "WEBP" + VP8 / VP8L / VP8X chunk
  if (b.length > 30 && b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45) {
    const chunk = String.fromCharCode(b[12], b[13], b[14], b[15]);
    if (chunk === "VP8 ") return (b[26] | (b[27] << 8)) & 0x3fff;
    if (chunk === "VP8L") return 1 + (b[21] | ((b[22] & 0x3f) << 8));
    if (chunk === "VP8X") return 1 + (b[24] | (b[25] << 8) | (b[26] << 16));
    return null;
  }
  // PNG
  if (b.length > 24 && b[0] === 0x89 && b[1] === 0x50) {
    return ((b[16] << 24) | (b[17] << 16) | (b[18] << 8) | b[19]) >>> 0;
  }
  // JPEG: walk the markers to the first start-of-frame
  if (b.length > 4 && b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) { i++; continue; }
      const marker = b[i + 1];
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return (b[i + 7] << 8) | b[i + 8];
      }
      i += 2 + ((b[i + 2] << 8) | b[i + 3]);
    }
  }
  return null;
}

interface R2Env {
  STORAGE: R2Bucket;
}

export interface StoredPhoto {
  /** 1200px URL - the one saved on the product. */
  url: string;
  /** Width in px of the stored 1200px version (may be smaller if the source is). */
  width: number | null;
}

async function download(url: string): Promise<{ bytes: ArrayBuffer; type: string } | null> {
  try {
    const response = await fetch(url, { headers: { Referer: "https://www.kilimall.co.ke/" } });
    if (!response.ok) return null;
    const type = (response.headers.get("Content-Type") || "image/webp").split(";")[0];
    if (!type.startsWith("image/")) return null;
    return { bytes: await response.arrayBuffer(), type };
  } catch (err) {
    console.error(`Photo download failed (${url}):`, err);
    return null;
  }
}

/**
 * Downloads one source photo at both sizes and stores them in R2 under long-
 * lived, immutable cache headers. Returns the 1200px URL (or null if either
 * size couldn't be fetched).
 */
export async function copyPhotoToStorage(
  env: R2Env,
  sourceUrl: string,
  namePrefix: string
): Promise<StoredPhoto | null> {
  const [detail, card] = await Promise.all([
    download(cdnVariantUrl(sourceUrl, DETAIL_WIDTH)),
    download(cdnVariantUrl(sourceUrl, CARD_WIDTH)),
  ]);
  if (!detail || !card) return null;

  const rand = Math.random().toString(36).slice(2, 8);
  const ext = detail.type.includes("png") ? "png" : detail.type.includes("jpeg") ? "jpg" : "webp";
  const detailKey = `products/${namePrefix}-${DETAIL_WIDTH}-${rand}.${ext}`;
  const cardKey = `products/${namePrefix}-${CARD_WIDTH}-${rand}.${ext}`;

  await Promise.all([
    env.STORAGE.put(detailKey, detail.bytes, { httpMetadata: { contentType: detail.type, cacheControl: CACHE_CONTROL } }),
    env.STORAGE.put(cardKey, card.bytes, { httpMetadata: { contentType: card.type, cacheControl: CACHE_CONTROL } }),
  ]);

  return { url: `/api/images/${detailKey}`, width: imageWidth(new Uint8Array(detail.bytes)) };
}
