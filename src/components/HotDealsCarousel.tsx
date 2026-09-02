import { useEffect, useState } from "react";
import { Flame } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import type { ProductWithCategory } from "@/data/products";

const TICK_MS = 2200;
const WINDOW_SIZE = 5;

// Auto-advancing "Hot Deals" strip - every couple of seconds the window of
// visible items shifts by one, the oldest drops off the left and a new one
// slides in from the right, looping through the full list continuously.
// Pauses while the pointer is over it so it doesn't shift mid-tap/click.
export const HotDealsCarousel = ({ products }: { products: ProductWithCategory[] }) => {
  const [startIndex, setStartIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || products.length <= 1) return;
    const id = setInterval(() => {
      setStartIndex((i) => (i + 1) % products.length);
    }, TICK_MS);
    return () => clearInterval(id);
  }, [paused, products.length]);

  if (products.length === 0) return null;

  const windowSize = Math.min(WINDOW_SIZE, products.length);
  const visible = Array.from({ length: windowSize }, (_, i) => products[(startIndex + i) % products.length]);

  return (
    <section className="mb-4 rounded-xl bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 p-3 shadow-card border border-red-100 dark:border-red-900/30">
      <div className="mb-2 flex items-center gap-2">
        <div className="flex shrink-0 items-center gap-1 rounded-md bg-gradient-to-r from-red-600 to-orange-500 px-2 py-1">
          <Flame className="h-3.5 w-3.5 fill-white text-white" />
          <span className="whitespace-nowrap text-xs font-extrabold text-white">Hot Deals</span>
        </div>
        <span className="text-[11px] text-muted-foreground">New picks every few seconds</span>
      </div>
      <div
        className="-mx-1 overflow-x-hidden px-1"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className="flex gap-2">
          {visible.map((p) => (
            <div
              key={`${p.id}-${startIndex}`}
              className="w-[142px] shrink-0 animate-in fade-in slide-in-from-right-4 duration-500"
            >
              <ProductCard p={p} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
