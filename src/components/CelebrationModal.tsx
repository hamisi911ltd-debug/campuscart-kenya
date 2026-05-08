import { useState, useEffect } from "react";
import { X, Gift, Sparkles, Star, Heart, Trophy, Zap } from "lucide-react";

interface CelebrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'lucky_code' | 'login';
  title: string;
  message: string;
  points?: number;
  autoCloseDelay?: number;
}

export const CelebrationModal = ({ 
  isOpen, 
  onClose, 
  type, 
  title, 
  message, 
  points,
  autoCloseDelay = 5000 
}: CelebrationModalProps) => {
  const [showConfetti, setShowConfetti] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; color: string; icon: React.ReactNode }>>([]);

  useEffect(() => {
    if (isOpen) {
      setShowConfetti(true);
      generateParticles();
      
      // Auto close after delay
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);
      
      return () => clearTimeout(timer);
    } else {
      setShowConfetti(false);
      setParticles([]);
    }
  }, [isOpen, autoCloseDelay, onClose]);

  const generateParticles = () => {
    const newParticles = [];
    const icons = [
      <Sparkles className="h-4 w-4" />,
      <Star className="h-3 w-3" />,
      <Heart className="h-3 w-3" />,
      <Gift className="h-4 w-4" />,
      <Trophy className="h-4 w-4" />,
      <Zap className="h-3 w-3" />
    ];
    
    const colors = [
      'text-yellow-400',
      'text-pink-400',
      'text-purple-400',
      'text-blue-400',
      'text-green-400',
      'text-red-400',
      'text-orange-400'
    ];

    for (let i = 0; i < 30; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        icon: icons[Math.floor(Math.random() * icons.length)]
      });
    }
    
    setParticles(newParticles);
  };

  if (!isOpen) return null;

  const getBgGradient = () => {
    if (type === 'lucky_code') {
      return 'bg-gradient-to-br from-purple-500 via-pink-500 to-yellow-500';
    }
    return 'bg-gradient-to-br from-blue-500 via-cyan-500 to-green-500';
  };

  const getMainIcon = () => {
    if (type === 'lucky_code') {
      return <Gift className="h-16 w-16 text-white" />;
    }
    return <Trophy className="h-16 w-16 text-white" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      {/* Confetti Particles */}
      {showConfetti && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {particles.map((particle) => (
            <div
              key={particle.id}
              className={`absolute ${particle.color} animate-bounce`}
              style={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1 + Math.random() * 2}s`
              }}
            >
              {particle.icon}
            </div>
          ))}
        </div>
      )}

      {/* Main Modal */}
      <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-pulse">
        {/* Header with gradient */}
        <div className={`${getBgGradient()} p-8 text-white text-center relative overflow-hidden`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white transition-colors rounded-full hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
          
          {/* Main Icon with pulse animation */}
          <div className="flex justify-center mb-4">
            <div className="animate-pulse">
              {getMainIcon()}
            </div>
          </div>
          
          {/* Floating decorative elements */}
          <div className="absolute top-4 left-4 animate-bounce">
            <Sparkles className="h-6 w-6 text-white/60" />
          </div>
          <div className="absolute top-8 right-8 animate-bounce" style={{ animationDelay: '0.5s' }}>
            <Star className="h-5 w-5 text-white/60" />
          </div>
          <div className="absolute bottom-4 left-8 animate-bounce" style={{ animationDelay: '1s' }}>
            <Heart className="h-4 w-4 text-white/60" />
          </div>
          <div className="absolute bottom-8 right-4 animate-bounce" style={{ animationDelay: '1.5s' }}>
            <Zap className="h-5 w-5 text-white/60" />
          </div>
          
          <h2 className="text-2xl font-bold mb-2 animate-bounce">
            {title}
          </h2>
          <p className="text-white/90 text-sm">
            {message}
          </p>
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          {type === 'lucky_code' && points && (
            <div className="mb-6">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border border-green-200 dark:border-green-800">
                <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2 animate-pulse">
                  +{points.toLocaleString()} Points
                </div>
                <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                  = KES {(points / 10).toLocaleString()}
                </div>
                <div className="text-sm text-green-600 dark:text-green-400 opacity-75 mt-1">
                  Added to your wallet!
                </div>
              </div>
            </div>
          )}

          {type === 'login' && (
            <div className="mb-6">
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl p-6 border border-blue-200 dark:border-blue-800">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                  Welcome Back! 🎉
                </div>
                <div className="text-sm text-blue-600 dark:text-blue-400 opacity-75">
                  Ready to explore amazing deals?
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
            >
              Awesome! 🚀
            </button>
          </div>

          {/* Auto close indicator */}
          <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
            Auto-closing in a few seconds...
          </div>
        </div>
      </div>

      {/* Additional floating animations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 animate-ping">
          <div className="w-3 h-3 bg-yellow-400 rounded-full opacity-75"></div>
        </div>
        <div className="absolute top-1/3 right-1/4 animate-ping" style={{ animationDelay: '1s' }}>
          <div className="w-2 h-2 bg-pink-400 rounded-full opacity-75"></div>
        </div>
        <div className="absolute bottom-1/4 left-1/3 animate-ping" style={{ animationDelay: '2s' }}>
          <div className="w-4 h-4 bg-purple-400 rounded-full opacity-75"></div>
        </div>
        <div className="absolute bottom-1/3 right-1/3 animate-ping" style={{ animationDelay: '0.5s' }}>
          <div className="w-2 h-2 bg-blue-400 rounded-full opacity-75"></div>
        </div>
      </div>
    </div>
  );
};