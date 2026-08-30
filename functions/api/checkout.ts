// Cloudflare Pages Function - Checkout API
import { OWNER_ID, ensureOwnerUser } from "./_lib/owner";

interface Env {
  DB: D1Database;
}

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
      email: 'N/A',
      phone: body.buyer_phone || 'N/A'
    };

    if (body.buyer_id && body.buyer_id !== 'guest') {
      const buyer = await context.env.DB.prepare(`
        SELECT full_name, email, phone_number
        FROM users
        WHERE id = ?
      `).bind(body.buyer_id).first();

      if (buyer) {
        buyerInfo = {
          name: buyer.full_name as string || 'Guest',
          email: buyer.email as string || 'N/A',
          phone: buyer.phone_number as string || body.buyer_phone || 'N/A'
        };
      }
    }

    // Calculate delivery fee
    const subtotal = body.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    let delivery_fee: number;
    if (subtotal <= 100) {
      delivery_fee = 40;
    } else if (subtotal <= 200) {
      delivery_fee = 70;
    } else if (subtotal <= 400) {
      delivery_fee = 90;
    } else {
      delivery_fee = 100;
    }

    const total_amount = subtotal + delivery_fee;

    // Get product details for the order confirmation. title/image are also
    // snapshotted onto order_items below so this order's history stays
    // readable even if the product is later deleted from the catalog.
    const productDetails = await Promise.all(
      body.items.map(async (item) => {
        const product = await context.env.DB.prepare(`
          SELECT id, title, category, image_url FROM products WHERE id = ?
        `).bind(item.product_id).first();

        return {
          ...item,
          title: product?.title || 'Unknown Product',
          category: product?.category || 'N/A',
          image_url: (product?.image_url as string | undefined) || null,
        };
      })
    );

    await ensureOwnerUser(context.env);

    // Create the order
    const orderId = crypto.randomUUID();

    await context.env.DB.prepare(`
      INSERT INTO orders (id, buyer_id, seller_id, total_amount, delivery_fee, delivery_address, delivery_latitude, delivery_longitude, buyer_phone, notes, status, payment_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_confirmation', 'unpaid')
    `).bind(
      orderId,
      body.buyer_id || "guest",
      OWNER_ID,
      total_amount,
      delivery_fee,
      body.delivery_address,
      body.delivery_latitude || null,
      body.delivery_longitude || null,
      buyerInfo.phone,
      body.notes || null
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

    // Build detailed WhatsApp message with buyer and order info
    const itemsList = productDetails.map((item, i) =>
      `${i + 1}. ${item.title}\n` +
      `Price: KES ${item.price.toLocaleString()} × ${item.quantity} = KES ${(item.price * item.quantity).toLocaleString()}\n` +
      `Category: ${item.category}`
    ).join("\n\n");

    // Google Maps link if location provided
    const mapsLink = (body.delivery_latitude && body.delivery_longitude) 
      ? `📍 *Live Location:*\nhttps://www.google.com/maps?q=${body.delivery_latitude},${body.delivery_longitude}\nCoordinates: ${body.delivery_latitude.toFixed(6)}, ${body.delivery_longitude.toFixed(6)}\n\n`
      : '';

    const whatsappMessage = `🛒 *New Order - #CM${Date.now().toString().slice(-8)}*\n\n` +
      `👤 *Customer Details:*\n` +
      `Name: ${buyerInfo.name}\n` +
      `Email: ${buyerInfo.email}\n` +
      `Phone: ${buyerInfo.phone}\n` +
      `Delivery: ${body.delivery_address}\n\n` +
      `${mapsLink}` +
      `📦 *Order Items:*\n\n` +
      `${itemsList}\n\n` +
      `💰 *Order Summary:*\n` +
      `Subtotal: KES ${subtotal.toLocaleString()}\n` +
      `Delivery: KES ${delivery_fee}\n` +
      `*Total: KES ${total_amount.toLocaleString()}*\n\n` +
      `${body.notes ? `📝 Notes: ${body.notes}\n\n` : ""}` +
      `Admin Contact: +254108254465\n` +
      `Order Time: ${new Date().toLocaleString("en-KE", { timeZone: "Africa/Nairobi" })}\n\n` +
      `⚠️ Please confirm the item(s) are in stock, then open Admin → Orders ` +
      `and tap "Confirm & Request Payment" to send the customer their M-Pesa payment prompt.`;

    return new Response(JSON.stringify({
      success: true,
      order_id: orderId,
      subtotal,
      delivery_fee,
      total_amount,
      whatsapp_message: whatsappMessage,
      admin_phone: "254108254465",
    }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: "Checkout failed",
      stack: error.stack
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
