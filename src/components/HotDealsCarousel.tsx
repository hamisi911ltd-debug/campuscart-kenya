import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Flame } from "lucide-react";
import type { ProductWithCategory } from "@/data/products";

const TICK_MS = 2200;
const WINDOW_SIZE = 3;

// Auto-advancing "Hot Deals" grid, styled like an ad placement rather than
// a normal product listing: just the photo with the price stamped on top
// as an offer tag - no title, rating or add-to-cart button. Every couple
// of seconds the 3-tile window shifts by one, the oldest drops off and a
// new one slides in, looping through the full list continuously. Pauses
// while the pointer is over it so it doesn't shift mid-tap.
export const HotDealsCarousel = ({ products }: { products: ProductWithCategory[] }) => {
  const [startIndex, setStartIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || products.length <= WINDOW_SIZE) return;
    const id = setInterval(() => {
      setStartIndex((i) => (i + 1) % products.length);
    }, TICK_MS);
    return () => clearInterval(id);
  }, [paused, products.length]);

  if (products.length === 0) return null;

  const windowSize = Math.min(WINDOW_SIZE, products.length);
  const visible = Array.from({ length: windowSize }, (_, i) => products[(startIndex + i) % products.length]);

  return (
    <section className="-mx-4 mb-4 md:mx-0">
      <div className="mb-2 flex items-center gap-2 px-4 md:px-0">
        <div className="flex shrink-0 items-center gap-1 rounded-md bg-gradient-to-r from-red-600 to-orange-500 px-2 py-1">
          <Flame className="h-3.5 w-3.5 fill-white text-white" />
          <span className="whitespace-nowrap text-xs font-extrabold text-white">Hot Deals</span>
        </div>
        <span className="text-[11px] text-muted-foreground">New picks every few seconds</span>
      </div>
      <div
        className="grid grid-cols-3 gap-0.5 md:gap-1 md:rounded-xl md:overflow-hidden"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {visible.map((p) => {
          const discount = p.oldPrice && p.oldPrice > p.price
            ? Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100)
            : 0;
          return (
            <Link
              key={`${p.id}-${startIndex}`}
              to={`/product/${p.id}`}
              className="group relative aspect-square overflow-hidden bg-muted animate-in fade-in duration-500"
            >
              <img
                src={p.image}
                alt={p.title}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
              />
              {/* Price stamped on top of the image, ad-style - no title/rating/cart */}
              <div className="absolute inset-x-0 top-0 flex flex-col items-center bg-gradient-to-b from-black/70 to-transparent px-1 pb-3 pt-1.5">
                {discount > 0 && (
                  <span className="mb-0.5 rounded bg-red-600 px-1 py-0.5 text-[9px] font-extrabold leading-none text-white">
                    -{discount}%
                  </span>
                )}
                <span className="text-[13px] font-extrabold leading-none text-white drop-shadow sm:text-sm">
                  KES {p.price.toLocaleString()}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
};
