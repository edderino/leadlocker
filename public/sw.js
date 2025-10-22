// LeadLocker Service Worker v2
// CRITICAL: Never cache HTML documents to prevent hydration mismatches

self.addEventListener("install", (e) => {
  console.log("[SW] Installing v2 - clearing all caches");
  self.skipWaiting();
});

self.addEventListener("activate", async (e) => {
  console.log("[SW] Activating v2 - wiping all old caches");
  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map((name) => caches.delete(name)));
  self.clients.claim();
  console.log("[SW] Cleared all caches on activate");
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  
  // CRITICAL: Never cache HTML responses (avoids hydration mismatch)
  if (req.destination === "document") {
    console.log("[SW] Bypassing cache for HTML:", req.url);
    return e.respondWith(fetch(req));
  }
  
  // Skip non-GET requests
  if (req.method !== 'GET') {
    return;
  }
  
  // Cache static assets only (CSS, JS, images, fonts)
  e.respondWith(
    caches.open("static-v2").then(async (cache) => {
      const res = await cache.match(req);
      if (res) {
        console.log("[SW] Cache hit:", req.url);
        return res;
      }
      const fresh = await fetch(req);
      // Only cache successful responses
      if (fresh.ok) {
        cache.put(req, fresh.clone());
      }
      return fresh;
    })
  );
});

// =====================================================
// PUSH NOTIFICATION HANDLING (unchanged)
// =====================================================

// Push event - show notification when received
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');

  if (!event.data) {
    console.log('[SW] Push event has no data');
    return;
  }

  try {
    const data = event.data.json();
    console.log('[SW] Push data:', data);

    const title = data.title || 'LeadLocker';
    const options = {
      body: data.message || 'You have a new notification',
      icon: data.icon || '/icons/icon-192.png',
      badge: data.badge || '/icons/icon-192.png',
      tag: data.tag || 'leadlocker-notification',
      data: {
        url: data.url || data.data?.url || '/',
        orgId: data.data?.orgId || data.orgId,
        eventType: data.data?.eventType || data.eventType,
        timestamp: data.timestamp || Date.now(),
      },
      vibrate: [200, 100, 200],
      requireInteraction: false,
      actions: [
        {
          action: 'open',
          title: 'View',
          icon: '/icons/icon-192.png',
        },
        {
          action: 'close',
          title: 'Dismiss',
        },
      ],
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );

  } catch (error) {
    console.error('[SW] Error parsing push data:', error);

    // Show generic notification as fallback
    event.waitUntil(
      self.registration.showNotification('LeadLocker', {
        body: 'You have a new notification',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        tag: 'leadlocker-notification',
      })
    );
  }
});

// Notification click event - handle user interaction
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);

  event.notification.close();

  // Handle different actions
  if (event.action === 'close') {
    console.log('[SW] Notification dismissed by user');
    return;
  }

  // Default action or 'open' action - open the app
  const urlToOpen = event.notification.data?.url || '/';
  
  console.log('[SW] Opening URL:', urlToOpen);

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          console.log('[SW] Focusing existing window');
          return client.focus();
        }
      }

      // If no window is open, open a new one
      if (clients.openWindow) {
        console.log('[SW] Opening new window');
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Notification close event - track dismissals (optional)
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed without action');
  
  // Optional: Track notification dismissals
  // Could send analytics event here
});
