import { Link, useNavigate } from "react-router-dom";
import { PageShell } from "@/components/PageShell";
import { useShop } from "@/store/shop";
import { Heart, LogOut, Package, Settings, ShoppingBag, Store, Wallet, Download } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const ProfilePage = () => {
  const { user, signOut, favorites, cartCount } = useShop();
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsInstalled(standalone);

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Listen for install prompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallApp = async () => {
    if (isIOS) {
      toast.info("To install on iPhone: Tap Share (⎙) → Add to Home Screen");
      return;
    }

    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        toast.success("App installed successfully!");
        setIsInstalled(true);
      }
      
      setDeferredPrompt(null);
    } else {
      toast.info("App is already installed or not available for installation");
    }
  };

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
    { i: Package, t: "My Orders", s: "Track deliveries", to: "/orders" },
    { i: Store, t: "My Listings", s: "Manage what you sell", to: "/sell" },
  ];

  // Add Install App option if not installed
  const installItem = !isInstalled ? {
    i: Download,
    t: "Install App",
    s: "Quick access from home screen",
    action: handleInstallApp
  } : null;

  return (
    <PageShell title="Profile">
      <div className="rounded-2xl gradient-hero p-5 text-primary-foreground shadow-elevated">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-background/20 text-xl font-extrabold overflow-hidden">
            {user.picture ? (
              <img src={user.picture} alt={user.name} className="h-full w-full object-cover" />
            ) : (
              user.name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex-1">
            <div className="text-lg font-extrabold">{user.name}</div>
            <div className="text-xs opacity-90">{user.email}</div>
            {user.phone && (
              <div className="text-xs opacity-90 mt-1">📱 {user.phone}</div>
            )}
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
        
        {/* Install App Option */}
        {installItem && (
          <button
            onClick={installItem.action}
            className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-accent to-green-600 p-4 shadow-card hover:shadow-elevated transition text-white"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
              <installItem.i className="h-5 w-5" />
            </div>
            <div className="text-left">
              <div className="text-sm font-bold">{installItem.t}</div>
              <div className="text-xs opacity-90">{installItem.s}</div>
            </div>
          </button>
        )}
      </div>

      {/* Settings Button */}
      <Link
        to="/settings"
        className="mt-4 flex items-center gap-3 rounded-xl bg-card p-4 shadow-card hover:shadow-elevated transition"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-primary">
          <Settings className="h-5 w-5" />
        </div>
        <div>
          <div className="text-sm font-bold">Settings</div>
          <div className="text-xs text-muted-foreground">Preferences & notifications</div>
        </div>
      </Link>

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
