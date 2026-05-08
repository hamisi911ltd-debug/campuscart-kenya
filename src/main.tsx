import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Cache version for force refresh
const CACHE_VERSION = 'v3.1-mobile-lucky-codes';

// Register Service Worker for PWA with cache busting
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js?' + CACHE_VERSION)
      .then((registration) => {
        console.log('✅ Service Worker registered successfully:', registration.scope);
        
        // Force update if new version available
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New version available, force refresh
                console.log('🔄 New version available, refreshing...');
                newWorker.postMessage({ type: 'SKIP_WAITING' });
                window.location.reload();
              }
            });
          }
        });
        
        // Check for updates more frequently during development
        setInterval(() => {
          registration.update();
        }, 30000); // Check every 30 seconds
      })
      .catch((error) => {
        console.log('❌ Service Worker registration failed:', error);
      });
      
    // Listen for service worker updates
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('🔄 Service Worker updated, reloading page...');
      window.location.reload();
    });
  });
}

// Clear browser cache on load for immediate updates
if (performance.navigation.type === 1) {
  // Page was refreshed
  if ('caches' in window) {
    caches.keys().then((names) => {
      names.forEach(name => {
        if (!name.includes(CACHE_VERSION)) {
          caches.delete(name);
        }
      });
    });
  }
}

createRoot(document.getElementById("root")!).render(<App />);
