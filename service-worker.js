const CACHE_NAME = 'velocity-banking-v1';
const STATIC_CACHE = 'static-v1';
const DYNAMIC_CACHE = 'dynamic-v1';
const VERSION = '1.0.0'; // Add version tracking

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/budget.html',
  '/Debt_Tracker.html',
  '/Velocity_Calculator.html',
  '/Credit_Score_Estimator.html',
  '/theme.css',
  '/global.js',
  '/icon-192.png',
  '/icon-512.png'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
  );
  // Activate new service worker immediately
  self.skipWaiting();
});

// Activate event - clean up old caches and take control
self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC