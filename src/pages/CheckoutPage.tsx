import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { PageShell } from "@/components/PageShell";
import { useShop } from "@/store/shop";
import { CheckCircle2 } from "lucide-react";

const CheckoutPage = () => {
  const { cart, cartTotal, clearCart } = useShop();
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [done, setDone] = useState(false);

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
          <p className="mt-1 text-sm text-muted-foreground">M-PESA prompt sent to {phone}. Your boda will arrive within 1 hour.</p>
          <button onClick={() => navigate("/")} className="mt-5 rounded-full gradient-accent px-6 py-2.5 text-sm font-bold text-accent-foreground shadow-accent">
            Continue shopping
          </button>
        </div>
      </PageShell>
    );
  }

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!/^(\+?254|0)7\d{8}$/.test(phone.replace(/\s/g, ""))) {
      toast.error("Enter a valid Safaricom number e.g. 07XXXXXXXX");
      return;
    }
    toast.success("STK Push sent to your phone");
    setTimeout(() => { clearCart(); setDone(true); }, 800);
  };

  return (
    <PageShell title="Checkout">
      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4 rounded-2xl bg-card p-5 shadow-card">
          <h2 className="text-lg font-extrabold">Delivery details</h2>
          <input value={address} onChange={(e) => setAddress(e.target.value)} required placeholder="Hostel block / room number / nearest landmark" className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40" />
          <h2 className="pt-3 text-lg font-extrabold">M-PESA payment</h2>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="07XX XXX XXX" className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40" />
          <p className="text-xs text-muted-foreground">You'll receive an STK push to confirm payment.</p>
        </div>
        <aside className="h-fit rounded-2xl bg-card p-5 shadow-elevated">
          <h2 className="text-lg font-extrabold">Summary</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {cart.map(({ product, qty }) => (
              <li key={product.id} className="flex justify-between gap-2">
                <span className="line-clamp-1">{product.title} × {qty}</span>
                <span className="shrink-0 font-bold">KES {(product.price * qty).toLocaleString()}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-between border-t border-border pt-3 text-base font-extrabold">
            <span>Total</span>
            <span className="text-accent">KES {(cartTotal + 100).toLocaleString()}</span>
          </div>
          <button className="mt-4 w-full rounded-full gradient-accent py-3 text-sm font-bold text-accent-foreground shadow-accent hover:scale-[1.02] transition">
            Pay with M-PESA
          </button>
        </aside>
      </form>
    </PageShell>
  );
};

export default CheckoutPage;
