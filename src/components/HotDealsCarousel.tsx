import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Flame } from "lucide-react";
import type { ProductWithCategory } from "@/data/products";
import { handleImageError } from "@/lib/imageFallback";
import { sizedImage, cdnImgProps } from "@/lib/imageUrl";

const SLOTS = 3;
const FLIP_EVERY_MS = 3200;
const STAGGER_MS = 1000;
const FLIP_MS = 700;

// Each card has two faces; flipping rotates the card 180deg so the hidden
// face (already loaded with the next product) swings into view. `turns`
// only ever increases, so the card always keeps spinning the same way, and
// the visible face is simply turns % 2.
interface Slot {
  faces: [ProductWithCategory | undefined, ProductWithCategory | undefined];
  turns: number;
}

function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// Round-robin across categories so the pool (and so every card in a row)
// comes from different categories instead of a run of one.
function interleaveByCategory(products: ProductWithCategory[]): ProductWithCategory[] {
  const groups = new Map<string, ProductWithCategory[]>();
  for (const p of shuffle(products)) {
    const list = groups.get(p.category) || [];
    list.push(p);
    groups.set(p.category, list);
  }
  const lists = shuffle([...groups.values()]);
  const out: ProductWithCategory[] = [];
  for (let round = 0; out.length < products.length; round++) {
    let added = false;
    for (const list of lists) {
      if (list[round]) {
        out.push(list[round]);
        added = true;
      }
    }
    if (!added) break;
  }
  return out;
}

const preload = (src: string) =>
  new Promise<void>((resolve) => {
    const img = new Image();
    const done = () => resolve();
    img.onload = done;
    img.onerror = done;
    setTimeout(done, 1500); // never hold a flip up on a slow image
    img.src = src;
  });

const Face = ({ p, back }: { p?: ProductWithCategory; back?: boolean }) => {
  if (!p) return <div className="absolute inset-0 bg-muted" style={{ backfaceVisibility: "hidden" }} />;
  const discount = p.oldPrice && p.oldPrice > p.price
    ? Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100)
    : 0;
  return (
    <Link
      to={`/product/${p.id}`}
      className="absolute inset-0 overflow-hidden rounded-lg bg-muted"
      style={{ backfaceVisibility: "hidden", transform: back ? "rotateY(180deg)" : undefined }}
    >
      <img
        src={sizedImage(p.image, 400)}
        alt={p.title}
        loading="eager"
        {...cdnImgProps}
        className="h-full w-full object-cover"
        onError={handleImageError}
      />
      {/* Price stamped on top of the image, ad-style - no title/rating/cart */}
      <div className="absolute inset-x-0 top-0 flex flex-col items-center bg-gradient-to-b from-black/70 to-transparent px-1 pb-2 pt-1">
        {discount > 0 && (
          <span className="mb-0.5 rounded bg-red-600 px-1 py-0.5 text-[8px] font-extrabold leading-none text-white">
            -{discount}%
          </span>
        )}
        <span className="text-[11px] font-extrabold leading-none text-white drop-shadow">
          KES {p.price.toLocaleString()}
        </span>
      </div>
    </Link>
  );
};

// "Hot Deals" - three small ad-style cards that each flip, one after the
// other, to a different product (from mixed categories). Pauses while the
// pointer is over it so a card doesn't turn mid-tap, and while the tab is
// hidden.
export const HotDealsCarousel = ({ products }: { products: ProductWithCategory[] }) => {
  const pool = useMemo(() => interleaveByCategory(products), [products]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const slotsRef = useRef<Slot[]>([]);
  const cursorRef = useRef(SLOTS);
  const pausedRef = useRef(false);

  // (Re)seed the cards whenever the product pool changes.
  useEffect(() => {
    const count = Math.min(SLOTS, pool.length);
    const initial: Slot[] = Array.from({ length: count }, (_, i) => ({ faces: [pool[i], undefined], turns: 0 }));
    slotsRef.current = initial;
    cursorRef.current = count;
    setSlots(initial);
  }, [pool]);

  useEffect(() => {
    // Nothing new to show if the pool fits entirely on the cards.
    if (pool.length <= SLOTS) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    const timers: ReturnType<typeof setTimeout>[] = [];
    const intervals: ReturnType<typeof setInterval>[] = [];

    const flip = async (index: number) => {
      if (pausedRef.current || document.hidden) return;
      const current = slotsRef.current[index];
      if (!current) return;

      // Next product that isn't already on screen on any card.
      const showing = new Set(
        slotsRef.current.map((s) => s.faces[s.turns % 2]?.id).filter(Boolean) as string[]
      );
      let next: ProductWithCategory | undefined;
      for (let tries = 0; tries < pool.length; tries++) {
        const candidate = pool[cursorRef.current % pool.length];
        cursorRef.current++;
        if (!showing.has(candidate.id)) {
          next = candidate;
          break;
        }
      }
      if (!next) return;

      await preload(sizedImage(next.image, 400));

      const slot = slotsRef.current[index];
      const hidden = ((slot.turns + 1) % 2) as 0 | 1;
      const faces: Slot["faces"] = [...slot.faces];
      faces[hidden] = next;
      slotsRef.current = slotsRef.current.map((s, i) => (i === index ? { faces, turns: s.turns + 1 } : s));
      setSlots(slotsRef.current);
    };

    for (let i = 0; i < Math.min(SLOTS, pool.length); i++) {
      timers.push(
        setTimeout(() => {
          flip(i);
          intervals.push(setInterval(() => flip(i), FLIP_EVERY_MS));
        }, FLIP_EVERY_MS + i * STAGGER_MS)
      );
    }

    return () => {
      timers.forEach(clearTimeout);
      intervals.forEach(clearInterval);
    };
  }, [pool]);

  if (products.length === 0) return null;

  return (
    <section className="mb-3">
      <div className="mb-1.5 flex items-center gap-2">
        <div className="flex shrink-0 items-center gap-1 rounded-md bg-gradient-to-r from-red-600 to-orange-500 px-2 py-1">
          <Flame className="h-3.5 w-3.5 fill-white text-white" />
          <span className="whitespace-nowrap text-xs font-extrabold text-white">Hot Deals</span>
        </div>
        <span className="text-[11px] text-muted-foreground">New picks every few seconds</span>
      </div>
      <div
        className="grid grid-cols-3 gap-1.5 md:max-w-md"
        onPointerEnter={(e) => { if (e.pointerType === "mouse") pausedRef.current = true; }}
        onPointerLeave={() => { pausedRef.current = false; }}
      >
        {slots.map((slot, i) => (
          <div key={i} style={{ perspective: "700px" }}>
            <div
              className="relative aspect-[4/3]"
              style={{
                transformStyle: "preserve-3d",
                transform: `rotateY(${slot.turns * 180}deg)`,
                transition: `transform ${FLIP_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`,
              }}
            >
              <Face p={slot.faces[0]} />
              <Face p={slot.faces[1]} back />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
