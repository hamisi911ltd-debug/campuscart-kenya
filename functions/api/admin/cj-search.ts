// Cloudflare Pages Function - search CJdropshipping's catalog (admin-only)
import { searchCJProducts, type CJEnv } from "../_lib/cjdropshipping";
import { isProductAuthorized } from "../_lib/teamAuth";

export async function onRequestGet(context: { env: CJEnv; request: Request }) {
  const { env, request } = context;

  if (!(await isProductAuthorized(request, env))) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!env.CJ_API_KEY) {
    return new Response(JSON.stringify({
      error: "CJ_API_KEY is not configured. Add it under Cloudflare Pages > Settings > Environment variables.",
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const url = new URL(request.url);
    const results = await searchCJProducts(env, {
      keyword: url.searchParams.get("keyword") || undefined,
      categoryId: url.searchParams.get("categoryId") || undefined,
      page: Number(url.searchParams.get("page") || "1"),
      pageSize: 20,
    });

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("CJ search error:", error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : "CJ search failed",
    }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
}
