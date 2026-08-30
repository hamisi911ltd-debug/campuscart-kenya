// Cloudflare Pages Function - delete every product (admin-only). Kept as
// its own endpoint, separate from the single-product DELETE handler in
// products.ts, so a bulk wipe can't be triggered by a malformed single
// request.
import { enforceAdminDomain } from "../_lib/adminDomain";

interface Env {
  DB: D1Database;
  STORAGE: R2Bucket;
}

function isAdmin(request: Request): boolean {
  const cookie = request.headers.get("Cookie") || "";
  if (cookie.includes("admin_session=true")) return true;
  const authHeader = request.headers.get("Authorization");
  if (authHeader === "Bearer admin_session_true") return true;
  return request.headers.get("X-Admin-Session") === "true";
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

  if (!isAdmin(request)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { results } = await env.DB.prepare(
      "SELECT image_url, images FROM products"
    ).all<{ image_url: string | null; images: string | null }>();

    const keysToDelete: string[] = [];
    for (const product of results || []) {
      if (product.image_url) {
        const key = extractR2Key(product.image_url);
        if (key) keysToDelete.push(key);
      }
      if (product.images) {
        try {
          const imageArray = JSON.parse(product.images);
          for (const url of imageArray) {
            const key = extractR2Key(url);
            if (key) keysToDelete.push(key);
          }
        } catch {
          // malformed images JSON on this row - nothing to clean up for it
        }
      }
    }

    // R2 delete accepts up to 1000 keys per call.
    for (let i = 0; i < keysToDelete.length; i += 1000) {
      const batch = keysToDelete.slice(i, i + 1000);
      try {
        await env.STORAGE.delete(batch);
      } catch (e) {
        console.warn("Failed to delete a batch of R2 images:", e);
      }
    }

    const deleted = await env.DB.prepare("DELETE FROM products").run();

    return new Response(JSON.stringify({
      success: true,
      message: `Deleted ${results?.length ?? 0} product(s) and ${keysToDelete.length} image(s)`,
      productsDeleted: results?.length ?? 0,
      imagesDeleted: keysToDelete.length,
    }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error clearing products:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "Failed to clear products",
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
