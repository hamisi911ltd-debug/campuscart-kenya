// Cloudflare Pages Function - preview Kilimall listings (admin-only).
// Reads Kilimall search/category pages and returns their products so the admin
// can pick which to import. One call loads up to 200 products: Kilimall shows
// ~40 per page, so several consecutive pages are read in parallel and merged.
// Nothing is written here; each chosen product is imported separately by
// kilimall-import.ts.
import { enforceAdminDomain } from "../_lib/adminDomain";
import { hasPermission } from "../_lib/teamAuth";
import { buildListingUrl, fetchKilimallHtml, parseListingPage, type KilimallListing } from "../_lib/kilimall";
import { findImportedListingIds } from "../_lib/kilimallDiscover";

interface Env {
  DB: D1Database;
}

const BATCH_SIZE = 200;
const PAGES_PER_LOAD = 7; // ~40 products a page, with some overlap between pages

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
    const firstPage = Math.min(Math.max(Number(body.page) || 1, 1), 300);

    // Build every page URL up front (this also validates the search / URL).
    const pageUrls: string[] = [];
    try {
      for (let i = 0; i < PAGES_PER_LOAD; i++) {
        pageUrls.push(buildListingUrl({ query: body.query, url: body.url, page: firstPage + i }));
      }
    } catch (err) {
      return json({ error: err instanceof Error ? err.message : "Invalid search" }, 400);
    }

    // All pages in parallel; a page that fails (e.g. past the last one) is skipped.
    const settled = await Promise.allSettled(
      pageUrls.map(async (u) => parseListingPage(await fetchKilimallHtml(u)))
    );

    const seen = new Set<string>();
    const items: KilimallListing[] = [];
    let failedAll = true;
    for (const result of settled) {
      if (result.status !== "fulfilled") continue;
      failedAll = false;
      for (const item of result.value) {
        if (seen.has(item.listingId)) continue;
        seen.add(item.listingId);
        items.push(item);
      }
    }
    if (failedAll) return json({ error: "Could not read Kilimall - try again" }, 502);

    const batch = items.slice(0, BATCH_SIZE);
    const imported = await findImportedListingIds(env, batch.map((item) => item.listingId));

    return json({
      page: firstPage,
      nextPage: firstPage + PAGES_PER_LOAD,
      items: batch.map((item) => ({ ...item, alreadyImported: imported.has(item.listingId) })),
    });
  } catch (error) {
    console.error("Kilimall search error:", error);
    return json({ error: error instanceof Error ? error.message : "Could not read Kilimall" }, 502);
  }
}
