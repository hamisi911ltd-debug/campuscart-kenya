import { ArrowRight, Flame, Sparkles, Truck, Shield, Wallet, Zap } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { ProductCard } from "@/components/ProductCard";
import { FlashCountdown } from "@/components/FlashCountdown";
import { SignInModal } from "@/components/SignInModal";
import { useShop } from "@/store/shop";
import { categories, getProducts, getProductsSync, getStaticProducts } from "@/data/products";

// Default ad slides - Use ONLY static products (never custom ones)
const getDefaultAdSlides = () => {
  const staticProducts = getStaticProducts();
  return [
    {
      bg: "transparent",
      badge: "STUDENT SPECIAL",
      title: "MacBook Pro 13\"",
      subtitle: "Perfect for Coding • KES 45K",
      product: staticProducts[0], // MacBook
    },
    {
      bg: "transparent",
      badge: "EXAM READY",
      title: "Introduction to Algorithms",
      subtitle: "CLRS 4th Ed • Save 50%",
      product: staticProducts[1], // Algorithms book
    },
    {
      bg: "transparent",
      badge: "TECH ESSENTIAL",
      title: "Casio Calculator",
      subtitle: "KUCCPS Approved • Brand New",
      product: staticProducts[2], // Calculator
    },
    {
      bg: "transparent",
      badge: "FASHION DEAL",
      title: "Nike Air Force 1",
      subtitle: "Size 42 • Save KES 3,500",
      product: staticProducts[3], // Sneakers
    },
    {
      bg: "transparent",
      badge: "WINTER READY",
      title: "Warm Winter Jacket",
      subtitle: "Grade 1 • Size M-L",
      product: staticProducts[4], // Jacket
    },
    {
      bg: "transparent",
      badge: "HOSTEL ESSENTIAL",
      title: "Mini Fridge",
      subtitle: "Low Power • 1 Year Warranty",
      product: staticProducts[5], // Mini Fridge
    },
    {
      bg: "transparent",
      badge: "QUICK BITE",
      title: "Chips & Chicken",
      subtitle: "Hot & Fresh • 30 Min Delivery",
      product: staticProducts[6], // Chips & Chicken
    },
    {
      bg: "transparent",
      badge: "HOSTEL READY",
      title: "Bedsitter Near Campus",
      subtitle: "WiFi Included • KES 7,500/mo",
      product: staticProducts[7], // Bedsitter
    },
    {
      bg: "transparent",
      badge: "PARTY READY",
      title: "Bluetooth Woofer",
      subtitle: "Powerful Bass • KES 6,500",
      product: staticProducts[8], // Woofer
    },
  ];
};

interface Advertisement {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  link?: string;
  active: boolean;
  order: number;
  createdAt: string;
}

