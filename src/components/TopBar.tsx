import { Bell, ChevronDown, MapPin, Search, ShoppingCart } from "lucide-react";
import { Logo } from "./Logo";

export const TopBar = () => {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur-lg">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        <Logo />
        <button className="ml-2 hidden items-center gap-1 rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary md:flex">
          <MapPin className="h-3.5 w-3.5 text-accent" />
          UoN Main Campus
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
        <div className="relative ml-auto hidden flex-1 max-w-xl md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Search textbooks, hostels, mitumba, chips mayai..."
            className="w-full rounded-full border border-border bg-background py-2.5 pl-10 pr-24 text-sm outline-none ring-primary/40 focus:ring-2"
          />
          <button className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full gradient-accent px-4 py-1.5 text-xs font-bold text-accent-foreground shadow-accent">
            Search
          </button>
        </div>
        <button className="ml-auto flex h-9 w-9 items-center justify-center rounded-full bg-muted text-foreground hover:bg-secondary md:ml-0">
          <Bell className="h-4 w-4" />
        </button>
        <button className="relative flex h-9 w-9 items-center justify-center rounded-full bg-muted text-foreground hover:bg-secondary">
          <ShoppingCart className="h-4 w-4" />
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full gradient-accent px-1 text-[9px] font-bold text-accent-foreground">
            3
          </span>
        </button>
        <button className="rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary-glow">
          Sign In
        </button>
      </div>
      {/* Mobile search */}
      <div className="px-4 pb-3 md:hidden">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Search products, food, rooms..."
            className="w-full rounded-full border border-border bg-background py-2.5 pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      </div>
    </header>
  );
};
