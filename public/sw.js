// Service Worker for CampusMart - Mobile Lucky Codes Update
const CACHE_NAME = 'campusmart-v3.2-sw-fix';
const CACHE_VERSION = '2026-05-13-sw-fix';

// Force update on version change
self.addEventListener('install', (event) => {
  console.log('Service Worker installing - SW Fix Update');
  // Skip waiting to activate immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating - Clearing old caches');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all clients immediately
      return self.clients.claim();
    })
  );
});

// Network-first strategy for API calls, cache-first for static assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Only handle GET requests for caching (Cache API doesn't support POST, PUT, etc.)
  if (event.request.method !== 'GET') {
    event.respondWith(fetch(event.request));
    return;
  }
  
  // API calls - always fetch fresh
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(JSON.stringify({
          error: 'Network unavailable',
          offline: true
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }
  
  // Static assets - cache with network fallback
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((response) => {
        if (response) {
          // Serve from cache but update in background
          fetch(event.request).then((fetchResponse) => {
            if (fetchResponse.ok && fetchResponse.status < 400) {
              cache.put(event.request, fetchResponse.clone());
            }
          }).catch(() => {
            // Network error, keep using cache
          });
          return response;
        }
        
        // Not in cache, fetch from network
        return fetch(event.request).then((fetchResponse) => {
          if (fetchResponse.ok && fetchResponse.status < 400) {
            cache.put(event.request, fetchResponse.clone());
          }
          return fetchResponse;
        });
      });
    })
  );
});

// Handle messages from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME).then(() => {
      event.ports[0].postMessage({ success: true });
    });
  }
});