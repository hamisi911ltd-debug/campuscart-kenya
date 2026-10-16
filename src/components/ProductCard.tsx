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
      className="group flex w-full flex-col self-start overflow-hidden rounded-lg bg-card shadow-sm transition-all hover:shadow-md"
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

      {/* Compact body: name with the + button right beside it, then the price.
          No fixed heights or spare rows, so there's no empty space under the card. */}
      <div className="flex flex-col gap-0.5 px-1.5 pb-1.5 pt-1">
        <div className="flex items-center gap-1">
          <h3 className="min-w-0 flex-1 truncate text-[11px] font-medium leading-4 text-foreground">{p.title}</h3>
          <button
            onClick={(e) => { e.preventDefault(); addToCart(p); }}
            aria-label="Add to cart"
            className="flex h-5 w-5 min-h-0 min-w-0 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition hover:bg-primary-glow"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>

        {p.shippingNote && (
          <div className="flex items-center gap-1 text-[9px] font-semibold text-accent">
            <Truck className="h-2.5 w-2.5 shrink-0" />
            <span className="truncate">Ships in 2-4 weeks</span>
          </div>
        )}

        <div className="flex items-end gap-1 overflow-hidden whitespace-nowrap">
          <span className="shrink-0 text-[9px] font-bold leading-none text-primary">KES</span>
          <span className="shrink-0 text-[13px] font-extrabold leading-none text-primary">{p.price.toLocaleString()}</span>
          {p.oldPrice && p.oldPrice > p.price && (
            <span className="mb-px truncate text-[9px] leading-none text-muted-foreground line-through">{p.oldPrice.toLocaleString()}</span>
          )}
          {p.rating ? (
            <span className="ml-auto flex shrink-0 items-center gap-0.5 text-[9px] leading-none text-muted-foreground">
              <Star className="h-2.5 w-2.5 fill-warning text-warning" />
              {p.rating.toFixed(1)}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
};
