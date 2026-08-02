// Shared order-settlement logic, used by both the PayHero webhook
// (functions/api/payhero/callback.ts) and the admin manual recheck fallback
// (functions/api/payhero/status.ts) so there is exactly one place that marks
// an order paid/failed. Single-vendor store: the M-Pesa STK push already
// deposits the full amount into the owner's PayHero account, so there is no
// seller wallet to credit or platform commission to skim.
import type { ParsedCallback } from "./payhero";

interface Env {
  DB: D1Database;
}

export interface OrderRow {
  id: string;
  payment_status: string;
  total_amount: number;
  delivery_fee: number | null;
}

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
