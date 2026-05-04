// Comprehensive Activity Monitoring API for Admin

interface Env {
  DB: D1Database;
  R2: R2Bucket;
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
    const url = new URL(request.url);
    const timeframe = url.searchParams.get('timeframe') || '24h'; // 24h, 7d, 30d
    const activity = url.searchParams.get('activity') || 'all';

    let timeCondition = '';
    switch (timeframe) {
      case '1h':
        timeCondition = "datetime('now', '-1 hour')";
        break;
      case '24h':
        timeCondition = "datetime('now', '-1 day')";
        break;
      case '7d':
        timeCondition = "datetime('now', '-7 days')";
        break;
      case '30d':
        timeCondition = "datetime('now', '-30 days')";
        break;
      default:
        timeCondition = "datetime('now', '-1 day')";
    }

    // Real-time activity stats
    const stats = {
      // User Activities
      newUsers: await env.DB.prepare(`
        SELECT COUNT(*) as count FROM users 
        WHERE created_at > ${timeCondition}
      `).first(),
      
      activeUsers: await env.DB.prepare(`
        SELECT COUNT(*) as count FROM users 
        WHERE last_login > ${timeCondition}
      `).first(),

      // Product Activities  
      newProducts: await env.DB.prepare(`
        SELECT COUNT(*) as count FROM products 
        WHERE created_at > ${timeCondition}
      `).first(),

      productUpdates: await env.DB.prepare(`
        SELECT COUNT(*) as count FROM products 
        WHERE updated_at > ${timeCondition} AND created_at < updated_at
      `).first(),

      // Order Activities
      newOrders: await env.DB.prepare(`
        SELECT COUNT(*) as count FROM orders 
        WHERE created_at > ${timeCondition}
      `).first(),

      completedOrders: await env.DB.prepare(`
        SELECT COUNT(*) as count FROM orders 
        WHERE status = 'delivered' AND delivered_at > ${timeCondition}
      `).first(),

      // Review Activities
      newReviews: await env.DB.prepare(`
        SELECT COUNT(*) as count FROM product_reviews 
        WHERE created_at > ${timeCondition}
      `).first(),

      // Message Activities
      newMessages: await env.DB.prepare(`
        SELECT COUNT(*) as count FROM messages 
        WHERE created_at > ${timeCondition}
      `).first(),

      // Revenue
      revenue: await env.DB.prepare(`
        SELECT COALESCE(SUM(total_amount), 0) as total FROM orders 
        WHERE status = 'delivered' AND delivered_at > ${timeCondition}
      `).first()
    };

    // Recent Activities Feed
    const recentActivities = [];

    // Recent Users
    const recentUsers = await env.DB.prepare(`
      SELECT id, full_name, email, created_at, 'user_registered' as activity_type
      FROM users 
      WHERE created_at > ${timeCondition}
      ORDER BY created_at DESC 
      LIMIT 10
    `).all();

    // Recent Products
    const recentProducts = await env.DB.prepare(`
      SELECT p.id, p.title, p.price, p.created_at, u.full_name as seller_name, 'product_listed' as activity_type
      FROM products p
      JOIN users u ON p.seller_id = u.id
      WHERE p.created_at > ${timeCondition}
      ORDER BY p.created_at DESC 
      LIMIT 10
    `).all();

    // Recent Orders
    const recentOrders = await env.DB.prepare(`
      SELECT o.id, o.total_amount, o.status, o.created_at, 
             buyer.full_name as buyer_name, seller.full_name as seller_name,
             'order_placed' as activity_type
      FROM orders o
      JOIN users buyer ON o.buyer_id = buyer.id
      JOIN users seller ON o.seller_id = seller.id
      WHERE o.created_at > ${timeCondition}
      ORDER BY o.created_at DESC 
      LIMIT 10
    `).all();

    // Recent Reviews
    const recentReviews = await env.DB.prepare(`
      SELECT r.id, r.rating, r.comment, r.created_at,
             u.full_name as reviewer_name, p.title as product_title,
             'review_posted' as activity_type
      FROM product_reviews r
      JOIN users u ON r.buyer_id = u.id
      JOIN products p ON r.product_id = p.id
      WHERE r.created_at > ${timeCondition}
      ORDER BY r.created_at DESC 
      LIMIT 10
    `).all();

