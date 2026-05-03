// Cloudflare Pages Function for Admin Products API
// This handles CRUD operations for products in D1 database

interface Env {
  DB: D1Database;
  STORAGE: R2Bucket;
}

interface Product {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  original_price?: number;
  image_url?: string;
  images?: string;
  quantity_available: number;
  location?: string;
  latitude?: number;
  longitude?: number;
  rating: number;
  reviews_count: number;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

// Enforce admin subdomain access only
function enforceAdminDomain(request: Request): Response | null {
  const url = new URL(request.url);
  if (url.hostname !== "admin.campusmart.co.ke" && url.hostname !== "localhost") {
    return new Response(JSON.stringify({ 
      error: "Admin access is only available at admin.campusmart.co.ke" 
    }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }
  return null;
}

// Simple admin authentication check
function isAdmin(request: Request): boolean {
  const cookie = request.headers.get("Cookie") || "";
  return cookie.includes("admin_session=true");
}

export async function onRequestGet(context: { env: Env; request: Request }) {
  const { env, request } = context;

  // Check domain restriction
  const domainCheck = enforceAdminDomain(request);
  if (domainCheck) return domainCheck;

  // Check admin authentication
  if (!isAdmin(request)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    // Get all products with seller information
    const result = await env.DB.prepare(`
      SELECT 
        p.*,
        u.full_name as seller_name,
        u.email as seller_email
      FROM products p
      LEFT JOIN users u ON p.seller_id = u.id
      ORDER BY p.created_at DESC
    `).all();

    return new Response(JSON.stringify({ 
      success: true, 
      products: result.results 
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return new Response(JSON.stringify({ 
      error: "Failed to fetch products" 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

export async function onRequestDelete(context: { env: Env; request: Request }) {
  const { env, request } = context;

  // Check domain restriction
  const domainCheck = enforceAdminDomain(request);
  if (domainCheck) return domainCheck;

  // Check admin authentication
  if (!isAdmin(request)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const url = new URL(request.url);
    const productId = url.searchParams.get("id");

    if (!productId) {
      return new Response(JSON.stringify({ error: "Product ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Get product details first (for image cleanup)
    const product = await env.DB.prepare(
      "SELECT image_url, images FROM products WHERE id = ?"
    ).bind(productId).first() as Product | null;

    if (!product) {
      return new Response(JSON.stringify({ error: "Product not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Delete the product from database
    await env.DB.prepare("DELETE FROM products WHERE id = ?").bind(productId).run();

    // Clean up images from R2 storage
    const imagesToDelete: string[] = [];
    
    if (product.image_url) {
      // Extract the key from the URL (assuming format: https://domain/key)
      const imageKey = product.image_url.split('/').pop();
      if (imageKey) imagesToDelete.push(imageKey);
    }

    if (product.images) {
      try {
        const imageArray = JSON.parse(product.images);
        imageArray.forEach((url: string) => {
          const key = url.split('/').pop();
          if (key) imagesToDelete.push(key);
        });
      } catch (e) {
        console.warn("Failed to parse images JSON:", e);
      }
    }

    // Delete images from R2
    for (const key of imagesToDelete) {
      try {
        await env.STORAGE.delete(key);
      } catch (e) {
        console.warn(`Failed to delete image ${key}:`, e);
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Product deleted successfully" 
    }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error deleting product:", error);
    return new Response(JSON.stringify({ 
      error: "Failed to delete product" 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

export async function onRequestPut(context: { env: Env; request: Request }) {
  const { env, request } = context;

  // Check domain restriction
  const domainCheck = enforceAdminDomain(request);
  if (domainCheck) return domainCheck;

  // Check admin authentication
  if (!isAdmin(request)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const body = await request.json();
    const { id, is_available } = body;

    if (!id || typeof is_available !== 'boolean') {
      return new Response(JSON.stringify({ 
        error: "Product ID and is_available status are required" 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Update product availability
    await env.DB.prepare(
      "UPDATE products SET is_available = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).bind(is_available, id).run();

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Product ${is_available ? 'approved' : 'rejected'} successfully` 
    }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error updating product:", error);
    return new Response(JSON.stringify({ 
      error: "Failed to update product" 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}