// Cloudflare Pages Function - POST /api/availability  { product_ids: string[] }
// Tells the shopper, before they pay, whether each item is still available on the original listing.
import { checkLiveAvailability } from "./_lib/availability";
import { overLimit, recordHit } from "./_lib/rateLimit";

interface Env {
  DB: D1Database;
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

export async function onRequestPost(context: { env: Env; request: Request }) {
  const { env, request } = context;
  try {
    const body = await request.json() as { product_ids?: unknown };
    const ids = Array.isArray(body.product_ids)
      ? [...new Set(body.product_ids.filter((x): x is string => typeof x === "string" && /^[A-Za-z0-9-]{1,64}$/.test(x)))].slice(0, 20)
      : [];
    if (ids.length === 0) return json({ error: "No products to check" }, 400);

    if (await overLimit(env, "availability", request, 40, 60)) {
      return json({ error: "Too many checks - please wait a few minutes." }, 429);
    }
    await recordHit(env, "availability", request);

    return json({ items: await checkLiveAvailability(env, ids) });
  } catch (error) {
    console.error("Availability error:", error);
    return json({ error: "Could not check availability" }, 500);
  }
}
