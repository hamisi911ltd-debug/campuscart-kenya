import { useState } from "react";
import { Ticket, X } from "lucide-react";
import { toast } from "sonner";
import { useShop } from "@/store/shop";
import { Logo } from "@/components/Logo";
import { CelebrationModal } from "./CelebrationModal";
import { notificationService } from "@/services/notificationService";
import { localLuckyCodesService } from "@/utils/luckyCodesLocal";

interface CouponModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CouponModal = ({ isOpen, onClose }: CouponModalProps) => {
  const [couponCode, setCouponCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationData, setCelebrationData] = useState<{ points: number } | null>(null);
  const { user, refreshUser, updateWalletBalance } = useShop();

  if (!isOpen) return null;

  const redeemCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }

    if (!user) {
      toast.error('Please sign in to redeem coupons');
      return;
    }

    setIsRedeeming(true);

    try {
      // First try the API
      const response = await fetch('/api/lucky-codes/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponCode.toUpperCase(),
          userId: user.id
        }),
      });

      let data;

      if (response.ok) {
        data = await response.json();
      } else {
        // API failed, use local fallback
        console.log('API not available, using local fallback');
        data = await localLuckyCodesService.redeemCode(
          couponCode.toUpperCase(),
          user.id,
          user.walletBalance || 0
        );
      }

      if (data.success) {
        // Show celebration modal instead of toast
        setCelebrationData({ points: data.points });
        setShowCelebration(true);
        setCouponCode('');
        onClose(); // Close the coupon modal

        // Show notification popup
        notificationService.showLuckyCodeSuccess(data.points);

        // Update user wallet balance in the store immediately if new balance is provided
        if (data.newBalance !== undefined) {
          updateWalletBalance(data.newBalance);
        }

        // Also refresh user data to ensure everything is in sync
        if (refreshUser) refreshUser();
      } else {
        toast.error(data.error || 'Invalid coupon code');
      }

    } catch (error) {
      console.error('Error redeeming coupon:', error);

      // If network error, try local fallback
      try {
        console.log('Network error, trying local fallback');
        const localData = await localLuckyCodesService.redeemCode(
          couponCode.toUpperCase(),
          user.id,
          user.walletBalance || 0
        );

        if (localData.success) {
          setCelebrationData({ points: localData.points });
          setShowCelebration(true);
          setCouponCode('');
          onClose();
          notificationService.showLuckyCodeSuccess(localData.points!);

          // Update wallet balance immediately for local fallback
          if (localData.newBalance !== undefined) {
            updateWalletBalance(localData.newBalance);
          }

          if (refreshUser) refreshUser();
        } else {
          toast.error(localData.error || 'Invalid coupon code');
        }
      } catch (localError) {
        console.error('Local fallback also failed:', localError);
        toast.error('Failed to redeem coupon. Please try again.');
      }
    } finally {
      setIsRedeeming(false);
    }
  };

  return (
    <>
      <CelebrationModal
        isOpen={showCelebration}
        onClose={() => setShowCelebration(false)}
        type="lucky_code"
        title="🎉 Congratulations!"
        message="You've successfully redeemed your coupon!"
        points={celebrationData?.points || 0}
      />

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card rounded-3xl shadow-2xl border border-border/50 w-full max-w-md mx-4 overflow-hidden">
            {/* Header — same logo treatment as the Sign In page */}
            <div className="relative px-6 pt-6 pb-5">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex flex-col items-center text-center">
                <div className="mb-4">
                  <Logo />
                </div>
                <h2 className="text-xl font-extrabold text-foreground">Have a Coupon?</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Enter your code to earn wallet points!
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 pb-6">
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Enter Coupon Code"
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-center text-base sm:text-lg font-mono tracking-wider outline-none transition-all focus:ring-2 focus:ring-accent/40 hover:border-accent/50"
                    onKeyPress={(e) => e.key === 'Enter' && redeemCoupon()}
                    maxLength={20}
                  />
                </div>

                <button
                  onClick={redeemCoupon}
                  disabled={isRedeeming || !couponCode.trim()}
                  className="w-full rounded-xl gradient-accent py-3 text-sm sm:text-base font-bold text-accent-foreground shadow-accent hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
                >
                  {isRedeeming ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Redeeming...
                    </>
                  ) : (
                    <>
                      <Ticket className="h-4 w-4" />
                      Redeem Coupon
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
