/**
 * Capacitor Native Bridge Utility
 * Handles initialization and provides helper methods for Capacitor plugins
 */

let isCapacitor = false;
let Capacitor = null;
let App = null;
let Haptics = null;
let Keyboard = null;
let StatusBar = null;
let Preferences = null;
let Network = null;
let Storage = null;

// Initialize Capacitor plugins
async function initCapacitor() {
  try {
    // Check if running in Capacitor
    if (typeof window !== 'undefined' && window.Capacitor) {
      isCapacitor = true;
      Capacitor = window.Capacitor;
      
      // Dynamically import Capacitor plugins
      const { App } = await import('@capacitor/app');
      const { Haptics } = await import('@capacitor/haptics');
      const { Keyboard } = await import('@capacitor/keyboard');
      const { StatusBar } = await import('@capacitor/status-bar');
      
      // Try to import optional plugins
      try {
        const { Preferences } = await import('@capacitor/preferences');
        window.CapacitorPreferences = Preferences;
      } catch (e) {
        console.log('[Capacitor] Preferences plugin not available');
      }
      
      try {
        const { Network } = await import('@capacitor/network');
        window.CapacitorNetwork = Network;
      } catch (e) {
        console.log('[Capacitor] Network plugin not available');
      }
      
      try {
        const { Storage } = await import('@capacitor/storage');
        window.CapacitorStorage = Storage;
      } catch (e) {
        console.log('[Capacitor] Storage plugin not available');
      }
      
      window.CapacitorApp = App;
      window.CapacitorHaptics = Haptics;
      window.CapacitorKeyboard = Keyboard;
      window.CapacitorStatusBar = StatusBar;
      
      console.log('[Capacitor] Initialized successfully');
      
      // Set up app lifecycle listeners
      setupAppListeners();
      
      // Configure status bar
      configureStatusBar();
      
      // Configure keyboard
      configureKeyboard();
      
      return true;
    } else {
      console.log('[Capacitor] Running in web browser');
      return false;
    }
  } catch (error) {
    console.warn('[Capacitor] Initialization error:', error);
    return false;
  }
}

/**
 * Set up app lifecycle event listeners
 */
function setupAppListeners() {
  if (!window.CapacitorApp) return;
  
  // Handle app state changes
  window.CapacitorApp.addListener('appStateChange', ({ isActive }) => {
    console.log('[Capacitor] App state changed. Is active:', isActive);
    if (isActive) {
      // App came to foreground - refresh data if needed
      window.dispatchEvent(new CustomEvent('app-foreground'));
    } else {
      // App went to background - save state if needed
      window.dispatchEvent(new CustomEvent('app-background'));
    }
  });
  
  // Handle app URL opens (deep links)
  window.CapacitorApp.addListener('appUrlOpen', (data) => {
    console.log('[Capacitor] App opened with URL:', data.url);
    window.dispatchEvent(new CustomEvent('app-url-open', { detail: data }));
  });
  
  // Handle back button (Android)
  window.CapacitorApp.addListener('backButton', () => {
    console.log('[Capacitor] Back button pressed');
    // Handle back button - you can customize this behavior
    if (window.history.length > 1) {
      window.history.back();
    } else {
      // Exit app if no history
      window.CapacitorApp.exitApp();
    }
  });
}

/**
 * Configure status bar appearance
 */
async function configureStatusBar() {
  if (!window.CapacitorStatusBar) return;
  
  try {
    await window.CapacitorStatusBar.setStyle({ style: 'DARK' });
    await window.CapacitorStatusBar.setBackgroundColor({ color: '#007bff' });
    await window.CapacitorStatusBar.setOverlaysWebView({ overlay: false });
  } catch (error) {
    console.warn('[Capacitor] StatusBar configuration error:', error);
  }
}

/**
 * Configure keyboard behavior
 */
function configureKeyboard() {
  if (!window.CapacitorKeyboard) return;
  
  // Listen for keyboard show/hide events
  window.CapacitorKeyboard.addListener('keyboardWillShow', (info) => {
    console.log('[Capacitor] Keyboard will show:', info);
    window.dispatchEvent(new CustomEvent('keyboard-show', { detail: info }));
  });
  
  window.CapacitorKeyboard.addListener('keyboardWillHide', () => {
    console.log('[Capacitor] Keyboard will hide');
    window.dispatchEvent(new CustomEvent('keyboard-hide'));
  });
  
  // Set keyboard style
  window.CapacitorKeyboard.setStyle({ style: 'DARK' });
  window.CapacitorKeyboard.setResizeMode({ mode: 'NATIVE' });
}

