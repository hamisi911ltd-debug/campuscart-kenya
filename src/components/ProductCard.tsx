import { Star, Truck } from "lucide-react";
import { Link } from "react-router-dom";
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

// Laid out like a marketplace listing (AliExpress-style): photo with a discount tag
// in its corner, a two-line name in normal weight, then the price in red with the
// crossed-out original price right beside it. Tap anywhere to open the product.
export const ProductCard = ({ p, priority = false }: { p: Product; priority?: boolean }) => {
  const [photoFailed, setPhotoFailed] = useState(false);
  // A crossed-out price is only ever a REAL original price; nothing is invented.
  const hasWas = !!p.oldPrice && p.oldPrice > p.price;
  const discount = hasWas ? Math.round(((p.oldPrice! - p.price) / p.oldPrice!) * 100) : 0;

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
        {/* Discount tag, top right of the photo */}
        {discount > 0 && (
          <span className="absolute right-1 top-1 rounded bg-red-600 px-1.5 py-0.5 text-[11px] font-bold leading-none text-white shadow">
            -{discount}%
          </span>
        )}
        {p.badge && (
          <span
            className={`absolute left-1 top-1 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground ${badgeStyles[p.badge]}`}
          >
            {p.badge}
          </span>
        )}
      </div>

      {/* Body sized by its text: no fixed heights, nothing left empty */}
      <div className="flex flex-1 flex-col gap-1 px-1.5 pb-2 pt-1.5">
        <h3 className="line-clamp-2 overflow-hidden text-[12px] font-medium leading-[1.25] text-foreground/90 sm:text-[13px]">
          {p.title}
        </h3>

        {p.shippingNote && (
          <div className="flex items-center gap-1 text-[9px] font-semibold text-accent">
            <Truck className="h-2.5 w-2.5 shrink-0" />
            <span className="truncate">Ships in 2-4 weeks</span>
          </div>
        )}

        <div className="mt-auto flex flex-wrap items-baseline gap-x-1.5 gap-y-0">
          <span className="whitespace-nowrap text-[15px] font-semibold leading-tight text-red-600 sm:text-[16px]">
            <span className="mr-0.5 text-[10px] font-medium">KES</span>
            {p.price.toLocaleString()}
          </span>
          {hasWas && (
            <span className="whitespace-nowrap text-[11px] leading-tight text-muted-foreground line-through">
              {p.oldPrice!.toLocaleString()}
            </span>
          )}
        </div>

        {p.rating ? (
          <div className="flex items-center gap-0.5 text-[10px] leading-none text-muted-foreground">
            <Star className="h-2.5 w-2.5 fill-warning text-warning" />
            {p.rating.toFixed(1)}
          </div>
        ) : null}
      </div>
    </Link>
  );
};
