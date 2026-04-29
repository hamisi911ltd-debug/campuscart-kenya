import { Link, useNavigate } from "react-router-dom";
import { PageShell } from "@/components/PageShell";
import { useShop } from "@/store/shop";
import { SignInModal } from "@/components/SignInModal";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useState } from "react";

const CartPage = () => {
  const { cart, setQty, removeFromCart, cartTotal, clearCart, user } = useShop();
  const navigate = useNavigate();
  const [showSignInModal, setShowSignInModal] = useState(false);

  const handleCheckout = () => {
    if (!user) {
      setShowSignInModal(true);
    } else {
      navigate("/checkout");
    }
  };

  if (cart.length === 0) {
    return (
      <PageShell title="Your Cart">
        <div className="rounded-2xl bg-card p-10 text-center shadow-card">
          <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">Your cart is empty.</p>
          <Link to="/" className="mt-4 inline-block rounded-full gradient-accent px-5 py-2 text-sm font-bold text-accent-foreground shadow-accent">
            Start shopping
          </Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Your Cart">
      {/* Sign In Modal */}
      <SignInModal 
        isOpen={showSignInModal} 
        onClose={() => setShowSignInModal(false)}
        message="Sign in to proceed with checkout and place your order."
      />
      
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <ul className="space-y-3">
          {cart.map(({ product, qty }) => (
            <li key={product.id} className="flex gap-3 rounded-xl bg-card p-3 shadow-card">
              <Link to={`/product/${product.id}`} className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-muted">
                <img src={product.image} alt={product.title} className="h-full w-full object-cover" />
              </Link>
              <div className="flex flex-1 flex-col">
                <Link to={`/product/${product.id}`} className="line-clamp-2 text-sm font-semibold text-foreground hover:text-accent">
                  {product.title}
                </Link>
                <span className="text-xs text-muted-foreground">{product.campus}</span>
                <div className="mt-auto flex items-center justify-between">
                  <span className="text-base font-extrabold text-accent">KES {(product.price * qty).toLocaleString()}</span>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center overflow-hidden rounded-full border border-border">
                      <button onClick={() => setQty(product.id, qty - 1)} className="px-2 py-1 hover:bg-muted"><Minus className="h-3 w-3" /></button>
                      <span className="px-3 text-sm font-bold">{qty}</span>
                      <button onClick={() => setQty(product.id, qty + 1)} className="px-2 py-1 hover:bg-muted"><Plus className="h-3 w-3" /></button>
                    </div>
                    <button onClick={() => removeFromCart(product.id)} aria-label="Remove" className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-accent">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="h-fit rounded-2xl bg-card p-5 shadow-elevated">
          <h2 className="text-lg font-extrabold">Order Summary</h2>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span className="font-bold">KES {cartTotal.toLocaleString()}</span></div>
            <div className="flex justify-between text-muted-foreground"><span>Delivery</span><span>KES 100</span></div>
            <div className="mt-2 flex justify-between border-t border-border pt-2 text-base font-extrabold"><span>Total</span><span className="text-accent">KES {(cartTotal + 100).toLocaleString()}</span></div>
          </div>
          <button onClick={handleCheckout} className="mt-4 w-full rounded-full gradient-accent py-3 text-sm font-bold text-accent-foreground shadow-accent hover:scale-[1.02] transition">
            Checkout
          </button>
          <button onClick={clearCart} className="mt-2 w-full rounded-full bg-muted py-2 text-xs font-medium text-muted-foreground hover:bg-secondary">
            Clear cart
          </button>
        </aside>
      </div>
    </PageShell>
  );
};

export default CartPage;
