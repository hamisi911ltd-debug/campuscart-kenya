import { ArrowRight, Flame, Sparkles, Truck, Shield, Wallet, Zap } from "lucide-react";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { ProductCard, type Product } from "@/components/ProductCard";
import { FlashCountdown } from "@/components/FlashCountdown";

import catBooks from "@/assets/cat-books.jpg";
import catElec from "@/assets/cat-electronics.jpg";
import catFashion from "@/assets/cat-fashion.jpg";
import catFood from "@/assets/cat-food.jpg";
import catRooms from "@/assets/cat-rooms.jpg";
import catStat from "@/assets/cat-stationery.jpg";
import catFurn from "@/assets/cat-furniture.jpg";

import pMac from "@/assets/p-macbook.jpg";
import pAlgo from "@/assets/p-algo.jpg";
import pJacket from "@/assets/p-jacket.jpg";
import pCalc from "@/assets/p-calc.jpg";
import pFridge from "@/assets/p-fridge.jpg";
import pChips from "@/assets/p-chips.jpg";
import pSneakers from "@/assets/p-sneakers.jpg";
import pBed from "@/assets/p-bedsitter.jpg";

const categories = [
  { name: "Books", img: catBooks },
  { name: "Electronics", img: catElec },
  { name: "Fashion", img: catFashion },
  { name: "Food", img: catFood },
  { name: "Hostels", img: catRooms },
  { name: "Stationery", img: catStat },
  { name: "Furniture", img: catFurn },
];

const trending: Product[] = [
  { id: "1", title: "MacBook Pro 13\" — 2nd hand, perfect for coding", price: 45000, oldPrice: 60000, image: pMac, campus: "UoN Main", badge: "HOT", rating: 4.9, sold: 12 },
  { id: "2", title: "Introduction to Algorithms (CLRS) — 4th Ed", price: 2500, oldPrice: 5000, image: pAlgo, campus: "JKUAT", badge: "SALE", rating: 4.8, sold: 47 },
  { id: "3", title: "Casio fx-991ES Plus Scientific Calculator", price: 1800, image: pCalc, campus: "Kenyatta U.", badge: "NEW", rating: 4.7, sold: 89 },
  { id: "4", title: "Nike Air Force 1 — Size 42, lightly used", price: 4500, oldPrice: 8000, image: pSneakers, campus: "Strathmore", badge: "SALE", rating: 4.6, sold: 23 },
];

const justListed: Product[] = [
  { id: "5", title: "Warm Winter Jacket — perfect for Limuru cold", price: 1200, oldPrice: 2500, image: pJacket, campus: "Daystar", badge: "SALE", rating: 4.5, sold: 8 },
  { id: "6", title: "Mini Fridge — ideal for hostel room", price: 8500, image: pFridge, campus: "UoN Main", badge: "NEW", rating: 4.9, sold: 3 },
  { id: "7", title: "Chips Mayai Combo — delivered hot to your door", price: 250, image: pChips, campus: "JKUAT Juja", badge: "FREE", rating: 4.8, sold: 156 },
  { id: "8", title: "Bedsitter near Main Campus, WiFi included", price: 7500, image: pBed, campus: "Kikuyu", badge: "HOT", rating: 4.7, sold: 0 },
];

