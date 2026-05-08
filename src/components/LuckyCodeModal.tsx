import { useState } from "react";
import { Gift, Sparkles, X, Wallet, Star } from "lucide-react";
import { toast } from "sonner";
import { useShop } from "@/store/shop";

interface LuckyCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LuckyCodeModal = ({ isOpen, onClose }: LuckyCodeModalProps) => {
  const [luckyCode, setLuckyCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const { user, refreshUser } = useShop();

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
      const response = await fetch('/api/lucky-codes/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code: luckyCode.toUpperCase(),
          userId: user.id 
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(`🎉 Lucky! You earned KES ${data.points.toLocaleString()} in your wallet!`);
        setLuckyCode('');
        onClose();
        // Refresh user data to update wallet balance
        if (refreshUser) refreshUser();
      } else {
        toast.error(data.error || 'Invalid lucky code');
      }

    } catch (error) {
      console.error('Error redeeming lucky code:', error);
      toast.error('Failed to redeem lucky code. Please try again.');
    } finally {
      setIsRedeeming(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 text-white/80 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-12 h-12 bg-white/20 rounded-full">
              <Gift className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Lucky Code</h2>
              <p className="text-white/90 text-sm">Enter your code to earn wallet points!</p>
            </div>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute -top-2 -right-2 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute -bottom-2 -left-2 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
          <Sparkles className="absolute top-2 right-12 h-4 w-4 text-white/60" />
          <Star className="absolute bottom-2 left-12 h-3 w-3 text-white/60" />
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Wallet Balance Display */}
          {user && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4 mb-6 border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-1">
                <Wallet className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-800 dark:text-green-200">Your Wallet</span>
              </div>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                KES {(user.walletBalance || 0).toLocaleString()}
              </p>
            </div>
          )}

          {/* Input Section */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Enter Lucky Code
              </label>
              <input
                type="text"
                value={luckyCode}
                onChange={(e) => setLuckyCode(e.target.value.toUpperCase())}
                placeholder="e.g., LUCKY123"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-center text-lg font-mono tracking-wider"
                onKeyPress={(e) => e.key === 'Enter' && redeemLuckyCode()}
                maxLength={20}
              />
            </div>

            <button
              onClick={redeemLuckyCode}
              disabled={isRedeeming || !luckyCode.trim()}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold flex items-center justify-center gap-2"
            >
              {isRedeeming ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Redeeming...
                </>
              ) : (
                <>
                  <Gift className="h-4 w-4" />
                  Redeem Lucky Code
                </>
              )}
            </button>
          </div>

          {/* Info */}
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-500" />
              How it works
            </h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Get lucky codes from CampusMart promotions</li>
              <li>• Enter the code to earn wallet points</li>
              <li>• Use wallet points for future purchases</li>
              <li>• Each code can only be used once per account</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};