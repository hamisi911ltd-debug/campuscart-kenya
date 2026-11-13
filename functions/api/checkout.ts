// Cloudflare Pages Function - Checkout API
import { OWNER_ID, ensureOwnerUser } from "./_lib/owner";
import { normalizeKenyanPhone } from "./_lib/phone";
import { checkLiveAvailability } from "./_lib/availability";
import { ensureOrderColumns } from "./_lib/orderSchema";
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

// Delivery is within the Nairobi CBD and Mombasa CBD only. Keep in sync with DELIVERY_COUNTIES
// in src/data/deliveryAreas.ts.
const DELIVERY_COUNTIES = ["Nairobi", "Mombasa"];


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

    if (!body.county || !DELIVERY_COUNTIES.includes(body.county)) {
      return new Response(JSON.stringify({ error: "We deliver within Nairobi CBD and Mombasa CBD only." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

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

    // The orders table has a foreign key to users, so an unknown account id (e.g. a sign-in that
    // never reached the database) would make the insert fail. Such orders go under a guest row.
    let buyerRowId = 'guest';
    if (body.buyer_id && body.buyer_id !== 'guest') {
      const buyer = await context.env.DB.prepare(`
        SELECT full_name, phone_number
        FROM users
        WHERE id = ?
      `).bind(body.buyer_id).first();

      if (buyer) {
        buyerRowId = body.buyer_id;
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
    const fullAddress = [body.delivery_address, body.county ? `${body.county} CBD` : ""]
      .map((part) => (part || "").trim())
      .filter(Boolean)
      .join(", ");
    const orderNotes = [
      `Recipient: ${recipientName}`,
      altPhone ? `Alt phone: ${altPhone}` : "",
      body.delivery_note ? `Rider note: ${body.delivery_note.trim()}` : "",
      body.notes && !body.notes.startsWith("Customer:") ? body.notes : "",
    ].filter(Boolean).join(" | ");

    // Prices come from OUR catalogue, never from the browser - otherwise anyone could
    // order a phone for KES 1 by editing the request.
    if (body.items.length > 50) {
      return new Response(JSON.stringify({ error: "Too many items in one order" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }
    for (const item of body.items) {
      const qty = Number(item.quantity);
      const row = await context.env.DB.prepare("SELECT price, is_available FROM products WHERE id = ?")
        .bind(item.product_id).first<{ price: number; is_available: number | null }>();
      if (!row || row.is_available === 0) {
        return new Response(JSON.stringify({ error: "One of the items in your cart is no longer available. Please remove it and try again." }), { status: 400, headers: { "Content-Type": "application/json" } });
      }
      if (!Number.isInteger(qty) || qty < 1 || qty > 50) {
        return new Response(JSON.stringify({ error: "Invalid quantity" }), { status: 400, headers: { "Content-Type": "application/json" } });
      }
      item.quantity = qty;
      item.price = Number(row.price);
    }

    // Check the ORIGINAL listing right now. If the supplier has run out, tell the customer
    // before they pay instead of taking money for something we cannot get. (A listing we cannot
    // read at the moment counts as "unknown" and never blocks the order.)
    const live = await checkLiveAvailability(context.env, body.items.map((item) => item.product_id));
    const soldOut = live.filter((r) => r.status === "unavailable");
    if (soldOut.length > 0) {
      const names = soldOut.map((r) => r.title.length > 50 ? r.title.slice(0, 47) + "..." : r.title).join(", ");
      return new Response(JSON.stringify({
        error: soldOut.length === 1
          ? `Sorry, "${names}" is out of stock right now. Please remove it from your cart to continue.`
          : `Sorry, these items are out of stock right now: ${names}. Please remove them from your cart to continue.`,
        unavailable: soldOut.map((r) => r.product_id),
      }), { status: 409, headers: { "Content-Type": "application/json" } });
    }

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

    await ensureOrderColumns(context.env);
    await ensureOwnerUser(context.env);
    if (buyerRowId === 'guest') {
      await context.env.DB.prepare(
        "INSERT OR IGNORE INTO users (id, email, password_hash, full_name, is_admin) VALUES ('guest', 'guest@campusmart.local', '', 'Guest customer', 0)"
      ).run();
    }

    // Create the order
    const orderId = crypto.randomUUID();
    // same format the Orders page derives from the id, so the number on the receipt matches everywhere
    const orderNumber = `CM${orderId.slice(-8)}`;

    await context.env.DB.prepare(`
      INSERT INTO orders (id, buyer_id, seller_id, total_amount, delivery_fee, delivery_address, delivery_latitude, delivery_longitude, buyer_phone, notes, status, payment_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed', 'unpaid')
    `).bind(
      orderId,
      buyerRowId,
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
      VALUES (?, ?, 'confirmed', 'Order placed - item availability verified live with the supplier. Awaiting payment.')
    `).bind(crypto.randomUUID(), orderId).run();

    // No WhatsApp message goes out here. The customer is sent their M-Pesa prompt next, and both the
    // shop owner and the customer are messaged only once PayHero has confirmed the payment
    // (see settleOrderPayment).

    return new Response(JSON.stringify({
      success: true,
      order_id: orderId,
      order_number: orderNumber,
      subtotal,
      delivery_fee,
      total_amount,
    }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return new Response(JSON.stringify({
      error: `Could not place the order (${error?.message || 'unknown error'}). Please try again.`,
      details: "Checkout failed"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
