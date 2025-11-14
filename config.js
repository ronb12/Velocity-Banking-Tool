// Environment Configuration
// This file should be added to .gitignore in production
const CONFIG = {
  // Firebase Configuration
  firebase: {
    apiKey: "AIzaSyDrdga_hOO52nicYN3AwqqDjSbcnre6iM4",
    authDomain: "mobile-debt-tracker.firebaseapp.com",
    projectId: "mobile-debt-tracker",
    storageBucket: "mobile-debt-tracker.appspot.com",
    messagingSenderId: "153601029964",
    appId: "1:153601029964:web:ddd1880ba21bce2e9041e9"
  },
  
  // App Configuration
  app: {
    name: "Bradley's Financial Tools",
    version: "2.0.0",
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
    maxRetries: 3,
    cacheTimeout: 5 * 60 * 1000 // 5 minutes
  },
  
  // Security Configuration
  security: {
    minPasswordLength: 8,
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
    enableRateLimiting: true,
    allowUnverifiedLocalLogin: true,
    allowUnverifiedAccounts: [
      'testuser@bfh.com',
      'testuser@BFH.com', // Also allow uppercase variant
    ]
  },
  
  // Feature Flags
  features: {
    enableOfflineMode: true,
    enablePushNotifications: true,
    enableAnalytics: false, // Set to true in production
    enableErrorReporting: true
  }
};

(() => {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
    return;
  }

  window.CONFIG = CONFIG;

  if (typeof window === 'undefined') {
    return;
  }

  try {
    const host = window.location && window.location.hostname;
    if (host && (host === 'localhost' || host === '127.0.0.1')) {
      const existing = document.querySelector('script[data-local-test-data="true"]');
      if (!existing) {
        const script = document.createElement('script');
        script.src = 'local-test-data.js';
        script.defer = true;
        script.dataset.localTestData = 'true';
        document.head.appendChild(script);
      }
    }
  } catch (err) {
    console.warn('Unable to load local test data helper:', err);
  }
})();