/**
 * Haptic feedback helper
 */
export async function hapticFeedback(type = 'light') {
  if (!window.CapacitorHaptics) return;
  
  try {
    const types = {
      light: () => window.CapacitorHaptics.impact({ style: 'LIGHT' }),
      medium: () => window.CapacitorHaptics.impact({ style: 'MEDIUM' }),
      heavy: () => window.CapacitorHaptics.impact({ style: 'HEAVY' }),
      selection: () => window.CapacitorHaptics.selectionStart(),
      notification: (style = 'SUCCESS') => window.CapacitorHaptics.notification({ type: style }),
    };
    
    if (types[type]) {
      await types[type]();
    }
  } catch (error) {
    console.warn('[Capacitor] Haptic feedback error:', error);
  }
}

/**
 * Check if running in Capacitor
 */
export function isCapacitorApp() {
  return isCapacitor;
}

/**
 * Get app info
 */
export async function getAppInfo() {
  if (!window.CapacitorApp) return null;
  
  try {
    return await window.CapacitorApp.getInfo();
  } catch (error) {
    console.warn('[Capacitor] Get app info error:', error);
    return null;
  }
}

/**
 * Get app state
 */
export async function getAppState() {
  if (!window.CapacitorApp) return null;
  
  try {
    return await window.CapacitorApp.getState();
  } catch (error) {
    console.warn('[Capacitor] Get app state error:', error);
    return null;
  }
}

/**
 * Exit app (Android)
 */
export async function exitApp() {
  if (!window.CapacitorApp) return;
  
  try {
    await window.CapacitorApp.exitApp();
  } catch (error) {
    console.warn('[Capacitor] Exit app error:', error);
  }
}

/**
 * Minimize app
 */
export async function minimizeApp() {
  if (!window.CapacitorApp) return;
  
  try {
    await window.CapacitorApp.minimizeApp();
  } catch (error) {
    console.warn('[Capacitor] Minimize app error:', error);
  }
}

/**
 * Check network status
 */
export async function getNetworkStatus() {
  if (!window.CapacitorNetwork) return { connected: true, connectionType: 'wifi' };
  
  try {
    const status = await window.CapacitorNetwork.getStatus();
    return {
      connected: status.connected,
      connectionType: status.connectionType,
    };
  } catch (error) {
    console.warn('[Capacitor] Get network status error:', error);
    return { connected: true, connectionType: 'unknown' };
  }
}

/**
 * Store data using Capacitor Preferences
 */
export async function setPreference(key, value) {
  if (!window.CapacitorPreferences) {
    // Fallback to localStorage
    localStorage.setItem(key, JSON.stringify(value));
    return;
  }
  
  try {
    await window.CapacitorPreferences.set({ key, value: JSON.stringify(value) });
  } catch (error) {
    console.warn('[Capacitor] Set preference error:', error);
    localStorage.setItem(key, JSON.stringify(value));
  }
}

/**
 * Get data from Capacitor Preferences
 */
export async function getPreference(key, defaultValue = null) {
  if (!window.CapacitorPreferences) {
    // Fallback to localStorage
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : defaultValue;
  }
  
  try {
    const { value } = await window.CapacitorPreferences.get({ key });
    return value ? JSON.parse(value) : defaultValue;
  } catch (error) {
    console.warn('[Capacitor] Get preference error:', error);
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : defaultValue;
  }
}

/**
 * Remove preference
 */
export async function removePreference(key) {
  if (!window.CapacitorPreferences) {
    localStorage.removeItem(key);
    return;
  }
  
  try {
    await window.CapacitorPreferences.remove({ key });
  } catch (error) {
    console.warn('[Capacitor] Remove preference error:', error);
    localStorage.removeItem(key);
  }
}

// Auto-initialize when module loads
if (typeof window !== 'undefined') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCapacitor);
  } else {
    initCapacitor();
  }
}

// Export initialization function
export { initCapacitor };

