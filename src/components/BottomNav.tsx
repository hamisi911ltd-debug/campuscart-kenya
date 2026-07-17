import { Home, LayoutGrid, ShoppingCart, Package, UserCircle2 } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useShop } from "@/store/shop";

const tabs = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/categories", label: "Categories", icon: LayoutGrid },
  { to: "/cart", label: "Cart", icon: ShoppingCart, badge: true },
  { to: "/orders", label: "Orders", icon: Package },
  { to: "/profile", label: "Account", icon: UserCircle2 },
];

export const BottomNav = () => {
  const { cartCount } = useShop();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-lg shadow-elevated"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Primary"
    >
      <div className="mx-auto flex w-full max-w-2xl items-stretch justify-between px-2 sm:px-6">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium sm:text-xs"
            >
              {({ isActive }) => (
                <>
                  <div
                    className={`relative flex h-9 w-14 items-center justify-center rounded-full transition sm:h-10 sm:w-16 ${
                      isActive ? "gradient-accent shadow-accent" : ""
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 sm:h-[22px] sm:w-[22px] ${
                        isActive ? "text-accent-foreground" : "text-muted-foreground"
                      }`}
                    />
                    {t.badge && cartCount > 0 && (
                      <span className="absolute right-1 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground shadow">
                        {cartCount}
                      </span>
                    )}
                  </div>
                  <span className={isActive ? "text-accent" : "text-muted-foreground"}>
                    {t.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
