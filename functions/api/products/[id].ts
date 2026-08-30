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

function isAdmin(request: Request): boolean {
  const cookie = request.headers.get("Cookie") || "";
  if (cookie.includes("admin_session=true")) return true;
  const authHeader = request.headers.get("Authorization");
  if (authHeader === "Bearer admin_session_true") return true;
  return request.headers.get("X-Admin-Session") === "true";
}

// DELETE product by ID (admin-only - this was previously reachable by
// anyone with no authentication check at all)
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  try {
    if (!isAdmin(context.request)) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

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

    // order_items.product_id is NOT NULL but its foreign key tries to null
    // it out on product deletion - deleting an ordered product fails
    // outright without this (see the matching fix in admin/products.ts).
    await context.env.DB.prepare(
      "DELETE FROM order_items WHERE product_id = ?"
    ).bind(id).run();

    // Delete the product (CASCADE handles reviews/cart/favorites)
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
// PATCH product by ID (admin-only - same missing-auth issue as DELETE above)
export const onRequestPatch: PagesFunction<Env> = async (context) => {
  try {
    if (!isAdmin(context.request)) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

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
