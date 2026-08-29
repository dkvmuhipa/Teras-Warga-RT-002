const CACHE_NAME = 'teras-rt02-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/logo-rt.svg',
  '/logo.svg',
  '/manifest.json'
];

// Install Event: Pre-cache App Shell & Core Assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker v2] Pre-caching core app assets for offline readiness');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: Instant cache cleanup
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker v2] Purging deprecated cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event (Stale-While-Revalidate with full network fallback)
self.addEventListener('fetch', (event) => {
  // Only handle GET requests and skip non-http(s), browser extensions, or external services
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip Vite HMR / WebSockets / API calls / Firestore to avoid intercepting dev server HMR or live data
  const url = new URL(event.request.url);
  if (url.protocol === 'ws:' || url.protocol === 'wss:' || url.pathname.includes('/api/') || url.pathname.includes('/firestore') || url.port === '24678') {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch background update gracefully
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
            }
          })
          .catch(() => { /* Clean ignore background fetch failure */ });
          
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(async () => {
        // Offline Fallback for SPA routing: return index.html for page loads
        if (event.request.headers.get('accept')?.includes('text/html')) {
          const fallback = await caches.match('/');
          if (fallback) return fallback;
        }
        // Always return a valid Response object to prevent "Failed to convert value to 'Response'" TypeError
        return new Response('Network error occurred', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({ 'Content-Type': 'text/plain' })
        });
      });
    })
  );
});
