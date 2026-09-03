// =====================================================================
// Service worker — makes the site installable and lets the basic page
// shell (HTML/CSS/JS/logo) load even with a poor/no connection.
//
// IMPORTANT: bump CACHE_NAME any time you change style.css / script.js
// / any HTML file, otherwise phones that already installed the app
// keep serving the OLD cached version. Easiest habit: change the
// version number below (v1 -> v2 -> v3 ...) every time you re-deploy.
// =====================================================================
const CACHE_NAME = "bp-mobiles-hub-v1";

const APP_SHELL = [
  "index.html",
  "products.html",
  "product.html",
  "laptops.html",
  "laptop.html",
  "accessories.html",
  "accessory.html",
  "services.html",
  "contact.html",
  "account.html",
  "style.css",
  "script.js",
  "firebase-config.js",
  "logo.png",
  "favicon.ico",
  "favicon-16x16.png",
  "favicon-32x32.png",
  "apple-touch-icon.png",
  "manifest.json"
];

// ---- Install: pre-cache the app shell ----
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// ---- Activate: clear out old caches from previous versions ----
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ---- Fetch strategy ----
// Firebase/Firestore/fonts/other cross-origin requests: leave completely
// alone (network only) — we never want to serve stale phone stock/price
// data from cache. Only same-origin site files use cache-first.
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const isSameOrigin = url.origin === self.location.origin;

  if (!isSameOrigin || event.request.method !== "GET") {
    return; // let the browser handle it normally
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached); // offline: fall back to cache

      // Serve cached instantly if we have it (fast repeat visits),
      // still refresh the cache in the background from network.
      return cached || networkFetch;
    })
  );
});
