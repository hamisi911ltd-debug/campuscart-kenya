// Cloudflare Pages Function - change many products at once (admin-only), for the
// "select all / selected" actions on the Products page:
//   action "approve"  -> show the products in the store
//   action "reject"   -> hide them from the store
//   action "category" -> move them to a category (needs `category`)
// Deleting stays in bulk-delete.ts, which also cleans up photos.
import { enforceAdminDomain } from "../_lib/adminDomain";
import { hasPermission } from "../_lib/teamAuth";
import { CATEGORY_SLUGS } from "../_lib/categorize";

interface Env {
  DB: D1Database;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

export async function onRequestPost(context: { env: Env; request: Request }) {
  const { env, request } = context;

  const domainCheck = enforceAdminDomain(request);
  if (domainCheck) return domainCheck;
  if (!(await hasPermission(request, env, "products"))) return json({ error: "Unauthorized" }, 401);

  try {
    const body = await request.json() as { ids?: string[]; action?: string; category?: string };
    const ids = Array.isArray(body.ids) ? [...new Set(body.ids.filter((id) => typeof id === "string" && id))] : [];
    if (ids.length === 0) return json({ error: "No products selected" }, 400);

    let setClause: string;
    let value: string | number;
    if (body.action === "approve") { setClause = "is_available = ?"; value = 1; }
    else if (body.action === "reject") { setClause = "is_available = ?"; value = 0; }
    else if (body.action === "category") {
      if (!body.category || !(CATEGORY_SLUGS as readonly string[]).includes(body.category)) {
        return json({ error: "Choose a valid category" }, 400);
      }
      setClause = "category = ?";
      value = body.category;
    } else {
      return json({ error: "Unknown action" }, 400);
    }

    const now = new Date().toISOString();
    // D1 allows ~100 bound values per statement: update in chunks.
    for (let i = 0; i < ids.length; i += 80) {
      const chunk = ids.slice(i, i + 80);
      const marks = chunk.map(() => "?").join(",");
      await env.DB.prepare(`UPDATE products SET ${setClause}, updated_at = ? WHERE id IN (${marks})`)
        .bind(value, now, ...chunk)
        .run();
    }

    return json({ success: true, updated: ids.length });
  } catch (error) {
    console.error("Bulk update error:", error);
    return json({ error: error instanceof Error ? error.message : "Bulk update failed" }, 500);
  }
}
