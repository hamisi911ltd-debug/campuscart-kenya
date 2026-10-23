import { Zap, ChevronRight, ThumbsUp } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect, useMemo, useCallback } from "react";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { SiteFooter } from "@/components/SiteFooter";
import { ProductCard } from "@/components/ProductCard";
import { FlashCountdown } from "@/components/FlashCountdown";
import { HotSaleBanner } from "@/components/HotSaleBanner";
import { HotDealsCarousel } from "@/components/HotDealsCarousel";
import { SignInModal } from "@/components/SignInModal";
import { CelebrationModal } from "@/components/CelebrationModal";
import { notificationService } from "@/services/notificationService";
import { useShop } from "@/store/shop";
import { useSEO, SITE_URL } from "@/hooks/useSEO";
import { Pagination } from "@/components/Pagination";
import { categories, getProductsPage, getProductsSync, transformDatabaseProduct, DEFAULT_PAGE_SIZE, type ProductWithCategory } from "@/data/products";
import { sizedImage, cdnImgProps } from "@/lib/imageUrl";

const Index = () => {
  const { user } = useShop();
  const [products, setProducts] = useState<ProductWithCategory[]>(getProductsSync() || []);
  const [productsHasMore, setProductsHasMore] = useState(false);
  const [productsPage, setProductsPage] = useState(1);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [showLoginCelebration, setShowLoginCelebration] = useState(false);
  const [flashDeals, setFlashDeals] = useState<ProductWithCategory[]>([]);
  // ONE category-mixed request feeds the Hot Deals cards, the first page of
  // "More to love" and the per-category photos (these used to be three
  // separate requests). The URL is also <link rel="preload">ed in index.html so
  // it starts downloading before this code has even loaded - keep them identical.
  const [homeMixed, setHomeMixed] = useState<ProductWithCategory[]>([]);

  const loadHome = useCallback(async () => {
    try {
      const res = await fetch('/api/products?sort=mixed&limit=100');
      if (res.ok) {
        const data = await res.json();
        setHomeMixed(Array.isArray(data) ? data.map(transformDatabaseProduct) : []);
      }
    } catch (e) {
      console.error('Error fetching products:', e);
    }
  }, []);

  useEffect(() => { loadHome(); }, [loadHome]);

  // Hot Deals cards — a category-mixed pool; each card flips to a new product.
  const hotDeals = useMemo(() => homeMixed.slice(0, 40), [homeMixed]);
  const categoryImageSample = homeMixed;

  // Flash deals = trending products, fetched broadly enough to spread
  // across several categories so they can be shown as one batch per
  // category below rather than a single flat row.
  useEffect(() => {
    const fetchFlash = async () => {
      try {
        const res = await fetch('/api/products?sort=trending&limit=200');
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

  // Flash deals grouped by category, in the site's category order, each
  // becoming its own independently side-scrollable batch.
  const flashByCategory = useMemo(() => {
    const map: Record<string, ProductWithCategory[]> = {};
    for (const p of flashDeals) {
      (map[p.category] ||= []).push(p);
    }
    return categories
      .map((c) => ({ category: c, items: (map[c.slug] || []).slice(0, 16) }))
      .filter((group) => group.items.length > 0);
  }, [flashDeals]);

  // "More to love" feed — one page at a time (see Pagination below). Page 1
  // comes straight from the shared request above; later pages are fetched when
  // asked for. Refreshed on focus/visibility so a page left open in a
  // background tab still reflects newly added products.
  useEffect(() => {
    if (productsPage !== 1) return;
    if (homeMixed.length === 0) return;
    setProducts(homeMixed.slice(0, DEFAULT_PAGE_SIZE));
    setProductsHasMore(homeMixed.length > DEFAULT_PAGE_SIZE);
  }, [productsPage, homeMixed]);

  useEffect(() => {
    const refreshProductList = async () => {
      if (productsPage === 1) {
        await loadHome();
        return;
      }
      const result = await getProductsPage({ sort: "mixed" }, productsPage);
      setProducts(result.items);
      setProductsHasMore(result.hasMore);
    };
    if (productsPage !== 1) refreshProductList();

    const handleVisibilityChange = () => { if (!document.hidden) refreshProductList(); };
    window.addEventListener('storage', refreshProductList);
    window.addEventListener('focus', refreshProductList);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('storage', refreshProductList);
      window.removeEventListener('focus', refreshProductList);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [productsPage, loadHome]);

  // Real photos of actual in-stock items, one per category. Falls back to
  // the generic illustration for a category with nothing in stock yet.
  const categoryImages = useMemo(() => {
    const map: Record<string, string> = {};
    for (const p of categoryImageSample) {
      if (!map[p.category] && p.image && p.image !== "/placeholder.svg") map[p.category] = sizedImage(p.image, 400);
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
        message="Welcome to CampusMart! Sign in to shop at wholesale prices."
      />
      <CelebrationModal
        isOpen={showLoginCelebration}
        onClose={() => setShowLoginCelebration(false)}
        type="login"
        title="Welcome Back!"
        message={`Great to see you again, ${user?.name?.split(' ')[0] || 'friend'}! 🎉`}
      />

      <div className="sticky top-0 z-30">
        <TopBar />
      </div>

      <main className="mx-auto max-w-7xl px-4">
        {/* Real <h1> for the homepage — visually hidden (the header logo/tagline
            already carries this visually) but every page should have exactly
            one, and the homepage previously had none at all. */}
        <h1 className="sr-only">CampusMart Kenya — Wholesale Prices, Real Savings, Shop Online</h1>

        {/* Category circles — right below the search bar */}
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
                        width={64}
                        height={64}
                        {...cdnImgProps}
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

        {/* Hot Sale countdown banner */}
        <div className="-mx-4 mb-3 overflow-hidden md:mx-0 md:rounded-xl">
          <HotSaleBanner />
        </div>

        {/* Hot Deals — auto-advancing strip, right below the Hot Sale banner */}
        <HotDealsCarousel products={hotDeals} />

        {/* Flash deals — one horizontally-scrollable batch per category */}
        {flashByCategory.length > 0 && (
          <section className="mb-4 rounded-xl bg-card p-3 shadow-card">
            <div className="mb-3 flex items-center justify-between gap-2">
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

            <div className="space-y-4">
              {flashByCategory.map(({ category, items }) => (
                <div key={category.slug}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <h3 className="text-xs font-bold text-foreground">{category.name}</h3>
                    <Link to={`/category/${category.slug}`} className="text-[11px] font-semibold text-accent">
                      See all
                    </Link>
                  </div>
                  {/* Phones: a side-scrolling strip. From tablet width up: ONE row that spreads
                      across the full width - as many cards as fit, no empty space at the end. */}
                  <div className="-mx-1 overflow-x-auto scrollbar-hide px-1 md:mx-0 md:overflow-hidden md:px-0">
                    <div className="flex gap-2 md:grid md:grid-rows-1 md:auto-rows-[0] md:gap-x-2 md:gap-y-0 md:overflow-hidden md:[grid-template-columns:repeat(auto-fill,minmax(150px,1fr))]">
                      {items.map((p) => (
                        <div key={p.id} className="w-[148px] shrink-0 md:w-auto">
                          <ProductCard p={p} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
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
              <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8">
                {products.map((p, i) => (
                  <ProductCard key={p.id} p={p} priority={i < 6} />
                ))}
              </div>
              <Pagination page={productsPage} hasMore={productsHasMore} onChange={setProductsPage} />
            </>
          )}
        </section>
      </main>

      <SiteFooter />
      <BottomNav />
    </div>
  );
};

export default Index;
