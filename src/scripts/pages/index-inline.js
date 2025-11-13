/**
 * Dashboard Inline Scripts
 * Extracted from index.html
 * This file contains all JavaScript that was inline in index.html
 * 
 * Now using component-based architecture
 */

// Import components
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

// Note: This code assumes global variables from index.html:
// - window.auth, window.db, window.themeManager
// - USE_FIRESTORE, ErrorHandler
// - Firebase imports (doc, getDoc, setDoc, onSnapshot, etc.)

// Initialize dashboard data manager
let dashboardDataManager = null;

// Enhanced data loading with error handling
(async function initializeDashboard() {
  if (typeof auth !== 'undefined' && typeof db !== 'undefined') {
    try {
      dashboardDataManager = new DashboardData(auth, db);
      const loadData = errorBoundary.wrapAsync(
        () => dashboardDataManager.loadDashboardData(typeof USE_FIRESTORE !== 'undefined' ? USE_FIRESTORE : false),
        'dashboard_data_load'
      );
      await loadData();
    } catch (error) {
      logger.error('Failed to initialize dashboard data', { error: error.message });
      errorBoundary.handleError(error, { context: 'dashboard_initialization' });
    }
  } else {
    logger.warn('Auth or DB not available, skipping dashboard data initialization');
  }
})();

// Profile Modal Logic
const profileButton = document.getElementById('profileButton');
const profileModal = document.getElementById('profileModal');
const closeProfileModal = document.getElementById('closeProfileModal');

logger.debug('Profile button found', { exists: !!profileButton });
logger.debug('Profile modal found', { exists: !!profileModal });

if (profileButton) {
  profileButton.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    logger.debug('Profile button clicked, opening modal');
    if (profileModal) {
      profileModal.style.display = 'flex';
      logger.debug('Modal display set to flex');
      profileStats.updateProfileStats(typeof auth !== 'undefined' ? auth : null);
      initializeThemeSelector();
      
      // Debug: Check if avatar elements exist
      setTimeout(() => {
        logger.debug('Avatar elements check', {
          container: !!document.querySelector('.avatar-container'),
          uploadButton: !!document.querySelector('.avatar-upload-btn'),
          modalVisible: profileModal.style.display,
          computedStyle: window.getComputedStyle(profileModal).display
        });
      }, 100);
    } else {
      logger.error('Profile modal not found');
      errorBoundary.handleError(new Error('Profile modal not found'), { context: 'profile_modal' });
    }
  });
} else {
  logger.error('Profile button not found');
  errorBoundary.handleError(new Error('Profile button not found'), { context: 'profile_button' });
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
    logger.warn('ThemeManager not available');
    return;
  }
  
  const button = document.getElementById('themeDropdownButton');
  const menu = document.getElementById('themeDropdownMenu');
  
  if (!button || !menu) {
    logger.warn('Theme selector elements not found');
    return;
  }
  
  // Populate theme options
  const themes = window.themeManager.getThemes();
  menu.innerHTML = themes.map(theme => `
    <div class="theme-option" data-theme="${theme.id}">
      <div class="theme-swatch" style="background: ${theme.primaryColor}"></div>
      <span>${theme.name}</span>
    </div>
  `).join('');
  
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
  
  const currentTheme = window.themeManager.getCurrentTheme();
  const menu = document.getElementById('themeDropdownMenu');
  
  if (menu) {
    menu.querySelectorAll('.theme-option').forEach(option => {
      if (option.dataset.theme === currentTheme.id) {
        option.classList.add('active');
      } else {
        option.classList.remove('active');
      }
    });
  }
}

// Settings Management
if (typeof settingsManager !== 'undefined') {
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
if (advancedSettingsBtn) {
  advancedSettingsBtn.addEventListener('click', () => {
    if (typeof advancedSettings !== 'undefined') {
      advancedSettings.openAdvancedSettings();
    }
  });
}

// Financial Tips
if (typeof financialTips !== 'undefined') {
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
  if (typeof dataExport === 'undefined') {
    logger.error('DataExport component not available');
    errorBoundary.handleError(new Error('DataExport component not available'), { context: 'data_export' });
    return;
  }

  // Validate format input
  const validFormats = ['json', 'csv', 'pdf'];
  if (!validFormats.includes(format)) {
    logger.error('Invalid export format', { format });
    errorBoundary.handleError(new Error(`Invalid export format: ${format}`), { context: 'data_export' });
    return;
  }
  
  const showNotification = typeof notificationSystem !== 'undefined' 
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
  if (typeof financialInsights === 'undefined') {
    logger.warn('FinancialInsights component not available');
    return;
  }
  
  try {
    // Rate limit check
    const rateCheck = rateLimiter.check('financial_insights_update', {
      window: 60000, // 1 minute
      max: 10 // Max 10 updates per minute
    });

    if (!rateCheck.allowed) {
      logger.warn('Rate limit exceeded for financial insights update');
      return;
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
    
    const recommendationsContainer = document.getElementById('recommendations');
    if (recommendationsContainer) {
      financialInsights.renderRecommendations(recommendations, recommendationsContainer);
    }
  } catch (error) {
    logger.error('Error updating financial insights', { error: error.message, stack: error.stack });
    errorBoundary.handleError(error, { context: 'financial_insights_update' });
  }
}

// Update insights when data changes
if (typeof auth !== 'undefined') {
  auth.onAuthStateChanged(() => {
    setTimeout(updateFinancialInsights, 1000);
  });
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
    profileStats.updateProfileStats(typeof auth !== 'undefined' ? auth : null);
    initializeThemeSelector();
  }
};

window.updateProfileStats = () => {
  profileStats.updateProfileStats(typeof auth !== 'undefined' ? auth : null);
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
