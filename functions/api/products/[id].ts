// Cloudflare Pages Function to handle single product operations
interface Env {
  DB: D1Database;
}

// GET /api/products/:id - Get single product
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const productId = context.params.id as string;

    const { results } = await context.env.DB.prepare(
      `SELECT 
        p.*,
        u.full_name as seller_name,
        u.email as seller_email,
        u.phone_number as seller_phone,
        u.location as seller_location
      FROM products p
      LEFT JOIN users u ON p.seller_id = u.id
      WHERE p.id = ?`
    ).bind(productId).all();

    if (results.length === 0) {
      return new Response(JSON.stringify({ error: "Product not found" }), { 
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Parse JSON fields
    const product = results[0];
    if (product.images && typeof product.images === 'string') {
      product.images = JSON.parse(product.images);
    }

    return new Response(JSON.stringify(product), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error('Database error:', error);
    return new Response(JSON.stringify({ 
      error: "Failed to fetch product",
      message: error.message 
    }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

// PUT /api/products/:id - Update product
export const onRequestPut: PagesFunction<Env> = async (context) => {
  try {
    const productId = context.params.id as string;
    const updates = await context.request.json();

    const result = await context.env.DB.prepare(
      `UPDATE products 
       SET title = ?, description = ?, price = ?, 
           quantity_available = ?, is_available = ?,
           updated_at = datetime('now')
       WHERE id = ?`
    ).bind(
      updates.title,
      updates.description,
      updates.price,
      updates.quantity_available,
      updates.is_available ? 1 : 0,
      productId
    ).run();

    return new Response(JSON.stringify({ 
      success: true,
      message: "Product updated successfully" 
    }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error('Database error:', error);
    return new Response(JSON.stringify({ 
      error: "Failed to update product",
      message: error.message 
    }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

// DELETE /api/products/:id - Delete product
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  try {
    const productId = context.params.id as string;

    // Soft delete - mark as unavailable
    await context.env.DB.prepare(
      `UPDATE products SET is_available = 0 WHERE id = ?`
    ).bind(productId).run();

    return new Response(JSON.stringify({ 
      success: true,
      message: "Product deleted successfully" 
    }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error('Database error:', error);
    return new Response(JSON.stringify({ 
      error: "Failed to delete product",
      message: error.message 
    }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
