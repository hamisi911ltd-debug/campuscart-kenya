import { PageShell } from "@/components/PageShell";
import { Bell } from "lucide-react";
import { useShop } from "@/store/shop";
import { useEffect } from "react";

const NotificationsPage = () => {
  const { notifications, markNotificationsAsRead } = useShop();

  // Mark all notifications as read when page is viewed
  useEffect(() => {
    markNotificationsAsRead();
  }, [markNotificationsAsRead]);

  return (
    <PageShell title="Notifications">
      {notifications.length === 0 ? (
        <div className="rounded-xl bg-card p-8 text-center shadow-card">
          <Bell className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">No notifications yet</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {notifications.map((n) => (
            <li key={n.id} className="flex items-start gap-3 rounded-xl bg-card p-4 shadow-card">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-primary">
                <Bell className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-foreground">{n.title}</div>
                <div className="text-xs text-muted-foreground">{n.message}</div>
              </div>
              <span className="text-[10px] text-muted-foreground">{n.time}</span>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
};

export default NotificationsPage;
