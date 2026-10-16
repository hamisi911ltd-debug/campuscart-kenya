// Cloudflare Pages Function - preview Kilimall listings (admin-only).
// Reads one Kilimall search/category page and returns its products so the
// admin can pick which to import. Nothing is written here; each chosen
// product is imported separately by kilimall-import.ts.
import { enforceAdminDomain } from "../_lib/adminDomain";
import { hasPermission } from "../_lib/teamAuth";
import { buildListingUrl, fetchKilimallHtml, parseListingPage } from "../_lib/kilimall";
import { findImportedListingIds } from "../_lib/kilimallDiscover";

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
    const imported = await findImportedListingIds(env, items.map((item) => item.listingId));

    return json({
      page,
      items: items.map((item) => ({ ...item, alreadyImported: imported.has(item.listingId) })),
    });
  } catch (error) {
    console.error("Kilimall search error:", error);
    return json({ error: error instanceof Error ? error.message : "Could not read Kilimall" }, 502);
  }
}
