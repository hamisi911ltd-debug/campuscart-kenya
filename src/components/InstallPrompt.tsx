import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Logo } from './Logo';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Check if user has dismissed the prompt before
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    
    // Show after 30 seconds delay
    if (!standalone && !dismissed) {
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 30000); // 30 seconds

      // For Android/Desktop - listen for beforeinstallprompt
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    await deferredPrompt.prompt();

    // Wait for the user's response
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }

    // Clear the deferred prompt
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  // Don't show if already installed or dismissed
  if (isStandalone || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleDismiss}
      />
      
      {/* Modal - Compact like SignInModal */}
      <div className="relative bg-card rounded-3xl p-6 shadow-2xl border border-border max-w-sm w-full animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5 text-muted-foreground" />
        </button>

        {/* Content */}
        <div className="text-center">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <Logo />
          </div>
          
          <h2 className="text-xl font-extrabold text-foreground mb-2">
            Install CampusMart
          </h2>
          
          <p className="text-sm text-muted-foreground mb-6">
            Get quick access from your home screen
          </p>

          {isIOS ? (
            // iOS Instructions
            <div className="bg-accent/5 rounded-xl p-4 mb-6 text-left">
              <p className="text-xs font-semibold text-foreground mb-2">To install on iPhone:</p>
              <ol className="space-y-1.5 text-xs text-muted-foreground list-decimal list-inside">
                <li>Tap the Share button <span className="inline-block">⎙</span> in Safari</li>
                <li>Scroll down and tap "Add to Home Screen"</li>
                <li>Tap "Add" in the top right corner</li>
              </ol>
            </div>
          ) : (
            // Android/Desktop Install Button
            <>
              <div className="bg-accent/5 rounded-xl p-4 mb-6 text-left">
                <p className="text-xs font-semibold text-foreground mb-2">Benefits:</p>
                <ul className="space-y-1.5 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <span className="text-accent">✓</span>
                    Works offline
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-accent">✓</span>
                    Faster access
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-accent">✓</span>
                    No app store needed
                  </li>
                </ul>
              </div>
              
              <button
                onClick={handleInstallClick}
                className="w-full rounded-xl gradient-accent py-3 text-sm font-bold text-accent-foreground shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all mb-3"
              >
                Install App
              </button>
            </>
          )}

          <button
            onClick={handleDismiss}
            className="w-full rounded-xl bg-muted py-3 text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors"
          >
            Maybe later
          </button>

          <p className="text-xs text-muted-foreground mt-4">
            Free • Fast • Secure
          </p>
        </div>
      </div>
    </div>
  );
}
