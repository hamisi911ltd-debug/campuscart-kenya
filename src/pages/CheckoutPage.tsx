import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { PageShell } from "@/components/PageShell";
import { useShop } from "@/store/shop";

interface CartItem {
  product_id: string;
  title: string;
  price: number;
  quantity: number;
  image_url: string;
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { user, cart } = useShop();
  const [items, setItems] = useState<CartItem[]>([]);
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load cart items from store
    if (cart && cart.length > 0) {
      const cartItems = cart.map(item => ({
        product_id: item.id,
        title: item.title,
        price: item.price,
        quantity: item.qty || 1,
        image_url: item.image || "/placeholder.svg"
      }));
      setItems(cartItems);
    }
  }, [cart]);

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Delivery fee calculation
  const getDeliveryFee = (total: number): number => {
    if (total <= 100) return 40;
    if (total <= 200) return 70;
    if (total <= 400) return 90;
    return 100;
  };

  const deliveryFee = getDeliveryFee(subtotal);
  const totalAmount = subtotal + deliveryFee;

  const handleCheckout = async () => {
    if (!user || !user.id) {
      toast.error("Please sign in to checkout");
      navigate("/auth");
      return;
    }

    if (!address || !phone) {
      toast.error("Please fill in delivery address and phone number");
      return;
    }

    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buyer_id: user.id,
          items: items.map(item => ({
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price,
          })),
          delivery_address: address,
          buyer_phone: phone,
          notes,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Open WhatsApp with the order details sent to admin
        window.open(result.admin_whatsapp, "_blank");

        toast.success("Order placed successfully!", {
          description: `Order ID: ${result.order_id}`
        });

        // Navigate to home after a short delay
        setTimeout(() => {
          navigate("/");
        }, 2000);
      } else {
        toast.error(result.error || "Checkout failed");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Checkout failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <PageShell title="Checkout">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground mb-4">Your cart is empty</p>
          <button
            onClick={() => navigate("/")}
            className="rounded-full bg-primary px-6 py-2 text-sm font-bold text-primary-foreground hover:bg-primary-glow transition"
          >
            Continue Shopping
          </button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Checkout">
      <div className="checkout-page">
        {/* Order Summary */}
        <div className="order-summary">
          <h2 className="text-lg font-bold mb-4">Order Summary</h2>
          {items.map(item => (
            <div key={item.product_id} className="checkout-item">
              <img src={item.image_url} alt={item.title} />
              <div className="flex-1">
                <p className="item-title">{item.title}</p>
                <p className="text-sm text-muted-foreground">KES {item.price.toLocaleString()} x {item.quantity}</p>
                <p className="item-total">KES {(item.price * item.quantity).toLocaleString()}</p>
              </div>
            </div>
          ))}

          <div className="price-breakdown">
            <div className="price-row">
              <span>Subtotal</span>
              <span>KES {subtotal.toLocaleString()}</span>
            </div>
            <div className="price-row">
              <span>🚚 Delivery Fee</span>
              <span>KES {deliveryFee}</span>
            </div>
            <div className="price-row total">
              <span>Total</span>
              <span>KES {totalAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Delivery Info */}
        <div className="delivery-form">
          <h2 className="text-lg font-bold mb-4">Delivery Details</h2>

          <label>Phone Number</label>
          <input
            type="tel"
            placeholder="e.g. 0759159881"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <label>Delivery Address</label>
          <textarea
            placeholder="e.g. Room 204, Hostel A, Campus"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            rows={3}
          />

          <label>Notes (optional)</label>
          <textarea
            placeholder="Any special instructions..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
          />

          <button onClick={handleCheckout} disabled={loading}>
            {loading ? "Processing..." : `Place Order — KES ${totalAmount.toLocaleString()}`}
          </button>
        </div>

        {/* Delivery fee info */}
        <div className="delivery-info">
          <h3 className="font-bold mb-2">🚚 Delivery Rates</h3>
          <p>KES 0–100 → KES 40</p>
          <p>KES 101–200 → KES 70</p>
          <p>KES 201–400 → KES 90</p>
          <p>KES 400+ → KES 100</p>
        </div>
      </div>

      <style>{`
        .checkout-page {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }

        .checkout-item {
          display: flex;
          gap: 12px;
          padding: 12px 0;
          border-bottom: 1px solid hsl(var(--border));
        }

        .checkout-item img {
          width: 60px;
          height: 60px;
          object-fit: cover;
          border-radius: 8px;
        }

        .item-title {
          font-weight: 600;
        }

        .item-total {
          font-weight: bold;
          color: hsl(var(--foreground));
        }

        .price-breakdown {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 2px solid hsl(var(--border));
        }

        .price-row {
          display: flex;
          justify-content: space-between;
          padding: 6px 0;
          color: hsl(var(--muted-foreground));
        }

        .price-row.total {
          font-size: 18px;
          font-weight: bold;
          color: hsl(var(--foreground));
          border-top: 2px solid hsl(var(--foreground));
          margin-top: 8px;
          padding-top: 12px;
        }

        .delivery-form {
          margin-top: 24px;
          background: hsl(var(--card));
          padding: 20px;
          border-radius: 12px;
        }

        .delivery-form label {
          display: block;
          margin-top: 16px;
          font-weight: 600;
          margin-bottom: 4px;
          font-size: 14px;
        }

        .delivery-form input,
        .delivery-form textarea {
          width: 100%;
          padding: 10px;
          border: 1px solid hsl(var(--border));
          border-radius: 8px;
          font-size: 16px;
          background: hsl(var(--background));
          color: hsl(var(--foreground));
        }

        .delivery-form button {
          width: 100%;
          margin-top: 20px;
          padding: 14px;
          background: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
          border: none;
          border-radius: 10px;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.2s;
        }

        .delivery-form button:hover:not(:disabled) {
          opacity: 0.9;
        }

        .delivery-form button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .delivery-info {
          margin-top: 24px;
          padding: 16px;
          background: hsl(var(--accent) / 0.1);
          border-radius: 10px;
          font-size: 14px;
        }

        .delivery-info p {
          margin: 4px 0;
        }

        .order-summary {
          background: hsl(var(--card));
          padding: 20px;
          border-radius: 12px;
        }
      `}</style>
    </PageShell>
  );
}
