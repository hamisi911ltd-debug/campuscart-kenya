// Shared order-settlement logic, used by both the PayHero webhook
// (functions/api/payhero/callback.ts) and the admin manual recheck fallback
// (functions/api/payhero/status.ts) so there is exactly one place that marks
// an order paid/failed. Single-vendor store: the M-Pesa STK push already
// deposits the full amount into the owner's PayHero account, so there is no
// seller wallet to credit or platform commission to skim.
import type { ParsedCallback } from "./payhero";
import { normalizeKenyanPhone } from "./phone";
import { sendWhatsAppMessage } from "./sendWhatsApp";

interface Env {
  DB: D1Database;
  TWILIO_ACCOUNT_SID?: string;
  TWILIO_AUTH_TOKEN?: string;
  TWILIO_WHATSAPP_FROM?: string;
}

export interface OrderRow {
  id: string;
  payment_status: string;
  total_amount: number;
  delivery_fee: number | null;
  buyer_phone?: string | null;
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

    // Customer only hears about the order over WhatsApp once payment is
    // actually confirmed - never before. Best-effort: a WhatsApp failure
    // (not configured yet, invalid number, etc.) must not undo the payment
    // that was just recorded above.
    if (order.buyer_phone) {
      const phone = normalizeKenyanPhone(order.buyer_phone);
      if (phone) {
        const waybill = order.id.replace(/-/g, "").toUpperCase().slice(0, 12);
        const message = `✅ Payment received!\n\nYour CampusMart order is confirmed and being prepared for delivery.\n\nOrder: WB${waybill.slice(0, 4)}-${waybill.slice(4, 8)}-${waybill.slice(8, 12)}\nTotal: KES ${order.total_amount.toLocaleString()}\n\nTrack it anytime at campusmart.co.ke/orders. Asante for shopping with us!`;
        try {
          await sendWhatsAppMessage(env, phone, message);
        } catch (err) {
          console.error(`Failed to send payment-confirmation WhatsApp for order ${order.id}:`, err);
        }
      }
    }

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
