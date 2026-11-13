// WhatsApp messages for an order. They are sent only AFTER PayHero has confirmed the payment
// (see settleOrderPayment) - placing an order, or an unpaid prompt, never messages anyone.
import { kilimallListingUrl, listingIdFromImages } from "./productSources";
import { shortProductTitle } from "./productTitle";

interface Env {
  DB: D1Database;
}

const SITE_URL = "https://campusmart.co.ke";
const money = (n: number) => `KES ${Math.round(Number(n) || 0).toLocaleString("en-KE")}`;
export const orderNumberFor = (orderId: string) => "CM" + orderId.slice(-8);

interface OrderForMessage {
  id: string;
  total_amount: number;
  delivery_fee: number | null;
  buyer_phone?: string | null;
}

/** The full order, written for the shop owner: who paid, what to buy, where to buy it, where to deliver. */
export async function buildAdminOrderMessage(env: Env, order: OrderForMessage, mpesaReceipt?: string): Promise<string> {
  const row = await env.DB.prepare(
    "SELECT notes, delivery_address, buyer_phone, created_at, buyer_id FROM orders WHERE id = ?"
  ).bind(order.id).first<{ notes: string | null; delivery_address: string | null; buyer_phone: string | null; created_at: string | null; buyer_id: string | null }>();

  let accountName = "Guest";
  if (row?.buyer_id) {
    try {
      const u = await env.DB.prepare("SELECT full_name FROM users WHERE id = ?").bind(row.buyer_id).first<{ full_name: string | null }>();
      if (u?.full_name) accountName = u.full_name;
    } catch { /* optional */ }
  }

  const { results } = await env.DB.prepare(
    `SELECT oi.product_id, oi.product_title, oi.quantity, oi.price_at_purchase, p.images AS images, p.category AS category
     FROM order_items oi LEFT JOIN products p ON p.id = oi.product_id WHERE oi.order_id = ?`
  ).bind(order.id).all<{ product_id: string; product_title: string | null; quantity: number; price_at_purchase: number; images: string | null; category: string | null }>();

  const lines: string[] = [];
  let subtotal = 0;
  let index = 0;
  for (const item of results || []) {
    index++;
    const qty = Number(item.quantity) || 1;
    const price = Number(item.price_at_purchase) || 0;
    subtotal += qty * price;

    let sourceUrl: string | null = null;
    let cost: number | null = null;
    try {
      const src = await env.DB.prepare("SELECT listing_id, source_price FROM product_sources WHERE product_id = ?")
        .bind(item.product_id).first<{ listing_id: string; source_price: number | null }>();
      const listingId = src?.listing_id || listingIdFromImages(item.images);
      if (listingId) sourceUrl = kilimallListingUrl(listingId);
      cost = src?.source_price ?? null;
    } catch { /* supplier info is optional */ }

    const block = [
      `${index}. *${shortProductTitle(item.product_title || "Item")}*`,
      `   Qty: ${qty} x ${money(price)} = ${money(qty * price)}`,
      `   Page: ${SITE_URL}/product/${item.product_id}`,
    ];
    if (sourceUrl) {
      block.push(`   🔗 Buy from: ${sourceUrl}`);
      if (cost) block.push(`   Cost: ${money(cost)} each · Profit: ${money((price - cost) * qty)}`);
    }
    lines.push(block.join("\n"));
  }

  const total = Number(order.total_amount) || 0;
  const delivery = Number(order.delivery_fee) || Math.max(total - subtotal, 0);
  const when = row?.created_at ? new Date(row.created_at.includes("T") ? row.created_at : row.created_at.replace(" ", "T") + "Z") : new Date();

  return [
    `✅ *PAID ORDER - #${orderNumberFor(order.id)}*`,
    "",
    "👤 *Client:*",
    `Account: ${accountName}`,
    `Phone: ${row?.buyer_phone || order.buyer_phone || "N/A"}`,
    ...(row?.notes ? [row.notes.split(" | ").join("\n")] : []),
    `Address: ${row?.delivery_address || "N/A"}`,
    "",
    "📦 *Products to buy:*",
    "",
    lines.join("\n\n"),
    "",
    "💰 *Payment (confirmed by PayHero):*",
    `Subtotal: ${money(subtotal)}`,
    `Delivery: ${money(delivery)}`,
    `*Total paid: ${money(total)}*`,
    ...(mpesaReceipt ? [`M-Pesa receipt: ${mpesaReceipt}`] : []),
    "",
    `Order ID: ${order.id}`,
    `Placed: ${when.toLocaleString("en-KE", { timeZone: "Africa/Nairobi" })}`,
    "",
    "Open each 🔗 link, buy the item(s) and arrange delivery. Update tracking in Admin → Orders.",
  ].join("\n");
}
