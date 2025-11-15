/**
 * Dashboard Inline Scripts
 * Extracted from index.html
 * This file contains all JavaScript that was inline in index.html
 * 
 * Now using component-based architecture
 */

// Import components - use standard ES module imports
// Note: ES6 imports are static, so we handle errors in usage instead
import { financialInsights } from '../components/FinancialInsights.js';
import { dataExport } from '../components/DataExport.js';
import { financialTips } from '../components/FinancialTips.js';
import { settingsManager } from '../components/SettingsManager.js';
import { profileStats } from '../components/ProfileStats.js';
import { advancedSettings } from '../components/AdvancedSettings.js';
import { notificationSystem } from '../components/NotificationSystem.js';
import { DashboardData } from './dashboard-data.js';
import { gatherAllFinancialData } from '../utils/gatherFinancialData.js';
import { calculateSummaryMetrics } from '../utils/calculateSummaryMetrics.js';

// Import core services
import { errorBoundary } from '../core/ErrorBoundary.js';
import { logger } from '../core/Logger.js';
import { inputValidator } from '../core/InputValidator.js';
import { rateLimiter } from '../core/RateLimiter.js';

// Don't import auth/db directly - use window.auth and window.db instead
// This prevents "Cannot access before initialization" errors
// auth.js already sets window.auth and window.db globally
let auth, db, logout, extendSession, login, register;

// Wait for window.auth to be available (set by auth.js)
const initAuth = async () => {
  try {
    // Wait for window.auth to be set by auth.js
    let retries = 0;
    while ((!window.auth || !window.db) && retries < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      retries++;
    }
    
    if (window.auth && window.db) {
      auth = window.auth;
      db = window.db;
      logout = window.logout;
      extendSession = window.extendSession;
      login = window.login;
      register = window.register;
    }
  } catch (error) {
    console.warn('[Index] Error initializing auth:', error);
  }
};

// Initialize auth asynchronously
initAuth();

// Note: This code assumes global variables from index.html:
// - window.themeManager
// - USE_FIRESTORE, ErrorHandler
// - Firebase imports (doc, getDoc, setDoc, onSnapshot, etc.)

// Initialize dashboard data manager
let dashboardDataManager = null;

// Function to set default values for dashboard stats
function setDefaultDashboardValues() {
  const elements = ['creditUtilizationValue', 'netWorthValue', 'debtSummaryValue', 'savingsValue'];
  elements.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = 'No data yet';
      element.style.color = '#64748b';
    }
  });
}

// Enhanced data loading with error handling
async function initializeDashboard() {
  // Get auth and db - try multiple sources
  const currentAuth = auth || window.auth;
  const currentDb = db || window.db;
  
  if (!currentAuth || !currentDb) {
    console.warn('[Index] Auth or DB not available, waiting...', {
      hasAuth: !!currentAuth,
      hasDb: !!currentDb,
      hasWindowAuth: !!window.auth,
      hasWindowDb: !!window.db
    });
    // Wait a bit and try again
    await new Promise(resolve => setTimeout(resolve, 500));
    return initializeDashboard(); // Retry
  }

  if (!currentAuth.currentUser) {
    console.log('[Index] No user logged in (currentUser is null)');
    
    // Set up auth state listener for when user logs in
    // Note: onAuthStateChanged fires immediately if user is already logged in
    let hasCalledLoad = false;
    const unsubscribe = currentAuth.onAuthStateChanged((user) => {
      if (user && !hasCalledLoad) {
        hasCalledLoad = true;
        console.log('[Index] User authenticated via listener, loading dashboard data for:', user.email);
        // Small delay to ensure everything is ready
        setTimeout(() => {
          loadDashboardData();
        }, 500);
        // Don't unsubscribe immediately - keep listening for changes
      } else if (!user) {
        console.log('[Index] Auth state changed to logged out');
        setDefaultDashboardValues();
        hasCalledLoad = false; // Reset flag for next login
      }
    });
    
    // Set default values for dashboard stats when not logged in
    setDefaultDashboardValues();
    
    // Don't wait - return immediately so page can load
    // The listener will trigger if user is already logged in
    return;
  }

  console.log('[Index] User is logged in:', currentAuth.currentUser.email);
  await loadDashboardData();
}

