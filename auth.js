// Import Firebase services from firebase-config.js
import { auth, db } from './firebase-config.js';
import { doc, getDoc, setDoc, updateDoc, onSnapshot, collection } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';

// Session management
let currentUser = null;
let sessionTimer = null;
let loginAttempts = 0;
let lockoutUntil = null;

// Load configuration
const SESSION_TIMEOUT = window.CONFIG?.app?.sessionTimeout || 30 * 60 * 1000; // 30 minutes
const MAX_LOGIN_ATTEMPTS = window.CONFIG?.security?.maxLoginAttempts || 5;
const LOCKOUT_DURATION = window.CONFIG?.security?.lockoutDuration || 15 * 60 * 1000; // 15 minutes

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
function logout() {
  clearTimeout(sessionTimer);
  currentUser = null;
  loginAttempts = 0;
  lockoutUntil = null;
  
  auth.signOut().then(() => {
    // Clear any stored data
    localStorage.removeItem('userSession');
    sessionStorage.clear();
    window.location.href = "login.html";
  }).catch((error) => {
    ErrorHandler.handleFirebaseError(error);
  });
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
    return false;
  }
  
  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    resetLoginAttempts();
    return userCredential.user;
  } catch (error) {
    if (error.code === 'auth/user-not-found' || 
        error.code === 'auth/wrong-password' || 
        error.code === 'auth/invalid-email') {
      handleFailedLogin();
    }
    ErrorHandler.handleFirebaseError(error);
    return null;
  }
}

// Enhanced registration function
async function register(email, password, displayName = '') {
  try {
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    if (displayName) {
      await userCredential.user.updateProfile({ displayName });
    }
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

// Authentication state observer
auth.onAuthStateChanged(async user => {
  currentUser = user;
  
  if (user) {
    // Check if email is verified
    if (!user.emailVerified) {
      auth.signOut();
      window.location.href = "login.html?error=Please verify your email first";
      return;
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
  } else {
    // Update UI for logged out user
    document.querySelectorAll('.auth-required').forEach(element => {
      element.style.display = 'none';
    });
    document.querySelectorAll('.auth-not-required').forEach(element => {
      element.style.display = 'block';
    });
    
    // Redirect to login if on protected page
    const protectedPages = ['dashboard.html', 'budget.html', 'debt-tracker.html', 'velocity-calculator.html'];
    const currentPage = window.location.pathname.split('/').pop();
    if (protectedPages.includes(currentPage)) {
      window.location.href = "login.html";
    }
  }
});

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
  resetLoginAttempts
}; 