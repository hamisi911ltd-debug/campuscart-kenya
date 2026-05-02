import { ArrowRight, Flame, Sparkles, Truck, Shield, Wallet, Zap } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { TopBar } from "@/components/TopBar";
import { BottomNav } from "@/components/BottomNav";
import { ProductCard } from "@/components/ProductCard";
import { FlashCountdown } from "@/components/FlashCountdown";
import { SignInModal } from "@/components/SignInModal";
import { useShop } from "@/store/shop";
import { categories, getProducts, getProductsSync, getStaticProducts, transformDatabaseProduct } from "@/data/products";

// Import category images for slides
import catBooks from "@/assets/cat-books.jpg";
import catElec from "@/assets/cat-electronics.jpg";
import catFashion from "@/assets/cat-fashion.jpg";
import catFood from "@/assets/cat-food.jpg";
import catRooms from "@/assets/cat-rooms.jpg";
import catStat from "@/assets/cat-stationery.jpg";
import catFurn from "@/assets/cat-furniture.jpg";

// Gen Z Catchy Product Slides - Replace these URLs with actual Pinterest images
const getDefaultAdSlides = () => {
  return [
    {
      bg: "transparent",
      badge: "TRENDING",
      title: "AirPods Pro 🎧",
      subtitle: "Wireless Freedom Awaits",
      categorySlug: "electronics",
      imageUrl: "https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7?w=1200&h=600&fit=crop", // Replace with Pinterest image
    },
    {
      bg: "transparent",
      badge: "HOT DEAL",
      title: "MacBook Air M2 💻",
      subtitle: "Power Meets Portability",
      categorySlug: "electronics",
      imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1200&h=600&fit=crop", // Replace with Pinterest image
    },
    {
      bg: "transparent",
      badge: "FASHION",
      title: "Streetwear Vibes 👟",
      subtitle: "Fresh Kicks & Fits",
      categorySlug: "fashion",
      imageUrl: "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=1200&h=600&fit=crop", // Replace with Pinterest image
    },
    {
      bg: "transparent",
      badge: "FOOD",
      title: "Campus Eats 🍕",
      subtitle: "Delivered Hot & Fast",
      categorySlug: "food",
      imageUrl: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1200&h=600&fit=crop", // Replace with Pinterest image
    },
    {
      bg: "transparent",
      badge: "BOOKS",
      title: "Textbooks 50% OFF 📚",
      subtitle: "Save Big This Semester",
      categorySlug: "books",
      imageUrl: "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=1200&h=600&fit=crop", // Replace with Pinterest image
    },
    {
      bg: "transparent",
      badge: "GAMING",
      title: "PS5 & Accessories 🎮",
      subtitle: "Level Up Your Game",
      categorySlug: "electronics",
      imageUrl: "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=1200&h=600&fit=crop", // Replace with Pinterest image
    },
    {
      bg: "transparent",
      badge: "ROOMS",
      title: "Cozy Hostels 🏠",
      subtitle: "Your Home Away From Home",
      categorySlug: "hostels",
      imageUrl: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&h=600&fit=crop", // Replace with Pinterest image
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
  const [products, setProducts] = useState<ProductWithCategory[]>(getProductsSync() || []);
  const [adSlides, setAdSlides] = useState(getDefaultAdSlides()); // Fixed ads, never changes
  const [showSignInModal, setShowSignInModal] = useState(false);

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
            // Check if this is an admin ad or category slide
            const isAdminAd = 'isAdminAd' in slide && slide.isAdminAd;
            const isCategorySlide = 'categorySlug' in slide;
            const imageUrl = isAdminAd ? slide.imageUrl : (isCategorySlide ? slide.imageUrl : null);
            const slideTitle = slide.title;
            const slideSubtitle = slide.subtitle;
            
            const handleClick = () => {
              if (isAdminAd && slide.link) {
                navigate(slide.link);
              } else if (isCategorySlide && slide.categorySlug) {
                navigate(`/category/${slide.categorySlug}`);
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
                  {/* Category/Ad image */}
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt={slideTitle}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder.svg';
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

        <Section icon={<Flame className="h-5 w-5 text-accent" />} title="Trending Near You" subtitle="Popular with students this week" link="View All" linkTo="/search?sort=trending">
          <ProductGrid items={trending} />
        </Section>

        <Section icon={<Sparkles className="h-5 w-5 text-accent" />} title="Just Listed" subtitle="Fresh from your fellow students" link="See More" linkTo="/search?sort=newest">
          <ProductGrid items={justListed} />
        </Section>

        {/* Post Item CTA Card - Shows at bottom */}
        <div className="mt-8 mb-4">
          <div 
            onClick={() => {
              if (!user) {
                setShowSignInModal(true);
              } else {
                navigate('/sell');
              }
            }}
            className="relative overflow-hidden rounded-xl bg-gradient-to-r from-accent/10 via-primary/10 to-accent/10 p-3 shadow-card hover:shadow-elevated transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1">
                <h3 className="text-sm font-extrabold text-foreground mb-0.5">
                  Got something to sell?
                </h3>
                <p className="text-xs text-muted-foreground">
                  List your item in seconds
                </p>
              </div>
              <button className="shrink-0 rounded-full gradient-accent px-4 py-2 text-xs font-bold text-accent-foreground shadow-accent hover:scale-105 transition-transform">
                Post Now
              </button>
            </div>
            {/* Decorative elements */}
            <div className="absolute -right-3 -top-3 h-16 w-16 rounded-full bg-accent/5 blur-xl"></div>
            <div className="absolute -left-3 -bottom-3 h-16 w-16 rounded-full bg-primary/5 blur-xl"></div>
          </div>
        </div>
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
