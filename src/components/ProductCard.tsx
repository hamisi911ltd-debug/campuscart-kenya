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
  location?: { lat: number; lng: number };
}

const badgeStyles: Record<string, string> = {
  SALE: "bg-destructive",
  NEW: "bg-destructive",
  HOT: "bg-destructive",
  FREE: "bg-destructive",
};

export const ProductCard = ({ p }: { p: Product }) => {
  const { toggleFavorite, isFavorite, addToCart } = useShop();
  const liked = isFavorite(p.id);
  const discount = p.oldPrice && p.oldPrice > p.price 
    ? Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100) 
    : 0;
  return (
    <Link
      to={`/product/${p.id}`}
      className="group flex w-full flex-col overflow-hidden rounded-md bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative aspect-[5/4] overflow-hidden bg-muted">
        <img
          src={p.image}
          alt={p.title}
          loading="lazy"
          width={400}
          height={320}
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
        <button
          onClick={(e) => { e.preventDefault(); toggleFavorite(p.id); }}
          aria-label="favorite"
          className="absolute bottom-1.5 right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-background/90 backdrop-blur transition hover:scale-110"
        >
          <Heart className={`h-3 w-3 transition ${liked ? "fill-accent text-accent" : "text-muted-foreground"}`} />
        </button>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-1.5">
        <h3 className="line-clamp-2 text-[13px] font-semibold text-foreground leading-tight">{p.title}</h3>
        <div className="flex items-center gap-1">
          <span className="text-[14px] font-extrabold text-primary">KES {p.price.toLocaleString()}</span>
          {p.oldPrice && (
            <span className="text-[10px] text-red-500 line-through font-medium">KES {p.oldPrice.toLocaleString()}</span>
          )}
        </div>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Star className="h-3 w-3 fill-warning text-warning" />
          {Math.round(p.rating ?? 4.7)}
          {p.sold !== undefined && <span className="ml-0.5">· {p.sold}</span>}
        </div>
        <button
          onClick={(e) => { e.preventDefault(); addToCart(p); }}
          className="mt-1 flex items-center justify-center gap-1 rounded-full bg-primary px-2 py-1.5 text-[10px] font-bold text-primary-foreground hover:bg-primary-glow transition"
        >
          <ShoppingCart className="h-3 w-3" /> Add
        </button>
      </div>
    </Link>
  );
};
