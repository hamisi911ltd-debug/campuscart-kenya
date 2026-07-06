// Shared order-settlement logic, used by both the PayHero webhook
// (functions/api/payhero/callback.ts) and the admin manual recheck fallback
// (functions/api/payhero/status.ts) so there is exactly one place that marks
// an order paid/failed, credits the seller wallet, and records platform
// revenue.
import type { ParsedCallback } from "./payhero";

interface Env {
  DB: D1Database;
}

export interface OrderRow {
  id: string;
  payment_status: string;
  total_amount: number;
  delivery_fee: number | null;
  seller_id: string;
}

const COMMISSION_RATE = 0.10; // platform keeps 10% of the item subtotal

export async function settleOrderPayment(env: Env, order: OrderRow, parsed: ParsedCallback): Promise<boolean> {
  // Idempotent: ignore if the order is already settled.
  if (order.payment_status === "paid" || order.payment_status === "failed") return false;
  if (parsed.status === "unknown") return false;

  if (parsed.status === "success") {
    await env.DB.prepare(`
      UPDATE orders SET payment_status = 'paid', status = 'processing', updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(order.id).run();

    await env.DB.prepare(`
      INSERT INTO order_status_history (id, order_id, status, note)
      VALUES (?, ?, 'paid', ?)
    `).bind(crypto.randomUUID(), order.id, parsed.receiptNumber ? `M-Pesa receipt ${parsed.receiptNumber}` : "Payment confirmed").run();

    await env.DB.prepare(`
      INSERT INTO order_status_history (id, order_id, status, note)
      VALUES (?, ?, 'processing', 'Order is being prepared')
    `).bind(crypto.randomUUID(), order.id).run();

    const subtotal = Number(order.total_amount) - Number(order.delivery_fee || 0);
    const sellerCut = Math.round(subtotal * (1 - COMMISSION_RATE) * 100) / 100;

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

    let sellerWallet = await env.DB.prepare(
      "SELECT id, balance FROM seller_wallets WHERE user_id = ?"
    ).bind(order.seller_id).first();

    if (!sellerWallet) {
      const walletId = crypto.randomUUID();
      await env.DB.prepare(`
        INSERT INTO seller_wallets (id, user_id, balance, total_earned, total_withdrawn)
        VALUES (?, ?, 0, 0, 0)
      `).bind(walletId, order.seller_id).run();
      sellerWallet = { id: walletId, balance: 0 };
    }

    const balanceBefore = Number(sellerWallet.balance);
    const balanceAfter = balanceBefore + sellerCut;

    await env.DB.prepare(`
      UPDATE seller_wallets
      SET balance = ?, total_earned = total_earned + ?, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `).bind(balanceAfter, sellerCut, order.seller_id).run();

    await env.DB.prepare(`
      INSERT INTO seller_wallet_transactions
        (id, user_id, type, amount, description, reference_type, reference_id, balance_before, balance_after)
      VALUES (?, ?, 'credit', ?, ?, 'order_sale', ?, ?, ?)
    `).bind(
      crypto.randomUUID(),
      order.seller_id,
      sellerCut,
      `Sale from order #${String(order.id).slice(0, 8).toUpperCase()}`,
      order.id,
      balanceBefore,
      balanceAfter
    ).run();

    const deliveryFee = Number(order.delivery_fee || 0);
    const commissionAmount = Math.round((subtotal - sellerCut) * 100) / 100;

    await env.DB.prepare(`
      INSERT INTO platform_revenue (id, order_id, delivery_fee, commission_amount, total_amount)
      VALUES (?, ?, ?, ?, ?)
    `).bind(crypto.randomUUID(), order.id, deliveryFee, commissionAmount, Number(order.total_amount)).run();

    return true;
  }

  // parsed.status === "failed"
  await env.DB.prepare(`
    UPDATE orders SET payment_status = 'failed', status = 'payment_failed', updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(order.id).run();

  await env.DB.prepare(`
    INSERT INTO order_status_history (id, order_id, status, note)
    VALUES (?, ?, 'payment_failed', 'M-Pesa payment was not completed')
  `).bind(crypto.randomUUID(), order.id).run();

  return true;
}
