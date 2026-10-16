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

    // Serve repeat requests from Cloudflare's edge cache instead of querying
    // D1 every time (the homepage asks for the same few lists on every visit).
    // Anything new shows up within about a minute.
    const edgeCache: Cache | undefined = typeof caches !== "undefined" ? (caches as any).default : undefined;
    const cacheKey = new Request(context.request.url, { method: "GET" });
    if (edgeCache) {
      const cached = await edgeCache.match(cacheKey);
      if (cached) return cached;
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

    // "mixed": interleave categories so a page shows a varied spread (one
    // product from each category in turn) instead of whichever category
    // was imported most recently. Within a category products are ordered
    // by id (a UUID, so effectively random but stable), which keeps
    // pagination consistent between requests.
    const mixed = sort === "mixed";
    if (mixed) {
      query = `SELECT * FROM (
        SELECT *, ROW_NUMBER() OVER (PARTITION BY category ORDER BY id) AS mix_rank
        FROM (${query})
      ) ORDER BY mix_rank, category, id`;
    }

    // Sort order
    switch (mixed ? "none" : sort) {
      case "none":
        break;
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
    // The list only needs enough to draw a card: a short description and just
    // the main photo. The full description + gallery come from /api/products/:id
    // when a product page opens (this cuts the homepage payload by about 3/4).
    const slim = (results || []).map((row: any) => ({
      ...row,
      description: typeof row.description === "string" ? row.description.slice(0, 160) : row.description,
      images: row.image_url ? JSON.stringify([row.image_url]) : row.images,
    }));

    const response = new Response(JSON.stringify(slim), {
      headers: {
        "Content-Type": "application/json",
        // Browser: reuse for 30s and refresh quietly in the background for 10 min.
        // Edge: keep for 60s.
        "Cache-Control": "public, max-age=30, s-maxage=60, stale-while-revalidate=600",
      },
    });
    if (edgeCache) context.waitUntil(edgeCache.put(cacheKey, response.clone()));
    return response;
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
