// Cloudflare Pages Function - Orders API
interface Env {
  DB: D1Database;
}

// GET user's orders
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    if (!context.env.DB) {
      return new Response(JSON.stringify({ 
        error: "DB binding not found" 
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const url = new URL(context.request.url);
    const userId = url.searchParams.get("user_id");

    if (!userId) {
      return new Response(JSON.stringify({ 
        error: "user_id parameter required" 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get orders with items
    const { results: orders } = await context.env.DB.prepare(`
      SELECT o.*, 
             GROUP_CONCAT(oi.product_id || ':' || oi.quantity || ':' || oi.price || ':' || p.title) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE o.buyer_id = ?
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `).bind(userId).all();

    // Parse items for each order
    const ordersWithItems = (orders as any[]).map(order => ({
      ...order,
      items: order.items ? order.items.split(',').map((item: string) => {
        const [product_id, quantity, price, title] = item.split(':');
        return { product_id, quantity: parseInt(quantity), price: parseFloat(price), title };
      }) : []
    }));

    return new Response(JSON.stringify(ordersWithItems), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error('GET /api/orders error:', err);
    return new Response(JSON.stringify({ 
      error: err.message 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

// POST create order
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    if (!context.env.DB) {
      return new Response(JSON.stringify({ 
        error: "DB binding not found" 
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data = await context.request.json() as {
      buyer_id: string;
      items: Array<{
        product_id: string;
        quantity: number;
        price: number;
      }>;
      total_amount: number;
      delivery_address: string;
      delivery_phone: string;
      payment_method: string;
      notes?: string;
    };

    if (!data.buyer_id || !data.items || data.items.length === 0 || !data.total_amount) {
      return new Response(JSON.stringify({ 
        error: "buyer_id, items, and total_amount are required" 
      }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const orderId = crypto.randomUUID();
    const now = new Date().toISOString();

    // Create order
    await context.env.DB.prepare(`
      INSERT INTO orders (
        id, buyer_id, total_amount, status, delivery_address, 
        delivery_phone, payment_method, payment_status, notes, 
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      orderId,
      data.buyer_id,
      data.total_amount,
      'pending',
      data.delivery_address,
      data.delivery_phone,
      data.payment_method,
      'pending',
      data.notes || null,
      now,
      now
    ).run();

    // Create order items
    for (const item of data.items) {
      const itemId = crypto.randomUUID();
      await context.env.DB.prepare(`
        INSERT INTO order_items (
          id, order_id, product_id, quantity, price, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        itemId,
        orderId,
        item.product_id,
        item.quantity,
        item.price,
        now,
        now
      ).run();
    }

    // Clear cart items for this user
    await context.env.DB.prepare(
      "DELETE FROM cart_items WHERE user_id = ?"
    ).bind(data.buyer_id).run();

    return new Response(JSON.stringify({ 
      success: true, 
      order_id: orderId 
    }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error('POST /api/orders error:', err);
    return new Response(JSON.stringify({ 
      error: err.message 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};