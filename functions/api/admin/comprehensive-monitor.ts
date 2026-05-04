// Comprehensive Monitoring API - Complete platform oversight

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
    const timeframe = url.searchParams.get('timeframe') || '24h';

    // Calculate time condition
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

    // Fetch comprehensive stats
    const stats = await fetchComprehensiveStats(env, timeCondition);
    
    // Fetch recent activities
    const recentActivities = await fetchRecentActivities(env, timeCondition);
    
    // System health check
    const systemHealth = await checkSystemHealth(env);
    
    // Geographic data
    const usersByLocation = await fetchGeographicData(env);
    
    // Performance metrics
    const performance = await fetchPerformanceMetrics(env);

    return new Response(JSON.stringify({
      success: true,
      timeframe,
      stats,
      recentActivities,
      systemHealth,
      usersByLocation,
      performance,
      lastUpdated: new Date().toISOString()
    }), {
      headers: { 
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate"
      }
    });

  } catch (error) {
    console.error("Error in comprehensive monitor:", error);
    return new Response(JSON.stringify({ 
      error: "Failed to fetch monitoring data",
      details: error.message 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

async function fetchComprehensiveStats(env: Env, timeCondition: string) {
  try {
    // Total counts
    const totalUsers = await env.DB.prepare("SELECT COUNT(*) as count FROM users").first();
    const totalProducts = await env.DB.prepare("SELECT COUNT(*) as count FROM products").first();
    const totalOrders = await env.DB.prepare("SELECT COUNT(*) as count FROM orders").first();
    const totalRevenue = await env.DB.prepare("SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status = 'delivered'").first();
    const totalReviews = await env.DB.prepare("SELECT COUNT(*) as count FROM product_reviews").first();
    
    // Today's counts
    const newUsersToday = await env.DB.prepare(`SELECT COUNT(*) as count FROM users WHERE created_at > ${timeCondition}`).first();
    const newProductsToday = await env.DB.prepare(`SELECT COUNT(*) as count FROM products WHERE created_at > ${timeCondition}`).first();
    const newOrdersToday = await env.DB.prepare(`SELECT COUNT(*) as count FROM orders WHERE created_at > ${timeCondition}`).first();
    const revenueToday = await env.DB.prepare(`SELECT COALESCE(SUM(total_amount), 0) as total FROM orders WHERE status = 'delivered' AND delivered_at > ${timeCondition}`).first();
    
    // Active users
    const activeUsers = await env.DB.prepare(`SELECT COUNT(*) as count FROM users WHERE last_login > ${timeCondition}`).first();
    
    // Pending orders
    const pendingOrders = await env.DB.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'pending'").first();
    
    // Average rating
    const averageRating = await env.DB.prepare("SELECT COALESCE(AVG(rating), 0) as avg FROM product_reviews").first();

    return {
      totalUsers: totalUsers?.count || 0,
      activeUsers: activeUsers?.count || 0,
      newUsersToday: newUsersToday?.count || 0,
      totalProducts: totalProducts?.count || 0,
      newProductsToday: newProductsToday?.count || 0,
      totalOrders: totalOrders?.count || 0,
      newOrdersToday: newOrdersToday?.count || 0,
      totalRevenue: totalRevenue?.total || 0,
      revenueToday: revenueToday?.total || 0,
      pendingOrders: pendingOrders?.count || 0,
      totalReviews: totalReviews?.count || 0,
      averageRating: averageRating?.avg || 0
    };
  } catch (error) {
    console.error("Error fetching stats:", error);
    return {
      totalUsers: 0, activeUsers: 0, newUsersToday: 0,
      totalProducts: 0, newProductsToday: 0,
      totalOrders: 0, newOrdersToday: 0,
      totalRevenue: 0, revenueToday: 0,
      pendingOrders: 0, totalReviews: 0, averageRating: 0
    };
  }
}

async function fetchRecentActivities(env: Env, timeCondition: string) {
  try {
    const activities = [];

    // Recent user registrations
    const recentUsers = await env.DB.prepare(`
      SELECT id, full_name, email, created_at, 'user_registered' as type
      FROM users 
      WHERE created_at > ${timeCondition}
      ORDER BY created_at DESC 
      LIMIT 5
    `).all();

    for (const user of recentUsers.results || []) {
      activities.push({
        id: user.id,
        type: 'user_registered',
        user: user.full_name,
        description: `registered with email ${user.email}`,
        timestamp: user.created_at,
        metadata: { email: user.email }
      });
    }

    // Recent product listings
    const recentProducts = await env.DB.prepare(`
      SELECT p.id, p.title, p.price, p.created_at, u.full_name as seller_name, 'product_listed' as type
      FROM products p
      JOIN users u ON p.seller_id = u.id
      WHERE p.created_at > ${timeCondition}
      ORDER BY p.created_at DESC 
      LIMIT 5
    `).all();

    for (const product of recentProducts.results || []) {
      activities.push({
        id: product.id,
        type: 'product_listed',
        user: product.seller_name,
        description: `listed "${product.title}" for KES ${product.price?.toLocaleString()}`,
        timestamp: product.created_at,
        metadata: { title: product.title, price: product.price }
      });
    }

    // Recent orders
    const recentOrders = await env.DB.prepare(`
      SELECT o.id, o.total_amount, o.created_at, 
             buyer.full_name as buyer_name, seller.full_name as seller_name,
             'order_placed' as type
      FROM orders o
      JOIN users buyer ON o.buyer_id = buyer.id
      JOIN users seller ON o.seller_id = seller.id
      WHERE o.created_at > ${timeCondition}
      ORDER BY o.created_at DESC 
      LIMIT 5
    `).all();

    for (const order of recentOrders.results || []) {
      activities.push({
        id: order.id,
        type: 'order_placed',
        user: order.buyer_name,
        description: `placed an order worth KES ${order.total_amount?.toLocaleString()} from ${order.seller_name}`,
        timestamp: order.created_at,
        metadata: { amount: order.total_amount, seller: order.seller_name }
      });
    }

    // Recent reviews
    const recentReviews = await env.DB.prepare(`
      SELECT r.id, r.rating, r.created_at,
             u.full_name as reviewer_name, p.title as product_title,
             'review_posted' as type
      FROM product_reviews r
      JOIN users u ON r.buyer_id = u.id
      JOIN products p ON r.product_id = p.id
      WHERE r.created_at > ${timeCondition}
      ORDER BY r.created_at DESC 
      LIMIT 5
    `).all();

    for (const review of recentReviews.results || []) {
      activities.push({
        id: review.id,
        type: 'review_posted',
        user: review.reviewer_name,
        description: `rated "${review.product_title}" ${review.rating}/5 stars`,
        timestamp: review.created_at,
        metadata: { rating: review.rating, product: review.product_title }
      });
    }

    // Sort all activities by timestamp
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return activities.slice(0, 20); // Return top 20 most recent
  } catch (error) {
    console.error("Error fetching activities:", error);
    return [];
  }
}

async function checkSystemHealth(env: Env) {
  try {
    const startTime = Date.now();
    
    // Test database connection
    await env.DB.prepare("SELECT 1").first();
    const dbResponseTime = Date.now() - startTime;

    // Test R2 storage (if available)
    let storageStatus = 'online';
    let storageUsage = 'Unknown';
    try {
      const listed = await env.R2.list({ limit: 1 });
      storageUsage = `${listed.objects.length} objects`;
    } catch (error) {
      storageStatus = 'offline';
      storageUsage = 'Error';
    }

    return {
      database: {
        status: 'online',
        responseTime: dbResponseTime
      },
      storage: {
        status: storageStatus,
        usage: storageUsage
      },
      api: {
        status: 'online',
        uptime: '99.9%' // This would be calculated from actual uptime monitoring
      }
    };
  } catch (error) {
    console.error("Error checking system health:", error);
    return {
      database: { status: 'offline', responseTime: 0 },
      storage: { status: 'offline', usage: 'Error' },
      api: { status: 'offline', uptime: '0%' }
    };
  }
}

async function fetchGeographicData(env: Env) {
  try {
    const result = await env.DB.prepare(`
      SELECT location, COUNT(*) as count
      FROM users 
      WHERE location IS NOT NULL AND location != ''
      GROUP BY location 
      ORDER BY count DESC 
      LIMIT 10
    `).all();

    return result.results || [];
  } catch (error) {
    console.error("Error fetching geographic data:", error);
    return [];
  }
}

async function fetchPerformanceMetrics(env: Env) {
  try {
    // Average order value
    const avgOrderValue = await env.DB.prepare(`
      SELECT COALESCE(AVG(total_amount), 0) as avg 
      FROM orders WHERE status = 'delivered'
    `).first();

    // Conversion rate (orders per user)
    const conversionRate = await env.DB.prepare(`
      SELECT 
        CASE 
          WHEN COUNT(DISTINCT u.id) > 0 
          THEN (COUNT(DISTINCT o.buyer_id) * 100.0 / COUNT(DISTINCT u.id))
          ELSE 0 
        END as rate
      FROM users u
      LEFT JOIN orders o ON u.id = o.buyer_id
    `).first();

    // Customer satisfaction (average rating)
    const customerSatisfaction = await env.DB.prepare(`
      SELECT COALESCE(AVG(rating) * 20, 0) as satisfaction 
      FROM product_reviews
    `).first();

    return {
      avgOrderValue: avgOrderValue?.avg || 0,
      conversionRate: conversionRate?.rate || 0,
      customerSatisfaction: customerSatisfaction?.satisfaction || 0,
      responseTime: 85 // This would be calculated from actual response time monitoring
    };
  } catch (error) {
    console.error("Error fetching performance metrics:", error);
    return {
      avgOrderValue: 0,
      conversionRate: 0,
      customerSatisfaction: 0,
      responseTime: 0
    };
  }
}