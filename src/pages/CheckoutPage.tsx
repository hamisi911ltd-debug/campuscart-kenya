import { useState, useEffect, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { PageShell } from "@/components/PageShell";
import { useShop } from "@/store/shop";
import { CheckCircle2, MapPin, Loader2 } from "lucide-react";
import { LocationPicker } from "@/components/LocationPicker";

interface Order {
  id: string;
  orderNumber: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  items: Array<{
    productId: string;
    productTitle: string;
    price: number;
    quantity: number;
    seller?: {
      name: string;
      email: string;
      phone: string;
      campus: string;
    };
  }>;
  total: number;
  deliveryAddress: string;
  location?: { lat: number; lng: number };
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

const CheckoutPage = () => {
  const { cart, cartTotal, clearCart, user } = useShop();
  const navigate = useNavigate();
  const [address, setAddress] = useState("");
  const [done, setDone] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [locationError, setLocationError] = useState<string>("");

  const ADMIN_WHATSAPP = "254759159881";

  // Calculate delivery fee based on cart total
  const getDeliveryFee = (subtotal: number): number => {
    if (subtotal <= 100) return 40;
    if (subtotal <= 200) return 70;
    if (subtotal <= 400) return 90;
    return 100;
  };

  const deliveryFee = getDeliveryFee(cartTotal);
  const orderTotal = cartTotal + deliveryFee;

  // No longer needed: getCurrentLocation and openLocationSettings are handled by LocationPicker

  if (cart.length === 0 && !done) {
    return (
      <PageShell title="Checkout">
        <p className="rounded-xl bg-card p-6 text-center text-sm text-muted-foreground shadow-card">Your cart is empty.</p>
      </PageShell>
    );
  }

  if (done) {
    return (
      <PageShell title="Order confirmed">
        <div className="rounded-2xl bg-card p-8 text-center shadow-elevated">
          <CheckCircle2 className="mx-auto h-14 w-14 text-success" />
          <h2 className="mt-3 text-xl font-extrabold">Asante sana!</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Order #{orderNumber} has been placed successfully!
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Your order details and location have been sent to the admin via WhatsApp.
          </p>
          <div className="mt-5 flex gap-3 justify-center">
            <button 
              onClick={() => navigate("/orders")} 
              className="rounded-full bg-primary px-6 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary-glow"
            >
              Track Order
            </button>
            <button 
              onClick={() => navigate("/")} 
              className="rounded-full gradient-accent px-6 py-2.5 text-sm font-bold text-accent-foreground shadow-accent"
            >
              Continue shopping
            </button>
          </div>
        </div>
      </PageShell>
    );
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Please sign in to continue");
      navigate('/auth');
      return;
    }

    if (!location) {
      toast.error("Please share your location to continue");
      return;
    }

    // Generate order number
    const newOrderNumber = `CM${Date.now().toString().slice(-8)}`;
    setOrderNumber(newOrderNumber);

    // Prepare order data for API
    const orderData = {
      buyer_id: user.id,
      items: cart.map(({ product, qty }) => ({
        product_id: product.id,
        quantity: qty,
        price: product.price,
      })),
      total_amount: orderTotal,
      delivery_address: address,
      delivery_latitude: location.lat,
      delivery_longitude: location.lng,
      buyer_phone: user.phone || 'Not provided',
      notes: `Location: ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`,
    };

    try {
      // Save order to database via checkout API
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error('Failed to save order');
      }

      const result = await response.json();
      
      // Prepare WhatsApp message with location
      const googleMapsLink = `https://www.google.com/maps?q=${location.lat},${location.lng}`;
      
      let message = `🛒 *New Order - #${newOrderNumber}*\n\n`;
      message += `👤 *Customer Details:*\n`;
      message += `Name: ${user.name}\n`;
      message += `Email: ${user.email}\n`;
      message += `Phone: ${user.phone || 'Not provided'}\n`;
      message += `Delivery: ${address}\n\n`;
      message += `📍 *Live Location:*\n`;
      message += `${googleMapsLink}\n`;
      message += `Coordinates: ${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}\n\n`;
      message += `📦 *Order Items:*\n`;
      
      cart.forEach(({ product, qty }, index) => {
        message += `\n${index + 1}. ${product.title}\n`;
        message += `   Price: KES ${product.price.toLocaleString()} × ${qty} = KES ${(product.price * qty).toLocaleString()}\n`;
        message += `   Category: ${product.category}\n`;
        if (product.seller) {
          message += `   Seller: ${product.seller.name}\n`;
          message += `   Seller Phone: ${product.seller.phone}\n`;
          message += `   Seller Email: ${product.seller.email}\n`;
        }
      });

      message += `\n💰 *Order Summary:*\n`;
      message += `Subtotal: KES ${cartTotal.toLocaleString()}\n`;
      message += `Delivery: KES ${deliveryFee}\n`;
      message += `*Total: KES ${orderTotal.toLocaleString()}*\n\n`;
      message += `Order ID: ${result.order_id}\n`;
      message += `Please process this order. Thank you!`;

      // Encode and send WhatsApp message
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${ADMIN_WHATSAPP}?text=${encodedMessage}`;
      
      // Open WhatsApp in new tab
      window.open(whatsappUrl, '_blank');

      toast.success("Order placed successfully!");
      setTimeout(async () => { 
        await clearCart(); 
        setDone(true); 
      }, 800);

    } catch (error) {
      console.error('Error placing order:', error);
      
      // Fallback to localStorage if API fails
      const order: Order = {
        id: Date.now().toString(),
        orderNumber: newOrderNumber,
        customer: {
          name: user.name,
          email: user.email,
          phone: user.phone || 'Not provided',
        },
        items: cart.map(({ product, qty }) => ({
          productId: product.id,
          productTitle: product.title,
          price: product.price,
          quantity: qty,
          seller: product.seller,
        })),
        total: orderTotal,
        deliveryAddress: address,
        location: location,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save order to localStorage as fallback
      const existingOrders = JSON.parse(localStorage.getItem('campusmart_orders') || '[]');
      existingOrders.push(order);
      localStorage.setItem('campusmart_orders', JSON.stringify(existingOrders));

      toast.success("Order placed successfully (saved locally)!");
      setTimeout(async () => { 
        await clearCart(); 
        setDone(true); 
      }, 800);
    }
  };

  return (
    <PageShell title="Checkout">
      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {/* Delivery Address */}
          <div className="rounded-2xl bg-card p-5 shadow-card">
            <h2 className="text-lg font-extrabold mb-4">Delivery Address</h2>
            <input 
              value={address} 
              onChange={(e) => setAddress(e.target.value)} 
              required 
              placeholder="Hostel block / room number / nearest landmark" 
              className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Provide detailed delivery instructions for the rider
            </p>
          </div>

          {/* Location Section */}
          <LocationPicker 
            onLocationCapture={(loc) => {
              setLocation(loc);
              setShowMap(true);
            }} 
            initialLocation={location}
          />

          {/* Order Confirmation */}
          <div className="rounded-2xl bg-card p-5 shadow-card">
            <h2 className="text-lg font-extrabold mb-4">Confirm Order Details</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Customer:</span>
                <span className="font-semibold">{user?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-semibold">{user?.email}</span>
              </div>
              {user?.phone && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="font-semibold">{user.phone}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Items:</span>
                <span className="font-semibold">{cart.length} item{cart.length > 1 ? 's' : ''}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Location:</span>
                <span className="font-semibold">{location ? '✓ Shared' : '✗ Not shared'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary Sidebar */}
        <aside className="h-fit rounded-2xl bg-card p-5 shadow-elevated">
          <h2 className="text-lg font-extrabold">Order Summary</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {cart.map(({ product, qty }) => (
              <li key={product.id} className="flex justify-between gap-2">
                <span className="line-clamp-1">{product.title} × {qty}</span>
                <span className="shrink-0 font-bold">KES {(product.price * qty).toLocaleString()}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 space-y-2 text-sm border-t border-border pt-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-semibold">KES {cartTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Delivery</span>
              <span className="font-semibold">KES {deliveryFee}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {cartTotal <= 100 && "KES 0-100 → KES 40"}
              {cartTotal > 100 && cartTotal <= 200 && "KES 101-200 → KES 70"}
              {cartTotal > 200 && cartTotal <= 400 && "KES 201-400 → KES 90"}
              {cartTotal > 400 && "KES 400+ → KES 100"}
            </div>
          </div>
          <div className="mt-3 flex justify-between border-t border-border pt-3 text-base font-extrabold">
            <span>Total</span>
            <span className="text-accent">KES {orderTotal.toLocaleString()}</span>
          </div>
          <button 
            type="submit"
            disabled={!location}
            className="mt-4 w-full rounded-full gradient-accent py-3 text-sm font-bold text-accent-foreground shadow-accent hover:scale-[1.02] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {location ? 'Complete Order Placement' : 'Share Location to Continue'}
          </button>
          {!location && (
            <p className="mt-2 text-xs text-center text-muted-foreground">
              Location required for delivery
            </p>
          )}
        </aside>
      </form>
    </PageShell>
  );
};

export default CheckoutPage;
