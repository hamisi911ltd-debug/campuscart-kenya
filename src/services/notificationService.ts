export interface CampusNotification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning' | 'welcome' | 'sale' | 'order' | 'lucky';
  title: string;
  message: string;
  iconName?: string;
  productImage?: string;
  productName?: string;
  productPrice?: number;
  category?: 'electronics' | 'fashion' | 'books' | 'food' | 'furniture' | 'stationery' | 'rooms';
}

// Real product data from the platform
const PLATFORM_PRODUCTS = [
  {
    id: '1',
    name: 'MacBook Pro M2 13-inch',
    price: 180000,
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&h=300&fit=crop',
    category: 'electronics',
    seller: 'John Kamau',
    campus: 'UoN Main Campus'
  },
  {
    id: '2', 
    name: 'Engineering Mathematics Textbook',
    price: 2500,
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=300&fit=crop',
    category: 'books',
    seller: 'Mary Wanjiku',
    campus: 'JKUAT Juja'
  },
  {
    id: '3',
    name: 'iPhone 14 Pro Max',
    price: 145000,
    image: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=300&fit=crop',
    category: 'electronics',
    seller: 'Peter Mwangi',
    campus: 'Strathmore'
  },
  {
    id: '4',
    name: 'Vintage Denim Jacket',
    price: 1200,
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=300&fit=crop',
    category: 'fashion',
    seller: 'Grace Akinyi',
    campus: 'Kenyatta U.'
  },
  {
    id: '5',
    name: 'Study Desk with Drawers',
    price: 8500,
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
    category: 'furniture',
    seller: 'David Kiprop',
    campus: 'Moi University'
  },
  {
    id: '6',
    name: 'Organic Chemistry Textbook',
    price: 3200,
    image: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop',
    category: 'books',
    seller: 'Sarah Njeri',
    campus: 'UoN Kikuyu'
  },
  {
    id: '7',
    name: 'Gaming Laptop - ASUS ROG',
    price: 95000,
    image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400&h=300&fit=crop',
    category: 'electronics',
    seller: 'Mike Ochieng',
    campus: 'Daystar'
  },
  {
    id: '8',
    name: 'Hostel Room - Single',
    price: 12000,
    image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&h=300&fit=crop',
    category: 'rooms',
    seller: 'Campus Housing',
    campus: 'UoN Main Campus'
  },
  {
    id: '9',
    name: 'Fresh Samosas & Chai',
    price: 150,
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop',
    category: 'food',
    seller: 'Mama Njeri Kitchen',
    campus: 'JKUAT Juja'
  },
  {
    id: '10',
    name: 'Scientific Calculator',
    price: 2800,
    image: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=300&fit=crop',
    category: 'stationery',
    seller: 'Tech Store',
    campus: 'Strathmore'
  }
];

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

  private getRandomProduct(category?: string) {
    const products = category 
      ? PLATFORM_PRODUCTS.filter(p => p.category === category)
      : PLATFORM_PRODUCTS;
    return products[Math.floor(Math.random() * products.length)];
  }

  // Welcome notifications - now product-focused
  showWelcomeNotification(userName: string) {
    const product = this.getRandomProduct();
    
    this.notify({
      type: 'welcome',
      title: `Welcome back, ${userName}!`,
      message: `Check out ${product.name} and other amazing deals from fellow students`,
      productImage: product.image,
      productName: product.name,
      productPrice: product.price,
      category: product.category as any
    });
  }

  showFirstTimeWelcome(userName: string) {
    const product = this.getRandomProduct();
    
    this.notify({
      type: 'welcome',
      title: `Welcome to CampusMart, ${userName}!`,
      message: `Start with ${product.name} - your campus marketplace for everything!`,
      productImage: product.image,
      productName: product.name,
      productPrice: product.price,
      category: product.category as any
    });
  }

  // Lucky code notifications - simplified, no popup
  showLuckyCodeSuccess(points: number) {
    // Just log success, no popup notification
    console.log(`Lucky code redeemed: ${points} points earned`);
  }

  // Product-based notifications with real images
  showNewItemNotification(category?: string) {
    const product = this.getRandomProduct(category);
    
    this.notify({
      type: 'sale',
      title: `New ${product.category} available!`,
      message: `${product.name} just got listed by ${product.seller} at ${product.campus}`,
      productImage: product.image,
      productName: product.name,
      productPrice: product.price,
      category: product.category as any
    });
  }

  showFlashSaleNotification() {
    const product = this.getRandomProduct();
    const discount = [10, 15, 20, 25, 30][Math.floor(Math.random() * 5)];
    const salePrice = Math.round(product.price * (1 - discount / 100));
    
    this.notify({
      type: 'sale',
      title: `Flash Sale Alert!`,
      message: `${discount}% off ${product.name} - Now KES ${salePrice.toLocaleString()}!`,
      productImage: product.image,
      productName: product.name,
      productPrice: salePrice,
      category: product.category as any
    });
  }

  showPriceDropNotification() {
    const product = this.getRandomProduct();
    const oldPrice = product.price;
    const newPrice = Math.round(oldPrice * 0.8); // 20% price drop
    
    this.notify({
      type: 'info',
      title: 'Price Drop Alert!',
      message: `${product.name} price dropped from KES ${oldPrice.toLocaleString()} to KES ${newPrice.toLocaleString()}`,
      productImage: product.image,
      productName: product.name,
      productPrice: newPrice,
      category: product.category as any
    });
  }

  showSimilarItemNotification() {
    const product = this.getRandomProduct();
    
    this.notify({
      type: 'info',
      title: 'Similar Item Available!',
      message: `Found ${product.name} similar to your recent searches at ${product.campus}`,
      productImage: product.image,
      productName: product.name,
      productPrice: product.price,
      category: product.category as any
    });
  }

  // Order notifications - now product-focused
  showOrderConfirmation(orderNumber: string) {
    const product = this.getRandomProduct();
    
    this.notify({
      type: 'order',
      title: 'Order Confirmed!',
      message: `Your order for ${product.name} has been placed. You'll receive updates via WhatsApp.`,
      productImage: product.image,
      productName: product.name,
      productPrice: product.price,
      category: product.category as any
    });
  }

  showOrderDelivered(orderNumber: string) {
    const product = this.getRandomProduct();
    
    this.notify({
      type: 'success',
      title: 'Order Delivered!',
      message: `Your ${product.name} has been delivered successfully. Enjoy your purchase!`,
      productImage: product.image,
      productName: product.name,
      productPrice: product.price,
      category: product.category as any
    });
  }

  // Campus-specific notifications with real products
  showCampusEventNotification(eventName: string, campus: string) {
    const product = this.getRandomProduct('books');
    
    this.notify({
      type: 'info',
      title: `${campus} Event`,
      message: `${eventName} is happening soon! Get ${product.name} and other study materials.`,
      productImage: product.image,
      productName: product.name,
      productPrice: product.price,
      category: 'books'
    });
  }

  showStudentDiscountNotification() {
    const product = this.getRandomProduct('books');
    const discountPrice = Math.round(product.price * 0.85); // 15% off
    
    this.notify({
      type: 'sale',
      title: 'Student Discount Active!',
      message: `Get 15% off textbooks like ${product.name} with your student ID.`,
      productImage: product.image,
      productName: product.name,
      productPrice: discountPrice,
      category: 'books'
    });
  }

  // Food delivery notifications
  showFoodOrderReady(restaurantName: string) {
    const foodProduct = this.getRandomProduct('food');
    
    this.notify({
      type: 'success',
      title: 'Food Order Ready!',
      message: `Your order from ${restaurantName} is ready for pickup/delivery.`,
      productImage: foodProduct.image,
      productName: foodProduct.name,
      productPrice: foodProduct.price,
      category: 'food'
    });
  }

  // Room/accommodation notifications
  showRoomAvailableNotification() {
    const roomProduct = this.getRandomProduct('rooms');
    
    this.notify({
      type: 'info',
      title: 'Room Available!',
      message: `New accommodation at ${roomProduct.campus} for KES ${roomProduct.price.toLocaleString()}/month.`,
      productImage: roomProduct.image,
      productName: roomProduct.name,
      productPrice: roomProduct.price,
      category: 'rooms'
    });
  }

  // Generic success/error notifications
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