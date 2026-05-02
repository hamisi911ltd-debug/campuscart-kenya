// Cloudflare Pages Function - Generate WhatsApp Order Message
export async function onRequestGet({ env, request }: any) {
  const url = new URL(request.url);
  const orderId = url.searchParams.get("order_id");
  if (!orderId) return Response.json({ error: "order_id required" }, { status: 400 });

  const order = await env.DB.prepare("SELECT * FROM orders WHERE id = ?").bind(orderId).first();
  if (!order) return Response.json({ error: "Order not found" }, { status: 404 });

  const buyer = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(order.buyer_id).first();
  const seller = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(order.seller_id).first();

  const items = await env.DB.prepare(
    "SELECT oi.quantity, oi.price_at_purchase, p.title, p.description, p.category, p.location FROM order_items oi LEFT JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?"
  ).bind(orderId).all();

  const orderNum = `#CM${orderId.slice(0, 8).toUpperCase()}`;

  let message = `🛒 *New Order - ${orderNum}*\n\n`;

  message += `👤 *Customer Details:*\n`;
  message += `Name: ${buyer?.full_name || "Unknown"}\n`;
  message += `Email: ${buyer?.email || "Unknown"}\n`;
  message += `Phone: ${buyer?.phone_number || "Not provided"}\n`;
  message += `Delivery: ${order.delivery_address || "Not provided"}\n\n`;

  if (order.delivery_latitude && order.delivery_longitude) {
    message += `📍 *Live Location:*\n`;
    message += `https://www.google.com/maps?q=${order.delivery_latitude},${order.delivery_longitude}\n`;
    message += `Coordinates: ${Number(order.delivery_latitude).toFixed(6)}, ${Number(order.delivery_longitude).toFixed(6)}\n\n`;
  }

  message += `📦 *Order Items:*\n\n`;
  items.results.forEach((item: any, i: number) => {
    message += `${i + 1}. ${item.title}\n`;
    if (item.description) message += `   ${item.description.substring(0, 60)}\n`;
    message += `   Price: KES ${item.price_at_purchase.toLocaleString()} × ${item.quantity} = KES ${(item.price_at_purchase * item.quantity).toLocaleString()}\n`;
    message += `   Category: ${item.category || "N/A"}\n`;
    if (item.location) message += `   Campus: ${item.location}\n`;
    if (seller?.full_name) message += `   Seller: ${seller.full_name}\n`;
    if (seller?.phone_number) message += `   Seller Phone: ${seller.phone_number}\n`;
    if (seller?.email) message += `   Seller Email: ${seller.email}\n`;
    message += `\n`;
  });

  const subtotal = items.results.reduce((sum: number, item: any) => sum + item.price_at_purchase * item.quantity, 0);
  const deliveryFee = order.delivery_fee || 0;
  const total = subtotal + deliveryFee;

  message += `💰 *Order Summary:*\n`;
  message += `Subtotal: KES ${subtotal.toLocaleString()}\n`;
  message += `Delivery: KES ${deliveryFee.toLocaleString()}\n`;
  message += `*Total: KES ${total.toLocaleString()}*\n\n`;
  message += `Please process this order. Thank you!`;

  const phone = (seller?.phone_number || "").replace(/[^0-9]/g, "");
  const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  return Response.json({ whatsapp_url: whatsappUrl, message });
}
