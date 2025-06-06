// Current version of the app
const APP_VERSION = '1.0.0';

// Check for updates every 5 minutes
const UPDATE_INTERVAL = 5 * 60 * 1000;

// Function to show update notification
function showUpdateNotification() {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: #007bff;
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        z-index: 9999;
        display: flex;
        align-items: center;
        gap: 12px;
    `;
    
    notification.innerHTML = `
        <span>A new version is available!</span>
        <button onclick="window.location.reload()" style="
            background: white;
            color: #007bff;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
        ">Update Now</button>
    `;
    
    document.body.appendChild(notification);
}

// Function to check for updates
async function checkForUpdates() {
    if ('serviceWorker' in navigator) {
        try {
            // Get the service worker registration
            const registration = await navigator.serviceWorker.ready;
            
            // Create a message channel
            const messageChannel = new MessageChannel();
            
            // Handler for receiving messages
            messageChannel.port1.onmessage = (event) => {
                const serverVersion = event.data.version;
                
                // Compare versions and show notification if update available
                if (serverVersion !== APP_VERSION) {
                    showUpdateNotification();
                }
            };
            
            // Send version check message to service worker
            registration.active.postMessage(
                { action: 'CHECK_VERSION' },
                [messageChannel.port2]
            );
            
        } catch (error) {
            console.error('Error checking for updates:', error);
        }
    }
}

// Function to initialize the updater
function initializeUpdater() {
    // Check for updates immediately
    checkForUpdates();
    
    // Set up periodic update checks
    setInterval(checkForUpdates, UPDATE_INTERVAL);
    
    // Listen for service worker updates
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then(registration => {
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        showUpdateNotification();
                    }
                });
            });
        });
    }
}

// Initialize the updater when the page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeUpdater);
} else {
    initializeUpdater();
} 