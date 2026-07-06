// Cloudflare Pages Function - Admin approves/rejects seller cashout requests
import { initiateWithdrawal } from "../_lib/payhero";

interface Env {
  DB: D1Database;
  PAYHERO_AUTH_TOKEN: string;
  PAYHERO_CHANNEL_ID: string;
}

function isAdmin(request: Request): boolean {
  const cookie = request.headers.get("Cookie") || "";
  if (cookie.includes("admin_session=true")) return true;

  const authHeader = request.headers.get("Authorization");
  if (authHeader === "Bearer admin_session_true") return true;

  const sessionHeader = request.headers.get("X-Admin-Session");
  return sessionHeader === "true";
}

export async function onRequestGet(context: { env: Env; request: Request }) {
  const { env, request } = context;

  if (!isAdmin(request)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { results } = await env.DB.prepare(`
    SELECT w.*, u.full_name as seller_name, u.email as seller_email
    FROM wallet_withdrawals w
    LEFT JOIN users u ON w.user_id = u.id
    ORDER BY w.requested_at DESC
  `).all();

  return new Response(JSON.stringify({ success: true, withdrawals: results || [] }), {
    headers: { "Content-Type": "application/json" },
  });
}

export async function onRequestPut(context: { env: Env; request: Request }) {
  const { env, request } = context;

  if (!isAdmin(request)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json() as { id?: string; action?: "approve" | "reject"; admin_note?: string };
    const { id, action, admin_note } = body;

    if (!id || (action !== "approve" && action !== "reject")) {
      return new Response(JSON.stringify({ error: "id and a valid action ('approve' or 'reject') are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const withdrawal = await env.DB.prepare("SELECT * FROM wallet_withdrawals WHERE id = ?").bind(id).first();
    if (!withdrawal) {
      return new Response(JSON.stringify({ error: "Withdrawal request not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (withdrawal.status !== "pending") {
      return new Response(JSON.stringify({ error: `This withdrawal is already ${withdrawal.status}` }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (action === "reject") {
      // Refund the reserved balance back to the seller's wallet.
      const wallet = await env.DB.prepare(
        "SELECT balance FROM seller_wallets WHERE user_id = ?"
      ).bind(withdrawal.user_id).first();
      const balanceBefore = wallet ? Number(wallet.balance) : 0;
      const balanceAfter = balanceBefore + Number(withdrawal.amount);

      await env.DB.prepare(`
        UPDATE seller_wallets SET balance = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?
      `).bind(balanceAfter, withdrawal.user_id).run();

      await env.DB.prepare(`
        INSERT INTO seller_wallet_transactions
          (id, user_id, type, amount, description, reference_type, reference_id, balance_before, balance_after)
        VALUES (?, ?, 'credit', ?, 'Withdrawal rejected - funds returned', 'withdrawal_refund', ?, ?, ?)
      `).bind(crypto.randomUUID(), withdrawal.user_id, withdrawal.amount, id, balanceBefore, balanceAfter).run();

      await env.DB.prepare(`
        UPDATE wallet_withdrawals SET status = 'rejected', admin_note = ?, processed_at = CURRENT_TIMESTAMP WHERE id = ?
      `).bind(admin_note || null, id).run();

      return new Response(JSON.stringify({ success: true, message: "Withdrawal rejected and balance refunded" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // action === "approve": actually send the money out via PayHero
    const callbackUrl = `${new URL(request.url).origin}/api/payhero/callback`;
    const payout = await initiateWithdrawal(env, {
      amount: Number(withdrawal.amount),
      phoneNumber: withdrawal.phone_number as string,
      externalReference: id,
      callbackUrl,
    });

    if (!payout.success) {
      return new Response(JSON.stringify({ error: "PayHero declined the payout", details: payout.raw }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    await env.DB.prepare(`
      UPDATE seller_wallets SET total_withdrawn = total_withdrawn + ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?
    `).bind(Number(withdrawal.amount), withdrawal.user_id).run();

    await env.DB.prepare(`
      UPDATE wallet_withdrawals
      SET status = 'completed', payhero_reference = ?, admin_note = ?, processed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(payout.reference || null, admin_note || null, id).run();

    return new Response(JSON.stringify({ success: true, message: "Payout sent", payhero_reference: payout.reference }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Admin withdrawals error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
