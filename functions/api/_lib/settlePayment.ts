// Shared order-settlement logic, used by both the PayHero webhook
// (functions/api/payhero/callback.ts) and the admin manual recheck fallback
// (functions/api/payhero/status.ts) so there is exactly one place that marks
// an order paid/failed. Single-vendor store: the M-Pesa STK push already
// deposits the full amount into the owner's PayHero account, so there is no
// seller wallet to credit or platform commission to skim.
import type { ParsedCallback } from "./payhero";
import { normalizeKenyanPhone } from "./phone";
import { sendWhatsAppMessage } from "./sendWhatsApp";
import { shortProductTitle } from "./productTitle";
import { buildAdminOrderMessage } from "./orderMessages";
import { ADMIN_PHONE_E164 } from "./owner";

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

/** The receipt the customer gets on WhatsApp the moment their payment is confirmed. */
export async function buildReceiptMessage(env: Env, order: OrderRow, mpesaReceipt?: string): Promise<string> {
  let lines: string[] = [];
  let subtotal = 0;
  try {
    const { results } = await env.DB.prepare(
      "SELECT product_title, quantity, price_at_purchase FROM order_items WHERE order_id = ?"
    ).bind(order.id).all<{ product_title: string | null; quantity: number; price_at_purchase: number }>();
    for (const item of results || []) {
      const qty = Number(item.quantity) || 1;
      const price = Number(item.price_at_purchase) || 0;
      subtotal += qty * price;
      const name = shortProductTitle(item.product_title || "Item");
      lines.push(`• ${qty} x ${name} - KES ${(qty * price).toLocaleString("en-KE")}`);
    }
  } catch { /* the receipt still goes out without the item list */ }
  const total = Number(order.total_amount) || 0;
  const delivery = Number(order.delivery_fee) || Math.max(total - subtotal, 0);
  const number = "CM" + order.id.slice(-8);
  return [
    "*CampusMart Kenya - Payment Receipt*",
    "",
    `Order: *${number}*`,
    `Status: *PAID* ${mpesaReceipt ? "(M-Pesa " + mpesaReceipt + ")" : ""}`.trim(),
    "",
    ...(lines.length ? [...lines, ""] : []),
    ...(subtotal > 0 ? [`Subtotal: KES ${subtotal.toLocaleString("en-KE")}`] : []),
    `Delivery (CBD): KES ${delivery.toLocaleString("en-KE")}`,
    `*Total paid: KES ${total.toLocaleString("en-KE")}*`,
    "",
    "Your order is confirmed and being prepared for delivery.",
    "Track it anytime: campusmart.co.ke/orders",
    "Asante for shopping with CampusMart!",
  ].join("\n");
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
        const message = await buildReceiptMessage(env, order, parsed.receiptNumber);
        try {
          await sendWhatsAppMessage(env, phone, message);
        } catch (err) {
          console.error(`Failed to send payment-confirmation WhatsApp for order ${order.id}:`, err);
        }
      }
    }

    // The shop owner hears about the order only now that the money is confirmed: full client
    // details, the products and the original Kilimall link for each one.
    try {
      await sendWhatsAppMessage(env, ADMIN_PHONE_E164, await buildAdminOrderMessage(env, order, parsed.receiptNumber));
    } catch (err) {
      console.error(`Failed to send the paid-order WhatsApp to the admin for order ${order.id}:`, err);
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
