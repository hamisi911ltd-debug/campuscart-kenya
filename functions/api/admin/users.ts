// Cloudflare Pages Function for Admin Users Management

interface Env {
  DB: D1Database;
}

// Simple admin authentication check
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
    const result = await env.DB.prepare(`
      SELECT 
        u.*,
        ss.total_products,
        ss.total_sales,
        ss.total_revenue,
        ss.average_rating
      FROM users u
      LEFT JOIN seller_stats ss ON u.id = ss.seller_id
      ORDER BY u.created_at DESC
    `).all();

    return new Response(JSON.stringify({ 
      success: true, 
      users: result.results 
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return new Response(JSON.stringify({ 
      error: "Failed to fetch users" 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

export async function onRequestPut(context: { env: Env; request: Request }) {
  const { env, request } = context;

  if (!isAdmin(request)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const body = await request.json();
    const { id, is_active } = body;

    if (!id || typeof is_active !== 'boolean') {
      return new Response(JSON.stringify({ 
        error: "User ID and is_active status are required" 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    await env.DB.prepare(
      "UPDATE users SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).bind(is_active, id).run();

    return new Response(JSON.stringify({ 
      success: true, 
      message: `User ${is_active ? 'activated' : 'deactivated'} successfully` 
    }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error updating user:", error);
    return new Response(JSON.stringify({ 
      error: "Failed to update user" 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}