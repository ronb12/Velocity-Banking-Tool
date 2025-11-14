// Import Firebase services from firebase-config.js
import { auth, db } from './firebase-config.js';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import { doc, getDoc, setDoc, updateDoc, onSnapshot, collection } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

// Make auth and db globally available immediately
// This ensures they're available for non-module scripts and tests
if (typeof window !== 'undefined') {
  window.auth = auth;
  window.db = db;
}

// Session management
let currentUser = null;
let sessionTimer = null;
let loginAttempts = 0;
let lockoutUntil = null;
let authStateResolved = false;

// Load configuration
const SESSION_TIMEOUT = window.CONFIG?.app?.sessionTimeout || 30 * 60 * 1000; // 30 minutes
const MAX_LOGIN_ATTEMPTS = window.CONFIG?.security?.maxLoginAttempts || 5;
const LOCKOUT_DURATION = window.CONFIG?.security?.lockoutDuration || 15 * 60 * 1000; // 15 minutes
const ALLOW_UNVERIFIED_LOCAL_LOGIN = Boolean(window.CONFIG?.security?.allowUnverifiedLocalLogin) &&
  ['localhost', '127.0.0.1'].includes(window.location.hostname);
const ALWAYS_ALLOW_UNVERIFIED_ACCOUNTS = new Set(
  (window.CONFIG?.security?.allowUnverifiedAccounts || []).map(email => email.toLowerCase())
);
console.log('[Auth] Allow unverified local login:', ALLOW_UNVERIFIED_LOCAL_LOGIN, 'Host:', window.location.hostname);
console.log('[Auth] Allow unverified accounts:', [...ALWAYS_ALLOW_UNVERIFIED_ACCOUNTS]);
const authPromiseResolvers = [];

// Start session timer
function startSessionTimer() {
  clearTimeout(sessionTimer);
  sessionTimer = setTimeout(() => {
    document.getElementById('sessionTimeout').style.display = 'block';
    startTimeoutCountdown();
  }, SESSION_TIMEOUT - 60000); // Show warning 1 minute before timeout
}

// Start timeout countdown
function startTimeoutCountdown() {
  let timeLeft = 60;
  const countdownElement = document.getElementById('timeoutCountdown');
  
  const countdown = setInterval(() => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    countdownElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    
    if (timeLeft <= 0) {
      clearInterval(countdown);
      logout();
    }
    timeLeft--;
  }, 1000);
}

// Extend session
function extendSession() {
  document.getElementById('sessionTimeout').style.display = 'none';
  startSessionTimer();
}

