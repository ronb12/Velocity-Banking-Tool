// Global reload loop prevention
// This script MUST be loaded FIRST to prevent reload loops

(function() {
  'use strict';
  
  // Reload guard flags
  const RELOAD_GUARD_KEY = 'reload-guard';
  const RELOAD_GUARD_TIMEOUT = 10000; // 10 seconds - longer timeout
  const MAX_RELOADS_PER_WINDOW = 2; // Max 2 reloads per 10 second window
  const RELOAD_HISTORY_KEY = 'reload-history';
  
  // Track reload history - use same key as auth.js expects
  const RELOAD_HISTORY_STORAGE_KEY = 'reload-history';
  
  function getReloadHistory() {
    try {
      const history = sessionStorage.getItem(RELOAD_HISTORY_STORAGE_KEY);
      return history ? JSON.parse(history) : [];
    } catch {
      return [];
    }
  }
  
  function addReloadToHistory() {
    try {
      const history = getReloadHistory();
      const now = Date.now();
      history.push(now);
      // Keep only recent reloads (last 10 seconds)
      const recentHistory = history.filter(timestamp => (now - timestamp) < RELOAD_GUARD_TIMEOUT);
      sessionStorage.setItem(RELOAD_HISTORY_STORAGE_KEY, JSON.stringify(recentHistory));
      return recentHistory.length;
    } catch {
      return 0;
    }
  }
  
  function shouldPreventReload() {
    const history = getReloadHistory();
    const now = Date.now();
    const recentReloads = history.filter(timestamp => (now - timestamp) < RELOAD_GUARD_TIMEOUT);
    
    if (recentReloads.length >= MAX_RELOADS_PER_WINDOW) {
      console.error('[Reload Guard] BLOCKING RELOAD: Too many reloads detected', recentReloads.length, 'in the last', RELOAD_GUARD_TIMEOUT / 1000, 'seconds');
      // Also set a flag that other code can check
      sessionStorage.setItem('reload-blocked', 'true');
      setTimeout(() => {
        sessionStorage.removeItem('reload-blocked');
      }, RELOAD_GUARD_TIMEOUT);
      return true;
    }
    
    // Check if reload is currently blocked
    if (sessionStorage.getItem('reload-blocked') === 'true') {
      console.error('[Reload Guard] Reload is currently blocked');
      return true;
    }
    
    return false;
  }
  
  // Create wrapper functions that check before navigation
  // Store original functions
  const originalReplace = window.location.replace.bind(window.location);
  const originalReload = window.location.reload.bind(window.location);
  const originalAssign = window.location.assign.bind(window.location);
  
  // Create safe navigation wrappers
  window.safeLocationReplace = function(url) {
    if (shouldPreventReload()) {
      console.error('[Reload Guard] BLOCKED location.replace to:', url);
      return;
    }
    addReloadToHistory();
    return originalReplace(url);
  };
  
  window.safeLocationReload = function(forceReload) {
    if (shouldPreventReload()) {
      console.error('[Reload Guard] BLOCKED location.reload');
      return;
    }
    addReloadToHistory();
    return originalReload(forceReload);
  };
  
  window.safeLocationAssign = function(url) {
    // Allow initial navigation
    if (document.readyState === 'loading') {
      return originalAssign(url);
    }
    
    if (shouldPreventReload()) {
      console.error('[Reload Guard] BLOCKED location.assign to:', url);
      return;
    }
    addReloadToHistory();
    return originalAssign(url);
  };
  
  // Intercept navigation using beforeunload (most reliable method)
  let navigationBlocked = false;
  
  window.addEventListener('beforeunload', function(event) {
    if (shouldPreventReload()) {
      console.error('[Reload Guard] BLOCKING navigation - too many reloads detected');
      navigationBlocked = true;
      // Note: Modern browsers ignore preventDefault on beforeunload
      // But we can still log and track
      event.stopImmediatePropagation();
      return false;
    }
    navigationBlocked = false;
  }, { capture: true, passive: false });
  
  // Also intercept unload to prevent navigation
  window.addEventListener('unload', function(event) {
    if (navigationBlocked || shouldPreventReload()) {
      console.error('[Reload Guard] Attempting to prevent unload');
      event.stopImmediatePropagation();
    }
  }, { capture: true });
  
  // Monitor for rapid navigation attempts and block them
  let lastNavigationAttempt = 0;
  const NAVIGATION_COOLDOWN = 2000; // 2 seconds between navigations
  
  // Override location methods using Object.defineProperty if possible
  try {
    // Try to override location.replace using defineProperty
    const locationProto = Object.getPrototypeOf(window.location);
    if (locationProto && typeof locationProto.replace === 'function') {
      const originalReplaceProto = locationProto.replace;
      locationProto.replace = function(url) {
        const now = Date.now();
        if (shouldPreventReload() || (now - lastNavigationAttempt) < NAVIGATION_COOLDOWN) {
          console.error('[Reload Guard] BLOCKED location.replace to:', url);
          return;
        }
        lastNavigationAttempt = now;
        addReloadToHistory();
        return originalReplaceProto.call(this, url);
      };
    }
  } catch (e) {
    console.warn('[Reload Guard] Could not override location.replace:', e.message);
  }
  
  try {
    // Try to override location.reload
    const locationProto = Object.getPrototypeOf(window.location);
    if (locationProto && typeof locationProto.reload === 'function') {
      const originalReloadProto = locationProto.reload;
      locationProto.reload = function(forceReload) {
        const now = Date.now();
        if (shouldPreventReload() || (now - lastNavigationAttempt) < NAVIGATION_COOLDOWN) {
          console.error('[Reload Guard] BLOCKED location.reload');
          return;
        }
        lastNavigationAttempt = now;
        addReloadToHistory();
        return originalReloadProto.call(this, forceReload);
      };
    }
  } catch (e) {
    console.warn('[Reload Guard] Could not override location.reload:', e.message);
  }
  
  // Log when script loads
  console.log('[Reload Guard] Reload prevention system initialized');
})();

