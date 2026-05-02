// Cloudflare Pages Function - Single Product API (GET, DELETE, PATCH)
interface Env {
  DB: D1Database;
}

// GET single product by ID
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const id = context.params.id as string;

    if (!id) {
      return new Response(JSON.stringify({ error: "Product ID required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const product = await context.env.DB.prepare(
      "SELECT * FROM products WHERE id = ?"
    ).bind(id).first();

    if (!product) {
      return new Response(JSON.stringify({ error: "Product not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(product), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error('GET /api/products/[id] error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

// DELETE product by ID
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  try {
    const id = context.params.id as string;

    if (!id) {
      return new Response(JSON.stringify({ error: "Product ID required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if product exists
    const product = await context.env.DB.prepare(
      "SELECT id, seller_id FROM products WHERE id = ?"
    ).bind(id).first();

    if (!product) {
      return new Response(JSON.stringify({ error: "Product not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Delete the product (CASCADE will handle related records)
    await context.env.DB.prepare(
      "DELETE FROM products WHERE id = ?"
    ).bind(id).run();

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Product deleted successfully" 
    }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error('DELETE /api/products/[id] error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: "Failed to delete product"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

// PATCH product by ID (update availability)
export const onRequestPatch: PagesFunction<Env> = async (context) => {
  try {
    const id = context.params.id as string;

    if (!id) {
      return new Response(JSON.stringify({ error: "Product ID required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await context.request.json() as { is_available?: number };

    // Check if product exists
    const product = await context.env.DB.prepare(
      "SELECT id, seller_id FROM products WHERE id = ?"
    ).bind(id).first();

    if (!product) {
      return new Response(JSON.stringify({ error: "Product not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Update availability if provided
    if (body.is_available !== undefined) {
      await context.env.DB.prepare(
        "UPDATE products SET is_available = ? WHERE id = ?"
      ).bind(body.is_available, id).run();
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Product updated successfully" 
    }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error('PATCH /api/products/[id] error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: "Failed to update product"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
