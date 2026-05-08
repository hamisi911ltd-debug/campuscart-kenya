export interface CampusNotification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning' | 'welcome' | 'sale' | 'order' | 'lucky';
  title: string;
  message: string;
  iconName?: string;
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
      iconName: 'trophy'
    });
  }

  showFirstTimeWelcome(userName: string) {
    this.notify({
      type: 'welcome',
      title: `Welcome to CampusMart, ${userName}! 🚀`,
      message: 'Your campus marketplace for textbooks, food, electronics & more!',
      iconName: 'star'
    });
  }

  // Lucky code notifications
  showLuckyCodeSuccess(points: number) {
    this.notify({
      type: 'lucky',
      title: '🎉 Lucky Code Redeemed!',
      message: `You earned ${points} points (KES ${(points / 10).toLocaleString()}) in your wallet!`,
      iconName: 'gift'
    });
  }

  // Sale notifications
  showNewItemNotification(category: string, itemName: string) {
    const categoryMap: Record<string, { iconName: string; cat: any }> = {
      'electronics': { iconName: 'zap', cat: 'electronics' },
      'books': { iconName: 'book-open', cat: 'books' },
      'food': { iconName: 'utensils-crossed', cat: 'food' },
      'fashion': { iconName: 'heart', cat: 'fashion' },
      'furniture': { iconName: 'home', cat: 'furniture' },
      'rooms': { iconName: 'home', cat: 'rooms' }
    };

    const categoryInfo = categoryMap[category] || { iconName: 'shopping-bag', cat: undefined };

    this.notify({
      type: 'sale',
      title: `New ${category} available! 📦`,
      message: `${itemName} just got listed by a fellow student. Check it out!`,
      iconName: categoryInfo.iconName,
      category: categoryInfo.cat
    });
  }

  showFlashSaleNotification(discount: number, category?: string) {
    this.notify({
      type: 'sale',
      title: `⚡ Flash Sale Alert!`,
      message: `${discount}% off ${category || 'selected items'}! Limited time only.`,
      iconName: 'zap',
      category: category as any
    });
  }

  // Order notifications
  showOrderConfirmation(orderNumber: string) {
    this.notify({
      type: 'order',
      title: '✅ Order Confirmed!',
      message: `Order #${orderNumber} has been placed. You'll receive updates via WhatsApp.`,
      iconName: 'package'
    });
  }

  showOrderDelivered(orderNumber: string) {
    this.notify({
      type: 'success',
      title: '🎉 Order Delivered!',
      message: `Order #${orderNumber} has been delivered successfully. Enjoy your purchase!`,
      iconName: 'package'
    });
  }

  // Campus-specific notifications
  showCampusEventNotification(eventName: string, campus: string) {
    this.notify({
      type: 'info',
      title: `📅 ${campus} Event`,
      message: `${eventName} is happening soon! Check out related items on CampusMart.`,
      iconName: 'star'
    });
  }

  showStudentDiscountNotification(percentage: number) {
    this.notify({
      type: 'sale',
      title: `🎓 Student Discount Active!`,
      message: `Get ${percentage}% off with your student ID. Valid for textbooks & stationery.`,
      iconName: 'book-open',
      category: 'books'
    });
  }

  // Food delivery notifications
  showFoodOrderReady(restaurantName: string) {
    this.notify({
      type: 'success',
      title: '🍕 Food Order Ready!',
      message: `Your order from ${restaurantName} is ready for pickup/delivery.`,
      iconName: 'utensils-crossed',
      category: 'food'
    });
  }

  // Room/accommodation notifications
  showRoomAvailableNotification(location: string, price: number) {
    this.notify({
      type: 'info',
      title: '🏠 Room Available!',
      message: `New accommodation in ${location} for KES ${price.toLocaleString()}/month.`,
      iconName: 'home',
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