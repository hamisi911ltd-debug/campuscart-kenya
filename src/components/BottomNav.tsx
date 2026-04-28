import { Home, Store, UtensilsCrossed, Building2, User } from "lucide-react";
import { NavLink } from "react-router-dom";

const tabs = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/category/electronics", label: "Market", icon: Store },
  { to: "/category/food", label: "Food", icon: UtensilsCrossed },
  { to: "/category/hostels", label: "Rooms", icon: Building2 },
  { to: "/profile", label: "Profile", icon: User },
];

export const BottomNav = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-lg shadow-elevated md:hidden">
      <div className="mx-auto flex max-w-md items-stretch justify-between px-2">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.end}
              className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium"
            >
              {({ isActive }) => (
                <>
                  <div className={`flex h-9 w-12 items-center justify-center rounded-full transition ${isActive ? "gradient-accent shadow-accent" : ""}`}>
                    <Icon className={`h-5 w-5 ${isActive ? "text-accent-foreground" : "text-muted-foreground"}`} />
                  </div>
                  <span className={isActive ? "text-accent" : "text-muted-foreground"}>{t.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
