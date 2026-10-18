// Cloudflare Pages Function - POST /api/reviews/upload
// A customer attaches ONE photo to a review. Public, so it is locked down: images only
// (checked by their actual bytes, not the file name), small, and rate-limited per address.
// Stored in R2 under reviews/ and served by /api/images/reviews/<file>.
import { overLimit, recordHit } from "../_lib/rateLimit";

interface Env {
  DB: D1Database;
  STORAGE: R2Bucket;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const MAX_BYTES = 2 * 1024 * 1024;

/** What the file REALLY is, from its first bytes. */
function sniff(b: Uint8Array): { ext: string; type: string } | null {
  if (b.length > 12 && b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45) return { ext: "webp", type: "image/webp" };
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { ext: "jpg", type: "image/jpeg" };
  if (b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return { ext: "png", type: "image/png" };
  return null;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  try {
    if (await overLimit(env, "review-upload", request, 10, 60)) {
      return json({ error: "Too many uploads - please try again later." }, 429);
    }

    const form = await request.formData();
    const file = form.get("image");
    if (!file || typeof file === "string") return json({ error: "No photo provided" }, 400);
    if (file.size > MAX_BYTES) return json({ error: "Photo is too large (max 2 MB)" }, 413);

    const bytes = new Uint8Array(await file.arrayBuffer());
    const kind = sniff(bytes);
    if (!kind) return json({ error: "Only JPG, PNG or WebP photos are allowed" }, 400);

    const name = `${crypto.randomUUID()}.${kind.ext}`;
    await env.STORAGE.put(`reviews/${name}`, bytes, {
      httpMetadata: { contentType: kind.type, cacheControl: "public, max-age=31536000, immutable" },
    });
    await recordHit(env, "review-upload", request);

    return json({ url: `/api/images/reviews/${name}` }, 201);
  } catch (error) {
    console.error("Review photo upload error:", error);
    return json({ error: "Could not upload the photo" }, 500);
  }
};
