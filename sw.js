const CACHE_NAME = "andrews-tracker-v5";
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css?v=reset-20260918-3",
  "./clarity.css?v=ledger-20260918-3",
  "./logic.js?v=reset-20260918-1",
  "./action-plan.js?v=reset-20260918-1",
  "./cloud-config.js?v=sync-20260918-4",
  "./cloud-sync.js?v=sync-20260918-3",
  "./pwa.js?v=pwa-20260919-4",
  "./app.js?v=reset-20260918-3",
  "./app.webmanifest",
  "./assets/Manrope-Variable.ttf",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/icon-maskable-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put("./index.html", copy));
          return response;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
      }
      return response;
    }))
  );
});
