// Current version of the app
const CURRENT_VERSION = '1.0.0';

// Update check interval (10 minutes - less frequent to avoid conflicts)
const UPDATE_INTERVAL = 10 * 60 * 1000;

// Flag to prevent multiple reloads
let isReloading = false;

// Flag to prevent multiple update check intervals
let updateCheckInterval = null;
let isInitialized = false;

// Function to show update notification
function showUpdateNotification() {
  // Don't show if already reloading
  if (isReloading) return;
  
  const notification = document.createElement('div');
  notification.className = 'update-notification';
  notification.innerHTML = `
    <div class="update-content">
      <p>A new version is available!</p>
      <button id="update-now-btn">Update Now</button>
      <button id="update-later-btn">Later</button>
    </div>
  `;
  document.body.appendChild(notification);

  // Add styles if not already present
  if (!document.getElementById('update-notification-styles')) {
    const styles = document.createElement('style');
    styles.id = 'update-notification-styles';
    styles.textContent = `
      .update-notification {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: #2196F3;
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        z-index: 1000;
        animation: slideUp 0.3s ease-out;
      }
      .update-content {
        display: flex;
        align-items: center;
        gap: 15px;
      }
      .update-notification button {
        background-color: white;
        color: #2196F3;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
        transition: background-color 0.2s;
      }
      .update-notification button:hover {
        background-color: #f0f0f0;
      }
      @keyframes slideUp {
        from { transform: translate(-50%, 100%); opacity: 0; }
        to { transform: translate(-50%, 0); opacity: 1; }
      }
    `;
    document.head.appendChild(styles);
  }

  // Add event listeners
  document.getElementById('update-now-btn').addEventListener('click', () => {
    if (!isReloading) {
      isReloading = true;
      
      // Use safe reload wrapper if available, otherwise check before reloading
      if (window.safeLocationReload) {
        window.safeLocationReload();
      } else {
        // Check reload guard before reloading
        const reloadHistory = JSON.parse(sessionStorage.getItem('reload-history') || '[]');
        const now = Date.now();
        const recent = reloadHistory.filter(t => (now - t) < 10000);
        
        if (recent.length < 2 && sessionStorage.getItem('reload-blocked') !== 'true') {
          window.location.reload();
        } else {
          console.warn('[App Updater] Reload blocked by reload guard');
          isReloading = false;
        }
      }
    }
  });

  document.getElementById('update-later-btn').addEventListener('click', () => {
    notification.remove();
  });
}

// Rate limiting for update checks
let lastUpdateCheck = 0;
const MIN_UPDATE_CHECK_INTERVAL = 60000; // 1 minute minimum between checks

// Function to check for updates
async function checkForUpdates() {
  // Rate limit update checks to prevent excessive checks
  const now = Date.now();
  if (now - lastUpdateCheck < MIN_UPDATE_CHECK_INTERVAL) {
    console.log('[App Updater] Update check skipped - too soon since last check');
    return;
  }
  lastUpdateCheck = now;
  
  try {
    if (!('serviceWorker' in navigator)) return;
    
    // Check if there's an existing service worker registration
    const registration = await navigator.serviceWorker.getRegistration();
    
    // If no service worker is registered, don't try to check for updates
    if (!registration) {
      console.log('[App Updater] No service worker registered, skipping update check');
      return;
    }
    
    // Wait for service worker to be ready (with timeout)
    const readyRegistration = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Service worker ready timeout')), 5000))
    ]).catch(error => {
      console.log('[App Updater] Service worker not ready or timeout:', error.message);
      return null;
    });
    
    if (!readyRegistration) {
      return;
    }
    
    // Check if there's an update available (this triggers update check)
    // Only do this if not already checking and if enough time has passed
    // Add a flag to prevent multiple simultaneous update checks
    if (readyRegistration._updateChecking) {
      console.log('[App Updater] Update check already in progress, skipping');
      return;
    }
    
    try {
      readyRegistration._updateChecking = true;
      await readyRegistration.update();
      // Clear flag after a delay to allow future checks
      setTimeout(() => {
        readyRegistration._updateChecking = false;
      }, 10000); // 10 second cooldown
    } catch (updateError) {
      readyRegistration._updateChecking = false;
      // Silently fail update check errors
      console.log('[App Updater] Update check failed (non-fatal):', updateError.message);
      return;
    }
    
    // Listen for updates (only if registration exists)
    // Only check once per registration to avoid duplicate listeners
    if (!readyRegistration._updateListenerAdded) {
      readyRegistration._updateListenerAdded = true;
      
      if (readyRegistration.installing || readyRegistration.waiting) {
        const worker = readyRegistration.installing || readyRegistration.waiting;
        if (worker) {
          worker.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker is installed, show notification (user must confirm)
              // Do NOT auto-reload - let user decide
              showUpdateNotification();
            }
          });
        }
      }
    }
  } catch (error) {
    // Silently fail - don't cause reload loops
    console.log('[App Updater] Error checking for updates (non-fatal):', error.message);
  }
}

// Function to initialize the updater
function initializeUpdater() {
  // Prevent multiple initializations
  if (isInitialized) {
    console.log('[App Updater] Already initialized, skipping');
    return;
  }
  
  // Only initialize if service workers are supported
  if (!('serviceWorker' in navigator)) {
    console.log('[App Updater] Service workers not supported, disabling updater');
    return;
  }
  
  // Check if there's actually a service worker registered
  navigator.serviceWorker.getRegistration().then(registration => {
    if (!registration) {
      console.log('[App Updater] No service worker registered, disabling updater');
      return;
    }
    
    // Mark as initialized before setting up intervals
    isInitialized = true;
    
    // Only set up update checks if service worker exists
    // Check for updates after a longer delay to avoid immediate reloads
    setTimeout(() => {
      checkForUpdates();
    }, 10000); // Increased delay to avoid conflicts during page load
    
    // Clear any existing interval first
    if (updateCheckInterval) {
      clearInterval(updateCheckInterval);
    }
    
    // Set up periodic update checks (less frequent)
    updateCheckInterval = setInterval(checkForUpdates, UPDATE_INTERVAL);
    
    // Listen for messages from service worker (but don't auto-reload)
    // Use a single listener that checks for duplicate messages
    let lastMessageTime = 0;
    navigator.serviceWorker.addEventListener('message', (event) => {
      // Rate limit message handling
      const now = Date.now();
      if (now - lastMessageTime < 5000) {
        return; // Ignore messages too close together
      }
      lastMessageTime = now;
      
      if (event.data && event.data.action === 'UPDATE_AVAILABLE') {
        showUpdateNotification();
      }
    });
  }).catch(error => {
    console.log('[App Updater] Error checking service worker registration (non-fatal):', error.message);
  });
}

// Initialize updater when the page loads
// CRITICAL: Disable auto-update checks on production to prevent reload loops
// Only enable on localhost for development testing
const isProduction = window.location && (
  window.location.hostname.includes('firebaseapp.com') || 
  window.location.hostname.includes('web.app') || 
  window.location.hostname.includes('github.io')
);
const isLocalhost = window.location && (
  window.location.hostname === 'localhost' || 
  window.location.hostname === '127.0.0.1'
);

// Only initialize updater on localhost to prevent production reload loops
if (isLocalhost && !isProduction) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeUpdater);
  } else {
    initializeUpdater();
  }
} else if (isProduction) {
  console.log('[App Updater] Disabled on production to prevent reload loops');
}
