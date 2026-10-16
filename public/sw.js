// Service Worker for CampusMart
//
// Strategy:
//  - /api/* and /share/*  -> straight to the network (always fresh)
//  - page navigations      -> network first (so a new deploy is picked up
//                             immediately); the cached copy is only an
//                             offline fallback
//  - /assets/* (hashed)    -> cache first; the file name changes whenever the
//                             content does, so a cached copy is never stale
//  - other static files    -> cached copy now, refreshed in the background
//
// IMPORTANT: only real files are ever cached. The host answers a request for a
// file that no longer exists (e.g. an old script after a deploy) with the app's
// index.html and a 200 status. The previous version of this worker cached that
// HTML under the script's URL, so loading that page's code failed forever and
// admin sidebar links did nothing. Responses that are HTML for a non-HTML
// request are now never stored, and a bad cached entry is thrown away.
const CACHE_NAME = 'campusmart-v4-safe-assets';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.map((n) => (n !== CACHE_NAME ? caches.delete(n) : undefined))))
      .then(() => self.clients.claim())
  );
});

const isHtml = (response) => (response.headers.get('Content-Type') || '').includes('text/html');

// Never cache an HTML answer to a request for a script, style, image, etc.
const isCacheableAsset = (request, response) =>
  response && response.ok && response.status === 200 && (request.destination === 'document' || !isHtml(response));

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  // Dynamic routes: network only. API keeps its offline JSON fallback.
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(
        () => new Response(JSON.stringify({ error: 'Network unavailable', offline: true }), {
          headers: { 'Content-Type': 'application/json' },
        })
      )
    );
    return;
  }
  if (url.pathname.startsWith('/share/')) return;

  // Page navigations: network first, cached shell only when offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok && isHtml(response)) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', copy));
          }
          return response;
        })
        .catch(() => caches.match('/index.html').then((cached) => cached || Response.error()))
    );
    return;
  }

  // Hashed build files: cache first.
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached && !isHtml(cached)) return cached;
        if (cached) await cache.delete(request); // a poisoned entry from an older worker

        const response = await fetch(request);
        if (isCacheableAsset(request, response)) cache.put(request, response.clone());
        return response;
      })
    );
    return;
  }

  // Everything else static (icons, banners, manifest): cached copy now, refresh behind it.
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(request);
      const refresh = fetch(request)
        .then((response) => {
          if (isCacheableAsset(request, response)) cache.put(request, response.clone());
          return response;
        })
        .catch(() => undefined);
      if (cached && !isHtml(cached)) return cached;
      return (await refresh) || Response.error();
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME).then(() => {
      if (event.ports[0]) event.ports[0].postMessage({ success: true });
    });
  }
});
