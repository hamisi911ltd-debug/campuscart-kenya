import { Star, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { useShop } from "@/store/shop";

export interface Product {
  id: string;
  title: string;
  price: number;
  oldPrice?: number;
  image: string;
  campus: string;
  badge?: "SALE" | "NEW" | "HOT" | "FREE";
  rating?: number;
  sold?: number;
  location?: { lat: number; lng: number };
}

const badgeStyles: Record<string, string> = {
  SALE: "bg-destructive",
  NEW: "bg-accent",
  HOT: "bg-destructive",
  FREE: "bg-primary",
};

export const ProductCard = ({ p }: { p: Product }) => {
  const { addToCart } = useShop();
  const discount = p.oldPrice && p.oldPrice > p.price
    ? Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100)
    : 0;

  return (
    <Link
      to={`/product/${p.id}`}
      className="group flex w-full flex-col overflow-hidden rounded-lg bg-card shadow-sm transition-all hover:shadow-md"
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={p.image}
          alt={p.title}
          loading="lazy"
          width={400}
          height={400}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/placeholder.svg';
          }}
        />
        {p.badge && (
          <span
            className={`absolute left-1.5 top-1.5 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground ${badgeStyles[p.badge]}`}
          >
            {p.badge}
          </span>
        )}
        {discount > 0 && (
          <span className="absolute right-1.5 top-1.5 rounded bg-destructive px-1.5 py-0.5 text-[10px] font-bold text-destructive-foreground">
            -{discount}%
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-2">
        <h3 className="line-clamp-2 text-[13px] font-medium text-foreground leading-snug">{p.title}</h3>

        {/* Price row */}
        <div className="mt-0.5 flex items-end gap-1">
          <span className="text-[11px] font-bold text-primary leading-none">KES</span>
          <span className="text-[17px] font-extrabold text-primary leading-none">{p.price.toLocaleString()}</span>
          {p.oldPrice && p.oldPrice > p.price && (
            <span className="mb-0.5 text-[10px] text-muted-foreground line-through">KES {p.oldPrice.toLocaleString()}</span>
          )}
        </div>

        {/* Rating + sold + add */}
        <div className="mt-0.5 flex items-center justify-between">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Star className="h-3 w-3 fill-warning text-warning" />
            <span>{(p.rating ?? 4.7).toFixed(1)}</span>
            {p.sold !== undefined && <span>· {p.sold >= 1000 ? `${(p.sold / 1000).toFixed(1)}k` : p.sold} sold</span>}
          </div>
          <button
            onClick={(e) => { e.preventDefault(); addToCart(p); }}
            aria-label="Add to cart"
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary-glow transition"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </Link>
  );
};
