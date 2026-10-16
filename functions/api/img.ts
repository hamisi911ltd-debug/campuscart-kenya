// Cloudflare Pages Function - /api/img?u=<image url>&w=<width>
//
// A small image relay for photos that still live on the source site's image
// server (products not yet copied into our own storage, and any source that
// blocks hotlinking from other sites). It
//   - only fetches from an allow-list of hosts (never an open proxy),
//   - asks the source for a WebP at the requested width,
//   - sends the right Referer so hotlink protection doesn't reject it,
//   - and caches the result for 30 days at Cloudflare's edge, so each photo is
//     fetched from the source at most once per region per month.

const ALLOWED_HOSTS = new Set(["img.kilimall.com", "image.kilimall.com"]);
const ALLOWED_WIDTHS = [160, 400, 800, 1200];
const THIRTY_DAYS = 60 * 60 * 24 * 30;

export const onRequestGet: PagesFunction = async (context) => {
  const url = new URL(context.request.url);

  let upstream: URL;
  try {
    upstream = new URL(url.searchParams.get("u") || "");
  } catch {
    return new Response("Bad image URL", { status: 400 });
  }
  if (upstream.protocol !== "https:" || !ALLOWED_HOSTS.has(upstream.hostname)) {
    return new Response("Host not allowed", { status: 403 });
  }

  // Snap to a known width so callers can't generate unlimited cache variants.
  const requested = Number(url.searchParams.get("w")) || 400;
  const width = ALLOWED_WIDTHS.find((w) => w >= requested) ?? ALLOWED_WIDTHS[ALLOWED_WIDTHS.length - 1];
  const quality = width <= 600 ? 72 : 78;
  upstream.search = `?x-image-process=image/format,webp/resize,w_${width}/quality,q_${quality}`;

  const edgeCache: Cache | undefined = typeof caches !== "undefined" ? (caches as any).default : undefined;
  // Cache key ignores the ?r=<n> retry parameter the page adds.
  const cacheKey = new Request(`${url.origin}/api/img?u=${encodeURIComponent(upstream.origin + upstream.pathname)}&w=${width}`);
  if (edgeCache) {
    const hit = await edgeCache.match(cacheKey);
    if (hit) return hit;
  }

  let response: Response;
  try {
    response = await fetch(upstream.toString(), { headers: { Referer: "https://www.kilimall.co.ke/" } });
  } catch {
    return new Response("Upstream unreachable", { status: 502 });
  }
  const type = (response.headers.get("Content-Type") || "").split(";")[0];
  if (!response.ok || !type.startsWith("image/")) {
    return new Response("Image unavailable", { status: response.ok ? 502 : response.status });
  }

  const out = new Response(response.body, {
    headers: {
      "Content-Type": type,
      "Cache-Control": `public, max-age=${THIRTY_DAYS}, immutable`,
      "Access-Control-Allow-Origin": "*",
    },
  });
  if (edgeCache) context.waitUntil(edgeCache.put(cacheKey, out.clone()));
  return out;
};
