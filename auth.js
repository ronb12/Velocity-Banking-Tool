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
  
  authStateChangeCount++;
  console.log('[Auth] onAuthStateChanged fired (#', authStateChangeCount, '), user:', user?.email || 'null', 'authStateResolved:', authStateResolved);
  
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
        // CRITICAL: Check if login.html is handling the redirect itself
        if (sessionStorage.getItem('login-handling-redirect') === 'true') {
          console.log('[Auth] Login page is handling redirect, skipping auth.js redirect');
          // Don't clear the flag immediately - let it persist for a few seconds
          // Clear it after navigation completes
          setTimeout(() => {
            sessionStorage.removeItem('login-handling-redirect');
          }, 5000);
          authStateChangeTimeout = null;
          return;
        }
        
        // Additional check: If we just redirected, don't redirect again
        const lastRedirectTime = parseInt(sessionStorage.getItem('last-auth-redirect-time') || '0');
        const timeSinceRedirect = Date.now() - lastRedirectTime;
        if (timeSinceRedirect < 5000) { // Within 5 seconds of last redirect - increased window
          console.log('[Auth] Too soon after last redirect, skipping (within 5 seconds)');
          authStateChangeTimeout = null;
          return;
        }
        
        // CRITICAL: Check reload guard FIRST before any navigation
        if (sessionStorage.getItem('reload-blocked') === 'true') {
          console.error('[Auth] Navigation blocked by reload guard - reload loop detected');
          authStateChangeTimeout = null;
          return;
        }
        
        // Check if we already redirected recently
        const history = JSON.parse(sessionStorage.getItem('reload-history') || '[]');
        const recent = history.filter(t => (Date.now() - t) < 10000); // 10 second window
        
        if (recent.length === 0 && !sessionStorage.getItem('auth-redirect-done')) {
          console.log('[Auth] Redirecting authenticated user away from auth page:', currentPage);
          sessionStorage.setItem('auth-redirect-done', 'true');
          sessionStorage.setItem('last-auth-redirect-time', Date.now().toString());
          
          // Determine correct redirect path
          let redirectPath = 'index.html';
          const currentPath = window.location.pathname;
          
          if (currentPage === 'login.html') {
            if (currentPath.includes('/src/pages/auth/')) {
              redirectPath = '../../index.html';
            } else if (currentPath.includes('/auth/')) {
              redirectPath = '../../index.html';
            } else if (currentPath === '/login.html' || currentPath.endsWith('/login.html')) {
              redirectPath = 'index.html';
            } else {
              redirectPath = '/index.html';
            }
          }
          
          console.log('[Auth] Redirecting to:', redirectPath, 'Current path:', currentPath);
          
          // Use a small delay to prevent immediate redirect loops
          setTimeout(() => {
            try {
              window.location.replace(redirectPath);
            } catch (error) {
              console.error('[Auth] Redirect error:', error);
              window.location.replace(window.location.origin + '/index.html');
            }
          }, 200);
        } else {
          console.log('[Auth] Redirect blocked - too many recent redirects or already redirected');
        }
    authStateChangeTimeout = null;
    isProcessingAuthState = false;
    return;
  } else {
        // Clear the redirect flags if we're on a non-auth page (like index.html)
        // But only after a delay to ensure we're not in the middle of a redirect
        setTimeout(() => {
          sessionStorage.removeItem('auth-redirect-done');
          sessionStorage.removeItem('last-auth-redirect-time');
          sessionStorage.removeItem('login-handling-redirect');
        }, 2000);
      }
      
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
    } else {
      if (!authStateResolved) {
        authStateResolved = true;
        console.log('[Auth] Awaiting persistence restoration... (initial page load, no user yet)');
        authStateChangeTimeout = null;
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
      const currentPage = window.location.pathname.split('/').pop() || 'index.html';
      const isAuthPage = ['login.html', 'register.html', 'reset.html'].includes(currentPage);
      
      // If we're on an auth page, do NOT redirect - stay on the page
      if (isAuthPage) {
        console.log('[Auth] Already on auth page, not redirecting to prevent loop');
        authStateChangeTimeout = null;
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
        return;
      }
      
      // Redirect to login if on protected page OR index.html - but ONLY if not already on auth page
      // Protected pages are ALL pages under /src/pages/ (except auth pages), plus index.html
      const currentPath = window.location.pathname;
      const isIndexPage = currentPage === 'index.html' || currentPage === '' || currentPage === '/';
      const isUnderSrcPages = currentPath.includes('/src/pages/') && !currentPath.includes('/src/pages/auth/');
      
      // CRITICAL: Add a small delay before redirecting to allow navigation to complete
      // This prevents auth.js from blocking user-initiated navigation
      // Only redirect if we've been on this page for more than 500ms (not mid-navigation)
      const navigationStartTime = parseInt(sessionStorage.getItem('navigation-start-time') || '0');
      const timeOnPage = Date.now() - navigationStartTime;
      const isMidNavigation = timeOnPage < 500;
      
      // Redirect if on a protected page (any page under /src/pages/ except auth, or index.html)
      // but NOT if already on auth page, and NOT if we're mid-navigation
      if ((isUnderSrcPages || isIndexPage) && !isAuthPage && !isMidNavigation) {
        // Check reload guard before redirecting - be very strict
        const history = JSON.parse(sessionStorage.getItem('reload-history') || '[]');
        const recent = history.filter(t => (Date.now() - t) < 10000); // 10 second window
        if (recent.length < 1) { // Only allow 1 redirect per 10 seconds
          // Double-check we're not already going to login
          if (!window.location.href.includes('login.html')) {
            // Determine correct login path
            let loginPath = 'src/pages/auth/login.html';
            if (currentPath.includes('/src/pages/')) {
              loginPath = '../../src/pages/auth/login.html';
            } else if (currentPath.includes('/pages/')) {
              loginPath = '../auth/login.html';
            }
            console.log('[Auth] Redirecting unauthenticated user to login:', loginPath, 'from:', currentPath);
            window.location.replace(loginPath);
          }
        } else {
          console.log('[Auth] Redirect to login blocked by reload guard - too many recent redirects');
        }
      } else if (isMidNavigation) {
        console.log('[Auth] Skipping redirect - navigation in progress');
      }
    }
    
    authStateChangeTimeout = null;
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