// Cloudflare Pages Function for Admin Orders Management
import { hasPermission } from "../_lib/teamAuth";

interface Env {
  DB: D1Database;
}

export async function onRequestGet(context: { env: Env; request: Request }) {
  const { env, request } = context;

  if (!(await hasPermission(request, env, "orders"))) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  // has_dropship_items depends on products.sourced_from, added by
  // migrations/add_dropship_fields.sql. That migration isn't guaranteed to
  // have been run against this database yet, and a SELECT referencing a
  // column that doesn't exist fails the whole query — so this tries the
  // enhanced version first and falls back to the plain one instead of
  // breaking order listing entirely for anyone who hasn't run it.
  try {
    const result = await env.DB.prepare(`
      SELECT
        o.*,
        buyer.full_name as buyer_name,
        buyer.email as buyer_email,
        seller.full_name as seller_name,
        seller.email as seller_email,
        COUNT(oi.id) as item_count,
        MAX(CASE WHEN p.sourced_from IS NOT NULL THEN 1 ELSE 0 END) as has_dropship_items
      FROM orders o
      LEFT JOIN users buyer ON o.buyer_id = buyer.id
      LEFT JOIN users seller ON o.seller_id = seller.id
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `).all();

    return new Response(JSON.stringify({
      success: true,
      orders: result.results
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (enhancedError) {
    try {
      const fallback = await env.DB.prepare(`
        SELECT
          o.*,
          buyer.full_name as buyer_name,
          buyer.email as buyer_email,
          seller.full_name as seller_name,
          seller.email as seller_email,
          COUNT(oi.id) as item_count,
          0 as has_dropship_items
        FROM orders o
        LEFT JOIN users buyer ON o.buyer_id = buyer.id
        LEFT JOIN users seller ON o.seller_id = seller.id
        LEFT JOIN order_items oi ON o.id = oi.order_id
        GROUP BY o.id
        ORDER BY o.created_at DESC
      `).all();

      return new Response(JSON.stringify({
        success: true,
        orders: fallback.results
      }), {
        headers: { "Content-Type": "application/json" }
      });
    } catch (error) {
      console.error("Error fetching orders:", error);
      return new Response(JSON.stringify({
        error: "Failed to fetch orders"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }
}

export async function onRequestPut(context: { env: Env; request: Request }) {
  const { env, request } = context;

  if (!(await hasPermission(request, env, "orders"))) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const body = await request.json() as { id?: string; status?: string; note?: string };
    const { id } = body;
    const note = String(body.note || "").trim().slice(0, 200);
    let status = body.status;

    if (!id || (!status && !note)) {
      return new Response(JSON.stringify({
        error: "Order ID and a status or tracking note are required"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const ALLOWED = ["pending", "pending_confirmation", "confirmed", "payment_requested", "paid", "processing",
      "shipped", "out_for_delivery", "delivered", "cancelled", "payment_failed"];
    if (status && !ALLOWED.includes(status)) {
      return new Response(JSON.stringify({ error: "Unknown status" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    if (status) {
      await env.DB.prepare(
        "UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP, delivered_at = ? WHERE id = ?"
      ).bind(status, status === 'delivered' ? new Date().toISOString() : null, id).run();
    } else {
      // note-only update: a tracking message on the current status
      const current = await env.DB.prepare("SELECT status FROM orders WHERE id = ?").bind(id).first<{ status: string }>();
      if (!current) {
        return new Response(JSON.stringify({ error: "Order not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" }
        });
      }
      status = current.status;
    }

    await env.DB.prepare(`
      INSERT INTO order_status_history (id, order_id, status, note)
      VALUES (?, ?, ?, ?)
    `).bind(crypto.randomUUID(), id, status, note || "Status updated by admin").run();

    return new Response(JSON.stringify({
      success: true,
      message: `Order status updated to ${status}`
    }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error updating order:", error);
    return new Response(JSON.stringify({ 
      error: "Failed to update order" 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}