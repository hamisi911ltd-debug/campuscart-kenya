import { Bell, ChevronDown, MapPin, Search, ShoppingCart, Wallet, Star } from "lucide-react";
import { Logo } from "./Logo";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, type FormEvent } from "react";
import { useShop } from "@/store/shop";
import { LuckyCodeModal } from "./LuckyCodeModal";
import { LuckyCodeWelcomePopup } from "./LuckyCodeWelcomePopup";

const campuses = ["UoN Main Campus", "JKUAT Juja", "Kenyatta U.", "Strathmore", "Daystar", "UoN Kikuyu", "Moi University", "Egerton"];

export const TopBar = () => {
  const navigate = useNavigate();
  const { cartCount, user, unreadNotificationCount } = useShop();
  const [q, setQ] = useState("");
  const [campus, setCampus] = useState(campuses[0]);
  const [openCampus, setOpenCampus] = useState(false);
  const [showLuckyCodeModal, setShowLuckyCodeModal] = useState(false);

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
      
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur-lg">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        <Link to="/" aria-label="CampusMart home">
          <Logo />
        </Link>
        <div className="relative ml-2 hidden md:block">
          <button
            onClick={() => setOpenCampus((v) => !v)}
            className="flex items-center gap-1 rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary"
          >
            <MapPin className="h-3.5 w-3.5 text-accent" />
            {campus}
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          {openCampus && (
            <div className="absolute left-0 top-full z-40 mt-1 w-56 overflow-hidden rounded-xl border border-border bg-card shadow-elevated">
              {campuses.map((c) => (
                <button
                  key={c}
                  onClick={() => { setCampus(c); setOpenCampus(false); }}
                  className={`block w-full px-3 py-2 text-left text-xs hover:bg-muted ${c === campus ? "font-bold text-accent" : "text-foreground"}`}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>
        <form onSubmit={submit} className="relative ml-auto hidden flex-1 max-w-xl md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search textbooks, hostels, mitumba, chips mayai..."
            className="w-full rounded-full border border-border bg-background py-2.5 pl-10 pr-24 text-sm outline-none ring-primary/40 focus:ring-2"
          />
          <button type="submit" className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full gradient-accent px-4 py-1.5 text-xs font-bold text-accent-foreground shadow-accent">
            Search
          </button>
        </form>
        
        {/* Wallet Balance - Only show for logged in users */}
        {user && (
          <Link to="/profile" className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-full border border-green-200 dark:border-green-800 ml-1 sm:ml-0 hover:shadow-md transition-all active:scale-95">
            <Wallet className="h-4 w-4 sm:h-3.5 sm:w-3.5 text-green-600 dark:text-green-400" />
            <span className="text-xs font-bold text-green-600 dark:text-green-400">
              {(user.walletBalance || 0).toLocaleString()}
            </span>
          </Link>
        )}
        
        {/* Desktop Lucky Code Button - Only show for logged in users */}
        {user && (
          <button
            onClick={() => setShowLuckyCodeModal(true)}
            className="hidden sm:flex relative h-9 w-9 items-center justify-center rounded-full bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 text-white hover:shadow-lg hover:scale-105 transition-all animate-pulse"
            aria-label="Lucky Code"
          >
            <Star className="h-4 w-4 fill-current" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-bounce"></div>
          </button>
        )}
        
        {/* Mobile Layout: Lucky Code + Notifications + Cart */}
        <div className="sm:hidden flex items-center gap-2 ml-auto">
          {/* Mobile Lucky Code Button */}
          {user && (
            <button
              onClick={() => setShowLuckyCodeModal(true)}
              className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 text-white hover:shadow-lg hover:scale-105 transition-all animate-pulse"
              aria-label="Lucky Code"
            >
              <Star className="h-4 w-4 fill-current" />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-bounce"></div>
            </button>
          )}
          
          {/* Notifications */}
          <Link to="/notifications" className="relative flex h-9 w-9 items-center justify-center rounded-full bg-muted text-foreground hover:bg-secondary" aria-label="Notifications">
            <Bell className="h-4 w-4" />
            {unreadNotificationCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-lg">
                {unreadNotificationCount}
              </span>
            )}
          </Link>
          
          {/* Cart */}
          <Link to="/cart" className="relative flex h-9 w-9 items-center justify-center rounded-full bg-muted text-foreground hover:bg-secondary" aria-label="Cart">
            <ShoppingCart className="h-4 w-4" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-lg">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
        
        {/* Desktop Notifications and Cart */}
        <Link to="/notifications" className="hidden sm:flex relative h-9 w-9 items-center justify-center rounded-full bg-muted text-foreground hover:bg-secondary" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {unreadNotificationCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-lg">
              {unreadNotificationCount}
            </span>
          )}
        </Link>
        <Link to="/cart" className="hidden sm:flex relative h-9 w-9 items-center justify-center rounded-full bg-muted text-foreground hover:bg-secondary" aria-label="Cart">
          <ShoppingCart className="h-4 w-4" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-lg">
              {cartCount}
            </span>
          )}
        </Link>
      </div>
      {/* Mobile search */}
      <form onSubmit={submit} className="px-4 pb-3 md:hidden">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search products, food, rooms..."
            className="w-full rounded-full border border-border bg-background py-2.5 pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      </form>
    </header>
    </>
  );
};
