import { useState, useCallback } from "react";

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  icon?: React.ReactNode;
  timestamp: number;
  read: boolean;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [popupNotification, setPopupNotification] = useState<Notification | null>(null);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: Date.now(),
      read: false,
    };

    // Show as popup first
    setPopupNotification(newNotification);
  }, []);

  const moveToNotificationBox = useCallback((notification: Notification) => {
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

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    popupNotification,
    unreadCount,
    addNotification,
    moveToNotificationBox,
    markAsRead,
    clearNotification,
    clearAllNotifications,
    closePopup,
  };
};