// Enhanced logout function
async function logout() {
  try {
    console.log('[Auth] Logging out user...');
    
    // Set a flag to prevent onAuthStateChanged from redirecting back
    sessionStorage.setItem('logout-in-progress', 'true');
    
    // Determine correct login.html path BEFORE clearing storage
    let loginPath = 'src/pages/auth/login.html';
    const currentPath = window.location.pathname;
    
    // If we're on index.html or root, login.html should be at src/pages/auth/login.html
    if (currentPath.includes('index.html') || currentPath === '/' || currentPath.endsWith('/')) {
      loginPath = 'src/pages/auth/login.html';
    } else if (currentPath.includes('/src/pages/')) {
      loginPath = '../../src/pages/auth/login.html';
    } else if (currentPath.includes('/pages/')) {
      loginPath = '../auth/login.html';
    } else if (currentPath === '/login.html' || currentPath.endsWith('/login.html')) {
      // Already on login page, just clear and reload
      loginPath = 'src/pages/auth/login.html';
    }
    
    console.log('[Auth] Logout - redirect path:', loginPath, 'Current path:', currentPath);
    
    // Clear timeout first
    clearTimeout(sessionTimer);
    currentUser = null;
    loginAttempts = 0;
    lockoutUntil = null;
    
    // Clear any stored data
    localStorage.removeItem('userSession');
    localStorage.clear(); // Clear all localStorage
    
    // Sign out from Firebase (this will trigger onAuthStateChanged)
    if (auth) {
      try {
        await signOut(auth);
        console.log('[Auth] User signed out from Firebase');
      } catch (signOutError) {
        console.error('[Auth] Error signing out from Firebase:', signOutError);
        // Continue anyway - clear storage and redirect
      }
    }
    
    // Clear session storage AFTER signOut to preserve the flag temporarily
    const logoutFlag = sessionStorage.getItem('logout-in-progress');
    sessionStorage.clear();
    sessionStorage.setItem('logout-in-progress', 'true'); // Re-set flag
    
    console.log('[Auth] Cleared local and session storage');
    console.log('[Auth] Redirecting to login:', loginPath);
    
    // Redirect immediately - use setTimeout to ensure it happens after signOut completes
    setTimeout(() => {
      try {
        // Use absolute path to be safe
        const absolutePath = loginPath.startsWith('/') ? loginPath : '/' + loginPath;
        const fullUrl = window.location.origin + absolutePath;
        console.log('[Auth] Redirecting to:', fullUrl);
        window.location.replace(fullUrl);
      } catch (redirectError) {
        console.error('[Auth] Redirect error, trying href:', redirectError);
        // Fallback to href
        window.location.href = loginPath.startsWith('/') ? loginPath : '/' + loginPath;
      }
    }, 100);
    
  } catch (error) {
    console.error('[Auth] Logout error:', error);
    // Even if there's an error, try to clear storage and redirect
    try {
      sessionStorage.setItem('logout-in-progress', 'true');
      localStorage.clear();
      sessionStorage.clear();
      sessionStorage.setItem('logout-in-progress', 'true');
      
      if (window.ErrorHandler && typeof window.ErrorHandler.handleFirebaseError === 'function') {
        window.ErrorHandler.handleFirebaseError(error);
      } else {
        console.error('Error during logout: ' + error.message);
      }
      // Still try to redirect - use absolute path
      const loginPath = window.location.pathname.includes('/src/pages/') 
        ? '../../src/pages/auth/login.html' 
        : 'src/pages/auth/login.html';
      window.location.replace(window.location.origin + '/' + loginPath);
    } catch (redirectError) {
      console.error('[Auth] Error during logout redirect:', redirectError);
      // Last resort - hard redirect
      window.location.href = window.location.origin + '/src/pages/auth/login.html';
    }
  }
}

// Check if user is locked out
function isLockedOut() {
  if (lockoutUntil && Date.now() < lockoutUntil) {
    const remainingTime = Math.ceil((lockoutUntil - Date.now()) / 1000 / 60);
    ErrorHandler.showError(`Account locked. Try again in ${remainingTime} minutes.`);
    return true;
  }
  return false;
}

// Handle failed login attempt
function handleFailedLogin() {
  loginAttempts++;
  if (loginAttempts >= MAX_LOGIN_ATTEMPTS) {
    lockoutUntil = Date.now() + LOCKOUT_DURATION;
    ErrorHandler.showError(`Too many failed attempts. Account locked for ${LOCKOUT_DURATION / 1000 / 60} minutes.`);
  } else {
    const remainingAttempts = MAX_LOGIN_ATTEMPTS - loginAttempts;
    ErrorHandler.showWarning(`${remainingAttempts} login attempts remaining.`);
  }
}

// Reset login attempts on successful login
function resetLoginAttempts() {
  loginAttempts = 0;
  lockoutUntil = null;
}

// Enhanced login function
async function login(email, password) {
  if (isLockedOut()) {
    console.warn('[Auth login] User is locked out. email:', email);
    return null;
  }
  
  try {
    console.log('[Auth login] Attempting sign-in for', email);
    console.log('[Auth login] Current auth state before login:', auth.currentUser?.email || 'no user');
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('[Auth login] Sign-in successful, user:', userCredential.user.email, 'verified:', userCredential.user.emailVerified);
    resetLoginAttempts();
    authPromiseResolvers.forEach(resolve => resolve(userCredential.user));
    authPromiseResolvers.length = 0;
    console.log('[Auth login] Returning user object');
    return userCredential.user;
  } catch (error) {
    if (error.code === 'auth/user-not-found' || 
        error.code === 'auth/wrong-password' || 
        error.code === 'auth/invalid-email') {
      handleFailedLogin();
    }
    console.error('[Auth login] Sign-in failed:', error.code, error.message);
    ErrorHandler.handleFirebaseError(error);
    return null;
  }
}

