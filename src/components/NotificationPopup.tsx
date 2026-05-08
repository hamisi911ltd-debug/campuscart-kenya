import { useState, useEffect } from "react";
import { X, Bell, CheckCircle, AlertCircle, Info, Gift } from "lucide-react";
import { toast } from "sonner";

interface NotificationPopupProps {
  notification: {
    id: string;
    type: 'success' | 'error' | 'info' | 'warning';
    title: string;
    message: string;
    icon?: React.ReactNode;
  } | null;
  onClose: () => void;
  onMoveToBox: (notification: any) => void;
}

export const NotificationPopup = ({ notification, onClose, onMoveToBox }: NotificationPopupProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (notification) {
      setIsVisible(true);
      // Auto close after 5 seconds and move to notification box
      const timer = setTimeout(() => {
        handleClose();
      }, 5000);
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

  if (!notification) return null;

  const getIcon = () => {
    if (notification.icon) return notification.icon;
    
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getBgColor = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'error':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      default:
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-full">
      <div
        className={`${getBgColor()} border rounded-xl shadow-lg p-4 transform transition-all duration-300 ${
          isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              {notification.title}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {notification.message}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};