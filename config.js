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
    enableRateLimiting: true
  },
  
  // Feature Flags
  features: {
    enableOfflineMode: true,
    enablePushNotifications: true,
    enableAnalytics: false, // Set to true in production
    enableErrorReporting: true
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
} else {
  window.CONFIG = CONFIG;
}
