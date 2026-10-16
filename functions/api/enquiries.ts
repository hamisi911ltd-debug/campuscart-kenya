// Cloudflare Pages Function - customer stock enquiries.
//
// A shopper asks "is this in stock?" before paying. The question goes to the
// admin's WhatsApp (the page opens it, pre-filled), and is also saved here as
// a PENDING enquiry. Nothing is answered automatically: the admin checks
// stock first, then replies from Admin -> Stock Enquiries (or on WhatsApp),
// and the customer sees that confirmed answer on the product page.
import { normalizeKenyanPhone } from "./_lib/phone";
import { ensureSourceTables } from "./_lib/productSources";

interface Env {
  DB: D1Database;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  try {
    const body = await request.json() as {
      productId?: string;
      name?: string;
      phone?: string;
      message?: string;
      userId?: string;
    };

    const productId = String(body.productId || "");
    const phone = normalizeKenyanPhone(body.phone || "");
    if (!productId) return json({ error: "productId is required" }, 400);
    if (!phone) return json({ error: "Enter a valid phone number so we can reach you" }, 400);

    await ensureSourceTables(env);

    const product = await env.DB.prepare("SELECT id, title FROM products WHERE id = ?")
      .bind(productId)
      .first<{ id: string; title: string }>();
    if (!product) return json({ error: "Product not found" }, 404);

    // Light spam guard: a handful of enquiries per phone per hour.
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const recent = await env.DB.prepare(
      "SELECT COUNT(*) as n FROM product_enquiries WHERE phone = ? AND created_at > ?"
    ).bind(phone, since).first<{ n: number }>();
    if ((recent?.n || 0) >= 6) {
      return json({ error: "You've sent a few enquiries already - we'll get back to you shortly." }, 429);
    }

    const id = crypto.randomUUID();
    await env.DB.prepare(
      `INSERT INTO product_enquiries (id, product_id, product_title, user_id, name, phone, message, status, reply, auto_checked, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', NULL, 0, ?)`
    ).bind(
      id,
      productId,
      product.title,
      body.userId || null,
      (body.name || "").trim().slice(0, 80) || null,
      phone,
      (body.message || "").trim().slice(0, 300) || null,
      new Date().toISOString()
    ).run();

    return json({
      success: true,
      id,
      ref: id.slice(0, 6).toUpperCase(),
      status: "pending",
      reply: "Sent to our WhatsApp. We'll confirm stock and reply shortly.",
    }, 201);
  } catch (error) {
    console.error("Enquiry error:", error);
    return json({ error: "Could not send your enquiry. Please try again." }, 500);
  }
};

// Status of enquiries the customer already sent. The enquiry ids are random
// UUIDs only the sender holds, so they double as the access token.
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { env, request } = context;
  try {
    const ids = (new URL(request.url).searchParams.get("ids") || "")
      .split(",")
      .map((s) => s.trim())
      .filter((s) => /^[0-9a-f-]{36}$/i.test(s))
      .slice(0, 20);
    if (ids.length === 0) return json({ enquiries: [] });

    await ensureSourceTables(env);
    const placeholders = ids.map(() => "?").join(",");
    const { results } = await env.DB.prepare(
      `SELECT id, product_id, status, reply, created_at, answered_at FROM product_enquiries WHERE id IN (${placeholders})`
    ).bind(...ids).all();
    return json({ enquiries: results || [] });
  } catch (error) {
    console.error("Enquiry status error:", error);
    return json({ enquiries: [] });
  }
};
