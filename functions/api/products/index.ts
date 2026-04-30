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

    query += " ORDER BY created_at DESC";

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

// POST create product
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    // Check if DB binding exists
    if (!context.env.DB) {
      return new Response(JSON.stringify({ 
        error: "DB binding not found",
        message: "The D1 database binding is not configured. Check Cloudflare Pages settings."
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data = await context.request.json() as {
      id?: string;
      seller_id: string;
      title: string;
      description: string;
      category: string;
      price: number;
      image_url?: string;
      images?: string;
      quantity_available?: number;
      location?: string;
      latitude?: number;
      longitude?: number;
    };

    if (!data.seller_id || !data.title || !data.description || !data.category || !data.price) {
      return new Response(JSON.stringify({ 
        error: "Missing required fields",
        required: ["seller_id", "title", "description", "category", "price"],
        received: data
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Verify seller exists
    const seller = await context.env.DB.prepare(
      "SELECT id FROM users WHERE id = ?"
    ).bind(data.seller_id).first();

    if (!seller) {
      return new Response(JSON.stringify({ 
        error: "Seller not found",
        message: "User must register first before posting products",
        seller_id: data.seller_id
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const id = data.id || crypto.randomUUID();
    const now = new Date().toISOString();

    await context.env.DB.prepare(
      `INSERT INTO products (id, seller_id, title, description, category, price, image_url, images, quantity_available, location, latitude, longitude, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id,
      data.seller_id,
      data.title,
      data.description,
      data.category,
      data.price,
      data.image_url || null,
      data.images || null,
      data.quantity_available || 1,
      data.location || null,
      data.latitude || null,
      data.longitude || null,
      now,
      now
    ).run();

    // Update seller stats
    await context.env.DB.prepare(
      "UPDATE seller_stats SET total_products = total_products + 1, updated_at = ? WHERE seller_id = ?"
    ).bind(now, data.seller_id).run();

    return new Response(JSON.stringify({ success: true, id }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error('POST /api/products error:', err);
    return new Response(JSON.stringify({ 
      error: err.message,
      stack: err.stack,
      details: "Failed to create product in database"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
