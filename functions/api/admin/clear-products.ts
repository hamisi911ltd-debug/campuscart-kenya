// Cloudflare Pages Function - delete every product (admin-only). Kept as
// its own endpoint, separate from the single-product DELETE handler in
// products.ts, so a bulk wipe can't be triggered by a malformed single
// request.
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

    // order_items.product_id is NOT NULL but its foreign key tries to null
    // it out on product deletion ("ON DELETE SET NULL") - a contradiction
    // in the original schema that makes DELETE FROM products fail outright
    // for any product that was ever ordered. Clearing every product means
    // every one of these references is about to be removed anyway, so
    // dropping the line-items here avoids that conflict entirely without
    // requiring the schema migration to have been run first. The orders
    // themselves (buyer, total, status, tracking, waybill) are untouched -
    // only the itemized per-product breakdown inside past orders is lost.
    await env.DB.prepare("DELETE FROM order_items WHERE product_id IS NOT NULL").run();

    await env.DB.prepare("DELETE FROM products").run();

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
