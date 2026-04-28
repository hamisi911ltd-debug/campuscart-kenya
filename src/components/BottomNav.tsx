import { Home, Store, UtensilsCrossed, Building2, User } from "lucide-react";
import { useState } from "react";

const tabs = [
  { id: "home", label: "Home", icon: Home },
  { id: "market", label: "Market", icon: Store },
  { id: "food", label: "Food", icon: UtensilsCrossed },
  { id: "rooms", label: "Rooms", icon: Building2 },
  { id: "profile", label: "Profile", icon: User },
];

export const BottomNav = () => {
  const [active, setActive] = useState("home");
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-lg shadow-elevated md:hidden">
      <div className="mx-auto flex max-w-md items-stretch justify-between px-2">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = active === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium"
            >
              <div
                className={`flex h-9 w-12 items-center justify-center rounded-full transition ${
                  isActive ? "gradient-accent shadow-accent" : ""
                }`}
              >
                <Icon
                  className={`h-5 w-5 ${
                    isActive ? "text-accent-foreground" : "text-muted-foreground"
                  }`}
                />
              </div>
              <span className={isActive ? "text-accent" : "text-muted-foreground"}>
                {t.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
