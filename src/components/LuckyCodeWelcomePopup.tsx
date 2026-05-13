import { useState, useEffect } from "react";
import { Star, X, Gift, Sparkles } from "lucide-react";
import { useShop } from "@/store/shop";

export const LuckyCodeWelcomePopup = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { user } = useShop();

  useEffect(() => {
    if (user?.id) {
      // Check if user has seen the welcome popup before
      const hasSeenPopup = localStorage.getItem(`luckycode_welcome_${user.id}`);
      
      if (!hasSeenPopup) {
        // Show popup after a short delay
        const timer = setTimeout(() => {
          setIsVisible(true);
        }, 2000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [user?.id]);

  const handleClose = () => {
    setIsVisible(false);
    if (user?.id) {
      // Mark as seen for this user
      localStorage.setItem(`luckycode_welcome_${user.id}`, 'true');
    }
  };

  const handleTryNow = () => {
    handleClose();
    // Trigger the lucky code modal
    const event = new CustomEvent('openLuckyCodeModal');
    window.dispatchEvent(event);
  };

  if (!isVisible || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 p-6 text-white">
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 p-1 text-white/80 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
          
          <div className="text-center">
            <div className="flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mx-auto mb-3">
              <Star className="h-8 w-8 fill-current animate-pulse" />
            </div>
            <h2 className="text-xl font-bold mb-1">Welcome to CampusMart!</h2>
            <p className="text-white/90 text-sm">You've got lucky codes waiting!</p>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute -top-2 -right-2 w-12 h-12 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute -bottom-2 -left-2 w-16 h-16 bg-white/10 rounded-full blur-xl"></div>
          <Sparkles className="absolute top-2 right-8 h-3 w-3 text-white/60 animate-bounce" />
          <Gift className="absolute bottom-2 left-8 h-3 w-3 text-white/60 animate-bounce" style={{ animationDelay: '0.5s' }} />
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">
              🎉 Free Points Awaiting!
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Redeem lucky codes to earn wallet points and save money on your purchases!
            </p>
            
            {/* Sample codes preview */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 mb-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Try these codes:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded text-xs font-mono">
                  WELCOME500
                </span>
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded text-xs font-mono">
                  STUDENT100
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 py-2.5 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Maybe Later
            </button>
            <button
              onClick={handleTryNow}
              className="flex-1 py-2.5 px-4 bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 text-white rounded-lg text-sm font-bold hover:shadow-lg transition-all"
            >
              Try Now!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};