async function loadDashboardData() {
  if (!DashboardData) {
    console.error('[Index] DashboardData class not loaded!');
    return;
  }

  // Get auth and db - try multiple sources
  const currentAuth = auth || window.auth;
  const currentDb = db || window.db;

  if (!currentAuth || !currentDb) {
    console.error('[Index] Auth or DB not available for dashboard data');
    return;
  }

  try {
    dashboardDataManager = new DashboardData(currentAuth, currentDb);
    // Always use Firestore on production (non-localhost)
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const useFirestore = typeof USE_FIRESTORE !== 'undefined' ? USE_FIRESTORE : !isLocalhost;
    
    console.log('[Index] Loading dashboard data with settings:', {
      useFirestore,
      isLocalhost,
      hasAuth: !!currentAuth,
      hasDb: !!currentDb,
      hasUser: !!currentAuth?.currentUser,
      userEmail: currentAuth?.currentUser?.email || 'none'
    });
    
    if (errorBoundary && typeof errorBoundary.wrapAsync === 'function') {
      const loadData = errorBoundary.wrapAsync(
        () => dashboardDataManager.loadDashboardData(useFirestore),
        'dashboard_data_load'
      );
      await loadData();
    } else {
      await dashboardDataManager.loadDashboardData(useFirestore);
    }
    
    if (logger && typeof logger.info === 'function') {
      logger.info('Dashboard data initialized successfully');
    } else {
      console.log('[Index] Dashboard data initialized successfully');
    }
  } catch (error) {
    console.error('[Index] Failed to initialize dashboard data:', error);
    if (logger && typeof logger.error === 'function') {
      logger.error('Failed to initialize dashboard data', { error: error.message });
    }
    if (errorBoundary && typeof errorBoundary.handleError === 'function') {
      errorBoundary.handleError(error, { context: 'dashboard_initialization' });
    }
  }
}

// Start initialization when DOM is ready and auth/db are available
async function startInitialization() {
  // Use waitForAuth if available, otherwise fall back to polling
  try {
    if (typeof waitForAuth === 'function') {
      const { auth: authInstance, db: dbInstance } = await waitForAuth(10000);
      window.auth = authInstance;
      window.db = dbInstance;
      // Also set module-level variables if they weren't imported
      if (!auth) auth = authInstance;
      if (!db) db = dbInstance;
    } else {
      // Fallback: Wait for auth/db to be ready (check both module and window)
      let retries = 0;
      const maxRetries = 50; // 5 seconds - increased wait time

      while ((!auth && !window.auth) || (!db && !window.db)) {
        if (retries >= maxRetries) {
          console.warn('[Index] Auth/DB not available after waiting, setting defaults');
          setDefaultDashboardValues();
          return;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
        retries++;
      }
    }

    // Ensure window.auth and window.db are set
    if (!window.auth) window.auth = auth;
    if (!window.db) window.db = db;

    // Wait a bit more for auth state to be fully resolved
    await new Promise(resolve => setTimeout(resolve, 300));

    const currentAuth = auth || window.auth;
    const hasUser = !!(currentAuth?.currentUser);
    
    console.log('[Index] Starting dashboard initialization', {
      hasAuth: !!(auth || window.auth),
      hasDb: !!(db || window.db),
      hasUser: hasUser,
      userEmail: currentAuth?.currentUser?.email || 'none'
    });

    // Now initialize dashboard (won't block if no user)
    initializeDashboard().catch(error => {
      console.error('[Index] Dashboard initialization error:', error);
    });
    
    // Also set up a delayed check - sometimes auth state resolves after initial load
    if (!hasUser) {
      setTimeout(() => {
        const delayedAuth = auth || window.auth;
        if (delayedAuth?.currentUser) {
          console.log('[Index] User detected in delayed check, loading dashboard data');
          loadDashboardData();
        }
      }, 1000);
    }
  } catch (error) {
    console.error('[Index] Error waiting for auth:', error);
    setDefaultDashboardValues();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startInitialization);
} else {
  startInitialization();
}

// Profile Modal Logic
const profileButton = document.getElementById('profileButton');
const profileModal = document.getElementById('profileModal');
const closeProfileModal = document.getElementById('closeProfileModal');

if (logger) {
  logger.debug('Profile button found', { exists: !!profileButton });
  logger.debug('Profile modal found', { exists: !!profileModal });
}

if (profileButton) {
  profileButton.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (logger) logger.debug('Profile button clicked, opening modal');
    if (profileModal) {
      profileModal.style.display = 'flex';
      if (logger) logger.debug('Modal display set to flex');
      if (profileStats) profileStats.updateProfileStats(auth);
      initializeThemeSelector();
      
      // Debug: Check if avatar elements exist
      setTimeout(() => {
        if (logger) {
          logger.debug('Avatar elements check', {
            container: !!document.querySelector('.avatar-container'),
            uploadButton: !!document.querySelector('.avatar-upload-btn'),
            modalVisible: profileModal.style.display,
            computedStyle: window.getComputedStyle(profileModal).display
          });
        }
      }, 100);
    } else {
      if (logger) logger.error('Profile modal not found');
      if (errorBoundary) errorBoundary.handleError(new Error('Profile modal not found'), { context: 'profile_modal' });
    }
  });
} else {
  if (logger) logger.error('Profile button not found');
  if (errorBoundary) errorBoundary.handleError(new Error('Profile button not found'), { context: 'profile_button' });
}

