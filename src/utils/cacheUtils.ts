// Cache busting utilities for immediate updates

export const CACHE_VERSION = 'v3.2-sw-fix';
export const BUILD_TIMESTAMP = '2026-05-13-sw-fix';

// Force clear all caches
export const clearAllCaches = async (): Promise<void> => {
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    );
    console.log('🗑️ All caches cleared');
  }
};

// Clear old caches, keep current version
export const clearOldCaches = async (): Promise<void> => {
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => {
        if (!cacheName.includes(CACHE_VERSION)) {
          return caches.delete(cacheName);
        }
      })
    );
    console.log('🧹 Old caches cleared');
  }
};

// Force reload with cache bypass
export const forceReload = (): void => {
  // Clear localStorage version flags
  localStorage.removeItem('app_version');
  localStorage.removeItem('last_update_check');
  
  // Set new version
  localStorage.setItem('app_version', CACHE_VERSION);
  localStorage.setItem('last_update_check', Date.now().toString());
  
  // Force reload with cache bypass
  window.location.reload();
};

// Check if app needs update
export const checkForUpdates = (): boolean => {
  const currentVersion = localStorage.getItem('app_version');
  const lastCheck = localStorage.getItem('last_update_check');
  const now = Date.now();
  
  // Force update if version changed or no recent check
  if (currentVersion !== CACHE_VERSION || !lastCheck || (now - parseInt(lastCheck)) > 300000) {
    return true;
  }
  
  return false;
};

// Add cache-busting query params to URLs
export const addCacheBuster = (url: string): string => {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${CACHE_VERSION}&t=${BUILD_TIMESTAMP}`;
};

// Initialize cache management
export const initializeCacheManagement = (): void => {
  // Check for updates on app start
  if (checkForUpdates()) {
    console.log('🔄 App update detected, clearing old caches...');
    clearOldCaches();
    localStorage.setItem('app_version', CACHE_VERSION);
    localStorage.setItem('last_update_check', Date.now().toString());
  }
  
  // Set up periodic update checks
  setInterval(() => {
    if (checkForUpdates()) {
      console.log('🔄 Periodic update check triggered');
      clearOldCaches();
    }
  }, 300000); // Check every 5 minutes
};