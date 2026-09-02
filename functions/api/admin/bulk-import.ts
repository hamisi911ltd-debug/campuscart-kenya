// Cloudflare Pages Function - bulk product import (admin-only).
// Accepts an already-prepared array of products (title/price/category all
// filled in - the CSV parsing and category/price sanity-checking happens
// client-side in AdminBulkImport.tsx before this is ever called) and
// inserts them one by one, same INSERT shape as the single-product
// onRequestPost in admin/products.ts.
import { OWNER_ID, ensureOwnerUser } from "../_lib/owner";
import { enforceAdminDomain } from "../_lib/adminDomain";
import { hasPermission } from "../_lib/teamAuth";

interface Env {
  DB: D1Database;
}

interface ImportRow {
  title: string;
  description: string;
  category: string;
  price: number;
  original_price?: number;
  image_url?: string;
  images?: string;
  quantity_available?: number;
  location?: string;
}

// Kept in sync with the `categories` array in src/data/products.ts -
// there's no shared module between the frontend and Pages Functions build,
// so this list is duplicated deliberately rather than imported.
const VALID_CATEGORIES = new Set([
  "phones", "electronics", "computing", "appliances", "fashion",
  "home", "beauty", "baby", "gaming", "watches",
]);

export async function onRequestPost(context: { env: Env; request: Request }) {
  const { env, request } = context;

  const domainCheck = enforceAdminDomain(request);
  if (domainCheck) return domainCheck;

  if (!(await hasPermission(request, env, "products"))) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json() as { products?: ImportRow[] };
    const rows = Array.isArray(body.products) ? body.products : [];

    if (rows.length === 0) {
      return new Response(JSON.stringify({ error: "No products provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (rows.length > 500) {
      return new Response(JSON.stringify({ error: "Import one file of up to 500 products at a time" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    await ensureOwnerUser(env);

    const errors: { row: number; title: string; error: string }[] = [];
    let imported = 0;
    const now = new Date().toISOString();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // +2: 1-indexed, plus the header row

      if (!row.title || !row.description || !row.category || !row.price) {
        errors.push({ row: rowNum, title: row.title || "(untitled)", error: "Missing title, description, category or price" });
        continue;
      }
      if (!VALID_CATEGORIES.has(row.category)) {
        errors.push({ row: rowNum, title: row.title, error: `Unknown category "${row.category}"` });
        continue;
      }
      if (!(row.price > 0)) {
        errors.push({ row: rowNum, title: row.title, error: "Price must be greater than 0" });
        continue;
      }

      try {
        const id = crypto.randomUUID();
        await env.DB.prepare(
          `INSERT INTO products (id, seller_id, title, description, category, price, original_price, image_url, images, quantity_available, location, rating, reviews_count, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?)`
        ).bind(
          id,
          OWNER_ID,
          row.title,
          row.description,
          row.category,
          row.price,
          row.original_price || null,
          row.image_url || null,
          row.images || null,
          row.quantity_available || 1,
          row.location || null,
          now,
          now
        ).run();
        imported++;
      } catch (err) {
        errors.push({ row: rowNum, title: row.title, error: err instanceof Error ? err.message : "Insert failed" });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      imported,
      failed: errors.length,
      errors,
    }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error bulk-importing products:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Failed to import products",
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
