// Cloudflare Pages Function - "Discover": a random, varied mix of Kilimall
// products across every store category (admin-only). For each category it
// searches a randomly chosen keyword on a random results page and takes a
// few random hits, so each run surfaces different, general products rather
// than one category. Nothing is written here - the admin picks which to
// import via kilimall-import.ts, using the category returned for each item.
import { enforceAdminDomain } from "../_lib/adminDomain";
import { hasPermission } from "../_lib/teamAuth";
import { buildListingUrl, fetchKilimallHtml, parseListingPage, type KilimallListing } from "../_lib/kilimall";
import { DISCOVER_KEYWORDS, findImportedListingIds, pickRandom } from "../_lib/kilimallDiscover";

interface Env {
  DB: D1Database;
}

type DiscoveredItem = KilimallListing & { category: string; keyword: string };

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
    const body = await request.json() as { perCategory?: number; categories?: string[] };
    const perCategory = Math.min(Math.max(Number(body.perCategory) || 5, 1), 12);
    const wanted = Object.keys(DISCOVER_KEYWORDS).filter(
      (slug) => !Array.isArray(body.categories) || body.categories.length === 0 || body.categories.includes(slug)
    );

    // One search per category (at most 10 subrequests, well inside Workers'
    // limit), all in parallel. A category that fails is skipped, not fatal.
    const perCategoryResults = await Promise.all(
      wanted.map(async (category): Promise<DiscoveredItem[]> => {
        try {
          const keyword = pickRandom(DISCOVER_KEYWORDS[category], 1)[0];
          const page = 1 + Math.floor(Math.random() * 2);
          const listings = parseListingPage(await fetchKilimallHtml(buildListingUrl({ query: keyword, page })));
          return pickRandom(listings, perCategory).map((item) => ({ ...item, category, keyword }));
        } catch (err) {
          console.error(`Kilimall discover failed for ${category}:`, err);
          return [];
        }
      })
    );

    // Interleave categories so the preview reads as a genuine mix.
    const items: DiscoveredItem[] = [];
    const seen = new Set<string>();
    for (let round = 0; round < perCategory; round++) {
      for (const list of perCategoryResults) {
        const item = list[round];
        if (item && !seen.has(item.listingId)) {
          seen.add(item.listingId);
          items.push(item);
        }
      }
    }

    if (items.length === 0) return json({ error: "Kilimall returned no products - try again" }, 502);

    const imported = await findImportedListingIds(env, items.map((item) => item.listingId));
    return json({ items: items.map((item) => ({ ...item, alreadyImported: imported.has(item.listingId) })) });
  } catch (error) {
    console.error("Kilimall discover error:", error);
    return json({ error: error instanceof Error ? error.message : "Discover failed" }, 502);
  }
}