const heroCards = [
  { tag: "MARKET", title: "Cheap Textbooks", sub: "From KES 200", grad: "gradient-card-1", img: catBooks },
  { tag: "HOSTELS", title: "Find a Room", sub: "Verified listings", grad: "gradient-card-2", img: catRooms },
  { tag: "FOOD", title: "Late Night Bites", sub: "30 min delivery", grad: "gradient-card-3", img: catFood },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <TopBar />

      {/* Promo strip */}
      <div className="gradient-hero">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-2 text-xs text-primary-foreground">
          <FlashCountdown />
          <div className="hidden items-center gap-4 sm:flex">
            <span className="flex items-center gap-1.5"><Truck className="h-3.5 w-3.5" /> Free campus delivery</span>
            <span className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" /> Buyer protection</span>
            <span className="flex items-center gap-1.5"><Wallet className="h-3.5 w-3.5" /> M-PESA</span>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-5">
        {/* Hero cards */}
        <section className="grid grid-cols-3 gap-3 md:gap-4">
          {heroCards.map((c) => (
            <button
              key={c.title}
              className={`${c.grad} group relative overflow-hidden rounded-2xl p-4 text-left text-primary-foreground shadow-card transition hover:shadow-elevated md:p-6`}
            >
              <span className="inline-block rounded-full bg-background/15 px-2.5 py-0.5 text-[10px] font-bold tracking-wider backdrop-blur md:text-xs">
                {c.tag}
              </span>
              <h2 className="mt-2 text-lg font-extrabold leading-tight md:mt-4 md:text-2xl">
                {c.title}
              </h2>
              <p className="mt-0.5 hidden text-xs opacity-90 md:block">{c.sub}</p>
              <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold opacity-90 group-hover:gap-2 transition-all md:text-sm">
                Explore <ArrowRight className="h-3.5 w-3.5" />
              </div>
              <img
                src={c.img}
                alt=""
                aria-hidden
                loading="lazy"
                className="pointer-events-none absolute -bottom-2 -right-2 h-20 w-20 rounded-xl object-cover opacity-60 mix-blend-luminosity md:h-28 md:w-28"
              />
            </button>
          ))}
        </section>

        {/* Categories */}
        <section className="mt-6">
          <div className="-mx-4 overflow-x-auto scrollbar-hide px-4">
            <div className="flex gap-4 md:justify-between">
              {categories.map((c) => (
                <button key={c.name} className="group flex shrink-0 flex-col items-center gap-1.5">
                  <div className="h-16 w-16 overflow-hidden rounded-2xl bg-card shadow-card ring-2 ring-transparent transition group-hover:ring-accent md:h-20 md:w-20">
                    <img src={c.img} alt={c.name} loading="lazy" className="h-full w-full object-cover" />
                  </div>
                  <span className="text-xs font-medium text-foreground">{c.name}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Flash deals banner */}
        <section className="mt-6 overflow-hidden rounded-2xl gradient-flash p-4 text-primary-foreground shadow-accent">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 fill-warning text-warning" />
              <div>
                <h2 className="text-base font-extrabold md:text-lg">Student Flash Deals</h2>
                <p className="text-xs opacity-90">Mega discounts — only on CampusMart</p>
              </div>
            </div>
            <button className="rounded-full bg-background/20 px-3 py-1.5 text-xs font-bold backdrop-blur hover:bg-background/30">
              Shop now <ArrowRight className="ml-1 inline h-3 w-3" />
            </button>
          </div>
        </section>

        {/* Trending */}
        <Section
          icon={<Flame className="h-5 w-5 text-accent" />}
          title="Trending Near You"
          subtitle="Popular with students this week"
          link="View All"
        >
          <ProductGrid items={trending} />
        </Section>

        {/* Just listed */}
        <Section
          icon={<Sparkles className="h-5 w-5 text-accent" />}
          title="Just Listed"
          subtitle="Fresh from your fellow students"
          link="See More"
        >
          <ProductGrid items={justListed} />
        </Section>

        {/* Sell CTA */}
        <section className="mt-6 overflow-hidden rounded-2xl gradient-hero p-5 text-primary-foreground shadow-elevated md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="max-w-md">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent-glow">
                Sell on CampusMart
              </span>
              <h2 className="mt-1 text-xl font-extrabold md:text-3xl">Turn clutter into cash</h2>
              <p className="mt-1 text-sm opacity-90">
                List your books, electronics, mitumba or empty bedsitter — free, in 60 seconds. M-PESA payouts.
              </p>
            </div>
            <button className="rounded-full gradient-accent px-6 py-3 text-sm font-bold text-accent-foreground shadow-accent transition hover:scale-105">
              Start Selling
            </button>
          </div>
        </section>

        {/* Trust */}
        <section className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { icon: Shield, t: "Verified Students", s: "School ID required" },
            { icon: Wallet, t: "M-PESA Escrow", s: "Pay after delivery" },
            { icon: Truck, t: "Boda Delivery", s: "Within 1 hour" },
            { icon: Sparkles, t: "Campus Reviews", s: "Real student ratings" },
          ].map((x) => (
            <div key={x.t} className="flex items-center gap-3 rounded-xl bg-card p-3 shadow-card">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-primary">
                <x.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-foreground">{x.t}</div>
                <div className="text-xs text-muted-foreground">{x.s}</div>
              </div>
            </div>
          ))}
        </section>

        <footer className="mt-10 border-t border-border pt-6 pb-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} CampusMart Kenya · Built by students, for students 🇰🇪
        </footer>
      </main>

      <BottomNav />
    </div>
  );
};

const Section = ({
  icon,
  title,
  subtitle,
  link,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  link: string;
  children: React.ReactNode;
}) => (
  <section className="mt-8">
    <div className="mb-3 flex items-end justify-between gap-2">
      <div className="flex items-center gap-2">
        {icon}
        <div>
          <h2 className="text-lg font-extrabold text-foreground md:text-xl">{title}</h2>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      <button className="flex shrink-0 items-center gap-1 text-xs font-bold text-accent hover:gap-2 transition-all">
        {link} <ArrowRight className="h-3 w-3" />
      </button>
    </div>
    {children}
  </section>
);

const ProductGrid = ({ items }: { items: Product[] }) => (
  <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
    {items.map((p) => (
      <ProductCard key={p.id} p={p} />
    ))}
  </div>
);

export default Index;
