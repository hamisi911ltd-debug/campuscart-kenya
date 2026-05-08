import { BookOpen, ShoppingBag, UtensilsCrossed, Home, Package, Zap, Heart, Gift, Trophy, Star } from "lucide-react";

export interface CampusNotification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning' | 'welcome' | 'sale' | 'order' | 'lucky';
  title: string;
  message: string;
  icon?: React.ReactNode;
  category?: 'electronics' | 'fashion' | 'books' | 'food' | 'furniture' | 'stationery' | 'rooms';
}

export class NotificationService {
  private static instance: NotificationService;
  private listeners: Array<(notification: CampusNotification) => void> = [];

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  subscribe(listener: (notification: CampusNotification) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify(notification: Omit<CampusNotification, 'id'>) {
    const fullNotification: CampusNotification = {
      ...notification,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
    };
    
    this.listeners.forEach(listener => listener(fullNotification));
  }

  // Welcome notifications
  showWelcomeNotification(userName: string) {
    this.notify({
      type: 'welcome',
      title: `Welcome back, ${userName}! 🎉`,
      message: 'Ready to discover amazing deals from fellow students?',
      icon: <Trophy className="h-6 w-6 text-white" />
    });
  }

  showFirstTimeWelcome(userName: string) {
    this.notify({
      type: 'welcome',
      title: `Welcome to CampusMart, ${userName}! 🚀`,
      message: 'Your campus marketplace for textbooks, food, electronics & more!',
      icon: <Star className="h-6 w-6 text-white" />
    });
  }

  // Lucky code notifications
  showLuckyCodeSuccess(points: number) {
    this.notify({
      type: 'lucky',
      title: '🎉 Lucky Code Redeemed!',
      message: `You earned ${points} points (KES ${(points / 10).toLocaleString()}) in your wallet!`,
      icon: <Gift className="h-6 w-6 text-white" />
    });
  }

  // Sale notifications
  showNewItemNotification(category: string, itemName: string) {
    const categoryMap: Record<string, { icon: React.ReactNode; cat: any }> = {
      'electronics': { icon: <Zap className="h-6 w-6 text-white" />, cat: 'electronics' },
      'books': { icon: <BookOpen className="h-6 w-6 text-white" />, cat: 'books' },
      'food': { icon: <UtensilsCrossed className="h-6 w-6 text-white" />, cat: 'food' },
      'fashion': { icon: <Heart className="h-6 w-6 text-white" />, cat: 'fashion' },
      'furniture': { icon: <Home className="h-6 w-6 text-white" />, cat: 'furniture' },
      'rooms': { icon: <Home className="h-6 w-6 text-white" />, cat: 'rooms' }
    };

    const categoryInfo = categoryMap[category] || { icon: <ShoppingBag className="h-6 w-6 text-white" />, cat: undefined };

    this.notify({
      type: 'sale',
      title: `New ${category} available! 📦`,
      message: `${itemName} just got listed by a fellow student. Check it out!`,
      icon: categoryInfo.icon,
      category: categoryInfo.cat
    });
  }

  showFlashSaleNotification(discount: number, category?: string) {
    this.notify({
      type: 'sale',
      title: `⚡ Flash Sale Alert!`,
      message: `${discount}% off ${category || 'selected items'}! Limited time only.`,
      icon: <Zap className="h-6 w-6 text-white" />,
      category: category as any
    });
  }

  // Order notifications
  showOrderConfirmation(orderNumber: string) {
    this.notify({
      type: 'order',
      title: '✅ Order Confirmed!',
      message: `Order #${orderNumber} has been placed. You'll receive updates via WhatsApp.`,
      icon: <Package className="h-6 w-6 text-white" />
    });
  }

  showOrderDelivered(orderNumber: string) {
    this.notify({
      type: 'success',
      title: '🎉 Order Delivered!',
      message: `Order #${orderNumber} has been delivered successfully. Enjoy your purchase!`,
      icon: <Package className="h-6 w-6 text-white" />
    });
  }

  // Campus-specific notifications
  showCampusEventNotification(eventName: string, campus: string) {
    this.notify({
      type: 'info',
      title: `📅 ${campus} Event`,
      message: `${eventName} is happening soon! Check out related items on CampusMart.`,
      icon: <Star className="h-6 w-6 text-white" />
    });
  }

  showStudentDiscountNotification(percentage: number) {
    this.notify({
      type: 'sale',
      title: `🎓 Student Discount Active!`,
      message: `Get ${percentage}% off with your student ID. Valid for textbooks & stationery.`,
      icon: <BookOpen className="h-6 w-6 text-white" />,
      category: 'books'
    });
  }

  // Food delivery notifications
  showFoodOrderReady(restaurantName: string) {
    this.notify({
      type: 'success',
      title: '🍕 Food Order Ready!',
      message: `Your order from ${restaurantName} is ready for pickup/delivery.`,
      icon: <UtensilsCrossed className="h-6 w-6 text-white" />,
      category: 'food'
    });
  }

  // Room/accommodation notifications
  showRoomAvailableNotification(location: string, price: number) {
    this.notify({
      type: 'info',
      title: '🏠 Room Available!',
      message: `New accommodation in ${location} for KES ${price.toLocaleString()}/month.`,
      icon: <Home className="h-6 w-6 text-white" />,
      category: 'rooms'
    });
  }

  // Generic success/error notifications with campus theme
  showSuccess(title: string, message: string, category?: string) {
    this.notify({
      type: 'success',
      title,
      message,
      category: category as any
    });
  }

  showError(title: string, message: string) {
    this.notify({
      type: 'error',
      title,
      message
    });
  }

  showInfo(title: string, message: string, category?: string) {
    this.notify({
      type: 'info',
      title,
      message,
      category: category as any
    });
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();