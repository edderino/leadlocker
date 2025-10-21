// LeadLocker Service Worker
// Provides offline caching and PWA functionality

const CACHE_NAME = 'leadlocker-v1';
const RUNTIME_CACHE = 'leadlocker-runtime';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/client',
  '/manifest.json',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome extensions and external requests
  if (!url.origin.includes(self.location.origin)) {
    return;
  }

  // API routes - network first, cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful API responses
          if (response.ok && (url.pathname.includes('/analytics') || url.pathname.includes('/client/leads'))) {
            const responseClone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache for analytics and client data
          return caches.match(request).then((cached) => {
            if (cached) {
              console.log('[SW] Serving from cache (offline):', url.pathname);
              return cached;
            }
            // Return offline page or error
            return new Response(
              JSON.stringify({ success: false, error: 'Offline' }),
              {
                headers: { 'Content-Type': 'application/json' },
                status: 503
              }
            );
          });
        })
    );
    return;
  }

  // All other requests - cache first, network fallback
  event.respondWith(
    caches.match(request)
      .then((cached) => {
        if (cached) {
          console.log('[SW] Serving from cache:', url.pathname);
          return cached;
        }

        return fetch(request).then((response) => {
          // Cache successful responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        });
      })
  );
});

// Message event - allow runtime cache clearing
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    console.log('[SW] Clearing caches...');
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => caches.delete(name))
        );
      })
    );
  }
});

