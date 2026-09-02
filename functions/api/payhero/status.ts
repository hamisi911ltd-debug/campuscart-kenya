// Cloudflare Pages Function - Admin manual fallback to recheck a payment with PayHero
// directly, in case a webhook callback was missed or the payload shape didn't
// match what functions/api/_lib/payhero.ts expects.
import { checkTransactionStatus, parseCallbackPayload } from "../_lib/payhero";
import { settleOrderPayment } from "../_lib/settlePayment";
import { hasPermission } from "../_lib/teamAuth";

interface Env {
  DB: D1Database;
  PAYHERO_AUTH_TOKEN: string;
  PAYHERO_CHANNEL_ID: string;
}

export async function onRequestGet(context: { env: Env; request: Request }) {
  const { env, request } = context;

  if (!(await hasPermission(request, env, "orders"))) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const url = new URL(request.url);
  const orderId = url.searchParams.get("order_id");
  if (!orderId) {
    return new Response(JSON.stringify({ error: "order_id is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const order = await env.DB.prepare("SELECT * FROM orders WHERE id = ?").bind(orderId).first();
  if (!order) {
    return new Response(JSON.stringify({ error: "Order not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!order.payhero_reference) {
    return new Response(JSON.stringify({ error: "No PayHero reference on this order yet" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { raw } = await checkTransactionStatus(env, order.payhero_reference as string);
  const parsed = parseCallbackPayload({ external_reference: orderId, ...raw });

  const applied = await settleOrderPayment(env, order, parsed);

  return new Response(JSON.stringify({
    success: true,
    previous_payment_status: order.payment_status,
    payhero_status: parsed.status,
    order_updated: applied,
    raw,
  }), {
    headers: { "Content-Type": "application/json" },
  });
}
