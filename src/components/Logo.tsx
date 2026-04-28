import { ShoppingCart, Search } from "lucide-react";

export const Logo = () => (
  <div className="flex items-center gap-2 font-extrabold text-primary">
    <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-elevated">
      <ShoppingCart className="h-4 w-4" />
      <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-accent ring-2 ring-background" />
    </div>
    <div className="leading-none">
      <div className="text-base tracking-tight">
        CAMPUS<span className="text-accent">MART</span>
      </div>
      <div className="mt-0.5 text-[9px] font-medium tracking-[0.2em] text-muted-foreground">
        KENYA · STUDENTS
      </div>
    </div>
  </div>
);
