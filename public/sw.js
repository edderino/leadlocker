// ===============================
//   LeadLocker Service Worker v4
//   PRODUCTION SAFE — NEVER caches:
//   - /api/*
//   - JSON
//   - Authenticated requests
//   Static assets only.
// ===============================

const SW_VERSION = "v4";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // 1️⃣ BYPASS ALL API ROUTES (dynamic, must always be fresh)
  if (url.pathname.startsWith("/api/")) {
    return; // Let Next.js server handle it directly
  }

  // 2️⃣ BYPASS ALL AUTHENTICATED REQUESTS
  if (req.headers.get("Authorization")) {
    return;
  }

  // 3️⃣ BYPASS JSON + DOCUMENT requests
  const accepts = req.headers.get("accept") || "";
  if (
    req.destination === "document" ||
    accepts.includes("application/json")
  ) {
    return;
  }

  // 4️⃣ ONLY CACHE STATIC ASSETS (images, css, js bundles, fonts)
  event.respondWith(
    caches.open("static-assets-" + SW_VERSION).then((cache) => {
      return fetch(req)
        .then((res) => {
          // Store a copy in cache
          cache.put(req, res.clone());
          return res;
        })
        .catch(() => cache.match(req));
    })
  );
});
