/**
 * Auth Helper Utility
 * Provides helper functions to wait for auth initialization
 * and safely use auth across different pages
 */

/**
 * Wait for auth to be available and initialized
 * @param {number} timeout - Maximum time to wait in milliseconds (default: 10000)
 * @returns {Promise<{auth: Object, db: Object, user: Object|null}>}
 */
async function waitForAuth(timeout = 10000) {
  const startTime = Date.now();
  
  // Check if auth is already available
  if (window.auth && typeof window.auth !== 'undefined') {
    // Wait a bit more for auth state to be initialized
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      auth: window.auth,
      db: window.db || null,
      user: window.auth?.currentUser || null
    };
  }

  // Poll for auth to become available
  return new Promise((resolve, reject) => {
    const checkAuth = () => {
      const elapsed = Date.now() - startTime;
      
      if (window.auth && typeof window.auth !== 'undefined') {
        // Wait a bit more for auth state to be initialized
        setTimeout(() => {
          resolve({
            auth: window.auth,
            db: window.db || null,
            user: window.auth?.currentUser || null
          });
        }, 500);
        return;
      }

      if (elapsed >= timeout) {
        reject(new Error(`Auth not available after ${timeout}ms. Make sure auth.js is loaded.`));
        return;
      }

      setTimeout(checkAuth, 100);
    };

    checkAuth();
  });
}

/**
 * Wait for auth and then execute a callback
 * @param {Function} callback - Function to execute once auth is available
 * @param {number} timeout - Maximum time to wait in milliseconds
 */
async function withAuth(callback, timeout = 10000) {
  const { auth, db, user } = await waitForAuth(timeout);
  return callback(auth, db, user);
}

/**
 * Wait for auth state change to complete
 * @param {Object} auth - Firebase auth instance
 * @param {number} timeout - Maximum time to wait in milliseconds
 * @returns {Promise<Object|null>} Current user or null
 */
async function waitForAuthState(auth, timeout = 5000) {
  if (!auth) {
    throw new Error('Auth instance is required');
  }

  // If user is already available, return immediately
  if (auth.currentUser) {
    return auth.currentUser;
  }

  // Wait for auth state to be determined
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    let resolved = false;

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!resolved) {
        resolved = true;
        unsubscribe();
        resolve(user);
      }
    });

    // Timeout fallback
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        unsubscribe();
        // If timeout, return null (user might not be logged in)
        resolve(null);
      }
    }, timeout);
  });
}

/**
 * Check if user is authenticated (waits for auth to be ready)
 * @param {number} timeout - Maximum time to wait in milliseconds
 * @returns {Promise<boolean>}
 */
async function isAuthenticated(timeout = 10000) {
  try {
    const { auth, user } = await waitForAuth(timeout);
    return user !== null;
  } catch (error) {
    console.warn('[AuthHelper] Error checking authentication:', error.message);
    return false;
  }
}

/**
 * Get current user (waits for auth to be ready)
 * @param {number} timeout - Maximum time to wait in milliseconds
 * @returns {Promise<Object|null>}
 */
async function getCurrentUser(timeout = 10000) {
  try {
    const { user } = await waitForAuth(timeout);
    return user;
  } catch (error) {
    console.warn('[AuthHelper] Error getting current user:', error.message);
    return null;
  }
}

// Export functions for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    waitForAuth,
    withAuth,
    waitForAuthState,
    isAuthenticated,
    getCurrentUser
  };
}

// Make functions globally available
window.waitForAuth = waitForAuth;
window.withAuth = withAuth;
window.waitForAuthState = waitForAuthState;
window.isAuthenticated = isAuthenticated;
window.getCurrentUser = getCurrentUser;

