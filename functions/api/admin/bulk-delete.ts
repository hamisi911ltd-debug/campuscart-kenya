// Cloudflare Pages Function - delete a chosen set of products (admin-only).
// Distinct from clear-products.ts (deletes everything) - this deletes only
// the ids the admin selected on the Products page.
import { enforceAdminDomain } from "../_lib/adminDomain";
import { hasPermission } from "../_lib/teamAuth";

interface Env {
  DB: D1Database;
  STORAGE: R2Bucket;
}

function extractR2Key(url: string): string | null {
  const marker = "/api/images/";
  const index = url.indexOf(marker);
  return index === -1 ? null : url.slice(index + marker.length);
}

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
    const body = await request.json() as { ids?: string[] };
    const ids = Array.isArray(body.ids) ? body.ids.filter((id) => typeof id === "string" && id) : [];

    if (ids.length === 0) {
      return new Response(JSON.stringify({ error: "No product ids provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const placeholders = ids.map(() => "?").join(",");
    const { results } = await env.DB.prepare(
      `SELECT id, image_url, images FROM products WHERE id IN (${placeholders})`
    ).bind(...ids).all<{ id: string; image_url: string | null; images: string | null }>();

    const keysToDelete: string[] = [];
    for (const product of results || []) {
      if (product.image_url) {
        const key = extractR2Key(product.image_url);
        if (key) keysToDelete.push(key);
      }
      if (product.images) {
        try {
          for (const url of JSON.parse(product.images)) {
            const key = extractR2Key(url);
            if (key) keysToDelete.push(key);
          }
        } catch {
          // malformed images JSON on this row - nothing to clean up for it
        }
      }
    }

    for (let i = 0; i < keysToDelete.length; i += 1000) {
      const batch = keysToDelete.slice(i, i + 1000);
      try {
        await env.STORAGE.delete(batch);
      } catch (e) {
        console.warn("Failed to delete a batch of R2 images:", e);
      }
    }

    // Same order_items.product_id NOT NULL / ON DELETE SET NULL
    // contradiction as elsewhere - drop referencing rows first so deleting
    // a product that was ever ordered doesn't fail outright.
    await env.DB.prepare(`DELETE FROM order_items WHERE product_id IN (${placeholders})`).bind(...ids).run();
    await env.DB.prepare(`DELETE FROM products WHERE id IN (${placeholders})`).bind(...ids).run();

    return new Response(JSON.stringify({
      success: true,
      message: `Deleted ${results?.length ?? 0} product(s)`,
      deleted: results?.length ?? 0,
      imagesDeleted: keysToDelete.length,
    }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error bulk-deleting products:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Failed to delete products",
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
