import { Link, useNavigate } from "react-router-dom";
import { PageShell } from "@/components/PageShell";
import { useShop } from "@/store/shop";
import { Heart, LogOut, Package, Settings, ShoppingBag, Wallet, Download, MessageCircle, HelpCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { CelebrationModal } from "@/components/CelebrationModal";
import { CouponModal } from "@/components/CouponModal";

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
  const [showLoginCelebration, setShowLoginCelebration] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);

  useEffect(() => {
    // Check if user just logged in
    const justLoggedIn = sessionStorage.getItem('campusmart_just_logged_in');
    if (justLoggedIn && user) {
      sessionStorage.removeItem('campusmart_just_logged_in');
      // Show login celebration
      const timer = setTimeout(() => {
        setShowLoginCelebration(true);
      }, 800); // Small delay to let page load
      return () => clearTimeout(timer);
    }

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
  }, [user]);

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

  const handleContactSupport = () => {
    const adminPhone = "254108254465";
    const message = `Hello CampusMart Support,\n\nI need help with:\n\n[Please describe your issue or feedback here]\n\n---\nUser: ${user?.name || 'Guest'}\nPhone: ${user?.phone || 'N/A'}`;
    
    // Detect if mobile device
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    // Use whatsapp:// protocol to open app directly on mobile
    const whatsappUrl = isMobile 
      ? `whatsapp://send?phone=${adminPhone}&text=${encodeURIComponent(message)}`
      : `https://wa.me/${adminPhone}?text=${encodeURIComponent(message)}`;
    
    window.location.href = whatsappUrl;
  };

  if (!user) {
    return (
      <PageShell title="Profile" noIndex>
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
  ];

  // Add Install App option if not installed
  const installItem = !isInstalled ? {
    i: Download,
    t: "Install App",
    s: "Quick access from home screen",
    action: handleInstallApp
  } : null;

  return (
    <>
      <CouponModal
        isOpen={showCouponModal}
        onClose={() => setShowCouponModal(false)}
      />
      
      <CelebrationModal
        isOpen={showLoginCelebration}
        onClose={() => setShowLoginCelebration(false)}
        type="login"
        title="Welcome Back!"
        message={`Great to see you again, ${user?.name?.split(' ')[0] || 'friend'}! 🎉`}
      />
      
      <PageShell title="Profile" noIndex>
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
            {user.phone && (
              <div className="text-xs opacity-90 mt-1">📱 {user.phone}</div>
            )}
          </div>
        </div>
      </div>

      {/* Wallet Section - Mobile Priority */}
      <div className="mt-5 rounded-2xl gradient-hero p-5 text-primary-foreground shadow-elevated">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            <h3 className="font-bold">My Wallet</h3>
          </div>
          <div className="text-right">
            <div className="text-2xl font-extrabold">
              KES {(user.walletBalance || 0).toLocaleString()}
            </div>
            <div className="text-xs opacity-90">Available balance</div>
          </div>
        </div>
        <p className="text-xs opacity-90">
          Top up with M-Pesa and pay for orders instantly from your balance.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Link
            to="/wallet"
            className="flex items-center justify-center gap-1.5 py-2.5 bg-accent text-accent-foreground rounded-xl font-bold text-sm shadow-accent hover:scale-[1.02] transition"
          >
            <Wallet className="h-4 w-4" /> Top Up
          </Link>
          <button
            onClick={() => setShowCouponModal(true)}
            className="flex items-center justify-center gap-1.5 py-2.5 bg-white/15 text-primary-foreground rounded-xl font-bold text-sm hover:bg-white/25 transition"
          >
            Redeem Code
          </button>
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

      {/* Install App Button - Below Settings, Blue Color */}
      <button
        onClick={handleInstallApp}
        className="mt-4 flex items-center gap-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 p-4 shadow-card hover:shadow-elevated transition text-white w-full"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
          <Download className="h-5 w-5" />
        </div>
        <div className="text-left">
          <div className="text-sm font-bold">Install App</div>
          <div className="text-xs opacity-90">Quick access from home screen</div>
        </div>
      </button>

      {/* Support & Feedback Section */}
      <div className="mt-4 rounded-xl bg-card p-4 shadow-card border border-border">
        <div className="flex items-center gap-2 mb-2">
          <HelpCircle className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Need Help?</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Have an issue or feedback? Contact our support team via WhatsApp.
        </p>
        <button
          onClick={handleContactSupport}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary hover:bg-primary-glow p-2.5 shadow-md hover:shadow-lg transition text-primary-foreground font-bold text-xs"
        >
          <MessageCircle className="h-4 w-4" />
          Contact Support
        </button>
      </div>

      <button
        onClick={() => { signOut(); navigate("/"); }}
        className="mt-6 flex items-center gap-2 rounded-full bg-muted px-5 py-2.5 text-sm font-bold text-foreground hover:bg-secondary"
      >
        <LogOut className="h-4 w-4" /> Sign out
      </button>
    </PageShell>
    </>
  );
};

export default ProfilePage;
