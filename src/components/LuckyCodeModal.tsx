import { useState } from "react";
import { Ticket, Sparkles, X, Wallet, Star } from "lucide-react";
import { toast } from "sonner";
import { useShop } from "@/store/shop";
import { CelebrationModal } from "./CelebrationModal";
import { notificationService } from "@/services/notificationService";
import { localLuckyCodesService } from "@/utils/luckyCodesLocal";

interface LuckyCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LuckyCodeModal = ({ isOpen, onClose }: LuckyCodeModalProps) => {
  const [luckyCode, setLuckyCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationData, setCelebrationData] = useState<{ points: number } | null>(null);
  const { user, refreshUser, updateWalletBalance } = useShop();

  if (!isOpen) return null;

  const redeemLuckyCode = async () => {
    if (!luckyCode.trim()) {
      toast.error('Please enter a lucky code');
      return;
    }

    if (!user) {
      toast.error('Please sign in to redeem lucky codes');
      return;
    }

    setIsRedeeming(true);
    
    try {
      // First try the API
      const response = await fetch('/api/lucky-codes/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code: luckyCode.toUpperCase(),
          userId: user.id 
        }),
      });

      let data;
      let useLocalFallback = false;

      if (response.ok) {
        data = await response.json();
      } else {
        // API failed, use local fallback
        console.log('API not available, using local fallback');
        useLocalFallback = true;
        data = await localLuckyCodesService.redeemCode(
          luckyCode.toUpperCase(), 
          user.id, 
          user.walletBalance || 0
        );
      }

      if (data.success) {
        // Show celebration modal instead of toast
        setCelebrationData({ points: data.points });
        setShowCelebration(true);
        setLuckyCode('');
        onClose(); // Close the lucky code modal
        
        // Show notification popup
        notificationService.showLuckyCodeSuccess(data.points);
        
        // Update user wallet balance in the store
        if (useLocalFallback && data.newBalance !== undefined) {
          // For local fallback, update the user's wallet balance immediately
          updateWalletBalance(data.newBalance);
        }
        
        // Refresh user data to update wallet balance
        if (refreshUser) refreshUser();
      } else {
        toast.error(data.error || 'Invalid lucky code');
      }

    } catch (error) {
      console.error('Error redeeming lucky code:', error);
      
      // If network error, try local fallback
      try {
        console.log('Network error, trying local fallback');
        const localData = await localLuckyCodesService.redeemCode(
          luckyCode.toUpperCase(), 
          user.id, 
          user.walletBalance || 0
        );
        
        if (localData.success) {
          setCelebrationData({ points: localData.points });
          setShowCelebration(true);
          setLuckyCode('');
          onClose();
          notificationService.showLuckyCodeSuccess(localData.points!);
          
          // Update wallet balance immediately for local fallback
          if (localData.newBalance !== undefined) {
            updateWalletBalance(localData.newBalance);
          }
          
          if (refreshUser) refreshUser();
        } else {
          toast.error(localData.error || 'Invalid lucky code');
        }
      } catch (localError) {
        console.error('Local fallback also failed:', localError);
        toast.error('Failed to redeem lucky code. Please try again.');
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
        message="You've successfully redeemed your lucky code!"
        points={celebrationData?.points || 0}
      />
      
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            {/* Header */}
            <div className="relative bg-gradient-to-r from-purple-500 to-pink-500 p-4 sm:p-6 text-white">
              <button
                onClick={onClose}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 p-1 text-white/80 hover:text-white transition-colors"
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-full">
                  <Ticket className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold">Lucky Code</h2>
                  <p className="text-white/90 text-xs sm:text-sm">Enter your code to earn wallet points!</p>
                </div>
              </div>
              
              {/* Decorative elements */}
              <div className="absolute -top-2 -right-2 w-12 h-12 sm:w-16 sm:h-16 bg-white/10 rounded-full blur-xl"></div>
              <div className="absolute -bottom-2 -left-2 w-16 h-16 sm:w-20 sm:h-20 bg-white/10 rounded-full blur-xl"></div>
              <Sparkles className="absolute top-2 right-10 sm:right-12 h-3 w-3 sm:h-4 sm:w-4 text-white/60" />
              <Star className="absolute bottom-2 left-10 sm:left-12 h-2 w-2 sm:h-3 sm:w-3 text-white/60" />
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6">
              {/* Wallet Balance Display */}
              {user && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 mb-1">
                    <Wallet className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 dark:text-green-400" />
                    <span className="text-xs sm:text-sm font-medium text-green-800 dark:text-green-200">Your Wallet</span>
                  </div>
                  <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
                    KES {((user.walletBalance || 0) / 10).toLocaleString()}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400 opacity-75">
                    {(user.walletBalance || 0).toLocaleString()} points (10 points = KES 1)
                  </p>
                </div>
              )}

              {/* Input Section */}
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Enter Lucky Code
                  </label>
                  <input
                    type="text"
                    value={luckyCode}
                    onChange={(e) => setLuckyCode(e.target.value.toUpperCase())}
                    placeholder="e.g., LUCKY123"
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-center text-base sm:text-lg font-mono tracking-wider"
                    onKeyPress={(e) => e.key === 'Enter' && redeemLuckyCode()}
                    maxLength={20}
                  />
                </div>

                <button
                  onClick={redeemLuckyCode}
                  disabled={isRedeeming || !luckyCode.trim()}
                  className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold flex items-center justify-center gap-2 text-sm sm:text-base"
                >
                  {isRedeeming ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Redeeming...
                    </>
                  ) : (
                    <>
                      <Ticket className="h-4 w-4" />
                      Redeem Lucky Code
                    </>
                  )}
                </button>
              </div>

              {/* Info */}
              <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2 text-sm sm:text-base">
                  <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500" />
                  How it works
                </h3>
                <ul className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Get lucky codes from CampusMart promotions</li>
                  <li>• Enter the code to earn wallet points</li>
                  <li>• 10 points = KES 1 for purchases</li>
                  <li>• Each code can only be used once per account</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};