// Cloudflare Pages Function - search CJdropshipping's catalog (admin-only)
import { searchCJProducts, type CJEnv } from "../_lib/cjdropshipping";

function isAdmin(request: Request): boolean {
  const cookie = request.headers.get("Cookie") || "";
  if (cookie.includes("admin_session=true")) return true;
  const authHeader = request.headers.get("Authorization");
  if (authHeader === "Bearer admin_session_true") return true;
  return request.headers.get("X-Admin-Session") === "true";
}

export async function onRequestGet(context: { env: CJEnv; request: Request }) {
  const { env, request } = context;

  if (!isAdmin(request)) {
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
