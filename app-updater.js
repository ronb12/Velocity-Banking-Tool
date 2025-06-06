// Current version of the app
const CURRENT_VERSION = '1.0.0';

// Update check interval (5 minutes)
const UPDATE_INTERVAL = 5 * 60 * 1000;

// Function to show update notification
function showUpdateNotification() {
  const notification = document.createElement('div');
  notification.className = 'update-notification';
  notification.innerHTML = `
    <div class="update-content">
      <p>A new version is available!</p>
      <button onclick="window.location.reload()">Update Now</button>
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
}

// Function to check for updates
async function checkForUpdates() {
  try {
    // Get the service worker registration
    const registration = await navigator.serviceWorker.ready;
    
    // Create a message channel for version check
    const messageChannel = new MessageChannel();
    
    // Send version check message to service worker
    registration.active.postMessage({
      action: 'CHECK_VERSION'
    }, [messageChannel.port2]);
    
    // Listen for version response
    messageChannel.port1.onmessage = (event) => {
      const serverVersion = event.data.version;
      
      // Compare versions
      if (serverVersion !== CURRENT_VERSION) {
        showUpdateNotification();
      }
    };
  } catch (error) {
    console.error('Error checking for updates:', error);
  }
}

// Function to initialize the updater
function initializeUpdater() {
  // Check for updates immediately
  checkForUpdates();
  
  // Set up periodic update checks
  setInterval(checkForUpdates, UPDATE_INTERVAL);
  
  // Listen for service worker updates
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    showUpdateNotification();
  });
  
  // Listen for messages from service worker
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data.action === 'UPDATE_AVAILABLE') {
      showUpdateNotification();
    }
  });
}

// Initialize updater when the page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeUpdater);
} else {
  initializeUpdater();
} 