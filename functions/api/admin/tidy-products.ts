// Cloudflare Pages Function - tidy the existing catalogue (admin-only):
//  - move each product into the category its name says it belongs in, and
//  - shorten keyword-stuffed names to the important part (brand + model).
// Products the classifier can't place keep their current category. The full
// description is untouched, so nothing is lost.
import { enforceAdminDomain } from "../_lib/adminDomain";
import { hasPermission } from "../_lib/teamAuth";
import { classifyProduct } from "../_lib/categorize";
import { shortProductTitle } from "../_lib/productTitle";

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
    const { results } = await env.DB.prepare("SELECT id, title, description, category FROM products")
      .all<{ id: string; title: string; description: string | null; category: string }>();

    const updates: { id: string; title: string; category: string }[] = [];
    let recategorized = 0;
    let retitled = 0;
    const moved: Record<string, number> = {};

    for (const p of results || []) {
      const category = classifyProduct(p.title, p.description || "") ?? p.category;
      const title = shortProductTitle(p.title);
      const catChanged = category !== p.category;
      const titleChanged = title !== p.title;
      if (!catChanged && !titleChanged) continue;
      if (catChanged) { recategorized++; moved[`${p.category} → ${category}`] = (moved[`${p.category} → ${category}`] || 0) + 1; }
      if (titleChanged) retitled++;
      updates.push({ id: p.id, title, category });
    }

    const now = new Date().toISOString();
    for (let i = 0; i < updates.length; i += 40) {
      await env.DB.batch(
        updates.slice(i, i + 40).map((u) =>
          env.DB.prepare("UPDATE products SET title = ?, category = ?, updated_at = ? WHERE id = ?").bind(u.title, u.category, now, u.id)
        )
      );
    }

    return json({ success: true, checked: results?.length ?? 0, recategorized, retitled, moved });
  } catch (error) {
    console.error("Tidy products error:", error);
    return json({ error: error instanceof Error ? error.message : "Could not tidy products" }, 500);
  }
}
