import { useNavigate, useParams, Link } from "react-router-dom";
import { PageShell } from "@/components/PageShell";
import { findProduct, products } from "@/data/products";
import { ProductCard } from "@/components/ProductCard";
import { useShop } from "@/store/shop";
import { Heart, MapPin, ShieldCheck, Star, Truck, Wallet, Zap } from "lucide-react";
import { useState } from "react";

const ProductPage = () => {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const p = findProduct(id);
  const { addToCart, toggleFavorite, isFavorite } = useShop();
  const [qty, setQty] = useState(1);

  if (!p) {
    return (
      <PageShell title="Product not found">
        <Link to="/" className="text-accent font-bold">Go home</Link>
      </PageShell>
    );
  }

  const liked = isFavorite(p.id);
  const discount = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
  const related = products.filter((x) => x.category === p.category && x.id !== p.id).slice(0, 4);

  return (
    <PageShell title="">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="overflow-hidden rounded-2xl bg-card shadow-card">
          <img src={p.image} alt={p.title} className="aspect-square w-full object-cover" />
        </div>
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-foreground">{p.title}</h1>
            <div className="mt-2 flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Star className="h-4 w-4 fill-warning text-warning" /> {p.rating ?? 4.7}</span>
              <span>· {p.sold ?? 0} sold</span>
              <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {p.campus}</span>
            </div>
          </div>
          <div className="rounded-2xl gradient-flash p-4 text-primary-foreground">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-extrabold">KES {p.price.toLocaleString()}</span>
              {p.oldPrice && <span className="text-sm line-through opacity-80">{p.oldPrice.toLocaleString()}</span>}
              {discount > 0 && <span className="rounded-full bg-background/25 px-2 py-0.5 text-xs font-bold">-{discount}%</span>}
            </div>
            <p className="mt-1 flex items-center gap-1 text-xs opacity-90"><Zap className="h-3 w-3" /> Student flash price · ends tonight</p>
          </div>
          {p.description && <p className="text-sm text-foreground/90">{p.description}</p>}

          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold">Qty</span>
            <div className="flex items-center overflow-hidden rounded-full border border-border">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3 py-1 hover:bg-muted">−</button>
              <span className="px-4 text-sm font-bold">{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} className="px-3 py-1 hover:bg-muted">+</button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => addToCart(p, qty)}
              className="flex-1 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:bg-primary-glow"
            >
              Add to cart
            </button>
            <button
              onClick={() => { addToCart(p, qty); navigate("/checkout"); }}
              className="flex-1 rounded-full gradient-accent px-6 py-3 text-sm font-bold text-accent-foreground shadow-accent"
            >
              Buy now
            </button>
            <button
              onClick={() => toggleFavorite(p.id)}
              aria-label="favorite"
              className="flex h-12 w-12 items-center justify-center rounded-full bg-muted hover:bg-secondary"
            >
              <Heart className={`h-5 w-5 ${liked ? "fill-accent text-accent" : "text-muted-foreground"}`} />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 text-xs">
            {[
              { i: Truck, t: "Boda delivery 1hr" },
              { i: Wallet, t: "Pay with M-PESA" },
              { i: ShieldCheck, t: "Buyer protection" },
            ].map((x) => (
              <div key={x.t} className="flex flex-col items-center gap-1 rounded-xl bg-card p-3 shadow-card">
                <x.i className="h-4 w-4 text-accent" />
                <span className="text-center font-medium text-foreground">{x.t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 text-lg font-extrabold">You might also like</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {related.map((r) => <ProductCard key={r.id} p={r} />)}
          </div>
        </section>
      )}
    </PageShell>
  );
};

export default ProductPage;
