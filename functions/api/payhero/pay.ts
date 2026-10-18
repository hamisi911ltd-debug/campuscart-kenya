// Cloudflare Pages Function - POST /api/payhero/pay  { order_id }
// Sends the customer the M-Pesa payment prompt for their own order, right after they place it
// (previously an admin had to approve first). The prompt goes to the phone number on the order,
// so knowing an order id lets nobody take money from anyone else - at worst it re-sends a prompt.
import { initiateStkPush, type PayHeroEnv } from "../_lib/payhero";
import { normalizeKenyanPhone } from "../_lib/phone";

interface Env extends PayHeroEnv {
  DB: D1Database;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

const MAX_PROMPTS_PER_ORDER = 6;

export async function onRequestPost(context: { env: Env; request: Request }) {
  const { env, request } = context;
  try {
    const body = await request.json() as { order_id?: string };
    const orderId = String(body.order_id || "");
    if (!/^[0-9a-f-]{36}$/i.test(orderId)) return json({ error: "Invalid order" }, 400);

    const order = await env.DB.prepare("SELECT id, total_amount, buyer_phone, payment_status, status FROM orders WHERE id = ?")
      .bind(orderId)
      .first<{ id: string; total_amount: number; buyer_phone: string | null; payment_status: string; status: string }>();
    if (!order) return json({ error: "Order not found" }, 404);
    if (order.payment_status === "paid") return json({ success: true, alreadyPaid: true });
    if (order.status === "cancelled") return json({ error: "This order was cancelled" }, 400);

    const phone = normalizeKenyanPhone(order.buyer_phone || "");
    if (!phone) return json({ error: "This order has no valid phone number to charge" }, 400);

    const sent = await env.DB.prepare("SELECT COUNT(*) AS n FROM order_status_history WHERE order_id = ? AND status = 'payment_requested'")
      .bind(orderId).first<{ n: number }>();
    if ((sent?.n || 0) >= MAX_PROMPTS_PER_ORDER) {
      return json({ error: "Too many payment prompts for this order. Please contact us." }, 429);
    }

    const stk = await initiateStkPush(env, {
      amount: Math.round(Number(order.total_amount)),
      phoneNumber: phone,
      externalReference: orderId,
      callbackUrl: `${new URL(request.url).origin}/api/payhero/callback`,
    });
    if (!stk.success) return json({ error: "We couldn't send the M-Pesa prompt. Please try again." }, 502);

    await env.DB.prepare("UPDATE orders SET payment_status = 'requested', payhero_reference = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
      .bind(stk.reference || null, orderId).run();
    await env.DB.prepare("INSERT INTO order_status_history (id, order_id, status, note) VALUES (?, ?, 'payment_requested', ?)")
      .bind(crypto.randomUUID(), orderId, "M-Pesa payment prompt sent to your phone").run();

    return json({ success: true, phone: `${phone.slice(0, 7)}***${phone.slice(-3)}` });
  } catch (error) {
    console.error("Order payment prompt error:", error);
    return json({ error: "Could not start the payment. Please try again." }, 500);
  }
}
