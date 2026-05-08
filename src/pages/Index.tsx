import { ArrowRight, Flame, Sparkles, Truck, Shield, Wallet, Zap } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { ProductCard } from "@/components/ProductCard";
import { FlashCountdown } from "@/components/FlashCountdown";
import { SignInModal } from "@/components/SignInModal";
import { LuckyCodeModal } from "@/components/LuckyCodeModal";
import { useShop } from "@/store/shop";
import { categories, getProducts, getProductsSync, transformDatabaseProduct } from "@/data/products";
const Index = () => {
  const navigate = useNavigate();
  const { user } = useShop();
  const [products, setProducts] = useState<ProductWithCategory[]>(getProductsSync() || []);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [showLuckyCodeModal, setShowLuckyCodeModal] = useState(false);

  // Ensure products is always an array
  const safeProducts = Array.isArray(products) ? products : [];
  const [trending, setTrending] = useState<ProductWithCategory[]>([]);
  const [justListed, setJustListed] = useState<ProductWithCategory[]>([]);

  // Fetch trending and just listed products
  useEffect(() => {
    const fetchSortedProducts = async () => {
      try {
        // Fetch trending products
        const trendingResponse = await fetch('/api/products?sort=trending&limit=8', {
          headers: { 'Cache-Control': 'no-cache' },
        });
        if (trendingResponse.ok) {
          const trendingData = await trendingResponse.json();
          setTrending(Array.isArray(trendingData) ? trendingData.map(transformDatabaseProduct) : []);
        }

        // Fetch just listed products
        const newestResponse = await fetch('/api/products?sort=newest&limit=8', {
          headers: { 'Cache-Control': 'no-cache' },
        });
        if (newestResponse.ok) {
          const newestData = await newestResponse.json();
          setJustListed(Array.isArray(newestData) ? newestData.map(transformDatabaseProduct) : []);
        }
      } catch (error) {
        console.error('Error fetching sorted products:', error);
      }
    };

    fetchSortedProducts();
  }, []);

  // Refresh products on mount and when returning to page
  useEffect(() => {
    const refreshProductList = async () => {
      const refreshedProducts = await getProducts();
      // Ensure we always set an array
      setProducts(Array.isArray(refreshedProducts) ? refreshedProducts : []);
    };
    
    // Initial load
    refreshProductList();
    
    // Refresh when page becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshProductList();
      }
    };
    
    // Listen for storage changes (when products are added)
    window.addEventListener('storage', refreshProductList);
    window.addEventListener('focus', refreshProductList);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('storage', refreshProductList);
      window.removeEventListener('focus', refreshProductList);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Show sign-in modal on first visit if not logged in
  useEffect(() => {
    if (!user) {
      const hasSeenModal = sessionStorage.getItem('hasSeenSignInModal');
      if (!hasSeenModal) {
        // Show modal after a short delay
        const timer = setTimeout(() => {
          setShowSignInModal(true);
          sessionStorage.setItem('hasSeenSignInModal', 'true');
        }, 2000); // 2 seconds delay
        return () => clearTimeout(timer);
      }
    } else {
      // Show lucky code modal for logged in users occasionally
      const hasSeenLuckyModal = sessionStorage.getItem('hasSeenLuckyModal');
      const lastShown = localStorage.getItem('lastLuckyModalShown');
      const now = Date.now();
      const oneDayAgo = now - (24 * 60 * 60 * 1000);
      
      if (!hasSeenLuckyModal || (lastShown && parseInt(lastShown) < oneDayAgo)) {
        const timer = setTimeout(() => {
          setShowLuckyCodeModal(true);
          sessionStorage.setItem('hasSeenLuckyModal', 'true');
          localStorage.setItem('lastLuckyModalShown', now.toString());
        }, 5000); // 5 seconds delay
        return () => clearTimeout(timer);
      }
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Sign In Modal */}
      <SignInModal 
        isOpen={showSignInModal} 
        onClose={() => setShowSignInModal(false)}
        message="Welcome to CampusMart! Sign in to start shopping and selling."
      />

      {/* Lucky Code Modal */}
      <LuckyCodeModal 
        isOpen={showLuckyCodeModal} 
        onClose={() => setShowLuckyCodeModal(false)}
      />

      <div className="sticky top-0 z-30">
        <TopBar />
        {/* Promo strip */}
        <div className="bg-destructive">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-2 text-xs text-primary-foreground">
            <FlashCountdown />
            <div className="hidden items-center gap-4 sm:flex">
              <span className="flex items-center gap-1.5"><Truck className="h-3.5 w-3.5" /> Free campus delivery</span>
              <span className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" /> Buyer protection</span>
              <span className="flex items-center gap-1.5"><Wallet className="h-3.5 w-3.5" /> M-PESA</span>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 pb-4">
        <div className="py-3">
          <Section icon={<Flame className="h-5 w-5 text-accent" />} title="Trending Near You" subtitle="Popular with students this week" link="View All" linkTo="/search?sort=trending">
            <ProductGrid items={trending} />
          </Section>
        </div>

        <Section icon={<Sparkles className="h-5 w-5 text-accent" />} title="Just Listed" subtitle="Fresh from your fellow students" link="See More" linkTo="/search?sort=newest">
          <ProductGrid items={justListed} />
        </Section>

        {/* Post Item CTA Card - Shows at bottom with red color */}
        <div className="mt-8 mb-4">
          <div 
            onClick={() => {
              if (!user) {
                setShowSignInModal(true);
              } else {
                navigate('/sell');
              }
            }}
            className="relative overflow-hidden rounded-xl bg-red-600 p-3 shadow-card hover:shadow-elevated transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1">
                <h3 className="text-sm font-extrabold text-primary-foreground mb-0.5">
                  Got something to sell?
                </h3>
                <p className="text-xs text-primary-foreground/90">
                  List your item in seconds
                </p>
              </div>
              <button className="shrink-0 rounded-full bg-white text-red-600 px-4 py-2 text-xs font-bold hover:scale-105 transition-transform shadow-lg">
                Post Now
              </button>
            </div>
            {/* Decorative elements */}
            <div className="absolute -right-3 -top-3 h-16 w-16 rounded-full bg-white/10 blur-xl"></div>
            <div className="absolute -left-3 -bottom-3 h-16 w-16 rounded-full bg-white/10 blur-xl"></div>
          </div>
        </div>

        {/* Category Sections - All Products by Category */}
        <CategorySections />
      </main>

      <BottomNav />
    </div>
  );
};

const Section = ({ icon, title, subtitle, link, linkTo, children }: { icon: React.ReactNode; title: string; subtitle?: string; link: string; linkTo: string; children: React.ReactNode; }) => (
  <section className="mt-0">
    <div className="mb-2 flex items-end justify-between gap-2">
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

const ProductGrid = ({ items }: { items: any[] }) => (
  <div className="-mx-4 overflow-x-auto scrollbar-hide px-4">
    <div className="flex gap-1">
      {items.map((p) => (
        <div key={p.id} className="w-[calc((100vw-2rem-0.25rem)/2.5)] shrink-0 md:w-[140px]">
          <ProductCard p={p} />
        </div>
      ))}
    </div>
  </div>
);

// Category Sections Component - Shows products by category
const CategorySections = () => {
  const [categoryProducts, setCategoryProducts] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategoryProducts = async () => {
      setLoading(true);
      const productsByCategory: Record<string, any[]> = {};

      try {
        // Fetch products for each category
        for (const category of categories) {
          const response = await fetch(`/api/products?category=${category.slug}&limit=10`, {
            headers: { 'Cache-Control': 'no-cache' },
          });
          
          if (response.ok) {
            const data = await response.json();
            productsByCategory[category.slug] = Array.isArray(data) 
              ? data.map(transformDatabaseProduct) 
              : [];
          } else {
            productsByCategory[category.slug] = [];
          }
        }

        setCategoryProducts(productsByCategory);
      } catch (error) {
        console.error('Error fetching category products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryProducts();
  }, []);

  if (loading) {
    return (
      <div className="mt-8 text-center">
        <p className="text-sm text-muted-foreground">Loading categories...</p>
      </div>
    );
  }

  return (
    <>
      {categories.map((category) => {
        const products = categoryProducts[category.slug] || [];
        
        // Only show category if it has products
        if (products.length === 0) return null;

        return (
          <Section 
            key={category.slug}
            icon={<Zap className="h-5 w-5 text-accent" />} 
            title={category.name} 
            subtitle={`Browse ${category.name.toLowerCase()}`}
            link="View All" 
            linkTo={`/category/${category.slug}`}
          >
            <ProductGrid items={products} />
          </Section>
        );
      })}
    </>
  );
};

export default Index;
