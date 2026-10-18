// Cloudflare Pages Function - serves customers' review photos from R2
// /api/images/reviews/<uuid>.<ext>
interface Env {
  STORAGE: R2Bucket;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const segments = context.params.key as string[];
  // exactly one safe file name - nothing else under reviews/ is ever exposed
  if (!Array.isArray(segments) || segments.length !== 1 || !/^[A-Za-z0-9-]+\.(webp|jpg|jpeg|png)$/.test(segments[0])) {
    return new Response("Not found", { status: 404 });
  }
  const object = await context.env.STORAGE.get(`reviews/${segments[0]}`);
  if (!object) return new Response("Not found", { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  headers.set("X-Content-Type-Options", "nosniff");
  if (!headers.get("Content-Type")) headers.set("Content-Type", "image/jpeg");
  return new Response(object.body, { headers });
};
