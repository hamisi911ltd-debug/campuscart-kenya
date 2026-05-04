// Advanced Analytics API for Admin Dashboard

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
    const url = new URL(request.url);
    const period = url.searchParams.get('period') || '30d'; // 7d, 30d, 90d, 1y
    const metric = url.searchParams.get('metric') || 'all';

    // Time-based analytics
    const timeSeriesData = await getTimeSeriesData(env, period);
    
    // User analytics
    const userAnalytics = await getUserAnalytics(env, period);
    
    // Product analytics
    const productAnalytics = await getProductAnalytics(env, period);
    
    // Revenue analytics
    const revenueAnalytics = await getRevenueAnalytics(env, period);
    
    // Geographic analytics
    const geographicAnalytics = await getGeographicAnalytics(env);
    
    // Performance metrics
    const performanceMetrics = await getPerformanceMetrics(env, period);

    return new Response(JSON.stringify({
      success: true,
      period,
      analytics: {
        timeSeries: timeSeriesData,
        users: userAnalytics,
        products: productAnalytics,
        revenue: revenueAnalytics,
        geographic: geographicAnalytics,
        performance: performanceMetrics
      }
    }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error fetching analytics:", error);
    return new Response(JSON.stringify({ 
      error: "Failed to fetch analytics data",
      details: error.message 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

async function getTimeSeriesData(env: Env, period: string) {
  const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
  
  // Daily user registrations
  const userRegistrations = await env.DB.prepare(`
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as count
    FROM users 
    WHERE created_at > datetime('now', '-${days} days')
    GROUP BY DATE(created_at)
    ORDER BY date
  `).all();

  // Daily product listings
  const productListings = await env.DB.prepare(`
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as count
    FROM products 
    WHERE created_at > datetime('now', '-${days} days')
    GROUP BY DATE(created_at)
    ORDER BY date
  `).all();

  // Daily orders
  const dailyOrders = await env.DB.prepare(`
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as count,
      SUM(total_amount) as revenue
    FROM orders 
    WHERE created_at > datetime('now', '-${days} days')
    GROUP BY DATE(created_at)
    ORDER BY date
  `).all();

  return {
    userRegistrations: userRegistrations.results || [],
    productListings: productListings.results || [],
    dailyOrders: dailyOrders.results || []
  };
}

async function getUserAnalytics(env: Env, period: string) {
  const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;

  // User growth metrics
  const totalUsers = await env.DB.prepare("SELECT COUNT(*) as count FROM users").first();
  const newUsers = await env.DB.prepare(`
    SELECT COUNT(*) as count FROM users 
    WHERE created_at > datetime('now', '-${days} days')
  `).first();
  
  const activeUsers = await env.DB.prepare(`
    SELECT COUNT(*) as count FROM users 
    WHERE last_login > datetime('now', '-${days} days')
  `).first();

  // User demographics
  const usersByLocation = await env.DB.prepare(`
    SELECT location, COUNT(*) as count
    FROM users 
    WHERE location IS NOT NULL AND location != ''
    GROUP BY location 
    ORDER BY count DESC 
    LIMIT 10
  `).all();

  // Seller vs Buyer ratio
  const userTypes = await env.DB.prepare(`
    SELECT 
      SUM(CASE WHEN is_seller = 1 THEN 1 ELSE 0 END) as sellers,
      SUM(CASE WHEN is_seller = 0 THEN 1 ELSE 0 END) as buyers
    FROM users
  `).first();

  // User engagement
  const userEngagement = await env.DB.prepare(`
    SELECT 
      AVG(CASE WHEN last_login > datetime('now', '-7 days') THEN 1 ELSE 0 END) * 100 as weekly_active_rate,
      AVG(CASE WHEN last_login > datetime('now', '-30 days') THEN 1 ELSE 0 END) * 100 as monthly_active_rate
    FROM users
  `).first();

  return {
    totalUsers: totalUsers?.count || 0,
    newUsers: newUsers?.count || 0,
    activeUsers: activeUsers?.count || 0,
    usersByLocation: usersByLocation.results || [],
    userTypes: {
      sellers: userTypes?.sellers || 0,
      buyers: userTypes?.buyers || 0
    },
    engagement: {
      weeklyActiveRate: userEngagement?.weekly_active_rate || 0,
      monthlyActiveRate: userEngagement?.monthly_active_rate || 0
    }
  };
}

async function getProductAnalytics(env: Env, period: string) {
  const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;

  // Product metrics
  const totalProducts = await env.DB.prepare("SELECT COUNT(*) as count FROM products").first();
  const availableProducts = await env.DB.prepare("SELECT COUNT(*) as count FROM products WHERE is_available = 1").first();
  const newProducts = await env.DB.prepare(`
    SELECT COUNT(*) as count FROM products 
    WHERE created_at > datetime('now', '-${days} days')
  `).first();

  // Category distribution
  const categoryDistribution = await env.DB.prepare(`
    SELECT category, COUNT(*) as count, AVG(price) as avg_price
    FROM products 
    WHERE is_available = 1
    GROUP BY category 
    ORDER BY count DESC
  `).all();

  // Price analytics
  const priceAnalytics = await env.DB.prepare(`
    SELECT 
      AVG(price) as average_price,
      MIN(price) as min_price,
      MAX(price) as max_price,
      COUNT(*) as total_products
    FROM products 
    WHERE is_available = 1
  `).first();

  // Top products by views/favorites (if you track these)
  const topProducts = await env.DB.prepare(`
    SELECT 
      p.id, p.title, p.price, p.category,
      u.full_name as seller_name,
      COUNT(f.id) as favorite_count
    FROM products p
    LEFT JOIN users u ON p.seller_id = u.id
    LEFT JOIN favorites f ON p.id = f.product_id
    WHERE p.is_available = 1
    GROUP BY p.id, p.title, p.price, p.category, u.full_name
    ORDER BY favorite_count DESC
    LIMIT 10
  `).all();

  return {
    totalProducts: totalProducts?.count || 0,
    availableProducts: availableProducts?.count || 0,
    newProducts: newProducts?.count || 0,
    categoryDistribution: categoryDistribution.results || [],
    priceAnalytics: {
      averagePrice: priceAnalytics?.average_price || 0,
      minPrice: priceAnalytics?.min_price || 0,
      maxPrice: priceAnalytics?.max_price || 0
    },
    topProducts: topProducts.results || []
  };
}

async function getRevenueAnalytics(env: Env, period: string) {
  const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;

  // Revenue metrics
  const totalRevenue = await env.DB.prepare(`
    SELECT COALESCE(SUM(total_amount), 0) as total 
    FROM orders WHERE status = 'delivered'
  `).first();

  const periodRevenue = await env.DB.prepare(`
    SELECT COALESCE(SUM(total_amount), 0) as total 
    FROM orders 
    WHERE status = 'delivered' AND delivered_at > datetime('now', '-${days} days')
  `).first();

  // Average order value
  const avgOrderValue = await env.DB.prepare(`
    SELECT AVG(total_amount) as avg 
    FROM orders WHERE status = 'delivered'
  `).first();

  // Revenue by category
  const revenueByCategory = await env.DB.prepare(`
    SELECT 
      p.category,
      SUM(oi.price_at_purchase * oi.quantity) as revenue,
      COUNT(DISTINCT o.id) as orders
    FROM orders o
    JOIN order_items oi ON o.id = oi.order_id
    JOIN products p ON oi.product_id = p.id
    WHERE o.status = 'delivered'
    GROUP BY p.category
    ORDER BY revenue DESC
  `).all();

  // Top selling products
  const topSellingProducts = await env.DB.prepare(`
    SELECT 
      p.title,
      p.price,
      SUM(oi.quantity) as total_sold,
      SUM(oi.price_at_purchase * oi.quantity) as revenue
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    JOIN orders o ON oi.order_id = o.id
    WHERE o.status = 'delivered'
    GROUP BY p.id, p.title, p.price
    ORDER BY total_sold DESC
    LIMIT 10
  `).all();

  return {
    totalRevenue: totalRevenue?.total || 0,
    periodRevenue: periodRevenue?.total || 0,
    averageOrderValue: avgOrderValue?.avg || 0,
    revenueByCategory: revenueByCategory.results || [],
    topSellingProducts: topSellingProducts.results || []
  };
}

async function getGeographicAnalytics(env: Env) {
  // User distribution by location
  const usersByLocation = await env.DB.prepare(`
    SELECT location, COUNT(*) as user_count
    FROM users 
    WHERE location IS NOT NULL AND location != ''
    GROUP BY location 
    ORDER BY user_count DESC 
    LIMIT 20
  `).all();

  // Orders by delivery location
  const ordersByLocation = await env.DB.prepare(`
    SELECT 
      CASE 
        WHEN delivery_address LIKE '%Nairobi%' THEN 'Nairobi'
        WHEN delivery_address LIKE '%Mombasa%' THEN 'Mombasa'
        WHEN delivery_address LIKE '%Kisumu%' THEN 'Kisumu'
        WHEN delivery_address LIKE '%Nakuru%' THEN 'Nakuru'
        ELSE 'Other'
      END as city,
      COUNT(*) as order_count,
      SUM(total_amount) as revenue
    FROM orders
    WHERE status = 'delivered'
    GROUP BY city
    ORDER BY order_count DESC
  `).all();

  return {
    usersByLocation: usersByLocation.results || [],
    ordersByLocation: ordersByLocation.results || []
  };
}

async function getPerformanceMetrics(env: Env, period: string) {
  const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;

  // Conversion metrics
  const conversionRate = await env.DB.prepare(`
    SELECT 
      COUNT(DISTINCT o.buyer_id) * 100.0 / COUNT(DISTINCT u.id) as rate
    FROM users u
    LEFT JOIN orders o ON u.id = o.buyer_id
    WHERE u.created_at > datetime('now', '-${days} days')
  `).first();

  // Order fulfillment rate
  const fulfillmentRate = await env.DB.prepare(`
    SELECT 
      COUNT(CASE WHEN status = 'delivered' THEN 1 END) * 100.0 / COUNT(*) as rate
    FROM orders
    WHERE created_at > datetime('now', '-${days} days')
  `).first();

  // Average time to delivery
  const avgDeliveryTime = await env.DB.prepare(`
    SELECT 
      AVG(julianday(delivered_at) - julianday(created_at)) as avg_days
    FROM orders
    WHERE status = 'delivered' AND delivered_at IS NOT NULL
  `).first();

  // Customer satisfaction (based on reviews)
  const customerSatisfaction = await env.DB.prepare(`
    SELECT AVG(rating) as avg_rating, COUNT(*) as total_reviews
    FROM product_reviews
    WHERE created_at > datetime('now', '-${days} days')
  `).first();

  return {
    conversionRate: conversionRate?.rate || 0,
    fulfillmentRate: fulfillmentRate?.rate || 0,
    avgDeliveryTime: avgDeliveryTime?.avg_days || 0,
    customerSatisfaction: {
      averageRating: customerSatisfaction?.avg_rating || 0,
      totalReviews: customerSatisfaction?.total_reviews || 0
    }
  };
}