/**
 * Dashboard Page Controller
 * Main dashboard functionality
 */

import { profileModal } from '../components/ProfileModal.js';
import { themeSelector } from '../components/ThemeSelector.js';

export class Dashboard {
  constructor() {
    this.stats = {
      creditUtilization: null,
      netWorth: null,
      totalDebt: null,
      savingsProgress: null,
    };
  }

  async init() {
    console.log('[Dashboard] Initializing...');
    
    // Wait for dependencies
    await this.waitForDependencies();
    
    // Initialize components
    profileModal.init();
    themeSelector.init();
    
    // Load dashboard data
    await this.loadDashboardData();
    
    // Setup event listeners
    this.setupEventListeners();
    
    console.log('[Dashboard] Initialized successfully');
  }

  async waitForDependencies() {
    const maxWait = 5000; // 5 seconds
    const startTime = Date.now();

    while (Date.now() - startTime < maxWait) {
      if (window.auth && window.db && window.themeManager) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.warn('[Dashboard] Some dependencies not loaded');
  }

  async loadDashboardData() {
    if (!window.auth || !window.db) {
      console.warn('[Dashboard] Auth or DB not available');
      return;
    }

    const user = window.auth.currentUser;
    if (!user) {
      console.log('[Dashboard] No user logged in');
      return;
    }

    try {
      await Promise.all([
        this.loadCreditUtilization(user.uid),
        this.loadNetWorth(user.uid),
        this.loadTotalDebt(user.uid),
        this.loadSavingsProgress(user.uid),
      ]);
    } catch (error) {
      console.error('[Dashboard] Error loading data:', error);
      ErrorHandler?.handleFirebaseError?.(error);
    }
  }

  async loadCreditUtilization(userId) {
    // Implementation for loading credit utilization
    // This would fetch from Firestore
    const value = '0%'; // Placeholder
    this.updateStat('creditUtilization', value);
  }

  async loadNetWorth(userId) {
    // Implementation for loading net worth
    const value = '$0.00'; // Placeholder
    this.updateStat('netWorth', value);
  }

  async loadTotalDebt(userId) {
    // Implementation for loading total debt
    const value = '$0.00'; // Placeholder
    this.updateStat('totalDebt', value);
  }

  async loadSavingsProgress(userId) {
    // Implementation for loading savings progress
    const value = '0%'; // Placeholder
    this.updateStat('savingsProgress', value);
  }

  updateStat(statName, value) {
    this.stats[statName] = value;
    const element = document.getElementById(`${statName}Value`);
    if (element) {
      element.textContent = value;
    }
  }

  setupEventListeners() {
    // Profile button
    const profileBtn = document.getElementById('profileBtn') || 
                      document.querySelector('[onclick*="openProfileModal"]');
    if (profileBtn) {
      profileBtn.addEventListener('click', () => profileModal.open());
    }

    // Make openProfileModal globally available for backward compatibility
    window.openProfileModal = () => profileModal.open();
  }
}

// Initialize dashboard when DOM is ready
let dashboard;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    dashboard = new Dashboard();
    dashboard.init();
  });
} else {
  dashboard = new Dashboard();
  dashboard.init();
}

export default dashboard;

