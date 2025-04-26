const CACHE_NAME = "finance-hub-cache-v2";
const urlsToCache = [
  "index.html",
  "manifest.json",
  "service-worker.js",
  "icon-192.png",
  "icon-512.png",
  "https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js",
  "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth-compat.js",
  "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore-compat.js"
];

// Install event
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log("✅ Cache Opened");
        return cache.addAll(urlsToCache).catch(error => {
          console.error("❌ Error caching files:", error);
        });
      })
  );
});

// Fetch event
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});
