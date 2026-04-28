import { ArrowRight, Flame, Sparkles, Truck, Shield, Wallet, Zap } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { ProductCard } from "@/components/ProductCard";
import { FlashCountdown } from "@/components/FlashCountdown";
import { categories, products } from "@/data/products";

const trending = products.slice(0, 4);
const justListed = products.slice(4, 8);

const heroCards = [
  { tag: "MARKET", title: "Cheap Textbooks", sub: "From KES 200", grad: "gradient-card-1", img: categories[0].img, to: "/category/books" },
  { tag: "HOSTELS", title: "Find a Room", sub: "Verified listings", grad: "gradient-card-2", img: categories[4].img, to: "/category/hostels" },
  { tag: "FOOD", title: "Late Night Bites", sub: "30 min delivery", grad: "gradient-card-3", img: categories[3].img, to: "/category/food" },
];

const Index = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background pb-24">
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
              onClick={() => navigate(c.to)}
              className={`${c.grad} group relative overflow-hidden rounded-2xl p-4 text-left text-primary-foreground shadow-card transition hover:shadow-elevated md:p-6`}
            >
              <span className="inline-block rounded-full bg-background/15 px-2.5 py-0.5 text-[10px] font-bold tracking-wider backdrop-blur md:text-xs">
                {c.tag}
              </span>
              <h2 className="mt-2 text-lg font-extrabold leading-tight md:mt-4 md:text-2xl">{c.title}</h2>
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
                <Link key={c.slug} to={`/category/${c.slug}`} className="group flex shrink-0 flex-col items-center gap-1.5">
                  <div className="h-16 w-16 overflow-hidden rounded-2xl bg-card shadow-card ring-2 ring-transparent transition group-hover:ring-accent md:h-20 md:w-20">
                    <img src={c.img} alt={c.name} loading="lazy" className="h-full w-full object-cover" />
                  </div>
                  <span className="text-xs font-medium text-foreground">{c.name}</span>
                </Link>
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
            <Link to="/search?q=sale" className="rounded-full bg-background/20 px-3 py-1.5 text-xs font-bold backdrop-blur hover:bg-background/30">
              Shop now <ArrowRight className="ml-1 inline h-3 w-3" />
            </Link>
          </div>
        </section>

        <Section icon={<Flame className="h-5 w-5 text-accent" />} title="Trending Near You" subtitle="Popular with students this week" link="View All" linkTo="/search">
          <ProductGrid items={trending} />
        </Section>

        <Section icon={<Sparkles className="h-5 w-5 text-accent" />} title="Just Listed" subtitle="Fresh from your fellow students" link="See More" linkTo="/search">
          <ProductGrid items={justListed} />
        </Section>

        {/* Sell CTA */}
        <section className="mt-6 overflow-hidden rounded-2xl gradient-hero p-5 text-primary-foreground shadow-elevated md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="max-w-md">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent-glow">Sell on CampusMart</span>
              <h2 className="mt-1 text-xl font-extrabold md:text-3xl">Turn clutter into cash</h2>
              <p className="mt-1 text-sm opacity-90">List your books, electronics, mitumba or empty bedsitter — free, in 60 seconds. M-PESA payouts.</p>
            </div>
            <Link to="/sell" className="rounded-full gradient-accent px-6 py-3 text-sm font-bold text-accent-foreground shadow-accent transition hover:scale-105">
              Start Selling
            </Link>
          </div>
        </section>

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

const Section = ({ icon, title, subtitle, link, linkTo, children }: { icon: React.ReactNode; title: string; subtitle?: string; link: string; linkTo: string; children: React.ReactNode; }) => (
  <section className="mt-8">
    <div className="mb-3 flex items-end justify-between gap-2">
      <div className="flex items-center gap-2">
        {icon}
        <div>
          <h2 className="text-lg font-extrabold text-foreground md:text-xl">{title}</h2>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      <Link to={linkTo} className="flex shrink-0 items-center gap-1 text-xs font-bold text-accent hover:gap-2 transition-all">
        {link} <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
    {children}
  </section>
);

const ProductGrid = ({ items }: { items: typeof products }) => (
  <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
    {items.map((p) => (
      <ProductCard key={p.id} p={p} />
    ))}
  </div>
);

export default Index;
