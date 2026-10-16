import { useState, useEffect, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { PageShell } from "@/components/PageShell";
import { useShop } from "@/store/shop";
import { CheckCircle2, MapPin, Loader2, Wallet, Smartphone } from "lucide-react";
import { LocationPicker } from "@/components/LocationPicker";
import { DELIVERY_COUNTIES, DELIVERY_FEE, DELIVERY_NOTICE, isValidKenyanPhone } from "@/data/deliveryAreas";

const DETAILS_KEY = "campusmart_delivery_details";
const fieldClass = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40";

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
  // Delivery details, collected the way Kilimall's checkout does: who is
  // receiving it, how to reach them, and exactly where it's going.
  const saved = (() => {
    try { return JSON.parse(localStorage.getItem(DETAILS_KEY) || "{}"); } catch { return {}; }
  })();
  const [recipientName, setRecipientName] = useState<string>(saved.recipientName || user?.name || "");
  const [phone, setPhone] = useState<string>(saved.phone || user?.phone || "");
  const [altPhone, setAltPhone] = useState<string>(saved.altPhone || "");
  // A county saved from an earlier order that we no longer deliver to is dropped.
  const [county, setCounty] = useState<string>((DELIVERY_COUNTIES as readonly string[]).includes(saved.county) ? saved.county : "");
  const [town, setTown] = useState<string>(saved.town || "");
  const [address, setAddress] = useState<string>(saved.address || "");
  const [deliveryNote, setDeliveryNote] = useState("");
  const [done, setDone] = useState(false);
  const [paidWithWallet, setPaidWithWallet] = useState(false);
  const [payMethod, setPayMethod] = useState<"wallet" | "mpesa">("mpesa");
  const [submitting, setSubmitting] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [whatsappLink, setWhatsappLink] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [locationError, setLocationError] = useState<string>("");

  const ADMIN_WHATSAPP = "254108254465";

  // Flat delivery fee on every order.
  const getDeliveryFee = (subtotal: number): number => (subtotal > 0 ? DELIVERY_FEE : 0);

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
          {whatsappLink && (
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block rounded-full bg-green-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-green-700"
            >
              Send order details on WhatsApp
            </a>
          )}
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

    if (!isValidKenyanPhone(phone)) {
      toast.error("Enter a valid phone number, e.g. 0712 345 678 - it's the number we'll send the M-Pesa request to");
      return;
    }
    if (altPhone.trim() && !isValidKenyanPhone(altPhone)) {
      toast.error("The alternative phone number isn't valid");
      return;
    }
    if (!county) {
      toast.error(DELIVERY_NOTICE);
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
      order_number: newOrderNumber,
      payment_method: payMethod,
      delivery_address: address,
      recipient_name: recipientName.trim(),
      alt_phone: altPhone.trim() || undefined,
      county,
      town: town.trim(),
      delivery_note: deliveryNote.trim() || undefined,
      delivery_latitude: location.lat,
      delivery_longitude: location.lng,
      buyer_phone: phone.trim(),
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

      // The server messages the admin's WhatsApp itself. If that isn't set
      // up (or the send failed), fall back to opening WhatsApp with the
      // order details ready to send, so the admin always gets them.
      if (result.whatsapp_message) {
        const link = `https://wa.me/${result.admin_phone || ADMIN_WHATSAPP}?text=${encodeURIComponent(result.whatsapp_message)}`;
        if (!result.admin_notified) {
          setWhatsappLink(link);
          window.open(link, '_blank');
        }
      }

      try {
        localStorage.setItem(DETAILS_KEY, JSON.stringify({
          recipientName: recipientName.trim(), phone: phone.trim(), altPhone: altPhone.trim(),
          county, town: town.trim(), address: address.trim(),
        }));
      } catch { /* storage unavailable - not essential */ }

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
            {/* Delivery details */}
            <div className="rounded-lg lg:rounded-xl bg-card p-3 lg:p-4 shadow-card">
              <h2 className="text-sm lg:text-base font-bold mb-1">Delivery Details</h2>
              <p className="mb-2 lg:mb-3 rounded-lg bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent">{DELIVERY_NOTICE}</p>
              <div className="grid gap-2.5 sm:grid-cols-2">
                <label className="text-xs font-semibold text-muted-foreground sm:col-span-2">
                  Full name of person receiving the order
                  <input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} required
                    autoComplete="name" placeholder="e.g. Jane Wanjiku" className={`mt-1 ${fieldClass}`} />
                </label>
                <label className="text-xs font-semibold text-muted-foreground">
                  Phone number (M-Pesa request goes here)
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} required type="tel"
                    inputMode="tel" autoComplete="tel" placeholder="07XX XXX XXX" className={`mt-1 ${fieldClass}`} />
                </label>
                <label className="text-xs font-semibold text-muted-foreground">
                  Alternative phone (optional)
                  <input value={altPhone} onChange={(e) => setAltPhone(e.target.value)} type="tel"
                    inputMode="tel" placeholder="07XX XXX XXX" className={`mt-1 ${fieldClass}`} />
                </label>
                <label className="text-xs font-semibold text-muted-foreground">
                  County
                  <select value={county} onChange={(e) => setCounty(e.target.value)} required className={`mt-1 ${fieldClass}`}>
                    <option value="">Select county</option>
                    {DELIVERY_COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>
                <label className="text-xs font-semibold text-muted-foreground">
                  Town / area
                  <input value={town} onChange={(e) => setTown(e.target.value)} required
                    placeholder="e.g. Westlands, Nyali, Milimani" className={`mt-1 ${fieldClass}`} />
                </label>
                <label className="text-xs font-semibold text-muted-foreground sm:col-span-2">
                  Street / estate / building / house no. / nearest landmark
                  <input value={address} onChange={(e) => setAddress(e.target.value)} required
                    placeholder="Estate / street / building / house no. / nearest landmark" className={`mt-1 ${fieldClass}`} />
                </label>
                <label className="text-xs font-semibold text-muted-foreground sm:col-span-2">
                  Delivery note for the rider (optional)
                  <input value={deliveryNote} onChange={(e) => setDeliveryNote(e.target.value)}
                    placeholder="e.g. Call when you arrive, gate is blue" className={`mt-1 ${fieldClass}`} />
                </label>
              </div>
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
                  <span className="text-muted-foreground">Deliver to:</span>
                  <span className="font-semibold truncate ml-2 max-w-[200px]">{recipientName || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="font-semibold">{phone || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Area:</span>
                  <span className="font-semibold truncate ml-2 max-w-[200px]">{[town, county].filter(Boolean).join(', ') || '—'}</span>
                </div>
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
              <div className="text-xs text-muted-foreground">Flat delivery fee on every order</div>
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
