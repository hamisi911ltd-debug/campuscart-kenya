// Cloudflare Pages Function - Admin summary of platform revenue
// (delivery fees + commission kept from paid orders, never passed to sellers)

interface Env {
  DB: D1Database;
}

function isAdmin(request: Request): boolean {
  const cookie = request.headers.get("Cookie") || "";
  if (cookie.includes("admin_session=true")) return true;

  const authHeader = request.headers.get("Authorization");
  if (authHeader === "Bearer admin_session_true") return true;

  const sessionHeader = request.headers.get("X-Admin-Session");
  return sessionHeader === "true";
}

export async function onRequestGet(context: { env: Env; request: Request }) {
  const { env, request } = context;

  if (!isAdmin(request)) {
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
