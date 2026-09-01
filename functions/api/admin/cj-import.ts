// Cloudflare Pages Function - import one CJdropshipping product into the
// catalog (admin-only). Downloads the product's real photos (licensed via
// the CJ API relationship, not scraped) and re-hosts them on this site's
// own R2 storage rather than hotlinking CJ's CDN, so listings don't break
// if CJ ever changes an image path.
import { getCJProductDetail, type CJEnv } from "../_lib/cjdropshipping";
import { OWNER_ID, ensureOwnerUser } from "../_lib/owner";
import { isProductAuthorized } from "../_lib/teamAuth";

interface Env extends CJEnv {
  STORAGE: R2Bucket;
}

const DEFAULT_SHIPPING_NOTE = "Ships in 2-4 weeks — sourced on order from our supplier";

async function rehostImage(env: Env, sourceUrl: string, index: number): Promise<string | null> {
  try {
    const response = await fetch(sourceUrl);
    if (!response.ok || !response.body) return null;

    const contentType = response.headers.get("Content-Type") || "image/jpeg";
    const extension = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
    const key = `products/cj-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}.${extension}`;

    await env.STORAGE.put(key, response.body, { httpMetadata: { contentType } });
    return `/api/images/${key}`;
  } catch (err) {
    console.error(`Failed to rehost image ${sourceUrl}:`, err);
    return null;
  }
}

export async function onRequestPost(context: { env: Env; request: Request }) {
  const { env, request } = context;

  if (!(await isProductAuthorized(request, env))) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json() as { pid?: string; category?: string; sellPrice?: number };
    const { pid, category, sellPrice } = body;

    if (!pid || !category || !sellPrice) {
      return new Response(JSON.stringify({
        error: "pid, category and sellPrice are required",
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const detail = await getCJProductDetail(env, pid);

    // Re-host up to 3 photos on our own R2 rather than depending on CJ's CDN.
    const sourceImages = detail.images.slice(0, 3);
    const rehosted = (await Promise.all(
      sourceImages.map((url, i) => rehostImage(env, url, i))
    )).filter((url): url is string => Boolean(url));

    if (rehosted.length === 0) {
      return new Response(JSON.stringify({ error: "Could not fetch any product images from CJ" }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    await ensureOwnerUser(env);

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await env.DB.prepare(`
      INSERT INTO products (
        id, seller_id, title, description, category, price, image_url, images,
        quantity_available, rating, reviews_count, created_at, updated_at,
        sourced_from, external_product_id, external_sku, supplier_cost, shipping_note
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?, 'cjdropshipping', ?, ?, ?, ?)
    `).bind(
      id,
      OWNER_ID,
      detail.name,
      detail.description || `${detail.name}. ${DEFAULT_SHIPPING_NOTE}.`,
      category,
      sellPrice,
      rehosted[0],
      JSON.stringify(rehosted),
      1,
      now,
      now,
      detail.pid,
      detail.sku || null,
      detail.sellPrice,
      DEFAULT_SHIPPING_NOTE
    ).run();

    return new Response(JSON.stringify({ success: true, id }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("CJ import error:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "CJ import failed",
    }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
}
