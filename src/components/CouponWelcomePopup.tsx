import { useState, useEffect } from "react";
import { X, Gift, Sparkles } from "lucide-react";
import { useShop } from "@/store/shop";
import { Logo } from "@/components/Logo";

export const CouponWelcomePopup = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { user } = useShop();

  useEffect(() => {
    // Check if user has seen the welcome popup before (use a general key, not user-specific)
    const hasSeenPopup = localStorage.getItem('luckycode_welcome_shown');

    if (!hasSeenPopup) {
      // Show popup after a short delay for all users
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    // Mark as seen globally
    localStorage.setItem('luckycode_welcome_shown', 'true');
  };

  const handleTryNow = () => {
    handleClose();
    // Trigger the coupon modal
    const event = new CustomEvent('openCouponModal');
    window.dispatchEvent(event);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-card rounded-3xl shadow-2xl border border-border/50 w-full max-w-sm mx-4 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        {/* Header — same logo treatment as the Sign In page */}
        <div className="relative px-6 pt-6 pb-5">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex flex-col items-center text-center">
            <div className="mb-4">
              <Logo />
            </div>
            <h2 className="text-xl font-extrabold text-foreground">Welcome to CampusMart!</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {user ? "You've got coupons waiting!" : "Sign up and get coupons!"}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          <div className="text-center mb-6">
            <h3 className="font-bold text-foreground mb-2 flex items-center justify-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" />
              Free Points Awaiting!
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {user
                ? "Redeem coupons to earn wallet points and save money on your purchases!"
                : "Sign up now to redeem coupons, earn wallet points, and save money on your purchases!"
              }
            </p>

            {/* Sample codes preview */}
            <div className="bg-muted rounded-xl p-3 mb-4">
              <p className="text-xs text-muted-foreground mb-2 flex items-center justify-center gap-1">
                <Gift className="h-3 w-3" /> Try these codes:
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <span className="px-2 py-1 bg-accent/10 text-accent rounded text-xs font-mono font-bold">
                  WELCOME500
                </span>
                <span className="px-2 py-1 bg-accent/10 text-accent rounded text-xs font-mono font-bold">
                  STUDENT100
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              Maybe Later
            </button>
            <button
              onClick={handleTryNow}
              className="flex-1 py-2.5 px-4 rounded-xl gradient-accent text-sm font-bold text-accent-foreground shadow-accent hover:scale-[1.02] transition-all"
            >
              {user ? "Try Now!" : "Sign Up & Try!"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