if (closeProfileModal) {
  closeProfileModal.addEventListener('click', () => {
    if (profileModal) {
      profileModal.style.display = 'none';
    }
  });
}

window.addEventListener('click', (e) => {
  if (e.target === profileModal && profileModal) {
    profileModal.style.display = 'none';
  }
});

// Theme Selector Initialization
function initializeThemeSelector() {
  if (typeof window.themeManager === 'undefined') {
    if (logger) logger.warn('ThemeManager not available');
    return;
  }
  
  const button = document.getElementById('themeDropdownButton');
  const menu = document.getElementById('themeDropdownMenu');
  
  if (!button || !menu) {
    if (logger) logger.warn('Theme selector elements not found');
    return;
  }
  
  // Populate theme options
  // Use getAvailableThemes() which returns array of theme IDs, then get info for each
  const themeIds = window.themeManager.getAvailableThemes ? window.themeManager.getAvailableThemes() : ['blue', 'pink', 'green', 'purple', 'orange', 'teal', 'red', 'auto'];
  const themeInfo = {
    blue: { name: 'Blue', color: '#007bff', icon: '🔵' },
    pink: { name: 'Pink', color: '#ff4b91', icon: '🩷' },
    green: { name: 'Green', color: '#28a745', icon: '🟢' },
    purple: { name: 'Purple', color: '#6f42c1', icon: '🟣' },
    orange: { name: 'Orange', color: '#fd7e14', icon: '🟠' },
    teal: { name: 'Teal', color: '#20c997', icon: '🔷' },
    red: { name: 'Red', color: '#dc3545', icon: '🔴' },
    auto: { name: 'Auto', color: '#64748b', icon: '⚙️' }
  };
  
  menu.innerHTML = themeIds.map(themeId => {
    const info = themeInfo[themeId] || { name: themeId, color: '#007bff', icon: '🔵' };
    return `
      <div class="theme-option" data-theme="${themeId}">
        <div class="theme-swatch" style="background: ${info.color}"></div>
        <span>${info.name}</span>
      </div>
    `;
  }).join('');
  
  // Add click handlers
  menu.querySelectorAll('.theme-option').forEach(option => {
    option.addEventListener('click', () => {
      const themeId = option.dataset.theme;
      window.themeManager.setTheme(themeId);
      updateThemeSelector();
    });
  });
  
  // Update current theme indicator
  updateThemeSelector();
}

