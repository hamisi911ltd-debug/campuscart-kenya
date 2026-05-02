// Cloudflare Pages Function - Get My Listings
interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    // Get user ID from Authorization header or query parameter
    const authHeader = context.request.headers.get("Authorization");
    const userId = authHeader?.replace("Bearer ", "");
    
    // Fallback to query parameter for compatibility
    const url = new URL(context.request.url);
    const sellerIdFromQuery = url.searchParams.get("seller_id");
    
    const sellerId = userId || sellerIdFromQuery;

    if (!sellerId) {
      return new Response(JSON.stringify({ error: "Unauthorized - seller_id required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Fetch all products for this seller
    const { results: products } = await context.env.DB.prepare(`
      SELECT 
        id, 
        title, 
        description, 
        category, 
        price, 
        original_price, 
        image_url, 
        quantity_available, 
        location, 
        is_available, 
        created_at,
        rating,
        reviews_count
      FROM products 
      WHERE seller_id = ? 
      ORDER BY created_at DESC
    `).bind(sellerId).all();

    return new Response(JSON.stringify({ 
      products: products || [],
      count: products?.length || 0
    }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error('Error fetching my listings:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: "Failed to fetch listings"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
