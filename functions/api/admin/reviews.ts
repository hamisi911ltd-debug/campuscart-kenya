// Cloudflare Pages Function - review moderation (admin-only).
//   GET     -> the most recent reviews, with the product they belong to
//   DELETE  -> { id } remove a review (spam, abuse, wrong product...)
import { enforceAdminDomain } from "../_lib/adminDomain";
import { hasPermission } from "../_lib/teamAuth";

interface Env {
  DB: D1Database;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

async function authorize(env: Env, request: Request): Promise<Response | null> {
  const domainCheck = enforceAdminDomain(request);
  if (domainCheck) return domainCheck;
  if (!(await hasPermission(request, env, "products"))) return json({ error: "Unauthorized" }, 401);
  return null;
}

export async function onRequestGet(context: { env: Env; request: Request }) {
  const { env, request } = context;
  const denied = await authorize(env, request);
  if (denied) return denied;
  try {
    // the columns added for photos/names may not exist yet on an old database
    for (const col of ["image_url TEXT", "author_name TEXT"]) {
      try { await env.DB.prepare(`ALTER TABLE product_reviews ADD COLUMN ${col}`).run(); } catch { /* exists */ }
    }
    const { results } = await env.DB.prepare(`
      SELECT r.id, r.product_id, r.rating, r.comment, r.is_verified_purchase, r.created_at, r.image_url, r.author_name,
             p.title AS product_title
      FROM product_reviews r LEFT JOIN products p ON p.id = r.product_id
      ORDER BY r.created_at DESC LIMIT 200
    `).all();
    return json({ success: true, reviews: results || [] });
  } catch (error) {
    console.error("Error listing reviews:", error);
    return json({ error: "Could not load reviews" }, 500);
  }
}

export async function onRequestDelete(context: { env: Env; request: Request }) {
  const { env, request } = context;
  const denied = await authorize(env, request);
  if (denied) return denied;
  try {
    const body = await request.json() as { id?: string };
    if (!body.id) return json({ error: "Review id is required" }, 400);
    await env.DB.prepare("DELETE FROM product_reviews WHERE id = ?").bind(body.id).run();
    return json({ success: true });
  } catch (error) {
    console.error("Error deleting review:", error);
    return json({ error: "Could not delete the review" }, 500);
  }
}
