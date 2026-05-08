// Coupon Management API

interface Env {
  DB: D1Database;
}

function isAdmin(request: Request): boolean {
  const cookie = request.headers.get("Cookie") || "";
  return cookie.includes("admin_session=true");
}

export async function onRequestGet(context: { env: Env; request: Request }) {
  const { env, request } = context;

  if (!isAdmin(request)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    // Fetch coupons from database
    const result = await env.DB.prepare(`
      SELECT id, code, type, value, description, min_order_amount as minOrderAmount,
             max_discount as maxDiscount, usage_limit as usageLimit, used_count as usedCount,
             expires_at as expiresAt, is_active as active, created_at as createdAt
      FROM coupons 
      ORDER BY created_at DESC
    `).all();

    return new Response(JSON.stringify({
      success: true,
      coupons: result.results || []
    }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error fetching coupons:", error);
    return new Response(JSON.stringify({ 
      error: "Failed to fetch coupons" 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

export async function onRequestPost(context: { env: Env; request: Request }) {
  const { env, request } = context;

  if (!isAdmin(request)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const body = await request.json();
    const { action, coupon } = body;

    if (action === 'create') {
      // Create new coupon
      const id = crypto.randomUUID();
      await env.DB.prepare(`
        INSERT INTO coupons (id, code, type, value, description, min_order_amount, max_discount, usage_limit, expires_at, is_active, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `).bind(
        id,
        coupon.code.toUpperCase(),
        coupon.type,
        coupon.value,
        coupon.description,
        coupon.minOrderAmount || null,
        coupon.maxDiscount || null,
        coupon.usageLimit || null,
        coupon.expiresAt || null,
        coupon.active ? 1 : 0
      ).run();

      return new Response(JSON.stringify({
        success: true,
        message: 'Coupon created successfully',
        id
      }), {
        headers: { "Content-Type": "application/json" }
      });

    } else if (action === 'update') {
      // Update existing coupon
      await env.DB.prepare(`
        UPDATE coupons 
        SET code = ?, type = ?, value = ?, description = ?, min_order_amount = ?, 
            max_discount = ?, usage_limit = ?, expires_at = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(
        coupon.code.toUpperCase(),
        coupon.type,
        coupon.value,
        coupon.description,
        coupon.minOrderAmount || null,
        coupon.maxDiscount || null,
        coupon.usageLimit || null,
        coupon.expiresAt || null,
        coupon.active ? 1 : 0,
        coupon.id
      ).run();

      return new Response(JSON.stringify({
        success: true,
        message: 'Coupon updated successfully'
      }), {
        headers: { "Content-Type": "application/json" }
      });

    } else if (action === 'delete') {
      // Delete coupon
      await env.DB.prepare(`
        DELETE FROM coupons WHERE id = ?
      `).bind(coupon.id).run();

      return new Response(JSON.stringify({
        success: true,
        message: 'Coupon deleted successfully'
      }), {
        headers: { "Content-Type": "application/json" }
      });

    } else if (action === 'increment_usage') {
      // Increment usage count when coupon is used
      await env.DB.prepare(`
        UPDATE coupons 
        SET used_count = used_count + 1, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(coupon.id).run();

      return new Response(JSON.stringify({
        success: true,
        message: 'Coupon usage updated'
      }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error managing coupons:", error);
    return new Response(JSON.stringify({ 
      error: "Failed to manage coupons" 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

export async function onRequestPut(context: { env: Env; request: Request }) {
  return onRequestPost(context);
}

export async function onRequestDelete(context: { env: Env; request: Request }) {
  const { env, request } = context;

  if (!isAdmin(request)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return new Response(JSON.stringify({ error: 'Coupon ID required' }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    await env.DB.prepare(`
      DELETE FROM coupons WHERE id = ?
    `).bind(id).run();

    return new Response(JSON.stringify({
      success: true,
      message: 'Coupon deleted successfully'
    }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error deleting coupon:", error);
    return new Response(JSON.stringify({ 
      error: "Failed to delete coupon" 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}