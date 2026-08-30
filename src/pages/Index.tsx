import { Zap, Truck, Shield, Wallet, Ticket, ChevronRight, ThumbsUp } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { ProductCard } from "@/components/ProductCard";
import { FlashCountdown } from "@/components/FlashCountdown";
import { SignInModal } from "@/components/SignInModal";
import { CouponModal } from "@/components/CouponModal";
import { CelebrationModal } from "@/components/CelebrationModal";
import { notificationService } from "@/services/notificationService";
import { useShop } from "@/store/shop";
import { useSEO, SITE_URL } from "@/hooks/useSEO";
import { Pagination } from "@/components/Pagination";
import { categories, getProducts, getProductsPage, getProductsSync, transformDatabaseProduct, type ProductWithCategory } from "@/data/products";

const VOUCHERS = [
  { code: "WELCOME50", label: "KES 50 OFF", sub: "New shoppers" },
  { code: "FLASH30", label: "KES 30 OFF", sub: "Flash sale" },
  { code: "SHOP20", label: "KES 20 OFF", sub: "Any order" },
  { code: "LUCKY25", label: "KES 25 OFF", sub: "Limited time" },
];

const Index = () => {
  const { user } = useShop();
  const [products, setProducts] = useState<ProductWithCategory[]>(getProductsSync() || []);
  const [productsHasMore, setProductsHasMore] = useState(false);
  const [productsPage, setProductsPage] = useState(1);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [showLoginCelebration, setShowLoginCelebration] = useState(false);
  const [flashDeals, setFlashDeals] = useState<ProductWithCategory[]>([]);
  const [categoryImageSample, setCategoryImageSample] = useState<ProductWithCategory[]>([]);

  // Flash deals = trending products
  useEffect(() => {
    const fetchFlash = async () => {
      try {
        const res = await fetch('/api/products?sort=trending&limit=10', { headers: { 'Cache-Control': 'no-cache' } });
        if (res.ok) {
          const data = await res.json();
          setFlashDeals(Array.isArray(data) ? data.map(transformDatabaseProduct) : []);
        }
      } catch (e) {
        console.error('Error fetching flash deals:', e);
      }
    };
    fetchFlash();
  }, []);

  // "More to love" feed — one page at a time (see Pagination below) rather
  // than one long scrolling grid, refreshed on focus/visibility so a page
  // left open in a background tab still reflects newly added products.
  useEffect(() => {
    const refreshProductList = async () => {
      const result = await getProductsPage({}, productsPage);
      setProducts(result.items);
      setProductsHasMore(result.hasMore);
    };
    refreshProductList();

    const handleVisibilityChange = () => { if (!document.hidden) refreshProductList(); };
    window.addEventListener('storage', refreshProductList);
    window.addEventListener('focus', refreshProductList);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('storage', refreshProductList);
      window.removeEventListener('focus', refreshProductList);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [productsPage]);

  // A broader (unpaginated) sample purely for deriving one real photo per
  // category for the strip below — independent of whichever page of "More
  // to love" happens to be showing.
  useEffect(() => {
    getProducts({ limit: 100 }).then(setCategoryImageSample);
  }, []);

  // Real photos of actual in-stock items, one per category. Falls back to
  // the generic illustration for a category with nothing in stock yet.
  const categoryImages = useMemo(() => {
    const map: Record<string, string> = {};
    for (const p of categoryImageSample) {
      if (!map[p.category] && p.image && p.image !== "/placeholder.svg") map[p.category] = p.image;
    }
    return map;
  }, [categoryImageSample]);

  // Sign-in modal on first visit + login celebration
  useEffect(() => {
    if (!user) {
      const hasSeenModal = sessionStorage.getItem('hasSeenSignInModal');
      if (!hasSeenModal) {
        const timer = setTimeout(() => {
          setShowSignInModal(true);
          sessionStorage.setItem('hasSeenSignInModal', 'true');
        }, 2000);
        return () => clearTimeout(timer);
      }
    } else {
      const justLoggedIn = sessionStorage.getItem('campusmart_just_logged_in');
      if (justLoggedIn) {
        sessionStorage.removeItem('campusmart_just_logged_in');
        const timer = setTimeout(() => {
          setShowLoginCelebration(true);
          const firstName = user.name?.split(' ')[0] || 'friend';
          notificationService.showWelcomeNotification(firstName);
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [user]);

  useSEO({
    title: "",
    path: "/",
    // Lists the real products currently showing in "More To Love" as
    // Product entities — the more pages Google can see are full of
    // genuine, distinct products with real prices/images, the more of them
    // it has a reason to index and surface individually in search results.
    structuredData: products.length > 0 ? [{
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListElement: products.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "Product",
          name: p.title,
          image: p.image ? (p.image.startsWith("http") ? p.image : `${SITE_URL}${p.image}`) : undefined,
          url: `${SITE_URL}/product/${p.id}`,
          offers: {
            "@type": "Offer",
            price: p.price,
            priceCurrency: "KES",
            availability: "https://schema.org/InStock",
            url: `${SITE_URL}/product/${p.id}`,
          },
        },
      })),
    }] : undefined,
  });

  return (
    <div className="min-h-screen bg-background pb-24">
      <SignInModal
        isOpen={showSignInModal}
        onClose={() => setShowSignInModal(false)}
        message="Welcome to CampusMart! Sign in to start shopping and selling."
      />
      <CouponModal isOpen={showCouponModal} onClose={() => setShowCouponModal(false)} />
      <CelebrationModal
        isOpen={showLoginCelebration}
        onClose={() => setShowLoginCelebration(false)}
        type="login"
        title="Welcome Back!"
        message={`Great to see you again, ${user?.name?.split(' ')[0] || 'friend'}! 🎉`}
      />

      <div className="sticky top-0 z-30">
        <TopBar />
        <div className="bg-primary">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-2 text-xs text-primary-foreground">
            <span className="flex items-center gap-1.5"><Truck className="h-3.5 w-3.5" /> <span aria-hidden="true">🇰🇪</span> We deliver countrywide</span>
            <div className="flex items-center gap-4">
              <span className="hidden items-center gap-1.5 sm:flex"><Shield className="h-3.5 w-3.5" /> Buyer protection</span>
              <span className="flex items-center gap-1.5"><Wallet className="h-3.5 w-3.5" /> Pay with M-PESA or Wallet</span>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4">
        {/* Real <h1> for the homepage — visually hidden (the header logo/tagline
            already carries this visually) but every page should have exactly
            one, and the homepage previously had none at all. */}
        <h1 className="sr-only">CampusMart Kenya — Shop Local, Live Better, Buy &amp; Sell Online</h1>

        {/* Category tiles */}
        <section className="py-3">
          <div className="mb-2.5 flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-foreground">Shop by Category</h2>
            <Link to="/categories" className="flex items-center text-xs font-bold text-accent">
              See all <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {/* Mobile keeps the horizontal-scroll strip; from md up there's
              plenty of width, so the circles spread out with even gaps to
              fill the whole row instead of staying bunched on one side. */}
          <div className="-mx-4 overflow-x-auto scrollbar-hide px-4 md:mx-0 md:overflow-visible md:px-0">
            <div className="flex gap-4 md:w-full md:justify-between md:gap-2">
              {categories.map((c) => (
                <Link key={c.slug} to={`/category/${c.slug}`} className="group flex w-16 shrink-0 flex-col items-center gap-1.5 md:w-auto">
                  <div className="rounded-full bg-gradient-to-br from-accent/60 to-primary/40 p-[2px] shadow-sm transition-transform group-active:scale-95">
                    <div className="h-14 w-14 overflow-hidden rounded-full border-2 border-background bg-muted md:h-16 md:w-16">
                      <img
                        src={categoryImages[c.slug] || c.img}
                        alt={c.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    </div>
                  </div>
                  <span className="text-center text-[11px] font-medium text-foreground leading-tight">{c.name}</span>
                </Link>
              ))}
              <Link to="/categories" className="flex w-16 shrink-0 flex-col items-center gap-1.5 md:w-auto">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-border bg-muted text-muted-foreground transition group-hover:border-accent md:h-16 md:w-16">
                  <ChevronRight className="h-5 w-5" />
                </div>
                <span className="text-center text-[11px] font-medium text-foreground leading-tight">See all</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Voucher / coupon strip */}
        <section className="mb-3">
          <div className="-mx-4 overflow-x-auto scrollbar-hide px-4">
            <div className="flex gap-2">
              {VOUCHERS.map((v) => (
                <button
                  key={v.code}
                  onClick={() => (user ? setShowCouponModal(true) : setShowSignInModal(true))}
                  className="flex shrink-0 items-center gap-2 rounded-lg border border-dashed border-accent bg-accent/5 px-3 py-2 text-left"
                >
                  <Ticket className="h-4 w-4 text-accent" />
                  <div>
                    <div className="text-xs font-extrabold text-accent leading-tight">{v.label}</div>
                    <div className="text-[10px] text-muted-foreground">{v.sub} · Collect</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Flash deals */}
        {flashDeals.length > 0 && (
          <section className="mb-4 rounded-xl bg-card p-3 shadow-card">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <div className="flex shrink-0 items-center gap-1 rounded-md bg-destructive px-2 py-1">
                  <Zap className="h-3.5 w-3.5 fill-destructive-foreground text-destructive-foreground" />
                  <span className="whitespace-nowrap text-xs font-extrabold text-destructive-foreground">Flash Deals</span>
                </div>
                <FlashCountdown />
              </div>
              <Link to="/search?sort=trending" className="flex shrink-0 items-center text-xs font-bold text-accent">
                More <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="-mx-1 overflow-x-auto scrollbar-hide px-1">
              <div className="flex gap-2">
                {flashDeals.map((p) => (
                  <div key={p.id} className="w-[142px] shrink-0">
                    <ProductCard p={p} />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* More to love feed */}
        <section className="pb-6">
          <div className="mb-3 flex items-center justify-center gap-2">
            <span className="h-px w-8 bg-border" />
            <ThumbsUp className="h-4 w-4 text-accent" />
            <h2 className="text-base font-extrabold text-foreground">More To Love</h2>
            <span className="h-px w-8 bg-border" />
          </div>
          {products.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Loading products…</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {products.map((p) => (
                  <ProductCard key={p.id} p={p} />
                ))}
              </div>
              <Pagination page={productsPage} hasMore={productsHasMore} onChange={setProductsPage} />
            </>
          )}
        </section>
        {/* SEO footer: real, crawlable text and internal links (not just
            structured-data hints) linking every category, so both search
            engines and shoppers can find the whole catalog from the
            homepage. */}
        <footer className="mt-2 border-t border-border pt-4 pb-6 text-xs text-muted-foreground">
          <p className="mb-3">
            <strong className="text-foreground">CampusMart Kenya</strong> is
            Kenya's online marketplace to shop local and live better — buy and sell phones, electronics, computing,
            appliances, fashion, home &amp; kitchen, health &amp; beauty, baby &amp; kids items, gaming and watches
            &amp; jewellery, with fast delivery and secure M-Pesa payments across Nairobi, Mombasa, Kisumu and beyond.
          </p>
          <nav aria-label="Categories" className="flex flex-wrap gap-x-3 gap-y-1">
            {categories.map((c, i) => (
              <span key={c.slug} className="flex items-center gap-3">
                <Link to={`/category/${c.slug}`} className="hover:text-foreground hover:underline">
                  {c.name}
                </Link>
                {i < categories.length - 1 && <span aria-hidden="true">·</span>}
              </span>
            ))}
          </nav>
        </footer>
      </main>

      <BottomNav />
    </div>
  );
};

export default Index;
