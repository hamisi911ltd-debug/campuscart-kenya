import { useState, useEffect } from "react";
import { Ticket, Sparkles, X, Star, Coins, Zap } from "lucide-react";
import { toast } from "sonner";
import { CelebrationModal } from "./CelebrationModal";
import { notificationService } from "@/services/notificationService";

interface LuckyCodeWelcomePopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSignInRequired: () => void;
}

export const LuckyCodeWelcomePopup = ({ isOpen, onClose, onSignInRequired }: LuckyCodeWelcomePopupProps) => {
  const [luckyCode, setLuckyCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [showCelebration, setCelebrationData] = useState<{ points: number } | null>(null);
  const [step, setStep] = useState<'welcome' | 'input'>('welcome');

  if (!isOpen) return null;

  const redeemLuckyCode = async () => {
    if (!luckyCode.trim()) {
      toast.error('Please enter a lucky code');
      return;
    }

    // For non-logged in users, show sign in requirement
    onSignInRequired();
    return;
  };

  const handleGetStarted = () => {
    setStep('input');
  };

  const handleClose = () => {
    setStep('welcome');
    setLuckyCode('');
    onClose();
  };

  return (
    <>
      {showCelebration && (
        <CelebrationModal
          isOpen={true}
          onClose={() => setCelebrationData(null)}
          type="lucky_code"
          title="🎉 Congratulations!"
          message="You've successfully redeemed your lucky code!"
          points={showCelebration.points}
        />
      )}
      
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-md mx-4 overflow-hidden transform transition-all duration-500 scale-100">
          
          {step === 'welcome' ? (
            // Welcome Step
            <>
              {/* Header with Gradient */}
              <div className="relative bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 p-6 sm:p-8 text-white text-center">
                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 p-1.5 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
                
                {/* Floating Icons */}
                <div className="absolute top-4 left-4 animate-bounce">
                  <Ticket className="h-6 w-6 text-white/60" />
                </div>
                <div className="absolute top-8 right-12 animate-pulse">
                  <Sparkles className="h-4 w-4 text-white/60" />
                </div>
                <div className="absolute bottom-4 left-8 animate-bounce" style={{ animationDelay: '1s' }}>
                  <Star className="h-5 w-5 text-white/60" />
                </div>
                <div className="absolute bottom-6 right-6 animate-pulse" style={{ animationDelay: '0.5s' }}>
                  <Coins className="h-4 w-4 text-white/60" />
                </div>
                
                {/* Main Content */}
                <div className="relative z-10">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <Ticket className="h-10 w-10 sm:h-12 sm:w-12 text-white" />
                  </div>
                  
                  <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                    Welcome to CampusMart!
                  </h1>
                  <p className="text-white/90 text-sm sm:text-base mb-6">
                    Get started with a lucky code and earn instant wallet points!
                  </p>
                  
                  {/* Features */}
                  <div className="space-y-3 text-left max-w-xs mx-auto">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                        <Zap className="h-4 w-4" />
                      </div>
                      <span>Instant wallet points</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                        <Coins className="h-4 w-4" />
                      </div>
                      <span>10 points = KES 1</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                        <Ticket className="h-4 w-4" />
                      </div>
                      <span>Free codes from promotions</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-6 sm:p-8 space-y-4">
                <button
                  onClick={handleGetStarted}
                  className="w-full py-3.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl hover:shadow-lg transition-all font-bold text-base flex items-center justify-center gap-2"
                >
                  <Ticket className="h-5 w-5" />
                  I Have a Lucky Code
                </button>
                
                <button
                  onClick={handleClose}
                  className="w-full py-3.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-2xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all font-semibold text-base"
                >
                  Maybe Later
                </button>
                
                <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">
                  Get lucky codes from CampusMart social media, events, and promotions
                </p>
              </div>
            </>
          ) : (
            // Input Step
            <>
              {/* Header */}
              <div className="relative bg-gradient-to-r from-purple-500 to-pink-500 p-4 sm:p-6 text-white">
                <button
                  onClick={handleClose}
                  className="absolute top-3 right-3 sm:top-4 sm:right-4 p-1 text-white/80 hover:text-white transition-colors"
                >
                  <X className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
                
                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                  <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-full">
                    <Ticket className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold">Enter Lucky Code</h2>
                    <p className="text-white/90 text-xs sm:text-sm">Redeem your code for instant points!</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-4 sm:p-6">
                {/* Info Box */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 mb-6 border border-green-200 dark:border-green-800">
                  <div className="text-center">
                    <Coins className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-green-800 dark:text-green-200 mb-1">
                      Earn Instant Wallet Points
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-400">
                      10 points = KES 1 • Use for purchases
                    </p>
                  </div>
                </div>

                {/* Input Section */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Lucky Code
                    </label>
                    <input
                      type="text"
                      value={luckyCode}
                      onChange={(e) => setLuckyCode(e.target.value.toUpperCase())}
                      placeholder="e.g., WELCOME500"
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-center text-lg font-mono tracking-wider"
                      onKeyPress={(e) => e.key === 'Enter' && redeemLuckyCode()}
                      maxLength={20}
                    />
                  </div>

                  <button
                    onClick={redeemLuckyCode}
                    disabled={isRedeeming || !luckyCode.trim()}
                    className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold flex items-center justify-center gap-2"
                  >
                    {isRedeeming ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Redeeming...
                      </>
                    ) : (
                      <>
                        <Ticket className="h-4 w-4" />
                        Redeem Code
                      </>
                    )}
                  </button>
                </div>

                {/* Sign In Notice */}
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-800 dark:text-blue-200 text-center">
                    <strong>Note:</strong> You'll need to sign in to redeem codes and track your wallet points
                  </p>
                </div>

                {/* Sample Codes */}
                <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    Try These Sample Codes
                  </h3>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      onClick={() => setLuckyCode('WELCOME500')}
                      className="p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                    >
                      <div className="font-mono font-bold text-purple-600">WELCOME500</div>
                      <div className="text-gray-500">500 points</div>
                    </button>
                    <button
                      onClick={() => setLuckyCode('STUDENT100')}
                      className="p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                    >
                      <div className="font-mono font-bold text-green-600">STUDENT100</div>
                      <div className="text-gray-500">100 points</div>
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};