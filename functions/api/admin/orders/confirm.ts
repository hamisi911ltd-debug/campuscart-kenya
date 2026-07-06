// Cloudflare Pages Function - Admin confirms order availability and requests payment via PayHero
import { initiateStkPush } from "../../_lib/payhero";

interface Env {
  DB: D1Database;
  PAYHERO_AUTH_TOKEN: string;
  PAYHERO_CHANNEL_ID: string;
}

function isAdmin(request: Request): boolean {
  const cookie = request.headers.get("Cookie") || "";
  if (cookie.includes("admin_session=true")) return true;

  const authHeader = request.headers.get("Authorization");
  if (authHeader === "Bearer admin_session_true") return true;

  const sessionHeader = request.headers.get("X-Admin-Session");
  if (sessionHeader === "true") return true;

  return false;
}

export async function onRequestPost(context: { env: Env; request: Request }) {
  const { env, request } = context;

  if (!isAdmin(request)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json() as { order_id?: string };
    const orderId = body.order_id;

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

    if (order.payment_status === "paid") {
      return new Response(JSON.stringify({ error: "Order is already paid" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (order.payment_status === "requested") {
      return new Response(JSON.stringify({ error: "Payment has already been requested for this order" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const buyerPhone = order.buyer_phone as string;
    if (!buyerPhone || buyerPhone === "N/A") {
      return new Response(JSON.stringify({ error: "This order has no valid buyer phone number to charge" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const callbackUrl = `${new URL(request.url).origin}/api/payhero/callback`;

    const stk = await initiateStkPush(env, {
      amount: Number(order.total_amount),
      phoneNumber: buyerPhone,
      externalReference: orderId,
      callbackUrl,
    });

    if (!stk.success) {
      return new Response(JSON.stringify({
        error: "PayHero declined the payment request",
        details: stk.raw,
      }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    await env.DB.prepare(`
      UPDATE orders
      SET status = 'confirmed', payment_status = 'requested', payhero_reference = ?,
          confirmed_at = CURRENT_TIMESTAMP, confirmed_by = 'admin', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(stk.reference || null, orderId).run();

    await env.DB.prepare(`
      INSERT INTO order_status_history (id, order_id, status, note)
      VALUES (?, ?, 'confirmed', 'Admin confirmed item availability')
    `).bind(crypto.randomUUID(), orderId).run();

    await env.DB.prepare(`
      INSERT INTO order_status_history (id, order_id, status, note)
      VALUES (?, ?, 'payment_requested', 'M-Pesa payment prompt sent to buyer via PayHero')
    `).bind(crypto.randomUUID(), orderId).run();

    return new Response(JSON.stringify({
      success: true,
      message: "Payment request sent to the customer's phone",
      payhero_reference: stk.reference,
    }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Admin order confirm error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
