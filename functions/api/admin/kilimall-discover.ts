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
    // 20 from each of the 10 categories = a batch of 200.
    const perCategory = Math.min(Math.max(Number(body.perCategory) || 20, 1), 20);
    const wanted = Object.keys(DISCOVER_KEYWORDS).filter(
      (slug) => !Array.isArray(body.categories) || body.categories.length === 0 || body.categories.includes(slug)
    );

    // Two searches per category (two different keywords, each on a random page):
    // 20 requests in all, well inside Workers' limit, run in parallel. Sampling from
    // both gives a varied pool to draw the 20 from. A search that fails is skipped.
    const perCategoryResults = await Promise.all(
      wanted.map(async (category): Promise<DiscoveredItem[]> => {
        const keywords = pickRandom(DISCOVER_KEYWORDS[category], 2);
        const pools = await Promise.all(
          keywords.map(async (keyword) => {
            try {
              const page = 1 + Math.floor(Math.random() * 6);
              const listings = parseListingPage(await fetchKilimallHtml(buildListingUrl({ query: keyword, page })));
              return listings.map((item) => ({ ...item, category, keyword }));
            } catch (err) {
              console.error(`Kilimall discover failed for ${category} / ${keyword}:`, err);
              return [] as DiscoveredItem[];
            }
          })
        );
        const seenInCategory = new Set<string>();
        const merged = pools.flat().filter((item) => !seenInCategory.has(item.listingId) && seenInCategory.add(item.listingId));
        return pickRandom(merged, perCategory);
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
