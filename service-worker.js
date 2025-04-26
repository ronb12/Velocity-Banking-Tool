const CACHE_NAME = "debt-tracker-cache-v1";
const urlsToCache = [
  "index.html",
  "favicon.png",
  "manifest.json",
  "service-worker.js",
  "https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js",
  "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth-compat.js",
  "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore-compat.js"
];

// Install event
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log("Opened cache");
        return cache.addAll(urlsToCache);
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
