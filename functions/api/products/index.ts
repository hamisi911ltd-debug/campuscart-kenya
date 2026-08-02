// Cloudflare Pages Function - Products API
interface Env {
  DB: D1Database;
}

// GET all products
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    // Check if DB binding exists
    if (!context.env.DB) {
      console.error('DB binding not found');
      // Return empty array instead of error object
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const url = new URL(context.request.url);
    const category = url.searchParams.get("category");
    const sellerId = url.searchParams.get("seller_id");
    const search = url.searchParams.get("search");
    const sort = url.searchParams.get("sort") || "newest";
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    let query = "SELECT * FROM products WHERE is_available = 1";
    const params: any[] = [];

    if (category) {
      query += " AND category = ?";
      params.push(category);
    }
    if (sellerId) {
      query += " AND seller_id = ?";
      params.push(sellerId);
    }
    if (search) {
      query += " AND (title LIKE ? OR description LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    // Sort order
    switch (sort) {
      case "trending":
        // Trending: High rating + many reviews
        query += " ORDER BY (rating * reviews_count) DESC, created_at DESC";
        break;
      case "newest":
        query += " ORDER BY created_at DESC";
        break;
      case "price_low":
        query += " ORDER BY price ASC";
        break;
      case "price_high":
        query += " ORDER BY price DESC";
        break;
      case "rating":
        query += " ORDER BY rating DESC, reviews_count DESC";
        break;
      default:
        query += " ORDER BY created_at DESC";
    }

    query += " LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const { results } = await context.env.DB.prepare(query).bind(...params).all();

    // Ensure results is always an array
    return new Response(JSON.stringify(results || []), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error('GET /api/products error:', err);
    // Return empty array on error instead of error object
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
};

// Product creation now only happens through the admin-gated
// /api/admin/products endpoint (see functions/api/admin/products.ts) —
// this is a single-vendor store, so anonymous product creation is disabled.
