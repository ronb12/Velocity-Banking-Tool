const CACHE_NAME = 'velocity-banking-v2';
const STATIC_CACHE = 'static-v2';
const DYNAMIC_CACHE = 'dynamic-v2';
const VERSION = '1.1.0';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/budget.html',
  '/Debt_Tracker.html',
  '/Velocity_Calculator.html',
  '/Credit_Score_Estimator.html',
  '/theme.css',
  '/global.js',
  '/app-updater.js',
  '/icon-192.png',
  '/icon-512.png',
  '/offline.html'
];

// Install event - cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE)
        .then(cache => {
          console.log('Caching static assets');
          return cache.addAll(STATIC_ASSETS).catch(err => {
            console.warn('Failed to cache some assets:', err);
            // Continue even if some assets fail to cache
            return Promise.resolve();
          });
        }),
      // Create offline page
      caches.open(STATIC_CACHE)
        .then(cache => {
          return cache.add(new Request('/offline.html', {
            method: 'GET',
            headers: new Headers({
              'Content-Type': 'text/html'
            }),
            body: '<!DOCTYPE html><html><head><title>Offline</title><style>body{font-family:sans-serif;text-align:center;padding:20px}h1{color:#333}</style></head><body><h1>You are offline</h1><p>Please check your internet connection and try again.</p></body></html>'
          }));
        })
    ])
  );
  // DO NOT skip waiting automatically - wait for user confirmation
  // This prevents aggressive reloads that cause loops
});

// Activate event - clean up old caches and take control
self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Only claim clients if explicitly requested (not automatically)
      // This prevents automatic reload loops
      // clients.claim() is now only called when user explicitly updates
    ]).then(() => {
      // Try to register background sync, but don't fail if it's not supported
      if (self.registration.sync) {
        return self.registration.sync.register('sync-data').catch(err => {
          console.warn('Background sync registration failed (non-fatal):', err);
          return Promise.resolve();
        });
      }
      return Promise.resolve();
    })
  );
});

// Fetch event - serve from network first, fallback to cache
self.addEventListener('fetch', event => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Clone the response
        const responseToCache = response.clone();

        // Cache the response
        if (response.status === 200) {
          caches.open(DYNAMIC_CACHE)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
        }

        return response;
      })
      .catch(() => {
        // Fallback to cache if network fails
        return caches.match(event.request)
          .then(response => {
            if (response) {
              return response;
            }
            // Return offline page for HTML requests
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('/offline.html');
            }
            // Return a default offline response for other requests
            return new Response('Offline', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
      })
  );
});

// Message handling for version checks and updates
self.addEventListener('message', event => {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
  
  if (event.data.action === 'CHECK_VERSION') {
    event.ports[0].postMessage({
      version: VERSION
    });
  }

  if (event.data.action === 'UPDATE_AVAILABLE') {
    self.registration.showNotification('Update Available', {
      body: 'A new version is available. Click to update.',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'update-available'
    });
  }
});

// Background sync for offline data
self.addEventListener('sync', event => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

// Function to handle background sync
async function syncData() {
  try {
    const db = await openDB();
    const pendingData = await db.getAll('pendingData');
    
    for (const data of pendingData) {
      try {
        const response = await fetch(data.url, {
          method: data.method,
          headers: data.headers,
          body: data.body
        });
        
        if (response.ok) {
          await db.delete('pendingData', data.id);
        }
      } catch (error) {
        console.error('Sync failed:', error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Push notification handling
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'New update available!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      url: '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification('Velocity Banking', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.notification.tag === 'update-available') {
    event.waitUntil(
      clients.openWindow('/')
        .then(() => {
          // Notify all clients about the update
          clients.matchAll().then(clients => {
            clients.forEach(client => {
              client.postMessage({ action: 'UPDATE_AVAILABLE' });
            });
          });
        })
    );
  } else {
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/')
    );
  }
});

// Handle periodic sync
self.addEventListener('periodicsync', event => {
  if (event.tag === 'check-updates') {
    event.waitUntil(checkForUpdates());
  }
});

// Function to check for updates
// Rate limited to prevent excessive checks
let lastUpdateCheck = 0;
const UPDATE_CHECK_INTERVAL = 300000; // 5 minutes minimum between checks

async function checkForUpdates() {
  const now = Date.now();
  
  // Rate limit update checks to prevent loops
  if (now - lastUpdateCheck < UPDATE_CHECK_INTERVAL) {
    console.log('[SW] Update check skipped - too soon since last check');
    return;
  }
  
  lastUpdateCheck = now;
  
  try {
    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch('/version.json', { 
      cache: 'no-store',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      return; // Silently fail if version file doesn't exist
    }
    
    const data = await response.json();
    
    if (data.version && data.version !== VERSION) {
      // Only show notification if version actually changed
      self.registration.showNotification('Update Available', {
        body: 'A new version is available. Click to update.',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: 'update-available'
      });
    }
  } catch (error) {
    // Silently fail - don't log errors that might spam console
    // This prevents update check failures from causing issues
  }
}
