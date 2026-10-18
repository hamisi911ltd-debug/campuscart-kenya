// Cloudflare Pages Function - GET /api/payhero/order-status?order_id=...
// The checkout screen polls this while the customer enters their M-Pesa PIN. Instead of waiting for
// the webhook, it asks PayHero directly (the same verified path the webhook uses) so the result
// shows up within seconds. Only PayHero's own answer, and an amount that covers the order, ever
// marks an order paid.
import { checkTransactionStatus, parseCallbackPayload, type JsonRecord, type PayHeroEnv } from "../_lib/payhero";
import { settleOrderPayment } from "../_lib/settlePayment";

interface Env extends PayHeroEnv {
  DB: D1Database;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

export async function onRequestGet(context: { env: Env; request: Request }) {
  const { env, request } = context;
  try {
    const orderId = new URL(request.url).searchParams.get("order_id") || "";
    if (!/^[0-9a-f-]{36}$/i.test(orderId)) return json({ error: "Invalid order" }, 400);

    let order = await env.DB.prepare("SELECT * FROM orders WHERE id = ?").bind(orderId).first<any>();
    if (!order) return json({ error: "Order not found" }, 404);

    if (order.payment_status === "requested" && order.payhero_reference) {
      try {
        const { success, raw } = await checkTransactionStatus(env, order.payhero_reference);
        if (success) {
          const verified = parseCallbackPayload({ external_reference: orderId, ...(raw as JsonRecord) });
          const covers = verified.amount === undefined || Math.round(verified.amount) >= Math.round(Number(order.total_amount));
          if ((verified.status === "success" && covers) || verified.status === "failed") {
            await settleOrderPayment(env, order, verified);
            order = await env.DB.prepare("SELECT * FROM orders WHERE id = ?").bind(orderId).first<any>();
          }
        }
      } catch (err) {
        console.error("Order payment check failed (will retry on the next poll):", err);
      }
    }

    return json({ payment_status: order.payment_status, status: order.status });
  } catch (error) {
    console.error("Order status error:", error);
    return json({ error: "Could not check the payment" }, 500);
  }
}
