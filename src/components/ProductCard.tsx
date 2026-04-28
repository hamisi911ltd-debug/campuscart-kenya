import { Heart, MapPin, Star, ShoppingCart } from "lucide-react";
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
}

const badgeStyles: Record<string, string> = {
  SALE: "gradient-accent",
  NEW: "bg-success",
  HOT: "gradient-flash",
  FREE: "bg-warning text-warning-foreground",
};

export const ProductCard = ({ p }: { p: Product }) => {
  const { toggleFavorite, isFavorite, addToCart } = useShop();
  const liked = isFavorite(p.id);
  const discount = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
  return (
    <Link
      to={`/product/${p.id}`}
      className="group flex w-full flex-col overflow-hidden rounded-xl bg-card shadow-card transition-all hover:-translate-y-0.5 hover:shadow-elevated"
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={p.image}
          alt={p.title}
          loading="lazy"
          width={512}
          height={512}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {p.badge && (
          <span
            className={`absolute left-2 top-2 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground ${badgeStyles[p.badge]}`}
          >
            {p.badge}
          </span>
        )}
        {discount > 0 && (
          <span className="absolute right-2 top-2 rounded-md bg-accent px-1.5 py-0.5 text-[10px] font-bold text-accent-foreground">
            -{discount}%
          </span>
        )}
        <button
          onClick={(e) => { e.preventDefault(); toggleFavorite(p.id); }}
          aria-label="favorite"
          className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-background/90 backdrop-blur transition hover:scale-110"
        >
          <Heart className={`h-4 w-4 transition ${liked ? "fill-accent text-accent" : "text-muted-foreground"}`} />
        </button>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <h3 className="line-clamp-2 text-sm font-medium text-foreground">{p.title}</h3>
        <div className="flex items-baseline gap-1.5">
          <span className="text-base font-extrabold text-accent">KES {p.price.toLocaleString()}</span>
          {p.oldPrice && (
            <span className="text-xs text-muted-foreground line-through">{p.oldPrice.toLocaleString()}</span>
          )}
        </div>
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="flex items-center gap-0.5">
            <Star className="h-3 w-3 fill-warning text-warning" />
            {p.rating ?? 4.7}
            {p.sold !== undefined && <span className="ml-1">· {p.sold} sold</span>}
          </span>
          <span className="flex items-center gap-0.5 truncate">
            <MapPin className="h-3 w-3" />
            {p.campus}
          </span>
        </div>
        <button
          onClick={(e) => { e.preventDefault(); addToCart(p); }}
          className="mt-1 flex items-center justify-center gap-1 rounded-full gradient-accent px-3 py-1.5 text-[11px] font-bold text-accent-foreground shadow-accent hover:scale-[1.02] transition"
        >
          <ShoppingCart className="h-3 w-3" /> Add to cart
        </button>
      </div>
    </Link>
  );
};
