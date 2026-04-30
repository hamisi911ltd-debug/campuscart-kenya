// Cloudflare Pages Function - Favorites API
interface Env {
  DB: D1Database;
}

// GET user's favorites
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    if (!context.env.DB) {
      return new Response(JSON.stringify({ 
        error: "DB binding not found" 
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const url = new URL(context.request.url);
    const userId = url.searchParams.get("user_id");

    if (!userId) {
      return new Response(JSON.stringify({ 
        error: "user_id parameter required" 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { results } = await context.env.DB.prepare(`
      SELECT f.*, p.title, p.price, p.image_url, p.category, p.seller_id, p.location
      FROM favorites f
      JOIN products p ON f.product_id = p.id
      WHERE f.user_id = ? AND p.is_available = 1
      ORDER BY f.created_at DESC
    `).bind(userId).all();

    return new Response(JSON.stringify(results), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error('GET /api/favorites error:', err);
    return new Response(JSON.stringify({ 
      error: err.message 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

// POST add to favorites
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    if (!context.env.DB) {
      return new Response(JSON.stringify({ 
        error: "DB binding not found" 
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data = await context.request.json() as {
      user_id: string;
      product_id: string;
    };

    if (!data.user_id || !data.product_id) {
      return new Response(JSON.stringify({ 
        error: "user_id and product_id are required" 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if product exists
    const product = await context.env.DB.prepare(
      "SELECT id FROM products WHERE id = ? AND is_available = 1"
    ).bind(data.product_id).first();

    if (!product) {
      return new Response(JSON.stringify({ 
        error: "Product not found or unavailable" 
      }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if already favorited
    const existing = await context.env.DB.prepare(
      "SELECT id FROM favorites WHERE user_id = ? AND product_id = ?"
    ).bind(data.user_id, data.product_id).first();

    if (existing) {
      return new Response(JSON.stringify({ 
        error: "Product already in favorites" 
      }), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      });
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await context.env.DB.prepare(
      "INSERT INTO favorites (id, user_id, product_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?)"
    ).bind(id, data.user_id, data.product_id, now, now).run();

    return new Response(JSON.stringify({ success: true }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error('POST /api/favorites error:', err);
    return new Response(JSON.stringify({ 
      error: err.message 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

// DELETE remove from favorites
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  try {
    if (!context.env.DB) {
      return new Response(JSON.stringify({ 
        error: "DB binding not found" 
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const url = new URL(context.request.url);
    const userId = url.searchParams.get("user_id");
    const productId = url.searchParams.get("product_id");

    if (!userId || !productId) {
      return new Response(JSON.stringify({ 
        error: "user_id and product_id parameters required" 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    await context.env.DB.prepare(
      "DELETE FROM favorites WHERE user_id = ? AND product_id = ?"
    ).bind(userId, productId).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error('DELETE /api/favorites error:', err);
    return new Response(JSON.stringify({ 
      error: err.message 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};