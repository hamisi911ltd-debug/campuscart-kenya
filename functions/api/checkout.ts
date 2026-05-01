// Cloudflare Pages Function - Checkout API
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

    // Create the order
    const orderId = crypto.randomUUID();

    // Get first product's seller_id
    const firstProduct = await context.env.DB.prepare(
      "SELECT seller_id FROM products WHERE id = ?"
    ).bind(body.items[0]?.product_id).first();

    await context.env.DB.prepare(`
      INSERT INTO orders (id, buyer_id, seller_id, total_amount, delivery_fee, delivery_address, delivery_latitude, delivery_longitude, buyer_phone, notes, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'))
    `).bind(
      orderId,
      body.buyer_id,
      firstProduct?.seller_id || "",
      total_amount,
      delivery_fee,
      body.delivery_address,
      body.delivery_latitude || null,
      body.delivery_longitude || null,
      body.buyer_phone,
      body.notes || null
    ).run();

    // Create order items
    for (const item of body.items) {
      await context.env.DB.prepare(`
        INSERT INTO order_items (id, order_id, product_id, quantity, price_at_purchase)
        VALUES (?, ?, ?, ?, ?)
      `).bind(
        crypto.randomUUID(),
        orderId,
        item.product_id,
        item.quantity,
        item.price
      ).run();
    }

    // Build WhatsApp message for admin
    const itemsList = body.items.map((item, i) => `${i + 1}. ${item.product_id} x${item.quantity} @ KES ${item.price}`).join("\n");

    const whatsappMessage = `🛒 *NEW ORDER - CampusMart*\n\n` +
      `📋 Order ID: ${orderId}\n` +
      `📱 Buyer Phone: ${body.buyer_phone}\n` +
      `📍 Address: ${body.delivery_address}\n\n` +
      `📦 Items:\n${itemsList}\n\n` +
      `💰 Subtotal: KES ${subtotal}\n` +
      `🚚 Delivery Fee: KES ${delivery_fee}\n` +
      `💵 Total: KES ${total_amount}\n\n` +
      `${body.notes ? `📝 Notes: ${body.notes}\n\n` : ""}` +
      `⏰ ${new Date().toLocaleString("en-KE", { timeZone: "Africa/Nairobi" })}`;

    return new Response(JSON.stringify({
      success: true,
      order_id: orderId,
      subtotal,
      delivery_fee,
      total_amount,
      admin_whatsapp: `https://wa.me/254759159881?text=${encodeURIComponent(whatsappMessage)}`,
    }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return new Response(JSON.stringify({
      error: "Checkout failed",
      message: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
