// Cloudflare Pages Function to handle products API
interface Env {
  DB: D1Database;
  STORAGE: R2Bucket;
}

// GET /api/products - Get all products
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { results } = await context.env.DB.prepare(
      `SELECT 
        p.*,
        u.full_name as seller_name,
        u.email as seller_email,
        u.phone_number as seller_phone
      FROM products p
      LEFT JOIN users u ON p.seller_id = u.id
      WHERE p.is_available = 1
      ORDER BY p.created_at DESC
      LIMIT 100`
    ).all();

    return new Response(JSON.stringify(results), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error('Database error:', error);
    return new Response(JSON.stringify({ 
      error: "Failed to fetch products",
      message: error.message 
    }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

// POST /api/products - Create new product
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const product = await context.request.json();

    // Validate required fields
    if (!product.title || !product.price || !product.seller_id) {
      return new Response(JSON.stringify({ 
        error: "Missing required fields: title, price, seller_id" 
      }), { 
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Generate UUID for product
    const productId = crypto.randomUUID();

    // Insert product into database
    const result = await context.env.DB.prepare(
      `INSERT INTO products (
        id, seller_id, title, description, category, price,
        image_url, images, quantity_available, location,
        latitude, longitude, is_available, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
    ).bind(
      productId,
      product.seller_id,
      product.title,
      product.description || '',
      product.category || 'electronics',
      product.price,
      product.image_url || product.image, // Main image
      JSON.stringify(product.images || [product.image_url]), // All images as JSON
      product.quantity_available || 1,
      product.location || '',
      product.latitude || null,
      product.longitude || null,
      1 // is_available
    ).run();

    return new Response(JSON.stringify({ 
      success: true,
      id: productId,
      message: "Product created successfully" 
    }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error('Database error:', error);
    return new Response(JSON.stringify({ 
      error: "Failed to create product",
      message: error.message 
    }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
