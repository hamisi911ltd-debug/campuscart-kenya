// Cloudflare Pages Function - preview Kilimall listings (admin-only).
// Reads one Kilimall search/category page and returns its products so the
// admin can pick which to import. Nothing is written here; each chosen
// product is imported separately by kilimall-import.ts.
import { enforceAdminDomain } from "../_lib/adminDomain";
import { hasPermission } from "../_lib/teamAuth";
import { buildListingUrl, fetchKilimallHtml, parseListingPage } from "../_lib/kilimall";

interface Env {
  DB: D1Database;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

export async function onRequestPost(context: { env: Env; request: Request }) {
  const { env, request } = context;

  const domainCheck = enforceAdminDomain(request);
  if (domainCheck) return domainCheck;

  if (!(await hasPermission(request, env, "products"))) {
    return json({ error: "Unauthorized" }, 401);
  }

  try {
    const body = await request.json() as { query?: string; url?: string; page?: number };
    const page = Math.min(Math.max(Number(body.page) || 1, 1), 50);

    let pageUrl: string;
    try {
      pageUrl = buildListingUrl({ query: body.query, url: body.url, page });
    } catch (err) {
      return json({ error: err instanceof Error ? err.message : "Invalid search" }, 400);
    }

    const items = parseListingPage(await fetchKilimallHtml(pageUrl));

    // Flag products already imported so the admin doesn't create duplicates.
    // Imported images are stored as products/km-<listingId>-<n>-<rand>.<ext>,
    // which lets us detect them without any schema change.
    const imported = new Set<string>();
    if (items.length > 0) {
      const clauses = items.map(() => "images LIKE ?").join(" OR ");
      const { results } = await env.DB.prepare(`SELECT images FROM products WHERE ${clauses}`)
        .bind(...items.map((item) => `%/km-${item.listingId}-%`))
        .all<{ images: string | null }>();
      for (const row of results || []) {
        for (const item of items) {
          if (row.images && row.images.includes(`/km-${item.listingId}-`)) imported.add(item.listingId);
        }
      }
    }

    return json({
      page,
      items: items.map((item) => ({ ...item, alreadyImported: imported.has(item.listingId) })),
    });
  } catch (error) {
    console.error("Kilimall search error:", error);
    return json({ error: error instanceof Error ? error.message : "Could not read Kilimall" }, 502);
  }
}
