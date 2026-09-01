import { useState, useEffect, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { PageShell } from "@/components/PageShell";
import { useShop } from "@/store/shop";
import { CheckCircle2, MapPin, Loader2, Wallet, Smartphone } from "lucide-react";
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
  const { cart, cartTotal, clearCart, user, refreshUser } = useShop();
  const navigate = useNavigate();
  const [address, setAddress] = useState("");
  const [done, setDone] = useState(false);
  const [paidWithWallet, setPaidWithWallet] = useState(false);
  const [payMethod, setPayMethod] = useState<"wallet" | "mpesa">("mpesa");
  const [submitting, setSubmitting] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [locationError, setLocationError] = useState<string>("");

  const ADMIN_WHATSAPP = "254108254465";

  // Calculate delivery fee based on cart total with more accurate pricing
  const getDeliveryFee = (subtotal: number): number => {
    if (subtotal <= 0) return 0;
    if (subtotal <= 100) return 40;
    if (subtotal <= 200) return 70;
    if (subtotal <= 400) return 90;
    if (subtotal <= 800) return 120;
    if (subtotal <= 1500) return 150;
    return 200; // For orders above KES 1500
  };

  const deliveryFee = getDeliveryFee(cartTotal);
  const orderTotal = cartTotal + deliveryFee;
  const walletBalance = user?.walletBalance || 0;
  const walletCovers = walletBalance >= orderTotal;

  // No longer needed: getCurrentLocation and openLocationSettings are handled by LocationPicker

  if (cart.length === 0 && !done) {
    return (
      <PageShell title="Checkout" noIndex>
        <p className="rounded-xl bg-card p-6 text-center text-sm text-muted-foreground shadow-card">Your cart is empty.</p>
      </PageShell>
    );
  }

  if (done) {
    return (
      <PageShell title="Order confirmed" noIndex>
        <div className="rounded-2xl bg-card p-8 text-center shadow-elevated">
          <CheckCircle2 className="mx-auto h-14 w-14 text-success" />
          <h2 className="mt-3 text-xl font-extrabold">Asante sana!</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Order #{orderNumber} has been placed successfully!
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {paidWithWallet
              ? "Paid from your wallet balance. We're preparing your order now."
              : "We'll send an M-Pesa payment request to your phone once the order is confirmed, and message you on WhatsApp as soon as payment goes through."}
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

    if (submitting) return;

    if (!user) {
      toast.error("Please sign in to continue");
      navigate('/auth');
      return;
    }

    if (!location) {
      toast.error("Please share your location to continue");
      return;
    }

    if (payMethod === "wallet" && !walletCovers) {
      toast.error("Wallet balance is too low. Top up or choose M-Pesa.");
      return;
    }

    setSubmitting(true);

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
      notes: `Customer: ${user.name}`,
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

      // --- Pay from wallet balance ---
      if (payMethod === "wallet") {
        const payRes = await fetch('/api/wallet/pay', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: user.id, order_id: result.order_id }),
        });
        const payData = await payRes.json();

        if (!payRes.ok || !payData.success) {
          toast.error(payData.error || "Wallet payment failed. Try M-Pesa instead.");
          setSubmitting(false);
          return;
        }

        await refreshUser();
        toast.success("Paid from wallet!");
        setPaidWithWallet(true);
        await clearCart();
        setDone(true);
        setSubmitting(false);
        return;
      }

      // --- M-Pesa: the order now just lands in Admin → Orders for the
      // admin to confirm and trigger the M-Pesa STK push. Nothing
      // WhatsApp-related touches the customer's device at this point -
      // that only happens once PayHero confirms their payment
      // (see functions/api/_lib/settlePayment.ts). ---
      toast.success("Order placed successfully!");
      await clearCart();
      setDone(true);
      setSubmitting(false);

    } catch (error) {
      console.error('Error placing order:', error);
      toast.error("Failed to place order. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <PageShell title="Checkout" noIndex>
      <div className="min-h-screen pb-4">
        <form onSubmit={submit} className="grid gap-3 lg:gap-6 lg:grid-cols-[1fr_320px] max-w-7xl mx-auto">
          <div className="space-y-3 lg:space-y-4 overflow-hidden">
            {/* Delivery Address */}
            <div className="rounded-lg lg:rounded-xl bg-card p-3 lg:p-4 shadow-card">
              <h2 className="text-sm lg:text-base font-bold mb-2 lg:mb-3">Delivery Address</h2>
              <input 
                value={address} 
                onChange={(e) => setAddress(e.target.value)} 
                required 
                placeholder="Estate / street / building / house no. / nearest landmark"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Provide detailed delivery instructions for the rider
              </p>
            </div>

            {/* Location Section */}
            <div className="overflow-hidden">
              <LocationPicker 
                onLocationCapture={(loc) => {
                  setLocation(loc);
                  setShowMap(true);
                }} 
                initialLocation={location}
              />
            </div>

            {/* Payment Method */}
            <div className="rounded-lg lg:rounded-xl bg-card p-3 lg:p-4 shadow-card">
              <h2 className="text-sm lg:text-base font-bold mb-2 lg:mb-3">Payment Method</h2>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setPayMethod("wallet")}
                  className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition ${payMethod === "wallet" ? "border-accent bg-accent/5 ring-1 ring-accent" : "border-border hover:border-accent/50"}`}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent/10 text-accent">
                    <Wallet className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold">CampusMart Wallet</div>
                    <div className="text-xs text-muted-foreground">
                      Balance: KES {walletBalance.toLocaleString()}
                      {!walletCovers && <span className="text-destructive"> · Too low for this order</span>}
                    </div>
                  </div>
                  <span className={`h-4 w-4 rounded-full border-2 ${payMethod === "wallet" ? "border-accent bg-accent" : "border-muted-foreground"}`} />
                </button>

                <button
                  type="button"
                  onClick={() => setPayMethod("mpesa")}
                  className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition ${payMethod === "mpesa" ? "border-accent bg-accent/5 ring-1 ring-accent" : "border-border hover:border-accent/50"}`}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-950">
                    <Smartphone className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold">M-Pesa</div>
                    <div className="text-xs text-muted-foreground">Pay when the seller confirms your order</div>
                  </div>
                  <span className={`h-4 w-4 rounded-full border-2 ${payMethod === "mpesa" ? "border-accent bg-accent" : "border-muted-foreground"}`} />
                </button>
              </div>
              {payMethod === "wallet" && !walletCovers && (
                <button
                  type="button"
                  onClick={() => navigate("/wallet")}
                  className="mt-2 w-full rounded-lg bg-accent/10 py-2 text-xs font-bold text-accent hover:bg-accent/20"
                >
                  Top up wallet →
                </button>
              )}
            </div>

            {/* Order Confirmation */}
            <div className="rounded-lg lg:rounded-xl bg-card p-3 lg:p-4 shadow-card">
              <h2 className="text-sm lg:text-base font-bold mb-2 lg:mb-3">Confirm Order Details</h2>
              <div className="space-y-1.5 lg:space-y-2 text-xs lg:text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customer:</span>
                  <span className="font-semibold truncate ml-2 max-w-[200px]">{user?.name}</span>
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

          {/* Order Summary Sidebar - Fixed height and scrollable */}
          <aside className="lg:sticky lg:top-20 h-fit max-h-[calc(100vh-6rem)] rounded-lg lg:rounded-xl bg-card p-3 lg:p-4 shadow-elevated overflow-hidden flex flex-col">
            <h2 className="text-sm lg:text-base font-bold mb-2 lg:mb-3">Order Summary</h2>
            
            {/* Scrollable items list */}
            <ul className="flex-1 space-y-1.5 lg:space-y-2 text-xs lg:text-sm max-h-32 lg:max-h-48 overflow-y-auto mb-3">
              {cart.map(({ product, qty }) => (
                <li key={product.id} className="flex justify-between gap-2 py-1">
                  <span className="line-clamp-2 text-xs">{product.title} × {qty}</span>
                  <span className="shrink-0 font-bold text-xs">KES {(product.price * qty).toLocaleString()}</span>
                </li>
              ))}
            </ul>
            
            {/* Pricing breakdown */}
            <div className="space-y-1.5 lg:space-y-2 text-xs lg:text-sm border-t border-border pt-2 lg:pt-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold">KES {cartTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery</span>
                <span className="font-semibold">KES {deliveryFee}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {cartTotal <= 100 && "KES 0-100 → KES 40"}
                {cartTotal > 100 && cartTotal <= 200 && "KES 101-200 → KES 70"}
                {cartTotal > 200 && cartTotal <= 400 && "KES 201-400 → KES 90"}
                {cartTotal > 400 && cartTotal <= 800 && "KES 401-800 → KES 120"}
                {cartTotal > 800 && cartTotal <= 1500 && "KES 801-1500 → KES 150"}
                {cartTotal > 1500 && "KES 1500+ → KES 200"}
              </div>
            </div>
            
            {/* Total and button */}
            <div className="mt-2 lg:mt-3 flex justify-between border-t border-border pt-2 lg:pt-3 text-sm lg:text-base font-bold">
              <span>Total</span>
              <span className="text-accent">KES {orderTotal.toLocaleString()}</span>
            </div>
            
            <button
              type="submit"
              disabled={!location || submitting}
              className="mt-3 lg:mt-4 flex w-full items-center justify-center gap-2 rounded-full gradient-accent py-2 lg:py-2.5 text-xs lg:text-sm font-bold text-accent-foreground shadow-accent hover:scale-[1.02] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {!location
                ? 'Share Location to Continue'
                : payMethod === 'wallet'
                  ? `Pay KES ${orderTotal.toLocaleString()} from Wallet`
                  : 'Place Order'}
            </button>
            
            {!location && (
              <p className="mt-2 text-xs text-center text-muted-foreground">
                Location required for delivery
              </p>
            )}
          </aside>
        </form>
      </div>
    </PageShell>
  );
};

export default CheckoutPage;
