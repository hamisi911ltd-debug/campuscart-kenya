// Cloudflare Pages Function - product reviews
//   GET  /api/reviews/<productId>   -> the reviews to show (newest first)
//   POST /api/reviews/<productId>   -> add a review { user_id, rating, comment, image_url? }
//
// Reviews are written by real, signed-in customers. A review is marked "Verified Purchase" only
// if that customer has a PAID order containing the product. Nothing here invents reviews or names.
import { overLimit, recordHit } from "../_lib/rateLimit";

interface Env {
  DB: D1Database;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

let columnsReady = false;
async function ensureReviewColumns(env: Env): Promise<void> {
  if (columnsReady) return;
  // Added after the table first existed; each ALTER fails harmlessly if the column is already there.
  for (const col of ["image_url TEXT", "author_name TEXT"]) {
    try { await env.DB.prepare(`ALTER TABLE product_reviews ADD COLUMN ${col}`).run(); } catch { /* exists */ }
  }
  columnsReady = true;
}
export const resetReviewColumnsCache = () => { columnsReady = false; };

/** "Jane Wanjiku" -> "Jane W." (a first name and initial is enough to show publicly). */
function publicName(fullName: string | null | undefined): string {
  const parts = String(fullName || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Customer";
  const first = parts[0].slice(0, 20);
  return parts.length > 1 ? `${first} ${parts[parts.length - 1][0].toUpperCase()}.` : first;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const product_id = context.params.product_id as string;
    if (!product_id) return json({ error: "Product ID required" }, 400);

    await ensureReviewColumns(context.env);
    const { results } = await context.env.DB.prepare(`
      SELECT id, rating, comment, is_verified_purchase, created_at, image_url, author_name
      FROM product_reviews
      WHERE product_id = ?
      ORDER BY created_at DESC
      LIMIT 100
    `).bind(product_id).all<any>();

    const reviews = (results || []).map((review) => {
      // Older rows stored the name inside the comment as "Name: comment".
      let userName: string = review.author_name || "";
      let comment: string = review.comment || "";
      if (!userName && comment.includes(":")) {
        const [name, ...rest] = comment.split(":");
        if (name.length <= 30 && rest.length) { userName = name.trim(); comment = rest.join(":").trim(); }
      }
      return {
        id: review.id,
        userName: userName || "Customer",
        rating: review.rating,
        comment,
        date: review.created_at,
        verified: review.is_verified_purchase === 1,
        image: review.image_url || null,
      };
    });

    return json(reviews);
  } catch (error: any) {
    console.error("Error fetching reviews:", error);
    return json({ error: "Could not load reviews" }, 500);
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  try {
    const productId = context.params.product_id as string;
    const body = await request.json() as { user_id?: string; rating?: number; comment?: string; image_url?: string };

    const rating = Math.round(Number(body.rating));
    const comment = String(body.comment || "").trim();
    if (!productId) return json({ error: "Product ID required" }, 400);
    if (!body.user_id) return json({ error: "Please sign in to leave a review" }, 401);
    if (!(rating >= 1 && rating <= 5)) return json({ error: "Choose a rating from 1 to 5 stars" }, 400);
    if (comment.length < 3) return json({ error: "Please write a few words about the product" }, 400);
    if (comment.length > 800) return json({ error: "Please keep the review under 800 characters" }, 400);

    // A photo must be one we stored ourselves (uploaded through /api/reviews/upload).
    let imageUrl: string | null = null;
    if (body.image_url) {
      if (!/^\/api\/images\/reviews\/[A-Za-z0-9-]+\.(webp|jpg|jpeg|png)$/.test(body.image_url)) {
        return json({ error: "That photo isn't valid" }, 400);
      }
      imageUrl = body.image_url;
    }

    if (await overLimit(env, "review-post", request, 6, 60)) {
      return json({ error: "You've posted several reviews already - please try again later." }, 429);
    }

    const user = await env.DB.prepare("SELECT id, full_name FROM users WHERE id = ?").bind(body.user_id).first<{ id: string; full_name: string | null }>();
    if (!user) return json({ error: "Please sign in again to leave a review" }, 401);

    const product = await env.DB.prepare("SELECT id FROM products WHERE id = ?").bind(productId).first();
    if (!product) return json({ error: "Product not found" }, 404);

    await ensureReviewColumns(env);

    // one review per customer per product
    const existing = await env.DB.prepare("SELECT id FROM product_reviews WHERE product_id = ? AND buyer_id = ?")
      .bind(productId, user.id).first();
    if (existing) return json({ error: "You've already reviewed this product" }, 409);

    // "Verified Purchase" only when this customer has a PAID order containing the product
    const bought = await env.DB.prepare(`
      SELECT 1 AS ok FROM orders o JOIN order_items oi ON oi.order_id = o.id
      WHERE o.buyer_id = ? AND oi.product_id = ? AND o.payment_status = 'paid' LIMIT 1
    `).bind(user.id, productId).first();

    const id = crypto.randomUUID();
    await env.DB.prepare(`
      INSERT INTO product_reviews (id, product_id, buyer_id, rating, comment, is_verified_purchase, author_name, image_url, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(id, productId, user.id, rating, comment, bought ? 1 : 0, publicName(user.full_name), imageUrl, new Date().toISOString()).run();

    await recordHit(env, "review-post", request);
    return json({
      success: true,
      review: { id, userName: publicName(user.full_name), rating, comment, date: new Date().toISOString(), verified: !!bought, image: imageUrl },
    }, 201);
  } catch (error) {
    console.error("Error posting review:", error);
    return json({ error: "Could not save your review. Please try again." }, 500);
  }
};
