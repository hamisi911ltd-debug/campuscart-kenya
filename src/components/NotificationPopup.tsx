import { useState, useEffect } from "react";
import { X, Bell, CheckCircle, AlertCircle, Info, Gift, ShoppingBag, Package, Star, Zap, Heart, Trophy, Sparkles, BookOpen, Home, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";

interface NotificationPopupProps {
  notification: {
    id: string;
    type: 'success' | 'error' | 'info' | 'warning' | 'welcome' | 'sale' | 'order' | 'lucky';
    title: string;
    message: string;
    iconName?: string;
    category?: 'electronics' | 'fashion' | 'books' | 'food' | 'furniture' | 'stationery' | 'rooms';
  } | null;
  onClose: () => void;
  onMoveToBox: (notification: any) => void;
}

export const NotificationPopup = ({ notification, onClose, onMoveToBox }: NotificationPopupProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; color: string; icon: React.ReactNode; delay: number }>>([]);

  useEffect(() => {
    if (notification) {
      setIsVisible(true);
      generateParticles();
      
      // Auto close after 6 seconds and move to notification box
      const timer = setTimeout(() => {
        handleClose();
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      if (notification) {
        onMoveToBox(notification);
      }
      onClose();
    }, 300);
  };

  const generateParticles = () => {
    if (!notification) return;
    
    const newParticles = [];
    const campusIcons = [
      <BookOpen className="h-3 w-3" />,
      <ShoppingBag className="h-3 w-3" />,
      <UtensilsCrossed className="h-3 w-3" />,
      <Home className="h-3 w-3" />,
      <Package className="h-3 w-3" />,
      <Star className="h-3 w-3" />,
      <Heart className="h-3 w-3" />,
      <Sparkles className="h-3 w-3" />
    ];
    
    const campusColors = [
      'text-purple-400',
      'text-blue-400', 
      'text-green-400',
      'text-yellow-400',
      'text-pink-400',
      'text-cyan-400',
      'text-orange-400'
    ];

    for (let i = 0; i < 20; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        color: campusColors[Math.floor(Math.random() * campusColors.length)],
        icon: campusIcons[Math.floor(Math.random() * campusIcons.length)],
        delay: Math.random() * 2
      });
    }
    
    setParticles(newParticles);
  };

  if (!notification) return null;

  const getIconFromName = (iconName?: string) => {
    switch (iconName) {
      case 'trophy':
        return <Trophy className="h-6 w-6 text-white" />;
      case 'star':
        return <Star className="h-6 w-6 text-white" />;
      case 'gift':
        return <Gift className="h-6 w-6 text-white" />;
      case 'zap':
        return <Zap className="h-6 w-6 text-white" />;
      case 'book-open':
        return <BookOpen className="h-6 w-6 text-white" />;
      case 'utensils-crossed':
        return <UtensilsCrossed className="h-6 w-6 text-white" />;
      case 'heart':
        return <Heart className="h-6 w-6 text-white" />;
      case 'home':
        return <Home className="h-6 w-6 text-white" />;
      case 'shopping-bag':
        return <ShoppingBag className="h-6 w-6 text-white" />;
      case 'package':
        return <Package className="h-6 w-6 text-white" />;
      default:
        return null;
    }
  };

  const getNotificationStyle = () => {
    switch (notification.type) {
      case 'welcome':
        return {
          bg: 'bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500',
          border: 'border-purple-200 dark:border-purple-800',
          icon: <Trophy className="h-6 w-6 text-white" />,
          accent: 'text-purple-600 dark:text-purple-400'
        };
      case 'sale':
        return {
          bg: 'bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500',
          border: 'border-green-200 dark:border-green-800',
          icon: <ShoppingBag className="h-6 w-6 text-white" />,
          accent: 'text-green-600 dark:text-green-400'
        };
      case 'order':
        return {
          bg: 'bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500',
          border: 'border-blue-200 dark:border-blue-800',
          icon: <Package className="h-6 w-6 text-white" />,
          accent: 'text-blue-600 dark:text-blue-400'
        };
      case 'lucky':
        return {
          bg: 'bg-gradient-to-br from-yellow-500 via-orange-500 to-red-500',
          border: 'border-yellow-200 dark:border-yellow-800',
          icon: <Gift className="h-6 w-6 text-white" />,
          accent: 'text-yellow-600 dark:text-yellow-400'
        };
      case 'success':
        return {
          bg: 'bg-gradient-to-br from-green-500 to-emerald-600',
          border: 'border-green-200 dark:border-green-800',
          icon: <CheckCircle className="h-6 w-6 text-white" />,
          accent: 'text-green-600 dark:text-green-400'
        };
      case 'error':
        return {
          bg: 'bg-gradient-to-br from-red-500 to-pink-600',
          border: 'border-red-200 dark:border-red-800',
          icon: <AlertCircle className="h-6 w-6 text-white" />,
          accent: 'text-red-600 dark:text-red-400'
        };
      default:
        return {
          bg: 'bg-gradient-to-br from-gray-600 to-gray-700',
          border: 'border-gray-200 dark:border-gray-700',
          icon: <Info className="h-6 w-6 text-white" />,
          accent: 'text-gray-600 dark:text-gray-400'
        };
    }
  };

  const getCategoryIcon = () => {
    switch (notification.category) {
      case 'electronics':
        return <Zap className="h-4 w-4" />;
      case 'fashion':
        return <Heart className="h-4 w-4" />;
      case 'books':
        return <BookOpen className="h-4 w-4" />;
      case 'food':
        return <UtensilsCrossed className="h-4 w-4" />;
      case 'furniture':
        return <Home className="h-4 w-4" />;
      case 'rooms':
        return <Home className="h-4 w-4" />;
      default:
        return <ShoppingBag className="h-4 w-4" />;
    }
  };

  const style = getNotificationStyle();

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-full">
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className={`absolute ${particle.color} animate-bounce opacity-60`}
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${1.5 + Math.random()}s`
            }}
          >
            {particle.icon}
          </div>
        ))}
      </div>

      <div
        className={`relative overflow-hidden rounded-2xl shadow-2xl transform transition-all duration-500 ${
          isVisible ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-full opacity-0 scale-95'
        }`}
      >
        {/* Gradient Background Header */}
        <div className={`${style.bg} p-4 relative`}>
          {/* Decorative elements */}
          <div className="absolute top-2 right-2 w-8 h-8 bg-white/10 rounded-full animate-pulse"></div>
          <div className="absolute bottom-2 left-2 w-6 h-6 bg-white/10 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-white/5 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
          
          <div className="flex items-start gap-3 relative z-10">
            <div className="flex-shrink-0 p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              {getIconFromName(notification.iconName) || style.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-sm font-bold text-white truncate">
                  {notification.title}
                </h4>
                {notification.category && (
                  <div className="flex-shrink-0 p-1 bg-white/20 rounded-full">
                    <div className="text-white/80">
                      {getCategoryIcon()}
                    </div>
                  </div>
                )}
              </div>
              <p className="text-xs text-white/90 leading-relaxed">
                {notification.message}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="flex-shrink-0 p-1.5 text-white/70 hover:text-white hover:bg-white/20 rounded-full transition-all duration-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Bottom accent bar */}
        <div className="bg-white dark:bg-gray-800 px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">CampusMart</span>
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Just now
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};