// Enhanced registration function
async function register(email, password, displayName = '') {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) {
      await updateProfile(userCredential.user, { displayName });
    }
    authPromiseResolvers.forEach(resolve => resolve(userCredential.user));
    authPromiseResolvers.length = 0;
    return userCredential.user;
  } catch (error) {
    ErrorHandler.handleFirebaseError(error);
    return null;
  }
}

// Update UI for logged-in user
function updateUIForLoggedInUser(user) {
  const userMenu = document.querySelector('.user-menu');
  if (userMenu) {
    userMenu.innerHTML = `
      <span class="user-email">${user.email}</span>
      <button onclick="logout()" class="logout-btn">Logout</button>
    `;
  }
}

// Debounce auth state changes to prevent rapid firing
let authStateChangeTimeout = null;
let lastAuthState = null;
let authStateChangeCount = 0;
let isProcessingAuthState = false; // Flag to prevent concurrent processing
let pageLoadTime = Date.now(); // Track when page was loaded

// Authentication state observer with debouncing
auth.onAuthStateChanged(async user => {
  // Debounce: Wait 500ms before processing auth state change
  if (authStateChangeTimeout) {
    clearTimeout(authStateChangeTimeout);
  }
  
  // Check if state actually changed
  const currentUserId = user?.uid || null;
  if (currentUserId === lastAuthState) {
    // State hasn't changed, ignore
    return;
  }
  
  // Prevent concurrent processing
  if (isProcessingAuthState) {
    console.log('[Auth] Already processing auth state change, skipping');
    return;
  }
  
  // CRITICAL: Wait at least 2 seconds after page load before processing redirects when no user
  // This gives Firebase persistence time to restore auth state on Firebase hosting
  const timeSincePageLoad = Date.now() - pageLoadTime;
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const isAuthPage = ['login.html', 'register.html', 'reset.html'].includes(currentPage);
  
  // If page just loaded (< 2 seconds ago) and we're on login.html with no user, wait
  // This prevents immediate redirects before persistence restores
  if (timeSincePageLoad < 2000 && isAuthPage && !user) {
    console.log('[Auth] Page just loaded on auth page, waiting for auth persistence to restore (', timeSincePageLoad, 'ms ago)');
    authStateChangeTimeout = setTimeout(() => {
      // Check again after waiting - auth state might have been restored
      const currentUser = auth.currentUser;
      if (currentUser) {
        console.log('[Auth] Auth state restored after wait, user:', currentUser.email);
      }
    }, 2000 - timeSincePageLoad + 500); // Wait a bit longer to ensure persistence is done
    // Don't return - let it process normally, but the redirect logic below will check timeSincePageLoad
  }
  
  authStateChangeCount++;
  console.log('[Auth] onAuthStateChanged fired (#', authStateChangeCount, '), user:', user?.email || 'null', 'authStateResolved:', authStateResolved, 'timeSincePageLoad:', timeSincePageLoad);
  
  // Debounce processing
  authStateChangeTimeout = setTimeout(async () => {
    // Prevent multiple simultaneous auth state changes
    if (isProcessingAuthState || authStateChangeTimeout === null) {
      return; // Already processed
    }
    
    isProcessingAuthState = true;
    lastAuthState = currentUserId;
    currentUser = user;
    
    // Check if we're in a reload loop (prevent processing if too many changes)
    if (authStateChangeCount > 10) { // Increased threshold
      console.error('[Auth] Too many auth state changes detected (', authStateChangeCount, '), ignoring to prevent loop');
      authStateChangeTimeout = null;
      isProcessingAuthState = false;
      return;
    }
    
    // Check reload guard - more strict
    const reloadHistory = JSON.parse(sessionStorage.getItem('reload-history') || '[]');
    const now = Date.now();
    const recentReloads = reloadHistory.filter(timestamp => (now - timestamp) < 10000); // 10 second window
    if (recentReloads.length >= 2) { // Reduced threshold
      console.error('[Auth] Reload loop detected (', recentReloads.length, ' recent reloads), blocking auth state change processing');
      authStateChangeTimeout = null;
      isProcessingAuthState = false;
      return;
    }
    
    if (user) {
      authStateResolved = true;
      console.log('[Auth] User signed in:', user.email, 'Verified:', user.emailVerified);
      
      // Check if email is verified
      const emailLower = (user.email || '').toLowerCase();
      const isUnverifiedAllowed = ALLOW_UNVERIFIED_LOCAL_LOGIN || ALWAYS_ALLOW_UNVERIFIED_ACCOUNTS.has(emailLower);
      
      console.log('[Auth] Email check - emailLower:', emailLower, 'isUnverifiedAllowed:', isUnverifiedAllowed, 'emailVerified:', user.emailVerified);

      if (!user.emailVerified && !isUnverifiedAllowed) {
        console.log('[Auth] Email not verified and not in allowed list, signing out');
        await signOut(auth);
        // Check reload guard before redirecting
        const history = JSON.parse(sessionStorage.getItem('reload-history') || '[]');
        const recent = history.filter(t => (Date.now() - t) < 5000);
        if (recent.length < 2) {
          window.location.href = "login.html?error=Please verify your email first";
        }
        authStateChangeTimeout = null;
        return;
      }
      
      console.log('[Auth] User authentication check passed, proceeding with login');
      
      // Redirect authenticated users away from auth-only pages
      // Only redirect if we're actually on an auth page (not already on index.html)
      const authPages = ['login.html', 'register.html', 'reset.html'];
      const currentPage = window.location.pathname.split('/').pop() || 'index.html';
      const isIndexPage = currentPage === 'index.html' || currentPage === '' || currentPage === '/';
      
      if (authPages.includes(currentPage) && !isIndexPage) {
        // CRITICAL: Don't redirect if page just loaded (< 3 seconds) - wait for auth to fully restore
        const timeSincePageLoad = Date.now() - pageLoadTime;
        if (timeSincePageLoad < 3000) {
          console.log('[Auth] Page just loaded on auth page with user, waiting before redirect (', timeSincePageLoad, 'ms ago)');
          // Set a flag so we can redirect later once auth is fully settled
          sessionStorage.setItem('pending-auth-redirect', 'true');
          authStateChangeTimeout = null;
          isProcessingAuthState = false;
          // Check again in a bit
          setTimeout(() => {
            if (auth.currentUser && sessionStorage.getItem('pending-auth-redirect') === 'true') {
              sessionStorage.removeItem('pending-auth-redirect');
              // Re-trigger the auth state change handler
              const currentUser = auth.currentUser;
              auth.onAuthStateChanged.call(null, currentUser);
            }
          }, 3000 - timeSincePageLoad);
          return;
        }
        
        // CRITICAL: Check if login.html is handling the redirect itself
        if (sessionStorage.getItem('login-handling-redirect') === 'true') {
          console.log('[Auth] Login page is handling redirect, skipping auth.js redirect');
          // Don't clear the flag immediately - let it persist for a few seconds
          // Clear it after navigation completes
          setTimeout(() => {
            sessionStorage.removeItem('login-handling-redirect');
          }, 5000);
          authStateChangeTimeout = null;
          isProcessingAuthState = false;
          return;
        }
        
        // Additional check: If we just redirected, don't redirect again
        const lastRedirectTime = parseInt(sessionStorage.getItem('last-auth-redirect-time') || '0');
        const timeSinceRedirect = Date.now() - lastRedirectTime;
        if (timeSinceRedirect < 5000) { // Within 5 seconds of last redirect - increased window
          console.log('[Auth] Too soon after last redirect, skipping (within 5 seconds)');
          authStateChangeTimeout = null;
          isProcessingAuthState = false;
          return;
        }
        
        // CRITICAL: Check reload guard FIRST before any navigation
        if (sessionStorage.getItem('reload-blocked') === 'true') {
          console.error('[Auth] Navigation blocked by reload guard - reload loop detected');
          authStateChangeTimeout = null;
          isProcessingAuthState = false;
          return;
        }
        
        // Check if we already redirected recently
        const history = JSON.parse(sessionStorage.getItem('reload-history') || '[]');
        const recent = history.filter(t => (Date.now() - t) < 10000); // 10 second window
        
        if (recent.length === 0 && !sessionStorage.getItem('auth-redirect-done')) {
          console.log('[Auth] Redirecting authenticated user away from auth page:', currentPage);
          sessionStorage.setItem('auth-redirect-done', 'true');
          sessionStorage.setItem('last-auth-redirect-time', Date.now().toString());
          
          // Determine correct redirect path - use absolute path on Firebase hosting
          let redirectPath = '/index.html';
          const currentPath = window.location.pathname;
          
          // Use absolute path to avoid issues with Firebase rewrites
          if (currentPath.includes('/src/pages/auth/')) {
            redirectPath = window.location.origin + '/index.html';
          } else {
            redirectPath = window.location.origin + '/index.html';
          }
          
          console.log('[Auth] Redirecting to:', redirectPath, 'Current path:', currentPath);
          
          // Add to reload history before redirect
          history.push(Date.now());
          sessionStorage.setItem('reload-history', JSON.stringify(history));
          
          // Use a small delay to prevent immediate redirect loops
          setTimeout(() => {
            try {
              window.location.replace(redirectPath);
            } catch (error) {
              console.error('[Auth] Redirect error:', error);
              window.location.replace(window.location.origin + '/index.html');
            }
          }, 500); // Increased delay to 500ms
        } else {
          console.log('[Auth] Redirect blocked - too many recent redirects or already redirected');
        }
      }
      
      // Clear the redirect flags if we're on a non-auth page (like index.html)
      // But only after a delay to ensure we're not in the middle of a redirect
      setTimeout(() => {
        sessionStorage.removeItem('auth-redirect-done');
        sessionStorage.removeItem('last-auth-redirect-time');
        sessionStorage.removeItem('login-handling-redirect');
      }, 2000);
      
      // Start session timer
      startSessionTimer();
      
      // Update UI for logged in user
      updateUIForLoggedInUser(user);
      
      // Show/hide auth-dependent elements
      document.querySelectorAll('.auth-required').forEach(element => {
        element.style.display = 'block';
      });
      document.querySelectorAll('.auth-not-required').forEach(element => {
        element.style.display = 'none';
      });

      // Initialize user data in Firestore if needed
      try {
        const userRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userRef);
        if (!docSnap.exists()) {
          await setDoc(userRef, { 
            email: user.email, 
            joined: new Date().toISOString(),
            lastLogin: new Date().toISOString()
          });
        } else {
          await updateDoc(userRef, { lastLogin: new Date().toISOString() });
        }
      } catch (error) {
        console.error('[Auth] Error updating user data:', error);
      }
      
      authStateChangeTimeout = null;
      isProcessingAuthState = false;
    } else {
      // User is not authenticated
      const timeSincePageLoad = Date.now() - pageLoadTime;
      const currentPage = window.location.pathname.split('/').pop() || 'index.html';
      const isAuthPage = ['login.html', 'register.html', 'reset.html'].includes(currentPage);
      
      if (!authStateResolved) {
        authStateResolved = true;
        // On initial page load, wait longer before making decisions
        // This is especially important on Firebase hosting where persistence takes time
        if (timeSincePageLoad < 2500) {
          console.log('[Auth] Initial page load - waiting for auth persistence to restore (', timeSincePageLoad, 'ms ago)');
          // Just return early - Firebase will fire the handler again when persistence restores
          // Don't process redirects yet as auth state might change
          authStateChangeTimeout = null;
          isProcessingAuthState = false;
          return;
        }
        console.log('[Auth] Awaiting persistence restoration... (initial page load, no user yet)');
        authStateChangeTimeout = null;
        isProcessingAuthState = false;
        return;
      }
      console.log('[Auth] User signed out or no user present');
      
      // Update UI for logged out user
      document.querySelectorAll('.auth-required').forEach(element => {
        element.style.display = 'none';
      });
      document.querySelectorAll('.auth-not-required').forEach(element => {
        element.style.display = 'block';
      });
      
      // CRITICAL: Never redirect if we're already on an auth page - this prevents loops
      // If we're on an auth page, do NOT redirect - stay on the page
      if (isAuthPage) {
        console.log('[Auth] Already on auth page, not redirecting to prevent loop');
        authStateChangeTimeout = null;
        isProcessingAuthState = false;
        return;
      }
      
      // Check if logout is in progress - if so, let logout function handle redirect
      if (sessionStorage.getItem('logout-in-progress') === 'true') {
        console.log('[Auth] Logout in progress, skipping onAuthStateChanged redirect');
        // Clear the flag after a short delay
        setTimeout(() => {
          sessionStorage.removeItem('logout-in-progress');
        }, 2000);
        authStateChangeTimeout = null;
        isProcessingAuthState = false;
        return;
      }
      
      // CRITICAL: Don't redirect if page just loaded (< 3 seconds) - wait for auth to fully restore
      if (timeSincePageLoad < 3000) {
        console.log('[Auth] Page just loaded, waiting before redirect decision (', timeSincePageLoad, 'ms ago)');
        authStateChangeTimeout = null;
        isProcessingAuthState = false;
        return;
      }
      
      // Redirect to login if on protected page - but ONLY if not already on auth page
      // Protected pages are ALL pages under /src/pages/ (except auth pages)
      // IMPORTANT: Do NOT redirect from index.html - it's a public page
      const currentPath = window.location.pathname;
      const isIndexPage = currentPage === 'index.html' || currentPage === '' || currentPage === '/';
      const isUnderSrcPages = currentPath.includes('/src/pages/') && !currentPath.includes('/src/pages/auth/');
      
      // CRITICAL: Prevent redirect loops on production
      // Only redirect unauthenticated users from protected pages to login
      // But allow them to stay on index.html (public landing page)
      // This prevents infinite redirect loops between index.html and login.html
      
      // Check if we've already attempted a redirect recently
      const lastRedirectAttempt = parseInt(sessionStorage.getItem('last-redirect-attempt') || '0');
      const timeSinceRedirect = Date.now() - lastRedirectAttempt;
      const hasRecentRedirect = timeSinceRedirect < 5000; // Increased to 5 seconds
      
      // Don't redirect from index.html - it's a public page that shows the dashboard
      // Only redirect from actual protected pages under /src/pages/
      const shouldRedirect = isUnderSrcPages && !isAuthPage && !hasRecentRedirect && !isIndexPage;
      
      if (shouldRedirect) {
        // Mark redirect attempt
        sessionStorage.setItem('last-redirect-attempt', Date.now().toString());
        
        // Check reload guard before redirecting - be very strict
        const history = JSON.parse(sessionStorage.getItem('reload-history') || '[]');
        const recent = history.filter(t => (Date.now() - t) < 10000); // 10 second window
        if (recent.length < 1) { // Only allow 1 redirect per 10 seconds
          // Double-check we're not already going to login
          if (!window.location.href.includes('login.html')) {
            // Use absolute path to avoid issues with Firebase rewrites
            const loginPath = window.location.origin + '/src/pages/auth/login.html';
            console.log('[Auth] Redirecting unauthenticated user to login:', loginPath, 'from:', currentPath);
            
            // Add to reload history to prevent loops
            history.push(Date.now());
            sessionStorage.setItem('reload-history', JSON.stringify(history));
            
            setTimeout(() => {
              window.location.replace(loginPath);
            }, 500);
          }
        } else {
          console.log('[Auth] Redirect to login blocked by reload guard - too many recent redirects');
          // Clear the redirect attempt flag if blocked
          sessionStorage.removeItem('last-redirect-attempt');
        }
      } else if (isIndexPage) {
        // On index.html - this is fine, user can view public dashboard
        console.log('[Auth] User on index.html (public page), allowing access');
        // Clear redirect attempt flag
        sessionStorage.removeItem('last-redirect-attempt');
      } else if (hasRecentRedirect) {
        console.log('[Auth] Skipping redirect - recent redirect attempt detected (within 5s)');
      }
      
      authStateChangeTimeout = null;
      isProcessingAuthState = false;
    }
  }, 500); // 500ms debounce
});

// Ensure window.auth and window.db are set (in case they weren't set earlier)
// This is critical for non-module scripts and tests
if (typeof window !== 'undefined') {
  window.auth = auth;
  window.db = db;
  // Also export functions globally for backward compatibility
  // Make sure these are set immediately so onclick handlers can access them
  window.logout = logout;
  window.extendSession = extendSession;
  window.login = login;
  window.register = register;
  console.log('[Auth] Global functions set:', {
    hasLogout: typeof window.logout === 'function',
    hasExtendSession: typeof window.extendSession === 'function',
    hasLogin: typeof window.login === 'function',
    hasRegister: typeof window.register === 'function'
  });
}

// Export functions and variables
export {
  auth,
  db,
  currentUser,
  startSessionTimer,
  extendSession,
  logout,
  updateUIForLoggedInUser,
  login,
  register,
  isLockedOut,
  resetLoginAttempts,
  authPromiseResolvers
}; 