function updateThemeSelector() {
  if (typeof window.themeManager === 'undefined') return;
  
  // getCurrentTheme() returns the theme ID string, not an object
  const currentTheme = window.themeManager.getCurrentTheme ? window.themeManager.getCurrentTheme() : 'blue';
  const menu = document.getElementById('themeDropdownMenu');
  
  if (menu) {
    menu.querySelectorAll('.theme-option').forEach(option => {
      if (option.dataset.theme === currentTheme) {
        option.classList.add('active');
      } else {
        option.classList.remove('active');
      }
    });
  }
}

// Settings Management
if (settingsManager) {
  settingsManager.loadSettings();
  
  // Bind settings toggles
  const darkModeToggle = document.getElementById('settingsDarkMode');
  if (darkModeToggle) {
    darkModeToggle.addEventListener('change', () => settingsManager.toggleDarkMode());
  }
  
  const notificationsToggle = document.getElementById('settingsNotifications');
  if (notificationsToggle) {
    notificationsToggle.addEventListener('change', () => settingsManager.toggleNotifications());
  }
  
  const autoSaveToggle = document.getElementById('settingsAutoSave');
  if (autoSaveToggle) {
    autoSaveToggle.addEventListener('change', () => settingsManager.toggleAutoSave());
  }
  
  const showTipsToggle = document.getElementById('settingsShowTips');
  if (showTipsToggle) {
    showTipsToggle.addEventListener('change', () => settingsManager.toggleShowTips());
  }
  
  const avatarUpload = document.getElementById('avatarUpload');
  if (avatarUpload) {
    avatarUpload.addEventListener('change', (e) => settingsManager.handleAvatarUpload(e));
  }
}

// Advanced Settings
const advancedSettingsBtn = document.getElementById('advancedSettingsBtn');
if (advancedSettingsBtn && advancedSettings) {
  advancedSettingsBtn.addEventListener('click', () => {
    advancedSettings.openAdvancedSettings();
  });
}

// Financial Tips
if (financialTips) {
  // Initialize tips if tips data exists
  const tipsData = [
    {
      category: 'Debt Management',
      title: 'Pay High-Interest Debt First',
      content: 'Focus on paying off debts with the highest interest rates first to save money over time.'
    },
    {
      category: 'Savings',
      title: 'Build an Emergency Fund',
      content: 'Aim to save 3-6 months of expenses in an emergency fund for unexpected situations.'
    },
    {
      category: 'Budgeting',
      title: 'Track Every Expense',
      content: 'Keep track of all your expenses to understand where your money is going.'
    },
    {
      category: 'Credit',
      title: 'Keep Credit Utilization Low',
      content: 'Try to keep your credit card balances below 30% of your credit limits.'
    }
  ];
  
  financialTips.init(tipsData);
  
  // Bind tip navigation
  const nextTipBtn = document.getElementById('nextTip');
  const prevTipBtn = document.getElementById('previousTip');
  
  if (nextTipBtn) {
    nextTipBtn.addEventListener('click', () => financialTips.nextTip());
  }
  if (prevTipBtn) {
    prevTipBtn.addEventListener('click', () => financialTips.previousTip());
  }
}

// Data Export
async function handleExport(format) {
  if (!dataExport) {
    if (logger) logger.error('DataExport component not available');
    if (errorBoundary) errorBoundary.handleError(new Error('DataExport component not available'), { context: 'data_export' });
    return;
  }

  // Validate format input
  const validFormats = ['json', 'csv', 'pdf'];
  if (!validFormats.includes(format)) {
    if (logger) logger.error('Invalid export format', { format });
    if (errorBoundary) errorBoundary.handleError(new Error(`Invalid export format: ${format}`), { context: 'data_export' });
    return;
  }
  
  const showNotification = notificationSystem
    ? (msg, type) => notificationSystem.show(msg, type)
    : (msg, type) => console.log(`[${type}] ${msg}`);
  
  await dataExport.exportAllData(
    format,
    showNotification,
    gatherAllFinancialData,
    calculateSummaryMetrics
  );
}

// Export buttons
const exportJSONBtn = document.getElementById('exportJSON');
const exportCSVBtn = document.getElementById('exportCSV');
const exportPDFBtn = document.getElementById('exportPDF');

