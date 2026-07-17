import { Bell, Search, ShoppingCart, Star, Wallet } from "lucide-react";
import { Logo } from "./Logo";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, type FormEvent } from "react";
import { useShop } from "@/store/shop";
import { LuckyCodeModal } from "./LuckyCodeModal";
import { LuckyCodeWelcomePopup } from "./LuckyCodeWelcomePopup";
import { SignInModal } from "./SignInModal";

export const TopBar = () => {
  const navigate = useNavigate();
  const { cartCount, user, unreadNotificationCount } = useShop();
  const [q, setQ] = useState("");
  const [showLuckyCodeModal, setShowLuckyCodeModal] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);

  useEffect(() => {
    // Listen for custom event to open lucky code modal
    const handleOpenLuckyCodeModal = () => {
      setShowLuckyCodeModal(true);
    };

    window.addEventListener('openLuckyCodeModal', handleOpenLuckyCodeModal);
    
    return () => {
      window.removeEventListener('openLuckyCodeModal', handleOpenLuckyCodeModal);
    };
  }, []);

  const handleLuckyCodeClick = () => {
    if (!user) {
      setShowSignInModal(true);
    } else {
      setShowLuckyCodeModal(true);
    }
  };

  const handleNotificationClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      setShowSignInModal(true);
    }
  };

  const handleCartClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      setShowSignInModal(true);
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    navigate(term ? `/search?q=${encodeURIComponent(term)}` : "/search");
  };

  return (
    <>
      <LuckyCodeModal 
        isOpen={showLuckyCodeModal} 
        onClose={() => setShowLuckyCodeModal(false)}
      />
      <LuckyCodeWelcomePopup />
      <SignInModal 
        isOpen={showSignInModal} 
        onClose={() => setShowSignInModal(false)}
        message="Sign in to access this feature and enjoy all Urban Store benefits."
      />
      
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur-lg">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        <Link to="/" aria-label="Urban Store home">
          <Logo />
        </Link>
        <form onSubmit={submit} className="relative ml-auto hidden flex-1 max-w-xl md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search products, brands and categories..."
            className="w-full rounded-full border border-border bg-background py-2.5 pl-10 pr-24 text-sm outline-none ring-primary/40 focus:ring-2"
          />
          <button type="submit" className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full gradient-accent px-4 py-1.5 text-xs font-bold text-accent-foreground shadow-accent">
            Search
          </button>
        </form>
        
        {/* Desktop Layout: Wallet + Lucky Code + Notifications + Cart */}
        <div className="hidden sm:flex items-center gap-2 ml-auto">
          {/* Desktop Wallet */}
          <Link
            to={user ? "/wallet" : "/auth"}
            className="flex items-center gap-1.5 rounded-full bg-accent/10 px-3 py-1.5 text-xs font-bold text-accent hover:bg-accent/20 transition"
            aria-label="Wallet"
          >
            <Wallet className="h-4 w-4" />
            <span className="hidden md:inline">KES {(user?.walletBalance || 0).toLocaleString()}</span>
          </Link>

          {/* Desktop Lucky Code Button */}
          <button
            onClick={handleLuckyCodeClick}
            className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 text-white hover:shadow-lg hover:scale-105 transition-all"
            aria-label="Lucky Code"
          >
            <Star className="h-4 w-4" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          </button>
          
          {/* Desktop Notifications */}
          <Link 
            to="/notifications" 
            onClick={handleNotificationClick}
            className="relative flex h-9 w-9 items-center justify-center rounded-full bg-muted text-foreground hover:bg-secondary" 
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadNotificationCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-lg">
                {unreadNotificationCount}
              </span>
            )}
          </Link>
          
          {/* Desktop Cart */}
          <Link 
            to="/cart" 
            onClick={handleCartClick}
            className="relative flex h-9 w-9 items-center justify-center rounded-full bg-muted text-foreground hover:bg-secondary" 
            aria-label="Cart"
          >
            <ShoppingCart className="h-4 w-4" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-lg">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
        
        {/* Mobile Layout: Wallet + Lucky Code + Notifications + Cart */}
        <div className="sm:hidden flex items-center gap-2 ml-auto">
          {/* Mobile Wallet */}
          <Link
            to={user ? "/wallet" : "/auth"}
            className="relative flex h-9 w-9 items-center justify-center rounded-full bg-accent/10 text-accent hover:bg-accent/20"
            aria-label="Wallet"
          >
            <Wallet className="h-4 w-4" />
          </Link>

          {/* Mobile Lucky Code Button */}
          <button
            onClick={handleLuckyCodeClick}
            className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 text-white hover:shadow-lg hover:scale-105 transition-all"
            aria-label="Lucky Code"
          >
            <Star className="h-4 w-4" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          </button>
          
          {/* Mobile Notifications */}
          <Link 
            to="/notifications" 
            onClick={handleNotificationClick}
            className="relative flex h-9 w-9 items-center justify-center rounded-full bg-muted text-foreground hover:bg-secondary" 
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadNotificationCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-lg">
                {unreadNotificationCount}
              </span>
            )}
          </Link>
          
          {/* Mobile Cart */}
          <Link 
            to="/cart" 
            onClick={handleCartClick}
            className="relative flex h-9 w-9 items-center justify-center rounded-full bg-muted text-foreground hover:bg-secondary" 
            aria-label="Cart"
          >
            <ShoppingCart className="h-4 w-4" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-lg">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>
      {/* Mobile search */}
      <form onSubmit={submit} className="px-4 pb-3 md:hidden">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search products, brands and categories..."
            className="w-full rounded-full border border-border bg-background py-2.5 pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      </form>
    </header>
    </>
  );
};
