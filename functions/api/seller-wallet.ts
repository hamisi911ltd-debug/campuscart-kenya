// Seller earnings wallet API (cash from paid orders, distinct from the
// points-based lucky-code wallet in functions/api/wallet.ts).

interface Env {
  DB: D1Database;
}

async function ensureTables(env: Env) {
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS seller_wallets (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) UNIQUE NOT NULL,
      balance DECIMAL(10, 2) DEFAULT 0.00,
      total_earned DECIMAL(10, 2) DEFAULT 0.00,
      total_withdrawn DECIMAL(10, 2) DEFAULT 0.00,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
}

export async function onRequestGet(context: { env: Env; request: Request }) {
  const { env, request } = context;
  const url = new URL(request.url);
  const userId = url.searchParams.get("user_id");

  if (!userId) {
    return new Response(JSON.stringify({ success: false, error: "User ID is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  try {
    await ensureTables(env);

    let wallet = await env.DB.prepare(
      "SELECT id, balance, total_earned, total_withdrawn FROM seller_wallets WHERE user_id = ?"
    ).bind(userId).first();

    if (!wallet) {
      const walletId = crypto.randomUUID();
      await env.DB.prepare(`
        INSERT INTO seller_wallets (id, user_id, balance, total_earned, total_withdrawn)
        VALUES (?, ?, 0, 0, 0)
      `).bind(walletId, userId).run();
      wallet = { id: walletId, balance: 0, total_earned: 0, total_withdrawn: 0 };
    }

    return new Response(JSON.stringify({
      success: true,
      balance: parseFloat(wallet.balance.toString()),
      totalEarned: parseFloat(wallet.total_earned.toString()),
      totalWithdrawn: parseFloat(wallet.total_withdrawn.toString()),
    }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (error) {
    console.error("Seller wallet API error:", error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ success: false, error: "Failed to get wallet data", details: message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
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
