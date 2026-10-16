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
  SALE: "bg-red-600",
  NEW: "bg-accent",
  HOT: "bg-red-600",
  FREE: "bg-primary",
};

export const ProductCard = ({ p, priority = false }: { p: Product; priority?: boolean }) => {
  const { addToCart } = useShop();
  const [photoFailed, setPhotoFailed] = useState(false);
  // A "was" price is only ever a REAL original price; nothing is invented.
  const hasWas = !!p.oldPrice && p.oldPrice > p.price;
  const discount = hasWas ? Math.round(((p.oldPrice! - p.price) / p.oldPrice!) * 100) : 0;

  const rating = p.rating ? (
    <span className="ml-auto flex shrink-0 items-center gap-0.5 text-[10px] font-semibold text-muted-foreground">
      <Star className="h-2.5 w-2.5 fill-warning text-warning" />
      {p.rating.toFixed(1)}
    </span>
  ) : null;

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
        {/* Discount tag on the photo */}
        {discount > 0 && (
          <span className="absolute left-0 top-1.5 rounded-r-md bg-red-600 px-1.5 py-0.5 text-[11px] font-extrabold leading-none text-white shadow">
            -{discount}%
          </span>
        )}
        {p.badge && (
          <span
            className={`absolute right-1.5 top-1.5 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground ${badgeStyles[p.badge]}`}
          >
            {p.badge}
          </span>
        )}
      </div>

      {/* Body: bold name (2 lines at most) with the red + beside it, price pinned
          underneath. No fixed heights - the text sets the size, so nothing is left empty. */}
      <div className="flex flex-1 flex-col justify-between gap-1 px-1.5 pb-1.5 pt-1.5">
        <div className="flex items-start gap-1">
          <h3 className="line-clamp-2 min-w-0 flex-1 overflow-hidden text-[14px] font-bold leading-[1.15] text-foreground sm:text-[16px]">
            {p.title}
          </h3>
          <button
            onClick={(e) => { e.preventDefault(); addToCart(p); }}
            aria-label="Add to cart"
            className="flex h-7 w-7 min-h-0 min-w-0 shrink-0 items-center justify-center rounded-full bg-red-600 text-white shadow-sm transition hover:bg-red-700 active:scale-95 sm:h-8 sm:w-8"
          >
            <Plus className="h-4 w-4 sm:h-[18px] sm:w-[18px]" strokeWidth={3} />
          </button>
        </div>

        {p.shippingNote && (
          <div className="flex items-center gap-1 text-[9px] font-semibold text-accent">
            <Truck className="h-2.5 w-2.5 shrink-0" />
            <span className="truncate">Ships in 2-4 weeks</span>
          </div>
        )}

        <div className="leading-none text-red-600">
          <div className="flex items-baseline gap-1 whitespace-nowrap">
            {hasWas && <span className="text-[10px] font-bold uppercase">Now</span>}
            <span className="text-[10px] font-bold">KES</span>
            <span className="text-[16px] font-extrabold sm:text-[18px]">{p.price.toLocaleString()}</span>
            {!hasWas && rating}
          </div>
          {hasWas && (
            <div className="mt-1 flex items-baseline gap-1 whitespace-nowrap text-[11px] font-semibold">
              <span className="uppercase">Was</span>
              <span className="line-through decoration-2">KES {p.oldPrice!.toLocaleString()}</span>
              {rating}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};
