// Cloudflare Pages Function - Customer wallet transaction history
//   GET ?user_id=...&limit=50
import { ensureWalletTables } from "../_lib/settleWallet";

interface Env {
  DB: D1Database;
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });

export async function onRequestGet(context: { env: Env; request: Request }) {
  const { env, request } = context;
  const url = new URL(request.url);
  const userId = url.searchParams.get("user_id");
  const limit = Math.min(Number(url.searchParams.get("limit")) || 50, 200);

  if (!userId) return json({ success: false, error: "User ID is required" }, 400);

  try {
    await ensureWalletTables(env);

    const result = await env.DB.prepare(`
      SELECT id, type, amount, description, reference_type, reference_id, balance_after, created_at
      FROM wallet_transactions
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `).bind(userId, limit).all();

    return json({ success: true, transactions: result.results || [] });
  } catch (error: any) {
    console.error("Wallet transactions error:", error);
    return json({ success: false, error: "Failed to load transactions", details: error.message }, 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
