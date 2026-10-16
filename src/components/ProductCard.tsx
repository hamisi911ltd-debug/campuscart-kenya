import { Star, Plus, Truck } from "lucide-react";
import { Link } from "react-router-dom";
import { useShop } from "@/store/shop";
import { useState } from "react";
import { LazyImage } from "@/components/LazyImage";

export interface Product {
  id: string;
  title: string;
  price: number;
  oldPrice?: number;
  image: string;
  /** All photos; the card falls back to the next one if the first fails to load. */
  images?: string[];
  campus: string;
  badge?: "SALE" | "NEW" | "HOT" | "FREE";
  rating?: number;
  sold?: number;
  location?: { lat: number; lng: number };
  /** Set when sourced on order from a dropship supplier — different delivery
   * timeline than stock already in hand, so it's called out distinctly
   * rather than presented the same as a same-day-available item. */
  shippingNote?: string;
}

const badgeStyles: Record<string, string> = {
  SALE: "bg-destructive",
  NEW: "bg-accent",
  HOT: "bg-destructive",
  FREE: "bg-primary",
};

export const ProductCard = ({ p, priority = false }: { p: Product; priority?: boolean }) => {
  const { addToCart } = useShop();
  const [photoFailed, setPhotoFailed] = useState(false);
  const discount = p.oldPrice && p.oldPrice > p.price
    ? Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100)
    : 0;

  // If every photo of a product fails to load, hide the card rather than
  // showing a broken-image icon.
  if (photoFailed) return null;

  return (
    <Link
      to={`/product/${p.id}`}
      className="group flex h-full w-full flex-col overflow-hidden rounded-lg bg-card shadow-sm transition-all hover:shadow-md"
    >
      <div className="relative overflow-hidden bg-muted">
        <LazyImage
          srcs={[p.image, ...(p.images || [])]}
          alt={p.title}
          ratio="aspect-square"
          width={400}
          sizes="(max-width: 640px) 34vw, (max-width: 1024px) 25vw, 200px"
          priority={priority}
          onAllFailed={() => setPhotoFailed(true)}
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

      <div className="flex flex-1 flex-col p-1.5">
        {/* Fixed one-line title keeps every card's white area the same (short) height */}
        <h3 className="line-clamp-1 h-[15px] text-[11px] font-medium text-foreground leading-[15px]">{p.title}</h3>

        {p.shippingNote && (
          <div className="mt-0.5 flex items-center gap-1 text-[9px] font-semibold text-accent">
            <Truck className="h-2.5 w-2.5 shrink-0" />
            <span className="truncate">Ships in 2-4 weeks</span>
          </div>
        )}

        {/* Price row — single line so every card's white area matches */}
        <div className="mt-1 flex items-end gap-1 overflow-hidden whitespace-nowrap">
          <span className="shrink-0 text-[10px] font-bold text-primary leading-none">KES</span>
          <span className="shrink-0 text-[14px] font-extrabold text-primary leading-none">{p.price.toLocaleString()}</span>
          {p.oldPrice && p.oldPrice > p.price && (
            <span className="mb-0.5 truncate text-[9px] text-muted-foreground line-through">{p.oldPrice.toLocaleString()}</span>
          )}
        </div>

        {/* Rating (only once there is one) + add */}
        <div className="mt-1 flex items-center justify-between gap-1">
          <div className="flex min-w-0 items-center gap-1 overflow-hidden whitespace-nowrap text-[9px] text-muted-foreground">
            {p.rating ? (
              <>
                <Star className="h-2.5 w-2.5 shrink-0 fill-warning text-warning" />
                <span className="shrink-0">{p.rating.toFixed(1)}</span>
              </>
            ) : null}
          </div>
          <button
            onClick={(e) => { e.preventDefault(); addToCart(p); }}
            aria-label="Add to cart"
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary-glow transition"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      </div>
    </Link>
  );
};
