import { Bell, ChevronDown, MapPin, Search, ShoppingCart } from "lucide-react";
import { Logo } from "./Logo";
import { Link, useNavigate } from "react-router-dom";
import { useState, type FormEvent } from "react";
import { useShop } from "@/store/shop";

const campuses = ["UoN Main Campus", "JKUAT Juja", "Kenyatta U.", "Strathmore", "Daystar", "UoN Kikuyu", "Moi University", "Egerton"];

export const TopBar = () => {
  const navigate = useNavigate();
  const { cartCount, user } = useShop();
  const [q, setQ] = useState("");
  const [campus, setCampus] = useState(campuses[0]);
  const [openCampus, setOpenCampus] = useState(false);
  
  // Mock notification count - in real app, fetch from API
  const notificationCount = 3; // You can replace this with actual notification count from your store/API

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    navigate(term ? `/search?q=${encodeURIComponent(term)}` : "/search");
  };

  return (
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
        <Link to="/notifications" className="relative ml-auto flex h-9 w-9 items-center justify-center rounded-full bg-muted text-foreground hover:bg-secondary md:ml-0" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {notificationCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-lg">
              {notificationCount}
            </span>
          )}
        </Link>
        <Link to="/cart" className="relative flex h-9 w-9 items-center justify-center rounded-full bg-muted text-foreground hover:bg-secondary" aria-label="Cart">
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
  );
};
