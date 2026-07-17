import { Zap, Truck, Shield, Wallet, Ticket, ChevronRight, ThumbsUp } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { ProductCard } from "@/components/ProductCard";
import { FlashCountdown } from "@/components/FlashCountdown";
import { SignInModal } from "@/components/SignInModal";
import { LuckyCodeModal } from "@/components/LuckyCodeModal";
import { CelebrationModal } from "@/components/CelebrationModal";
import { notificationService } from "@/services/notificationService";
import { useShop } from "@/store/shop";
import { categories, getProducts, getProductsSync, transformDatabaseProduct, type ProductWithCategory } from "@/data/products";

const VOUCHERS = [
  { code: "WELCOME50", label: "KES 50 OFF", sub: "New shoppers" },
  { code: "FLASH30", label: "KES 30 OFF", sub: "Flash sale" },
  { code: "SHOP20", label: "KES 20 OFF", sub: "Any order" },
  { code: "LUCKY25", label: "KES 25 OFF", sub: "Lucky draw" },
];

const Index = () => {
  const navigate = useNavigate();
  const { user } = useShop();
  const [products, setProducts] = useState<ProductWithCategory[]>(getProductsSync() || []);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [showLuckyCodeModal, setShowLuckyCodeModal] = useState(false);
  const [showLoginCelebration, setShowLoginCelebration] = useState(false);
  const [flashDeals, setFlashDeals] = useState<ProductWithCategory[]>([]);

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

  // "More to love" feed = all products, refreshed on focus/visibility
  useEffect(() => {
    const refreshProductList = async () => {
      const refreshed = await getProducts();
      setProducts(Array.isArray(refreshed) ? refreshed : []);
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
  }, []);

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

  return (
    <div className="min-h-screen bg-background pb-24">
      <SignInModal
        isOpen={showSignInModal}
        onClose={() => setShowSignInModal(false)}
        message="Welcome to Urban Store! Sign in to start shopping and selling."
      />
      <LuckyCodeModal isOpen={showLuckyCodeModal} onClose={() => setShowLuckyCodeModal(false)} />
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
            <span className="flex items-center gap-1.5"><Truck className="h-3.5 w-3.5" /> Free delivery deals</span>
            <div className="flex items-center gap-4">
              <span className="hidden items-center gap-1.5 sm:flex"><Shield className="h-3.5 w-3.5" /> Buyer protection</span>
              <span className="flex items-center gap-1.5"><Wallet className="h-3.5 w-3.5" /> Pay with M-PESA or Wallet</span>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4">
        {/* Category tiles */}
        <section className="py-3">
          <div className="-mx-4 overflow-x-auto scrollbar-hide px-4">
            <div className="flex gap-4">
              {categories.map((c) => (
                <Link key={c.slug} to={`/category/${c.slug}`} className="flex w-16 shrink-0 flex-col items-center gap-1.5">
                  <div className="h-14 w-14 overflow-hidden rounded-full border border-border bg-muted shadow-sm">
                    <img src={c.img} alt={c.name} className="h-full w-full object-cover" />
                  </div>
                  <span className="text-center text-[11px] font-medium text-foreground leading-tight">{c.name}</span>
                </Link>
              ))}
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
                  onClick={() => (user ? setShowLuckyCodeModal(true) : setShowSignInModal(true))}
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

        {/* Sell CTA */}
        <div className="mb-4">
          <div
            onClick={() => (user ? navigate('/sell') : setShowSignInModal(true))}
            className="relative flex items-center justify-between gap-3 overflow-hidden rounded-xl gradient-hero p-3 shadow-card cursor-pointer"
          >
            <div>
              <h3 className="text-sm font-extrabold text-primary-foreground">Got something to sell?</h3>
              <p className="text-xs text-primary-foreground/90">List your item in seconds and reach thousands of shoppers</p>
            </div>
            <button className="shrink-0 rounded-full bg-accent px-4 py-2 text-xs font-bold text-accent-foreground shadow-accent">Post Now</button>
          </div>
        </div>

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
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {products.map((p) => (
                <ProductCard key={p.id} p={p} />
              ))}
            </div>
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  );
};

export default Index;
