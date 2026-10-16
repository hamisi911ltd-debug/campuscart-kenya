// Cloudflare Pages Function - Checkout API
import { OWNER_ID, ensureOwnerUser } from "./_lib/owner";
import { normalizeKenyanPhone } from "./_lib/phone";
import { sendWhatsAppMessage } from "./_lib/sendWhatsApp";
import { ensureSourceTables, kilimallListingUrl, listingIdFromImages } from "./_lib/productSources";

interface Env {
  DB: D1Database;
  TWILIO_ACCOUNT_SID?: string;
  TWILIO_AUTH_TOKEN?: string;
  TWILIO_WHATSAPP_FROM?: string;
}

// Flat delivery fee for every order. Keep in sync with DELIVERY_FEE in
// src/data/deliveryAreas.ts (the frontend can't import from functions/).
const DELIVERY_FEE = 129;

const ADMIN_PHONE_E164 = "+254108254465";
const ADMIN_PHONE_WA = "254108254465";
const SITE_URL = "https://campusmart.co.ke";

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json() as {
      buyer_id: string;
      items: Array<{ product_id: string; quantity: number; price: number }>;
      delivery_address: string;
      delivery_latitude?: number;
      delivery_longitude?: number;
      buyer_phone: string;
      notes?: string;
      order_number?: string;
      payment_method?: string;
      // Kilimall-style delivery details
      recipient_name?: string;
      alt_phone?: string;
      county?: string;
      town?: string;
      delivery_note?: string;
    };

    if (!body.items || body.items.length === 0) {
      return new Response(JSON.stringify({ error: "No items in order" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get buyer information
    let buyerInfo = {
      name: 'Guest',
      phone: body.buyer_phone || 'N/A'
    };

    // The phone entered at checkout is the one the M-Pesa request is sent
    // to, so it wins over whatever is on the account profile.
    const checkoutPhone = normalizeKenyanPhone(body.buyer_phone || "");
    const altPhone = body.alt_phone ? normalizeKenyanPhone(body.alt_phone) : null;
    if (body.buyer_phone && !checkoutPhone) {
      return new Response(JSON.stringify({ error: "Enter a valid Kenyan phone number" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (body.alt_phone && !altPhone) {
      return new Response(JSON.stringify({ error: "The alternative phone number isn't valid" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (body.buyer_id && body.buyer_id !== 'guest') {
      const buyer = await context.env.DB.prepare(`
        SELECT full_name, phone_number
        FROM users
        WHERE id = ?
      `).bind(body.buyer_id).first();

      if (buyer) {
        buyerInfo = {
          name: buyer.full_name as string || 'Guest',
          phone: checkoutPhone || buyer.phone_number as string || body.buyer_phone || 'N/A'
        };
      }
    } else if (checkoutPhone) {
      buyerInfo.phone = checkoutPhone;
    }

    const recipientName = (body.recipient_name || "").trim() || buyerInfo.name;

    // The orders table has a single address column, so the full Kilimall-style
    // address (street, town, county) is written into it as one line, and the
    // recipient / alternative phone / rider note go into notes.
    const fullAddress = [body.delivery_address, body.town, body.county ? `${body.county} County` : ""]
      .map((part) => (part || "").trim())
      .filter(Boolean)
      .join(", ");
    const orderNotes = [
      `Recipient: ${recipientName}`,
      altPhone ? `Alt phone: ${altPhone}` : "",
      body.delivery_note ? `Rider note: ${body.delivery_note.trim()}` : "",
      body.notes && !body.notes.startsWith("Customer:") ? body.notes : "",
    ].filter(Boolean).join(" | ");

    // Flat delivery fee
    const subtotal = body.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const delivery_fee = DELIVERY_FEE;
    const total_amount = subtotal + delivery_fee;

    // Get product details for the order confirmation. title/image are also
    // snapshotted onto order_items below so this order's history stays
    // readable even if the product is later deleted from the catalog.
    // Source info (original Kilimall listing + what it cost) is for the
    // admin's eyes only - it goes in the admin WhatsApp message, never the
    // customer-facing one.
    try { await ensureSourceTables(context.env); } catch (err) { console.error("ensureSourceTables:", err); }
    const productDetails = await Promise.all(
      body.items.map(async (item) => {
        const product = await context.env.DB.prepare(`
          SELECT id, title, category, image_url, images FROM products WHERE id = ?
        `).bind(item.product_id).first();

        let sourceUrl: string | null = null;
        let sourcePrice: number | null = null;
        try {
          const source = await context.env.DB.prepare(
            "SELECT listing_id, source_price FROM product_sources WHERE product_id = ?"
          ).bind(item.product_id).first<{ listing_id: string; source_price: number | null }>();
          const listingId = source?.listing_id || listingIdFromImages(product?.images);
          if (listingId) sourceUrl = kilimallListingUrl(listingId);
          sourcePrice = source?.source_price ?? null;
        } catch (err) {
          console.error("Source lookup failed:", err);
        }

        return {
          ...item,
          title: (product?.title as string | undefined) || 'Unknown Product',
          category: (product?.category as string | undefined) || 'N/A',
          image_url: (product?.image_url as string | undefined) || null,
          sourceUrl,
          sourcePrice,
        };
      })
    );

    await ensureOwnerUser(context.env);

    // Create the order
    const orderId = crypto.randomUUID();
    const orderNumber = body.order_number || `CM${Date.now().toString().slice(-8)}`;

    await context.env.DB.prepare(`
      INSERT INTO orders (id, buyer_id, seller_id, total_amount, delivery_fee, delivery_address, delivery_latitude, delivery_longitude, buyer_phone, notes, status, payment_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_confirmation', 'unpaid')
    `).bind(
      orderId,
      body.buyer_id || "guest",
      OWNER_ID,
      total_amount,
      delivery_fee,
      fullAddress,
      body.delivery_latitude || null,
      body.delivery_longitude || null,
      buyerInfo.phone,
      orderNotes
    ).run();

    // Create order items, snapshotting product title/image at purchase time
    for (let i = 0; i < body.items.length; i++) {
      const item = body.items[i];
      const detail = productDetails[i];
      await context.env.DB.prepare(`
        INSERT INTO order_items (id, order_id, product_id, product_title, product_image, quantity, price_at_purchase)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(),
        orderId,
        item.product_id,
        detail?.title || null,
        detail?.image_url || null,
        item.quantity,
        item.price
      ).run();
    }

    await context.env.DB.prepare(`
      INSERT INTO order_status_history (id, order_id, status, note)
      VALUES (?, ?, 'pending_confirmation', 'Order placed, awaiting seller/admin confirmation of stock availability')
    `).bind(crypto.randomUUID(), orderId).run();

    // ---- WhatsApp message with full product + client details ----
    const money = (n: number) => `KES ${n.toLocaleString("en-KE")}`;
    const payLabel = body.payment_method === "wallet" ? "CampusMart Wallet" : "M-Pesa";

    const itemsFor = (internal: boolean) => productDetails.map((item, i) => {
      const lines = [
        `${i + 1}. *${item.title}*`,
        `   Qty: ${item.quantity} × ${money(item.price)} = ${money(item.price * item.quantity)}`,
        `   Category: ${item.category}`,
        `   Product ID: ${item.product_id}`,
        `   Page: ${SITE_URL}/product/${item.product_id}`,
      ];
      if (internal && item.sourceUrl) {
        lines.push(`   🔗 Buy from: ${item.sourceUrl}`);
        if (item.sourcePrice) {
          const profit = (item.price - item.sourcePrice) * item.quantity;
          lines.push(`   Cost: ${money(item.sourcePrice)} each · Profit: ${money(profit)}`);
        }
      }
      return lines.join("\n");
    }).join("\n\n");

    const mapsLink = (body.delivery_latitude && body.delivery_longitude)
      ? `📍 *Live Location:*\nhttps://www.google.com/maps?q=${body.delivery_latitude},${body.delivery_longitude}\n\n`
      : '';

    const buildMessage = (internal: boolean) =>
      `🛒 *New Order - #${orderNumber}*\n\n` +
      `👤 *Client Details:*\n` +
      `Account: ${buyerInfo.name}\n` +
      `Deliver to: ${recipientName}\n` +
      `Phone: ${buyerInfo.phone}\n` +
      `${altPhone ? `Alt phone: ${altPhone}\n` : ""}` +
      `Address: ${fullAddress}\n` +
      `${body.delivery_note ? `Rider note: ${body.delivery_note.trim()}\n` : ""}\n` +
      `${mapsLink}` +
      `📦 *Products:*\n\n` +
      `${itemsFor(internal)}\n\n` +
      `💰 *Payment:*\n` +
      `Subtotal: ${money(subtotal)}\n` +
      `Delivery: ${money(delivery_fee)}\n` +
      `*Total: ${money(total_amount)}*\n` +
      `Method: ${payLabel} (unpaid until confirmed)\n\n` +
      `Order ID: ${orderId}\n` +
      `Order Time: ${new Date().toLocaleString("en-KE", { timeZone: "Africa/Nairobi" })}` +
      (internal
        ? `\n\n⚠️ Check the item(s) are in stock (open the 🔗 link), then open Admin → Orders ` +
          `and tap "Confirm & Request Payment" to send the customer their M-Pesa prompt.`
        : "");

    const adminMessage = buildMessage(true);
    // Customer-safe copy: same details, no supplier link or cost price.
    const customerMessage = buildMessage(false);

    // Message the admin's WhatsApp directly (Twilio). Best-effort - if
    // WhatsApp isn't configured or the send fails, the order is still saved
    // and the client falls back to opening WhatsApp with the message.
    let adminNotified = false;
    try {
      await sendWhatsAppMessage(context.env, ADMIN_PHONE_E164, adminMessage);
      adminNotified = true;
    } catch (err) {
      console.error("Admin WhatsApp notification failed:", err);
    }

    return new Response(JSON.stringify({
      success: true,
      order_id: orderId,
      order_number: orderNumber,
      subtotal,
      delivery_fee,
      total_amount,
      admin_notified: adminNotified,
      whatsapp_message: customerMessage,
      admin_phone: ADMIN_PHONE_WA,
    }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return new Response(JSON.stringify({
      error: error.message,
      details: "Checkout failed"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
