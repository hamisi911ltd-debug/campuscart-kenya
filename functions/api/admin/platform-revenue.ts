// Cloudflare Pages Function - Admin summary of platform revenue
// (delivery fees + commission kept from paid orders, never passed to sellers)
import { isOwner } from "../_lib/ownerAuth";

interface Env {
  DB: D1Database;
}

export async function onRequestGet(context: { env: Env; request: Request }) {
  const { env, request } = context;

  if (!(await isOwner(request, env))) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const summary = await env.DB.prepare(`
    SELECT
      COUNT(*) as paid_order_count,
      COALESCE(SUM(delivery_fee), 0) as total_delivery_fees,
      COALESCE(SUM(commission_amount), 0) as total_commission,
      COALESCE(SUM(delivery_fee + commission_amount), 0) as total_revenue
    FROM platform_revenue
  `).first();

  return new Response(JSON.stringify({ success: true, ...summary }), {
    headers: { "Content-Type": "application/json" },
  });
}
