import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Zap, Tag, TrendingUp, ShoppingBag, Package } from "lucide-react";
import { useShop } from "@/store/shop";
import { useNavigate } from "react-router-dom";

interface Product {
  id: string;
  title: string;
  price: number;
  category: string;
  created_at: string;
}

export const OfferNotifications = () => {
  const { user } = useShop();
  const navigate = useNavigate();
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);

  // Fetch real-time products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Fetch newest products
        const newestResponse = await fetch('/api/products?sort=newest&limit=5');
        if (newestResponse.ok) {
          const newest = await newestResponse.json();
          setRecentProducts(Array.isArray(newest) ? newest : []);
        }

        // Fetch trending products
        const trendingResponse = await fetch('/api/products?sort=trending&limit=5');
        if (trendingResponse.ok) {
          const trending = await trendingResponse.json();
          setTrendingProducts(Array.isArray(trending) ? trending : []);
        }
      } catch (error) {
        console.error('Error fetching products for notifications:', error);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    // Check notification settings
    const settings = localStorage.getItem('campusmart_settings');
    let notificationsEnabled = true;
    
    if (settings) {
      try {
        const parsed = JSON.parse(settings);
        notificationsEnabled = parsed.pushNotifications !== false;
      } catch (e) {
        console.error('Error parsing settings:', e);
      }
    }

    if (!notificationsEnabled) {
      return; // Don't show notifications if disabled
    }

    // Check if user just logged in or if notifications should show
    const lastNotificationTime = localStorage.getItem('campusmart_last_notification');
    const now = Date.now();
    const twoHours = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

    // Show notifications if:
    // 1. Never shown before, OR
    // 2. More than 2 hours since last notification, OR
    // 3. User just logged in (check session)
    const shouldShow = !lastNotificationTime || 
                       (now - parseInt(lastNotificationTime)) > twoHours ||
                       sessionStorage.getItem('campusmart_just_logged_in') === 'true';

    if (shouldShow && (recentProducts.length > 0 || trendingProducts.length > 0)) {
      // Notification 1: New Listings (based on real products)
      setTimeout(() => {
        if (recentProducts.length > 0) {
          const product = recentProducts[0];
          const timeAgo = getTimeAgo(product.created_at);
          
          toast(
            <div 
              className="flex items-start gap-3 cursor-pointer"
              onClick={() => navigate(`/product/${product.id}`)}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                <Tag className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="font-bold text-sm">New Listing: {product.title} 🎯</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Posted {timeAgo} • KES {product.price.toLocaleString()} • {product.category}
                </div>
              </div>
            </div>,
            {
              duration: 8000,
              position: "top-center",
              dismissible: true,
              cancel: {
                label: "Dismiss",
                onClick: () => {},
              },
            }
          );
        }
      }, 60000); // 1 minute

      // Notification 2: Trending Products (based on real data)
      setTimeout(() => {
        if (trendingProducts.length > 0) {
          const topProducts = trendingProducts.slice(0, 3);
          const categories = [...new Set(topProducts.map(p => p.category))];
          
          toast(
            <div 
              className="flex items-start gap-3 cursor-pointer"
              onClick={() => navigate('/search?sort=trending')}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="font-bold text-sm">Trending This Week 🔥</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {categories.join(', ')} are hot right now! {topProducts.length} items trending.
                </div>
              </div>
            </div>,
            {
              duration: 8000,
              position: "top-center",
              dismissible: true,
              cancel: {
                label: "Dismiss",
                onClick: () => {},
              },
            }
          );
        }
      }, 65000); // 1 minute 5 seconds

      // Notification 3: Flash Deal or Recent Activity
      setTimeout(() => {
        if (recentProducts.length > 1) {
          const product = recentProducts[1];
          const hasDiscount = product.original_price && product.original_price > product.price;
          
          toast(
            <div 
              className="flex items-start gap-3 cursor-pointer"
              onClick={() => navigate(`/product/${product.id}`)}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100">
                {hasDiscount ? (
                  <Zap className="h-5 w-5 text-yellow-600 fill-yellow-600" />
                ) : (
                  <Package className="h-5 w-5 text-yellow-600" />
                )}
              </div>
              <div>
                <div className="font-bold text-sm">
                  {hasDiscount ? 'Great Deal Alert! ⚡' : 'Fresh Listing 📦'}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {product.title} • KES {product.price.toLocaleString()}
                  {hasDiscount && ` (${Math.round(((product.original_price - product.price) / product.original_price) * 100)}% OFF)`}
                </div>
              </div>
            </div>,
            {
              duration: 8000,
              position: "top-center",
              dismissible: true,
              cancel: {
                label: "Dismiss",
                onClick: () => {},
              },
            }
          );
        }
      }, 70000); // 1 minute 10 seconds

      // Update last notification time
      localStorage.setItem('campusmart_last_notification', now.toString());
      
      // Clear the just logged in flag
      sessionStorage.removeItem('campusmart_just_logged_in');
    }
  }, [user, recentProducts, trendingProducts, navigate]);

  return null; // This component doesn't render anything
};

// Helper function to calculate time ago
function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
