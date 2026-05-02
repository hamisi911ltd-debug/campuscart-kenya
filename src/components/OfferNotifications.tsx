import { useEffect } from "react";
import { toast } from "sonner";
import { Zap, Tag, TrendingUp } from "lucide-react";
import { useShop } from "@/store/shop";

export const OfferNotifications = () => {
  const { user } = useShop();

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

    if (shouldShow) {
      // Show offer notifications after 1 minute
      setTimeout(() => {
        toast(
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100">
              <Zap className="h-5 w-5 text-yellow-600 fill-yellow-600" />
            </div>
            <div>
              <div className="font-bold text-sm">Flash Deals Active! ⚡</div>
              <div className="text-xs text-muted-foreground mt-1">
                Up to 50% OFF on electronics, books & more. Hurry, limited time!
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
      }, 60000); // 1 minute

      setTimeout(() => {
        toast(
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
              <Tag className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="font-bold text-sm">New Listings Near You 🎯</div>
              <div className="text-xs text-muted-foreground mt-1">
                Fresh items from students on your campus. Check them out!
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
      }, 65000); // 1 minute 5 seconds

      setTimeout(() => {
        toast(
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="font-bold text-sm">Trending This Week 🔥</div>
              <div className="text-xs text-muted-foreground mt-1">
                MacBooks, textbooks & winter jackets are hot right now!
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
      }, 70000); // 1 minute 10 seconds

      // Update last notification time
      localStorage.setItem('campusmart_last_notification', now.toString());
      
      // Clear the just logged in flag
      sessionStorage.removeItem('campusmart_just_logged_in');
    }
  }, [user]);

  return null; // This component doesn't render anything
};
