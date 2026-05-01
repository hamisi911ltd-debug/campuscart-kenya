// Cloudflare Pages Function - Cart API
interface Env {
  DB: D1Database;
}

// GET user's cart items
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
      SELECT ci.*, p.title, p.price, p.image_url, p.seller_id
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = ? AND p.is_available = 1
      ORDER BY ci.added_at DESC
    `).bind(userId).all();

    return new Response(JSON.stringify(results), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error('GET /api/cart error:', err);
    return new Response(JSON.stringify({ 
      error: err.message 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

// POST add item to cart
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
      quantity: number;
    };

    if (!data.user_id || !data.product_id || !data.quantity) {
      return new Response(JSON.stringify({ 
        error: "user_id, product_id, and quantity are required" 
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

    // Check if item already in cart
    const existing = await context.env.DB.prepare(
      "SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?"
    ).bind(data.user_id, data.product_id).first();

    const now = new Date().toISOString();

    if (existing) {
      // Update quantity
      await context.env.DB.prepare(
        "UPDATE cart_items SET quantity = quantity + ? WHERE id = ?"
      ).bind(data.quantity, (existing as any).id).run();
    } else {
      // Add new item
      const id = crypto.randomUUID();
      await context.env.DB.prepare(
        "INSERT INTO cart_items (id, user_id, product_id, quantity, added_at) VALUES (?, ?, ?, ?, ?)"
      ).bind(id, data.user_id, data.product_id, data.quantity, now).run();
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error('POST /api/cart error:', err);
    return new Response(JSON.stringify({ 
      error: err.message 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

// DELETE remove item from cart
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
      "DELETE FROM cart_items WHERE user_id = ? AND product_id = ?"
    ).bind(userId, productId).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error('DELETE /api/cart error:', err);
    return new Response(JSON.stringify({ 
      error: err.message 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};