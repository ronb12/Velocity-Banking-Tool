// Unregister any existing service workers to prevent reload loops
// This is especially important when PWA is disabled but old service workers might be registered
// IMPORTANT: This script does NOT reload the page to avoid reload loops

// Global reload guard to prevent infinite reload loops
(function() {
  // Prevent multiple reloads within a short time period
  const RELOAD_GUARD_KEY = 'reload-guard';
  const RELOAD_GUARD_TIMEOUT = 5000; // 5 seconds
  
  const lastReload = sessionStorage.getItem(RELOAD_GUARD_KEY);
  const now = Date.now();
  
  if (lastReload && (now - parseInt(lastReload)) < RELOAD_GUARD_TIMEOUT) {
    console.warn('[Reload Guard] Reload detected too soon, preventing potential loop');
    sessionStorage.removeItem(RELOAD_GUARD_KEY);
    return; // Exit early to prevent loop
  }
  
  // Store current time
  sessionStorage.setItem(RELOAD_GUARD_KEY, now.toString());
})();

(function() {
  // Check if we've already unregistered service workers
  if (sessionStorage.getItem('sw-unregistered') === 'true') {
    return; // Silently return if already done
  }

  if ('serviceWorker' in navigator) {
    // Unregister all service workers silently
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
      if (registrations.length > 0) {
        console.log('[SW Unregister] Found', registrations.length, 'service worker(s), unregistering...');
        
        // Unregister all registrations
        const unregisterPromises = registrations.map(function(registration) {
          return registration.unregister().catch(function(error) {
            console.error('[SW Unregister] Error unregistering:', error);
            return false;
          });
        });

        Promise.all(unregisterPromises).then(function() {
          // Clear all caches
          if ('caches' in window) {
            caches.keys().then(function(cacheNames) {
              return Promise.all(
                cacheNames.map(function(cacheName) {
                  return caches.delete(cacheName).catch(function(error) {
                    console.error('[SW Unregister] Error deleting cache:', cacheName, error);
                    return false;
                  });
                })
              );
            }).then(function() {
              console.log('[SW Unregister] Service workers unregistered and caches cleared');
              // Mark as unregistered - do NOT reload
              sessionStorage.setItem('sw-unregistered', 'true');
            }).catch(function(error) {
              console.error('[SW Unregister] Error clearing caches:', error);
              sessionStorage.setItem('sw-unregistered', 'true');
            });
          } else {
            sessionStorage.setItem('sw-unregistered', 'true');
          }
        }).catch(function(error) {
          console.error('[SW Unregister] Error during unregistration:', error);
          sessionStorage.setItem('sw-unregistered', 'true');
        });
      } else {
        sessionStorage.setItem('sw-unregistered', 'true');
      }
    }).catch(function(error) {
      console.error('[SW Unregister] Error getting service worker registrations:', error);
      sessionStorage.setItem('sw-unregistered', 'true');
    });
  } else {
    sessionStorage.setItem('sw-unregistered', 'true');
  }
})();

