// Cloudflare Pages Function - order line items with where to buy them
// (admin-only). For each recent order item: what was sold and for how much,
// plus the original Kilimall listing and its last known cost, so the admin
// can open the listing and buy it once the customer's order is confirmed.
import { hasPermission } from "../_lib/teamAuth";
import { ensureSourceTables, kilimallListingUrl, listingIdFromImages } from "../_lib/productSources";

interface Env {
  DB: D1Database;
}

export async function onRequestGet(context: { env: Env; request: Request }) {
  const { env, request } = context;

  if (!(await hasPermission(request, env, "orders"))) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    await ensureSourceTables(env);
    const { results } = await env.DB.prepare(
      `SELECT
         oi.order_id, oi.product_id, oi.product_title, oi.product_image, oi.quantity, oi.price_at_purchase,
         p.images as product_images,
         s.listing_id as src_listing_id, s.source_price as src_price, s.in_stock as src_in_stock, s.checked_at as src_checked_at
       FROM order_items oi
       LEFT JOIN products p ON p.id = oi.product_id
       LEFT JOIN product_sources s ON s.product_id = oi.product_id
       ORDER BY oi.created_at DESC
       LIMIT 1000`
    ).all<Record<string, unknown>>();

    const items = (results || []).map((row) => {
      const listingId = (row.src_listing_id as string | null) || listingIdFromImages(row.product_images);
      const { product_images: _images, ...rest } = row;
      return { ...rest, source_url: listingId ? kilimallListingUrl(listingId) : null };
    });

    return new Response(JSON.stringify({ success: true, items }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error loading order items:", error);
    return new Response(JSON.stringify({ success: true, items: [] }), {
      headers: { "Content-Type": "application/json" },
    });
  }
}
