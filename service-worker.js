const CACHE_NAME = 'velocity-banking-v2';
const STATIC_CACHE = 'static-v2';
const DYNAMIC_CACHE = 'dynamic-v2';
const VERSION = '1.1.0';

const STATIC_ASSETS = [
  '/index.html',
  '/src/pages/other/budget.html',
  '/src/pages/debt/Debt_Tracker.html',
  '/src/pages/calculators/Velocity_Calculator.html',
  '/src/pages/calculators/Credit_Score_Estimator.html',
  '/src/pages/auth/login.html',
  '/src/pages/auth/register.html',
  '/app-updater.js',
  '/config.js',
  '/icon-192.png',
  '/icon-512.png'
  // Note: /offline.html is created dynamically, not cached in STATIC_ASSETS
  // Note: / (root) is handled by index.html, no need to cache separately
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
      // Create offline page dynamically (it doesn't exist as a file)
      caches.open(STATIC_CACHE)
        .then(cache => {
          const offlineHTML = '<!DOCTYPE html><html><head><title>Offline</title><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body{font-family:sans-serif;text-align:center;padding:20px;background:#f5f5f5}h1{color:#333;margin-top:50px}</style></head><body><h1>📴 You are offline</h1><p>Please check your internet connection and try again.</p><button onclick="window.location.reload()" style="padding:10px 20px;margin-top:20px;cursor:pointer;background:#2196f3;color:white;border:none;border-radius:5px">Retry</button></body></html>';
          return cache.put(new Request('/offline.html'), new Response(offlineHTML, {
            headers: {
              'Content-Type': 'text/html; charset=utf-8'
            }
          }));
        })
        .catch(err => {
          console.warn('[SW] Failed to cache offline page:', err);
          // Non-fatal - continue anyway
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
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // CRITICAL: DO NOT call clients.claim() automatically
      // This prevents automatic reload loops
      // clients.claim() should only be called when user explicitly requests an update
      // Calling it here causes the service worker to take control immediately
      // which can trigger reload loops when a new service worker is installed
    ]).then(() => {
      console.log('[SW] Activate event completed - NOT claiming clients to prevent reload loops');
      // Try to register background sync, but don't fail if it's not supported
      if (self.registration.sync) {
        return self.registration.sync.register('sync-data').catch(err => {
          console.warn('[SW] Background sync registration failed (non-fatal):', err);
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

  const url = new URL(event.request.url);
  const pathname = url.pathname;

  // CRITICAL: Don't intercept JS, CSS, or other static assets - let the browser handle them
  // Only intercept HTML navigation requests and API calls
  const isStaticAsset = /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot|json|webp|map)$/i.test(pathname);
  
  if (isStaticAsset) {
    // DO NOT intercept static assets - let browser fetch directly
    // This prevents MIME type issues and allows Firebase to serve files correctly
    return;
  }

  // For navigation requests (HTML), always fetch from network first
  // This ensures we get the correct page (login.html, register.html, etc.)
  if (event.request.mode === 'navigate' || event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request, { 
        cache: 'no-store', // Don't use browser cache, always fetch fresh
        redirect: 'follow', // Follow redirects normally
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
        .then(response => {
          // Verify we got the right page - check the URL matches
          const requestUrl = new URL(event.request.url);
          const responseUrl = response.url ? new URL(response.url) : requestUrl;
          
          // Only cache if the response URL matches the request URL (prevent redirects being cached)
          if (response.status === 200 && requestUrl.pathname === responseUrl.pathname) {
            const responseToCache = response.clone();
            // Don't cache auth pages to prevent them being served as index.html
            const isAuthPage = requestUrl.pathname.includes('login.html') || 
                             requestUrl.pathname.includes('register.html') || 
                             requestUrl.pathname.includes('reset.html');
            if (!isAuthPage) {
              // Cache in background (don't wait for it)
              // Add error handling to prevent unhandled promise rejections
              caches.open(DYNAMIC_CACHE)
                .then(cache => {
                  return cache.put(event.request, responseToCache).catch(err => {
                    console.warn('[SW] Failed to cache navigation response:', event.request.url, err);
                  });
                })
                .catch(err => {
                  console.warn('[SW] Failed to open cache for navigation response:', err);
                })
                .catch(() => {
                  // Final catch to prevent unhandled rejections
                  // Errors are already logged above
                });
            }
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache only if network fails
          return caches.match(event.request)
            .then(response => {
              if (response) {
                // Double-check we're not serving index.html when login.html was requested
                const requestUrl = new URL(event.request.url);
                const cachedUrl = response.url ? new URL(response.url) : null;
                // Check if we're serving the wrong page (e.g., index.html when login.html was requested)
                if (cachedUrl && requestUrl.pathname !== cachedUrl.pathname) {
                  const isAuthRequest = requestUrl.pathname.includes('login.html') || 
                                       requestUrl.pathname.includes('register.html') || 
                                       requestUrl.pathname.includes('reset.html');
                  if (isAuthRequest) {
                    // Don't serve wrong cached page - return offline response
                    return caches.match('/offline.html').then(offlineResponse => {
                      if (offlineResponse) {
                        return offlineResponse;
                      }
                      return new Response('Network unavailable. Please check your connection.', { 
                        status: 503,
                        headers: { 'Content-Type': 'text/html; charset=utf-8' }
                      });
                    });
                  }
                }
                return response;
              }
              // Return offline page as last resort
              // Fallback to a basic offline response if offline page isn't cached
              return caches.match('/offline.html').then(offlineResponse => {
                if (offlineResponse) {
                  return offlineResponse;
                }
                // If offline page doesn't exist, return a basic offline message
                return new Response(
                  '<!DOCTYPE html><html><head><title>Offline</title><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body{font-family:sans-serif;text-align:center;padding:20px;background:#f5f5f5}h1{color:#333;margin-top:50px}</style></head><body><h1>📴 You are offline</h1><p>Please check your internet connection and try again.</p><button onclick="window.location.reload()" style="padding:10px 20px;margin-top:20px;cursor:pointer;background:#2196f3;color:white;border:none;border-radius:5px">Retry</button></body></html>',
                  {
                    status: 503,
                    statusText: 'Service Unavailable',
                    headers: { 'Content-Type': 'text/html; charset=utf-8' }
                  }
                );
              });
            });
        })
    );
    return;
  }

  // For API requests and other non-static assets
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Clone the response
        const responseToCache = response.clone();

        // Cache the response (but not for API calls)
        if (response.status === 200 && !pathname.includes('/api/')) {
          // Cache in background with error handling
          caches.open(DYNAMIC_CACHE)
            .then(cache => {
              return cache.put(event.request, responseToCache).catch(err => {
                console.warn('[SW] Failed to cache response:', event.request.url, err);
              });
            })
            .catch(err => {
              console.warn('[SW] Failed to open cache:', err);
            })
            .catch(() => {
              // Final catch to prevent unhandled rejections
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
            // Return a default offline response for non-HTML requests
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
    // Check if ports array exists and has elements before accessing
    if (event.ports && event.ports.length > 0) {
      event.ports[0].postMessage({
        version: VERSION
      });
    }
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
    event.waitUntil(
      syncData().catch(error => {
        // Handle sync errors gracefully
        console.warn('[SW] Background sync error:', error);
        return Promise.resolve(); // Don't fail the sync event
      })
    );
  }
});

// Function to handle background sync
// Note: This uses IndexedDB for offline data storage
async function syncData() {
  try {
    // Simple IndexedDB wrapper for background sync
    const dbName = 'offline-sync-db';
    const dbVersion = 1;
    const storeName = 'pendingData';
    
    const openDB = () => {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, dbVersion);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        
        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
          }
        };
      });
    };
    
    const db = await openDB();
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    
    // Get all pending data
    const getAllRequest = store.getAll();
    const pendingData = await new Promise((resolve, reject) => {
      getAllRequest.onsuccess = () => resolve(getAllRequest.result);
      getAllRequest.onerror = () => reject(getAllRequest.error);
    });
    
    // Set up transaction completion handler before processing
    const syncComplete = new Promise((resolve) => {
      transaction.oncomplete = () => {
        console.log('[SW] Background sync completed');
        resolve();
      };
      transaction.onerror = () => {
        console.warn('[SW] Background sync transaction error');
        resolve(); // Resolve anyway to not block
      };
    });
    
    for (const data of pendingData) {
      try {
        const response = await fetch(data.url, {
          method: data.method || 'GET',
          headers: data.headers || {},
          body: data.body
        });
        
        if (response.ok) {
          // Delete synced data within the same transaction
          store.delete(data.id);
        }
      } catch (error) {
        console.error('Sync failed for data:', data.id, error);
      }
    }
    
    // Wait for transaction to complete
    await syncComplete;
  } catch (error) {
    // Silently fail - background sync is optional
    console.warn('[SW] Background sync failed (non-fatal):', error);
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
  
  let timeoutId = null;
  try {
    // Add timeout to prevent hanging
    const controller = new AbortController();
    timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch('/version.json', { 
      cache: 'no-store',
      signal: controller.signal
    });
    
    // Clear timeout only if fetch succeeded
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    
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
    // Clean up timeout on error
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    // Silently fail - don't log errors that might spam console
    // This prevents update check failures from causing issues
    // AbortError is expected when timeout occurs, so we can ignore it
    if (error.name !== 'AbortError') {
      console.warn('[SW] Update check error:', error.message);
    }
  }
}
