// Cloudflare Pages Function - customer stock enquiries.
//
// A shopper can ask "is this in stock?" before paying. For products imported
// from Kilimall the answer comes back instantly from a live stock check; for
// anything else (or if the live check fails) the enquiry waits for the admin,
// who replies from Admin -> Stock Enquiries. The customer sees the answer on
// the product page.
import { normalizeKenyanPhone } from "./_lib/phone";
import { fetchKilimallHtml, parseProductPage } from "./_lib/kilimall";
import { ensureSourceTables, getSourceForProduct } from "./_lib/productSources";

interface Env {
  DB: D1Database;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> =>
  Promise.race([promise, new Promise<T>((_, reject) => setTimeout(() => reject(new Error("timeout")), ms))]);

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

    const product = await env.DB.prepare(
      "SELECT id, title, is_available, quantity_available FROM products WHERE id = ?"
    ).bind(productId).first<{ id: string; title: string; is_available: number; quantity_available: number }>();
    if (!product) return json({ error: "Product not found" }, 404);

    // Light spam guard: a handful of enquiries per phone per hour.
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const recent = await env.DB.prepare(
      "SELECT COUNT(*) as n FROM product_enquiries WHERE phone = ? AND created_at > ?"
    ).bind(phone, since).first<{ n: number }>();
    if ((recent?.n || 0) >= 6) {
      return json({ error: "You've sent a few enquiries already - we'll get back to you shortly." }, 429);
    }

    let status: "pending" | "available" | "unavailable" = "pending";
    let reply: string | null = null;
    let autoChecked = 0;

    if (!product.is_available) {
      status = "unavailable";
      reply = "Sorry, this item is currently unavailable.";
    } else {
      // Instant answer from live stock when the item comes from Kilimall.
      try {
        const source = await getSourceForProduct(env, productId);
        if (source) {
          const live = await withTimeout(
            fetchKilimallHtml(`/listing/${source.listing_id}`).then((html) => parseProductPage(html, source.listing_id)),
            7000
          );
          if (live.inStock === true) {
            status = "available";
            reply = live.stock !== null && live.stock <= 5
              ? `Good news - it's in stock (only ${live.stock} left). You can order now.`
              : "Good news - it's in stock. You can order now.";
            autoChecked = 1;
          } else if (live.inStock === false) {
            status = "unavailable";
            reply = "Sorry, this item is out of stock right now. We'll let you know when it's back.";
            autoChecked = 1;
          }
        }
      } catch (err) {
        console.error("Live stock check failed, leaving enquiry for the admin:", err);
      }
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await env.DB.prepare(
      `INSERT INTO product_enquiries (id, product_id, product_title, user_id, name, phone, message, status, reply, auto_checked, created_at, answered_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id,
      productId,
      product.title,
      body.userId || null,
      (body.name || "").trim().slice(0, 80) || null,
      phone,
      (body.message || "").trim().slice(0, 300) || null,
      status,
      reply,
      autoChecked,
      now,
      status === "pending" ? null : now
    ).run();

    return json({
      success: true,
      id,
      status,
      reply: reply || "Thanks! We're checking stock and will reply here shortly.",
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
