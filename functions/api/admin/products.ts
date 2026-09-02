// Cloudflare Pages Function for Admin Products API
// This handles CRUD operations for products in D1 database
import { OWNER_ID, ensureOwnerUser } from "../_lib/owner";
import { enforceAdminDomain } from "../_lib/adminDomain";
import { hasPermission } from "../_lib/teamAuth";

interface Env {
  DB: D1Database;
  STORAGE: R2Bucket;
}

// R2 keys are stored with a folder prefix (e.g. "products/xxxx.jpg") and
// served at /api/images/<key>. Taking just the URL's last path segment (the
// previous approach) drops that "products/" prefix, so the delete call
// never actually matched the real object and silently no-opped, leaving
// orphaned files in R2 on every product deletion.
function extractR2Key(url: string): string | null {
  const marker = "/api/images/";
  const index = url.indexOf(marker);
  return index === -1 ? null : url.slice(index + marker.length);
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


export async function onRequestGet(context: { env: Env; request: Request }) {
  const { env, request } = context;

  // Check domain restriction
  const domainCheck = enforceAdminDomain(request);
  if (domainCheck) return domainCheck;

  // Check admin authentication
  if (!(await hasPermission(request, env, "products"))) {
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

export async function onRequestPost(context: { env: Env; request: Request }) {
  const { env, request } = context;

  const domainCheck = enforceAdminDomain(request);
  if (domainCheck) return domainCheck;

  if (!(await hasPermission(request, env, "products"))) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const data = await request.json() as {
      title: string;
      description: string;
      category: string;
      price: number;
      original_price?: number;
      image_url?: string;
      images?: string;
      quantity_available?: number;
      location?: string;
      latitude?: number;
      longitude?: number;
    };

    if (!data.title || !data.description || !data.category || !data.price) {
      return new Response(JSON.stringify({
        error: "Missing required fields",
        required: ["title", "description", "category", "price"],
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    await ensureOwnerUser(env);

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await env.DB.prepare(
      `INSERT INTO products (id, seller_id, title, description, category, price, original_price, image_url, images, quantity_available, location, latitude, longitude, rating, reviews_count, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?)`
    ).bind(
      id,
      OWNER_ID,
      data.title,
      data.description,
      data.category,
      data.price,
      data.original_price || null,
      data.image_url || null,
      data.images || null,
      data.quantity_available || 1,
      data.location || null,
      data.latitude || null,
      data.longitude || null,
      now,
      now
    ).run();

    return new Response(JSON.stringify({ success: true, id }), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error creating product:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Failed to create product"
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
  if (!(await hasPermission(request, env, "products"))) {
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

    // See the matching comment in clear-products.ts: order_items.product_id
    // is NOT NULL but its own foreign key tries to null it out on delete -
    // deleting a product that was ever ordered fails outright without this.
    await env.DB.prepare("DELETE FROM order_items WHERE product_id = ?").bind(productId).run();

    // Delete the product from database
    await env.DB.prepare("DELETE FROM products WHERE id = ?").bind(productId).run();

    // Clean up images from R2 storage
    const imagesToDelete: string[] = [];
    
    if (product.image_url) {
      const imageKey = extractR2Key(product.image_url);
      if (imageKey) imagesToDelete.push(imageKey);
    }

    if (product.images) {
      try {
        const imageArray = JSON.parse(product.images);
        imageArray.forEach((url: string) => {
          const key = extractR2Key(url);
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
  if (!(await hasPermission(request, env, "products"))) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const body = await request.json();
    const { id, is_available, title, description, category, price, original_price, image_url, images, quantity_available, location, latitude, longitude } = body;

    if (!id) {
      return new Response(JSON.stringify({
        error: "Product ID is required"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Availability-only toggle (used by the Approve/Reject buttons)
    if (typeof is_available === 'boolean' && title === undefined) {
      await env.DB.prepare(
        "UPDATE products SET is_available = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
      ).bind(is_available, id).run();

      return new Response(JSON.stringify({
        success: true,
        message: `Product ${is_available ? 'approved' : 'rejected'} successfully`
      }), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // Full field edit (used by the product edit form)
    if (!title || !description || !category || !price) {
      return new Response(JSON.stringify({
        error: "title, description, category and price are required"
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    await env.DB.prepare(`
      UPDATE products SET
        title = ?, description = ?, category = ?, price = ?, original_price = ?,
        image_url = ?, images = ?, quantity_available = ?, location = ?,
        latitude = ?, longitude = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(
      title,
      description,
      category,
      price,
      original_price || null,
      image_url || null,
      images || null,
      quantity_available || 1,
      location || null,
      latitude || null,
      longitude || null,
      id
    ).run();

    return new Response(JSON.stringify({ success: true, message: "Product updated successfully" }), {
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