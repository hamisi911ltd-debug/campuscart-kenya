// Seller cashout requests against their seller_wallets balance.

interface Env {
  DB: D1Database;
}

const MIN_WITHDRAWAL = 100; // KES

export async function onRequestGet(context: { env: Env; request: Request }) {
  const { env, request } = context;
  const url = new URL(request.url);
  const userId = url.searchParams.get("user_id");

  if (!userId) {
    return new Response(JSON.stringify({ error: "user_id is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { results } = await env.DB.prepare(`
    SELECT id, amount, phone_number, status, admin_note, requested_at, processed_at
    FROM wallet_withdrawals
    WHERE user_id = ?
    ORDER BY requested_at DESC
  `).bind(userId).all();

  return new Response(JSON.stringify({ success: true, withdrawals: results || [] }), {
    headers: { "Content-Type": "application/json" },
  });
}

export async function onRequestPost(context: { env: Env; request: Request }) {
  const { env, request } = context;

  try {
    const body = await request.json() as { user_id?: string; amount?: number; phone_number?: string };
    const { user_id, amount, phone_number } = body;

    if (!user_id || !amount || !phone_number) {
      return new Response(JSON.stringify({ error: "user_id, amount and phone_number are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (amount < MIN_WITHDRAWAL) {
      return new Response(JSON.stringify({ error: `Minimum withdrawal is KES ${MIN_WITHDRAWAL}` }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const wallet = await env.DB.prepare(
      "SELECT balance FROM seller_wallets WHERE user_id = ?"
    ).bind(user_id).first();

    const balance = wallet ? Number(wallet.balance) : 0;
    if (amount > balance) {
      return new Response(JSON.stringify({ error: "Insufficient wallet balance" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const balanceAfter = balance - amount;
    const withdrawalId = crypto.randomUUID();

    // Reserve the funds immediately so the same balance can't be withdrawn twice.
    await env.DB.prepare(`
      UPDATE seller_wallets SET balance = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?
    `).bind(balanceAfter, user_id).run();

    await env.DB.prepare(`
      INSERT INTO seller_wallet_transactions
        (id, user_id, type, amount, description, reference_type, reference_id, balance_before, balance_after)
      VALUES (?, ?, 'debit', ?, 'Withdrawal requested', 'withdrawal_request', ?, ?, ?)
    `).bind(crypto.randomUUID(), user_id, amount, withdrawalId, balance, balanceAfter).run();

    await env.DB.prepare(`
      INSERT INTO wallet_withdrawals (id, user_id, amount, phone_number, status)
      VALUES (?, ?, ?, ?, 'pending')
    `).bind(withdrawalId, user_id, amount, phone_number).run();

    return new Response(JSON.stringify({ success: true, withdrawal_id: withdrawalId }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Withdraw request error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
