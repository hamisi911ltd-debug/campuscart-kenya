import { useState, useCallback, useEffect } from "react";
import { notificationService, CampusNotification } from "@/services/notificationService";

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<CampusNotification[]>([]);
  const [popupNotification, setPopupNotification] = useState<CampusNotification | null>(null);

  useEffect(() => {
    const unsubscribe = notificationService.subscribe((notification) => {
      setPopupNotification(notification);
    });

    return unsubscribe;
  }, []);

  const moveToNotificationBox = useCallback((notification: CampusNotification) => {
    setNotifications(prev => [notification, ...prev]);
    setPopupNotification(null);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  }, []);

  const clearNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const closePopup = useCallback(() => {
    setPopupNotification(null);
  }, []);

  const unreadCount = notifications.filter((n: any) => !n.read).length;

  return {
    notifications,
    popupNotification,
    unreadCount,
    moveToNotificationBox,
    markAsRead,
    clearNotification,
    clearAllNotifications,
    closePopup,
  };
};