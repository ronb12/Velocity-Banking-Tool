/**
 * Configuration Manager
 * Loads configuration from environment variables with fallbacks
 */

const CONFIG = {
  // Firebase Configuration (from environment variables)
  firebase: {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  },

  // App Configuration
  app: {
    name: import.meta.env.VITE_APP_NAME || "Bradley's Finance Hub",
    version: import.meta.env.VITE_APP_VERSION || '2.1.0',
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
    maxRetries: 3,
    cacheTimeout: 5 * 60 * 1000, // 5 minutes
  },

  // Security Configuration
  security: {
    minPasswordLength: 8,
    maxLoginAttempts: 5,
    lockoutDuration: 15 * 60 * 1000, // 15 minutes
    enableRateLimiting: true,
    allowUnverifiedLocalLogin: import.meta.env.VITE_ALLOW_UNVERIFIED_LOCAL_LOGIN === 'true',
    allowUnverifiedAccounts: (import.meta.env.VITE_ALLOW_UNVERIFIED_ACCOUNTS || '')
      .split(',')
      .map(email => email.trim().toLowerCase())
      .filter(Boolean),
  },

  // Feature Flags
  features: {
    enableOfflineMode: import.meta.env.VITE_ENABLE_OFFLINE_MODE !== 'false',
    enablePushNotifications: true,
    enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
    enableErrorReporting: import.meta.env.VITE_ENABLE_ERROR_REPORTING !== 'false',
  },
};

// Validate required configuration
function validateConfig() {
  const required = [
    'firebase.apiKey',
    'firebase.authDomain',
    'firebase.projectId',
  ];

  const missing = required.filter(key => {
    const value = key.split('.').reduce((obj, k) => obj?.[k], CONFIG);
    return !value;
  });

  if (missing.length > 0 && import.meta.env.MODE === 'production') {
    console.error('[Config] Missing required configuration:', missing);
    throw new Error(`Missing required configuration: ${missing.join(', ')}`);
  }

  if (missing.length > 0) {
    console.warn('[Config] Missing configuration (using defaults):', missing);
  }
}

// Initialize
validateConfig();

// Export
export default CONFIG;

// Make globally available for backward compatibility
if (typeof window !== 'undefined') {
  window.CONFIG = CONFIG;
}

