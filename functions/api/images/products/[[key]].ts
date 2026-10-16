// Cloudflare Pages Function to serve product images from R2
// Handles: /api/images/products/<file>   and   /api/images/products/<file>?w=400
//
// Photos stored by the current importer come in two sizes (…-400-… / …-1200-…)
// and are served exactly as stored, with immutable caching.
//
// Older products were saved as ONE heavy file (often 600-800 KB) named
// km-<listingId>-<n>-<rand>.webp. Cards were downloading those at full size, so
// the grid stayed grey for seconds. For those legacy files a width can be asked
// for (?w=400 on cards, ?w=1200 on the product page): the route finds the same
// photo at the source in that size (a few KB to ~60 KB), caches it for 30 days,
// and serves it. If anything goes wrong it falls back to the stored original,
// so a photo never goes missing because of this.
import { fetchKilimallHtml, parseProductPage } from "../../_lib/kilimall";
import { cdnVariantUrl } from "../../_lib/imageStore";

interface Env {
  STORAGE: R2Bucket;
}

const LEGACY_KEY = /^km-(\d+)-(\d+)o?-[a-z0-9]+\.\w+$/i;
const ALLOWED_WIDTHS = [400, 800, 1200];
const THIRTY_DAYS = 60 * 60 * 24 * 30;

const edgeCache = (): Cache | undefined => (typeof caches !== "undefined" ? (caches as any).default : undefined);

/** Photo URLs of a listing, cached for a day so a grid of cards doesn't refetch the page. */
async function listingPhotos(listingId: string, origin: string, waitUntil: (p: Promise<unknown>) => void): Promise<string[] | null> {
  const cache = edgeCache();
  const key = new Request(`${origin}/__listing-photos/${listingId}`);
  if (cache) {
    const hit = await cache.match(key);
    if (hit) return (await hit.json()) as string[];
  }
  try {
    const listing = parseProductPage(await fetchKilimallHtml(`/listing/${listingId}`), listingId);
    if (cache) {
      waitUntil(cache.put(key, new Response(JSON.stringify(listing.images), {
        headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=86400" },
      })));
    }
    return listing.images;
  } catch (err) {
    console.error(`Listing ${listingId} unavailable for legacy image resize:`, err);
    return null;
  }
}

/** A right-sized copy of a legacy photo from the source site, or null. */
async function resizedLegacy(
  fileName: string,
  width: number,
  url: URL,
  waitUntil: (p: Promise<unknown>) => void
): Promise<Response | null> {
  const match = fileName.match(LEGACY_KEY);
  if (!match) return null;

  const cache = edgeCache();
  const cacheKey = new Request(`${url.origin}${url.pathname}?w=${width}`);
  if (cache) {
    const hit = await cache.match(cacheKey);
    if (hit) return hit;
  }

  const photos = await listingPhotos(match[1], url.origin, waitUntil);
  const source = photos?.[Number(match[2])];
  if (!source) return null;

  try {
    const upstream = await fetch(cdnVariantUrl(source, width), { headers: { Referer: "https://www.kilimall.co.ke/" } });
    const type = (upstream.headers.get("Content-Type") || "").split(";")[0];
    if (!upstream.ok || !type.startsWith("image/")) return null;
    const response = new Response(upstream.body, {
      headers: {
        "Content-Type": type,
        "Cache-Control": `public, max-age=${THIRTY_DAYS}, immutable`,
        "Access-Control-Allow-Origin": "*",
      },
    });
    if (cache) waitUntil(cache.put(cacheKey, response.clone()));
    return response;
  } catch (err) {
    console.error("Legacy photo resize failed, serving the original:", err);
    return null;
  }
}

export const onRequest: PagesFunction<Env> = async (context) => {
  try {
    // Build the R2 key from the URL path segments
    // URL: /api/images/products/1777543425964-dnoxfj.jpg
    // key array: ["1777543425964-dnoxfj.jpg"] or ["subfolder", "file.jpg"]
    const keySegments = context.params.key as string[];
    const key = `products/${keySegments.join("/")}`;
    const url = new URL(context.request.url);

    // Legacy single-size photo + a requested width -> serve a light version.
    const requested = Number(url.searchParams.get("w"));
    if (requested > 0 && keySegments.length === 1) {
      const width = ALLOWED_WIDTHS.find((w) => w >= requested) ?? ALLOWED_WIDTHS[ALLOWED_WIDTHS.length - 1];
      const light = await resizedLegacy(keySegments[0], width, url, (p) => context.waitUntil(p));
      if (light) return light;
    }

    // Get object from R2
    const object = await context.env.STORAGE.get(key);

    if (!object) {
      console.error(`Image not found in R2: ${key}`);
      return new Response("Image not found", { status: 404 });
    }

    // Set response headers
    const headers = new Headers();
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
    headers.set("Content-Type", object.httpMetadata?.contentType || "image/jpeg");
    headers.set("Access-Control-Allow-Origin", "*");

    // Copy metadata from R2 object
    if (object.httpMetadata) {
      object.writeHttpMetadata(headers);
    }

    return new Response(object.body, { headers });
  } catch (error: any) {
    console.error('Image fetch error:', error);
    return new Response(`Error fetching image: ${error.message}`, { status: 500 });
  }
};
