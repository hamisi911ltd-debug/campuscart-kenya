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

    // Get product details with seller information
    const productDetails = await Promise.all(
      body.items.map(async (item) => {
        const product = await context.env.DB.prepare(`
          SELECT 
            p.id, 
            p.title, 
            p.category, 
            p.seller_id, 
            u.full_name as seller_name, 
            u.phone_number as seller_phone, 
            u.email as seller_email,
            u.location as seller_location
          FROM products p
          LEFT JOIN users u ON p.seller_id = u.id
          WHERE p.id = ?
        `).bind(item.product_id).first();
        
        return {
          ...item,
          title: product?.title || 'Unknown Product',
          category: product?.category || 'N/A',
          seller_id: product?.seller_id || 'unknown',
          seller_name: product?.seller_name || 'Unknown Seller',
          seller_phone: product?.seller_phone || 'Not provided',
          seller_email: product?.seller_email || 'Not provided',
          seller_location: product?.seller_location || 'Not provided',
        };
      })
    );

    const seller_id = productDetails[0]?.seller_id || "unknown";

    // Create the order
    const orderId = crypto.randomUUID();

    await context.env.DB.prepare(`
      INSERT INTO orders (id, buyer_id, seller_id, total_amount, delivery_fee, delivery_address, delivery_latitude, delivery_longitude, buyer_phone, notes, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `).bind(
      orderId,
      body.buyer_id || "guest",
      seller_id,
      total_amount,
      delivery_fee,
      body.delivery_address,
      body.delivery_latitude || null,
      body.delivery_longitude || null,
      buyerInfo.phone,
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

    // Build detailed WhatsApp message with buyer and seller info
    const itemsList = productDetails.map((item, i) => 
      `${i + 1}. ${item.title}\n` +
      `Price: KES ${item.price.toLocaleString()} × ${item.quantity} = KES ${(item.price * item.quantity).toLocaleString()}\n` +
      `Category: ${item.category}\n` +
      `Seller: ${item.seller_name}\n` +
      `Seller Phone: ${item.seller_phone}\n` +
      `Seller Email: ${item.seller_email}`
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
      `Please process this order. Thank you!`;

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