const Index = () => {
  const navigate = useNavigate();
  const { user } = useShop();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [products, setProducts] = useState(getProductsSync());
  const [adSlides, setAdSlides] = useState(getDefaultAdSlides()); // Fixed ads, never changes
  const [showSignInModal, setShowSignInModal] = useState(false);

  const trending = products.slice(0, 4);
  const justListed = products.slice(4, 8);

  // Refresh products on mount and when returning to page
  useEffect(() => {
    const refreshProductList = async () => {
      const refreshedProducts = await getProducts();
      setProducts(refreshedProducts);
      // Don't update ad slides when products change - keep them fixed
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
    }
  }, [user]);

  // Load advertisements from localStorage
  useEffect(() => {
    const savedAds = localStorage.getItem('campusmart_ads');
    if (savedAds) {
      try {
        const ads: Advertisement[] = JSON.parse(savedAds);
        const activeAds = ads.filter(ad => ad.active).sort((a, b) => a.order - b.order);
        
        if (activeAds.length > 0) {
          // Convert admin ads to slide format
          const adminSlides = activeAds.map(ad => ({
            bg: "transparent",
            badge: "FEATURED",
            title: ad.title,
            subtitle: ad.description,
            imageUrl: ad.imageUrl,
            link: ad.link,
            isAdminAd: true,
          }));
          setAdSlides(adminSlides);
        }
      } catch (error) {
        console.error('Error loading advertisements:', error);
      }
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % adSlides.length);
    }, 4000); // Change slide every 4 seconds
    return () => clearInterval(interval);
  }, [adSlides.length]);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Sign In Modal */}
      <SignInModal 
        isOpen={showSignInModal} 
        onClose={() => setShowSignInModal(false)}
        message="Welcome to CampusMart! Sign in to start shopping and selling."
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

      <main className="mx-auto max-w-7xl px-4 py-5">
        {/* Advertisement Carousel */}
        <section className="relative overflow-hidden rounded-xl shadow-card h-[160px] md:h-[180px]">
          {adSlides.map((slide, idx) => {
            // Check if this is an admin ad or default ad
            const isAdminAd = 'isAdminAd' in slide && slide.isAdminAd;
            const imageUrl = isAdminAd ? slide.imageUrl : slide.product?.image;
            const slideTitle = slide.title;
            const slideSubtitle = slide.subtitle;
            
            // Special handling for winter jacket and woofer in default ads
            const isSpecialItem = !isAdminAd && slide.product && (
              slide.product.title.includes("Winter Jacket") || slide.product.title.includes("Woofer")
            );
            const imageClass = isSpecialItem 
              ? "absolute inset-0 h-full w-full object-contain p-4"
              : "absolute inset-0 h-full w-full object-cover";
            
            const handleClick = () => {
              if (isAdminAd && slide.link) {
                navigate(slide.link);
              } else {
                navigate("/search");
              }
            };
            
            return (
              <div
                key={idx}
                className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                  idx === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                }`}
              >
                <button
                  onClick={handleClick}
                  className="relative h-full w-full cursor-pointer hover:scale-[1.01] transition-transform overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100"
                >
                  {/* Product/Ad image - Dynamic sizing based on type */}
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt={slideTitle}
                      loading="lazy"
                      className={imageClass}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/src/assets/placeholder.svg';
                      }}
                    />
                  )}

                  {/* Gradient overlay for text readability */}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent"></div>

                  {/* Content - Overlaid on image */}
                  <div className="relative z-10 h-full flex flex-col justify-center px-6 md:px-8">
                    <span className="inline-block self-start rounded-full bg-white/95 backdrop-blur-sm px-3 py-1 text-[9px] font-bold tracking-wider text-gray-900 md:text-[10px] shadow-lg">
                      {slide.badge}
                    </span>
                    <h2 className="mt-3 text-2xl md:text-4xl font-extrabold text-white leading-tight drop-shadow-2xl">
                      {slideTitle}
                    </h2>
                    <p className="mt-1 text-sm md:text-base text-white font-semibold drop-shadow-lg">
                      {slideSubtitle}
                    </p>
                  </div>
                </button>
              </div>
            );
          })}
          
          {/* Slide indicators */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-20 pointer-events-none">
            {adSlides.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all ${
                  idx === currentSlide 
                    ? 'w-6 bg-white' 
                    : 'w-1.5 bg-white/50'
                }`}
              />
            ))}
          </div>
        </section>

        <Section icon={<Flame className="h-5 w-5 text-accent" />} title="Trending Near You" subtitle="Popular with students this week" link="View All" linkTo="/search">
          <ProductGrid items={trending} />
        </Section>

        <Section icon={<Sparkles className="h-5 w-5 text-accent" />} title="Just Listed" subtitle="Fresh from your fellow students" link="See More" linkTo="/search">
          <ProductGrid items={justListed} />
        </Section>
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

const ProductGrid = ({ items }: { items: any[] }) => (
  <div className="-mx-4 overflow-x-auto scrollbar-hide px-4">
    <div className="flex gap-3">
      {items.map((p) => (
        <div key={p.id} className="w-[140px] shrink-0 md:w-[160px]">
          <ProductCard p={p} />
        </div>
      ))}
    </div>
  </div>
);

export default Index;