if (exportJSONBtn) {
  exportJSONBtn.addEventListener('click', () => handleExport('json'));
}
if (exportCSVBtn) {
  exportCSVBtn.addEventListener('click', () => handleExport('csv'));
}
if (exportPDFBtn) {
  exportPDFBtn.addEventListener('click', () => handleExport('pdf'));
}

// Financial Insights
async function updateFinancialInsights() {
  if (!financialInsights) {
    if (logger) logger.warn('FinancialInsights component not available');
    return;
  }
  
  try {
    // Rate limit check
    if (rateLimiter) {
      const rateCheck = rateLimiter.check('financial_insights_update', {
        window: 60000, // 1 minute
        max: 10 // Max 10 updates per minute
      });

      if (!rateCheck.allowed) {
        if (logger) logger.warn('Rate limit exceeded for financial insights update');
        return;
      }
    }
    
    const data = await gatherAllFinancialData();
    const summary = calculateSummaryMetrics(data);
    
    // Generate insights
    const insights = [];
    if (summary.metrics.totalDebt > 0) {
      insights.push({
        title: 'Debt Overview',
        data: {
          totalDebt: summary.metrics.totalDebt,
          creditUtilization: summary.metrics.creditUtilization
        }
      });
    }
    
    if (summary.metrics.netWorth !== null) {
      insights.push({
        title: 'Net Worth',
        data: {
          current: summary.metrics.netWorth,
          change: summary.metrics.netWorthChange
        }
      });
    }
    
    const insightsContainer = document.getElementById('financialInsights');
    if (insightsContainer) {
      financialInsights.renderInsights(insights, insightsContainer);
    }
    
    // Generate recommendations
    const recommendations = [];
    if (summary.metrics.creditUtilization > 30) {
      recommendations.push({
        title: 'Reduce Credit Utilization',
        description: 'Your credit utilization is above the recommended 30%.',
        action: 'Pay down credit card balances to improve your credit score.',
        priority: 1
      });
    }
    
    if (summary.metrics.totalDebt > 0 && summary.metrics.netWorth < 0) {
      recommendations.push({
        title: 'Focus on Debt Reduction',
        description: 'Your net worth is negative due to debt.',
        action: 'Create a debt payoff plan and stick to it.',
        priority: 1
      });
    }
    
    const recommendationsContainer = document.getElementById('recommendationsContainer');
    if (recommendationsContainer) {
      financialInsights.renderRecommendations(recommendations, recommendationsContainer);
    }
  } catch (error) {
    if (logger) logger.error('Error updating financial insights', { error: error.message, stack: error.stack });
    if (errorBoundary) errorBoundary.handleError(error, { context: 'financial_insights_update' });
  }
}

// Update insights when data changes
// NOTE: Don't add another onAuthStateChanged listener here - it's already handled in auth.js
// Instead, listen for a custom event or check auth state directly
if (auth) {
  // Only update insights if user is logged in and data is available
  // Use a one-time check after a delay instead of another listener
  const updateInsightsOnAuth = () => {
    if (auth.currentUser) {
      setTimeout(updateFinancialInsights, 1000);
    }
  };
  
  // Check once after page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateInsightsOnAuth);
  } else {
    setTimeout(updateInsightsOnAuth, 2000);
  }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    updateFinancialInsights();
  });
} else {
  updateFinancialInsights();
}

// Make functions globally available for backward compatibility
window.openProfileModal = () => {
  if (profileModal) {
    profileModal.style.display = 'flex';
    if (profileStats) profileStats.updateProfileStats(auth);
    initializeThemeSelector();
  }
};

window.updateProfileStats = () => {
  if (profileStats) profileStats.updateProfileStats(auth);
};

window.initializeThemeSelector = initializeThemeSelector;
window.updateThemeSelector = updateThemeSelector;
window.handleExport = handleExport;
window.updateFinancialInsights = updateFinancialInsights;

// Export for use in other modules
export {
  financialInsights,
  dataExport,
  financialTips,
  settingsManager,
  profileStats,
  advancedSettings,
  notificationSystem,
  dashboardDataManager
};
