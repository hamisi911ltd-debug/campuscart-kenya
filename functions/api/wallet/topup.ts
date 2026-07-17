// Cloudflare Pages Function - Customer wallet top-up via M-Pesa (PayHero STK push)
//   POST  { user_id, amount, phone }  -> initiates an STK push, records a pending top-up
//   GET   ?topup_id=...               -> polls the top-up status (pending/completed/failed)
import { initiateStkPush, checkTransactionStatus, parseCallbackPayload } from "../_lib/payhero";
import { ensureWalletTables, settleWalletTopup } from "../_lib/settleWallet";

interface Env {
  DB: D1Database;
  PAYHERO_AUTH_TOKEN: string;
  PAYHERO_CHANNEL_ID: string;
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });

const MIN_TOPUP = 10;
const MAX_TOPUP = 150000;

export async function onRequestPost(context: { env: Env; request: Request }) {
  const { env, request } = context;

  try {
    const body = await request.json() as { user_id?: string; amount?: number; phone?: string };
    const userId = body.user_id;
    const amount = Number(body.amount);
    const phone = (body.phone || "").trim();

    if (!userId) return json({ success: false, error: "User ID is required" }, 400);
    if (!amount || amount < MIN_TOPUP) return json({ success: false, error: `Minimum top-up is KES ${MIN_TOPUP}` }, 400);
    if (amount > MAX_TOPUP) return json({ success: false, error: `Maximum top-up is KES ${MAX_TOPUP.toLocaleString()}` }, 400);
    if (!phone) return json({ success: false, error: "Enter the M-Pesa number to charge" }, 400);

    await ensureWalletTables(env);

    const topupId = crypto.randomUUID();
    await env.DB.prepare(`
      INSERT INTO wallet_topups (id, user_id, amount, phone_number, status)
      VALUES (?, ?, ?, ?, 'pending')
    `).bind(topupId, userId, Math.round(amount), phone).run();

    const origin = new URL(request.url).origin;
    const stk = await initiateStkPush(env, {
      amount: Math.round(amount),
      phoneNumber: phone,
      externalReference: `WALLET-${topupId}`,
      callbackUrl: `${origin}/api/payhero/callback`,
    });

    if (!stk.success) {
      await env.DB.prepare("UPDATE wallet_topups SET status = 'failed' WHERE id = ?").bind(topupId).run();
      return json({ success: false, error: "Could not start M-Pesa payment. Please try again.", details: stk.raw }, 502);
    }

    if (stk.reference) {
      await env.DB.prepare("UPDATE wallet_topups SET payhero_reference = ? WHERE id = ?")
        .bind(stk.reference, topupId).run();
    }

    return json({
      success: true,
      topup_id: topupId,
      reference: stk.reference,
      message: "Check your phone and enter your M-Pesa PIN to complete the top-up.",
    });
  } catch (error: any) {
    console.error("Wallet top-up error:", error);
    return json({ success: false, error: "Top-up failed", details: error.message }, 500);
  }
}

export async function onRequestGet(context: { env: Env; request: Request }) {
  const { env, request } = context;
  const topupId = new URL(request.url).searchParams.get("topup_id");
  if (!topupId) return json({ success: false, error: "topup_id is required" }, 400);

  await ensureWalletTables(env);

  let topup = await env.DB.prepare(
    "SELECT id, user_id, amount, status, payhero_reference FROM wallet_topups WHERE id = ?"
  ).bind(topupId).first<any>();

  if (!topup) return json({ success: false, error: "Top-up not found" }, 404);

  // If still pending, ask PayHero directly in case the webhook was missed.
  if (topup.status === "pending" && topup.payhero_reference) {
    try {
      const { raw } = await checkTransactionStatus(env, topup.payhero_reference);
      const parsed = parseCallbackPayload({ external_reference: `WALLET-${topupId}`, ...raw });
      if (parsed.status !== "unknown") {
        await settleWalletTopup(env, topupId, parsed);
        topup = await env.DB.prepare("SELECT id, user_id, amount, status FROM wallet_topups WHERE id = ?")
          .bind(topupId).first<any>();
      }
    } catch (e) {
      // Non-fatal: fall through and return the last known status.
    }
  }

  return json({ success: true, status: topup.status, amount: Number(topup.amount) });
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