    // Combine all activities
    recentActivities.push(...recentUsers.results);
    recentActivities.push(...recentProducts.results);
    recentActivities.push(...recentOrders.results);
    recentActivities.push(...recentReviews.results);

    // Sort by timestamp
    recentActivities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // System Health Metrics
    const systemHealth = {
      totalUsers: await env.DB.prepare("SELECT COUNT(*) as count FROM users").first(),
      totalProducts: await env.DB.prepare("SELECT COUNT(*) as count FROM products").first(),
      totalOrders: await env.DB.prepare("SELECT COUNT(*) as count FROM orders").first(),
      totalRevenue: await env.DB.prepare("SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status = 'delivered'").first(),
      
      // Performance metrics
      averageOrderValue: await env.DB.prepare(`
        SELECT COALESCE(AVG(total_amount), 0) as avg FROM orders WHERE status = 'delivered'
      `).first(),
      
      conversionRate: await env.DB.prepare(`
        SELECT 
          CASE 
            WHEN COUNT(DISTINCT buyer_id) > 0 
            THEN (COUNT(*) * 100.0 / COUNT(DISTINCT buyer_id))
            ELSE 0 
          END as rate
        FROM orders
      `).first(),

      // Top categories
      topCategories: await env.DB.prepare(`
        SELECT category, COUNT(*) as count 
        FROM products 
        WHERE is_available = 1
        GROUP BY category 
        ORDER BY count DESC 
        LIMIT 5
      `).all(),

      // Order status distribution
      orderStatusDistribution: await env.DB.prepare(`
        SELECT status, COUNT(*) as count 
        FROM orders 
        GROUP BY status
      `).all()
    };

    // Geographic data
    const geographicData = await env.DB.prepare(`
      SELECT location, COUNT(*) as user_count
      FROM users 
      WHERE location IS NOT NULL AND location != ''
      GROUP BY location 
      ORDER BY user_count DESC 
      LIMIT 10
    `).all();

    // Seller performance
    const topSellers = await env.DB.prepare(`
      SELECT 
        u.id, u.full_name, u.email,
        ss.total_products, ss.total_sales, ss.total_revenue, ss.average_rating
      FROM users u
      JOIN seller_stats ss ON u.id = ss.seller_id
      WHERE u.is_seller = 1
      ORDER BY ss.total_revenue DESC
      LIMIT 10
    `).all();

    return new Response(JSON.stringify({
      success: true,
      timeframe,
      stats: {
        newUsers: stats.newUsers?.count || 0,
        activeUsers: stats.activeUsers?.count || 0,
        newProducts: stats.newProducts?.count || 0,
        productUpdates: stats.productUpdates?.count || 0,
        newOrders: stats.newOrders?.count || 0,
        completedOrders: stats.completedOrders?.count || 0,
        newReviews: stats.newReviews?.count || 0,
        newMessages: stats.newMessages?.count || 0,
        revenue: stats.revenue?.total || 0
      },
      recentActivities: recentActivities.slice(0, 20),
      systemHealth: {
        totalUsers: systemHealth.totalUsers?.count || 0,
        totalProducts: systemHealth.totalProducts?.count || 0,
        totalOrders: systemHealth.totalOrders?.count || 0,
        totalRevenue: systemHealth.totalRevenue?.total || 0,
        averageOrderValue: systemHealth.averageOrderValue?.avg || 0,
        conversionRate: systemHealth.conversionRate?.rate || 0,
        topCategories: systemHealth.topCategories.results || [],
        orderStatusDistribution: systemHealth.orderStatusDistribution.results || []
      },
      geographicData: geographicData.results || [],
      topSellers: topSellers.results || []
    }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error fetching activity monitor data:", error);
    return new Response(JSON.stringify({ 
      error: "Failed to fetch activity data",
      details: error.message 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}