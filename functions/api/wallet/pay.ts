// Cloudflare Pages Function - Pay for an order from the customer's wallet balance
//   POST { user_id, order_id }
// Debits the wallet, records the transaction, then runs the same order
// settlement used for M-Pesa (marks the order paid, credits the seller wallet,
// records platform revenue).
import { ensureWalletTables, getOrCreateWallet } from "../_lib/settleWallet";
import { settleOrderPayment, type OrderRow } from "../_lib/settlePayment";

interface Env {
  DB: D1Database;
}

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });

export async function onRequestPost(context: { env: Env; request: Request }) {
  const { env, request } = context;

  try {
    const body = await request.json() as { user_id?: string; order_id?: string };
    const userId = body.user_id;
    const orderId = body.order_id;

    if (!userId || !orderId) return json({ success: false, error: "user_id and order_id are required" }, 400);

    const order = await env.DB.prepare("SELECT * FROM orders WHERE id = ?").bind(orderId).first<OrderRow & { buyer_id: string }>();
    if (!order) return json({ success: false, error: "Order not found" }, 404);
    if ((order as any).buyer_id !== userId) return json({ success: false, error: "This order does not belong to you" }, 403);
    if (order.payment_status === "paid") return json({ success: false, error: "Order is already paid" }, 400);

    await ensureWalletTables(env);
    const wallet = await getOrCreateWallet(env, userId);
    const amount = Number(order.total_amount);
    const balanceBefore = Number(wallet.balance);

    if (balanceBefore < amount) {
      return json({
        success: false,
        error: "Insufficient wallet balance",
        balance: balanceBefore,
        required: amount,
      }, 400);
    }

    const balanceAfter = Math.round((balanceBefore - amount) * 100) / 100;

    // Debit the wallet.
    await env.DB.prepare(`
      UPDATE user_wallets
      SET balance = ?, total_spent = total_spent + ?, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `).bind(balanceAfter, amount, userId).run();

    await env.DB.prepare(`
      INSERT INTO wallet_transactions
        (id, user_id, type, amount, description, reference_type, reference_id, balance_before, balance_after)
      VALUES (?, ?, 'debit', ?, ?, 'order_payment', ?, ?, ?)
    `).bind(
      crypto.randomUUID(),
      userId,
      amount,
      `Order #${String(orderId).slice(0, 8).toUpperCase()}`,
      orderId,
      balanceBefore,
      balanceAfter
    ).run();

    // Settle the order exactly like a successful M-Pesa payment.
    await settleOrderPayment(env, order, {
      status: "success",
      receiptNumber: "WALLET",
      amount,
      externalReference: orderId,
    });

    return json({ success: true, balance: balanceAfter, order_id: orderId });
  } catch (error: any) {
    console.error("Wallet pay error:", error);
    return json({ success: false, error: "Wallet payment failed", details: error.message }, 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
