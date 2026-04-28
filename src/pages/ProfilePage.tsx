import { Link, useNavigate } from "react-router-dom";
import { PageShell } from "@/components/PageShell";
import { useShop } from "@/store/shop";
import { Heart, LogOut, Package, Settings, ShoppingBag, Store, Wallet } from "lucide-react";

const ProfilePage = () => {
  const { user, signOut, favorites, cartCount } = useShop();
  const navigate = useNavigate();

  if (!user) {
    return (
      <PageShell title="Profile">
        <div className="rounded-2xl bg-card p-8 text-center shadow-card">
          <p className="text-sm text-muted-foreground">Sign in to view your profile, orders & listings.</p>
          <Link to="/auth" className="mt-4 inline-block rounded-full gradient-accent px-6 py-2.5 text-sm font-bold text-accent-foreground shadow-accent">
            Sign in / Create account
          </Link>
        </div>
      </PageShell>
    );
  }

  const items = [
    { i: ShoppingBag, t: "My Cart", s: `${cartCount} items`, to: "/cart" },
    { i: Heart, t: "Favorites", s: `${favorites.length} saved`, to: "/favorites" },
    { i: Package, t: "My Orders", s: "Track deliveries", to: "/cart" },
    { i: Store, t: "My Listings", s: "Manage what you sell", to: "/sell" },
    { i: Wallet, t: "M-PESA Wallet", s: "Payouts & history", to: "/profile" },
    { i: Settings, t: "Settings", s: "Preferences", to: "/profile" },
  ];

  return (
    <PageShell title="Profile">
      <div className="rounded-2xl gradient-hero p-5 text-primary-foreground shadow-elevated">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-background/20 text-xl font-extrabold">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-lg font-extrabold">{user.name}</div>
            <div className="text-xs opacity-90">{user.email}</div>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((x) => (
          <Link key={x.t} to={x.to} className="flex items-center gap-3 rounded-xl bg-card p-4 shadow-card hover:shadow-elevated transition">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-primary"><x.i className="h-5 w-5" /></div>
            <div>
              <div className="text-sm font-bold">{x.t}</div>
              <div className="text-xs text-muted-foreground">{x.s}</div>
            </div>
          </Link>
        ))}
      </div>

      <button
        onClick={() => { signOut(); navigate("/"); }}
        className="mt-6 flex items-center gap-2 rounded-full bg-muted px-5 py-2.5 text-sm font-bold text-foreground hover:bg-secondary"
      >
        <LogOut className="h-4 w-4" /> Sign out
      </button>
    </PageShell>
  );
};

export default ProfilePage;
