// Cloudflare Pages Function for Admin Dashboard Stats

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
    // Get total users
    const usersResult = await env.DB.prepare("SELECT COUNT(*) as count FROM users").first();
    const totalUsers = usersResult?.count || 0;

    // Get active users (logged in last 30 days)
    const activeUsersResult = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM users 
      WHERE last_login > datetime('now', '-30 days')
    `).first();
    const activeUsers = activeUsersResult?.count || 0;

    // Get total products
    const productsResult = await env.DB.prepare("SELECT COUNT(*) as count FROM products").first();
    const totalProducts = productsResult?.count || 0;

    // Get available products
    const availableProductsResult = await env.DB.prepare(
      "SELECT COUNT(*) as count FROM products WHERE is_available = 1"
    ).first();
    const availableProducts = availableProductsResult?.count || 0;

    // Get total orders
    const ordersResult = await env.DB.prepare("SELECT COUNT(*) as count FROM orders").first();
    const totalOrders = ordersResult?.count || 0;

    // Get total revenue
    const revenueResult = await env.DB.prepare(
      "SELECT SUM(total_amount) as total FROM orders WHERE status = 'delivered'"
    ).first();
    const totalRevenue = revenueResult?.total || 0;

    // Get recent orders
    const recentOrdersResult = await env.DB.prepare(`
      SELECT 
        o.*,
        buyer.full_name as buyer_name,
        seller.full_name as seller_name
      FROM orders o
      LEFT JOIN users buyer ON o.buyer_id = buyer.id
      LEFT JOIN users seller ON o.seller_id = seller.id
      ORDER BY o.created_at DESC
      LIMIT 10
    `).all();

    // Get recent users
    const recentUsersResult = await env.DB.prepare(`
      SELECT * FROM users 
      ORDER BY created_at DESC 
      LIMIT 10
    `).all();

    // Get orders by status
    const orderStatusResult = await env.DB.prepare(`
      SELECT status, COUNT(*) as count 
      FROM orders 
      GROUP BY status
    `).all();

    // Get monthly revenue (last 12 months)
    const monthlyRevenueResult = await env.DB.prepare(`
      SELECT 
        strftime('%Y-%m', created_at) as month,
        SUM(total_amount) as revenue,
        COUNT(*) as orders
      FROM orders 
      WHERE created_at > datetime('now', '-12 months')
      AND status = 'delivered'
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY month DESC
    `).all();

    return new Response(JSON.stringify({ 
      success: true, 
      stats: {
        totalUsers,
        activeUsers,
        totalProducts,
        availableProducts,
        totalOrders,
        totalRevenue,
        recentOrders: recentOrdersResult.results,
        recentUsers: recentUsersResult.results,
        ordersByStatus: orderStatusResult.results,
        monthlyRevenue: monthlyRevenueResult.results
      }
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return new Response(JSON.stringify({ 
      error: "Failed to fetch dashboard stats" 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}