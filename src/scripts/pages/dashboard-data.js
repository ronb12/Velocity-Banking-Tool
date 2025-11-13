/**
 * Dashboard Data Management
 * Handles loading and updating dashboard statistics
 */

export class DashboardData {
  constructor(auth, db) {
    this.auth = auth;
    this.db = db;
    this.stats = {
      creditUtilization: null,
      netWorth: null,
      totalDebt: null,
      savingsProgress: null,
    };
  }

  /**
   * Load dashboard data from Firestore
   * @param {boolean} useFirestore - Whether to use Firestore
   */
  async loadDashboardData(useFirestore) {
    if (!this.auth || !this.db) {
      console.warn('[DashboardData] Auth or DB not available');
      return;
    }

    const user = this.auth.currentUser;
    if (!user) {
      console.log('[DashboardData] No user logged in');
      return;
    }

    if (useFirestore) {
      try {
        const userRef = this.db.doc(`users/${user.uid}`);
        
        // First, ensure the user document exists
        try {
          const userDoc = await userRef.get();
          if (!userDoc.exists()) {
            // Create user document if it doesn't exist
            await userRef.set({
              email: user.email,
              displayName: user.displayName || '',
              joined: new Date().toISOString(),
              lastLogin: new Date().toISOString(),
              creditUtilization: 0,
              netWorth: 0,
              totalDebt: 0,
              savingsProgress: 0
            });
            console.log('User document created successfully');
          }
        } catch (error) {
          console.error('Error creating user document:', error);
        }
        
        // Set up Firestore listener
        try {
          userRef.onSnapshot(
            docSnap => {
              try {
                const data = docSnap.data() || {};
                this.updateStatsFromData(data);
              } catch (error) {
                console.warn('Error updating dashboard data:', error);
              }
            },
            error => {
              console.warn('Firestore listener error (non-critical):', error.message);
              this.setDefaultValues();
            }
          );
        } catch (error) {
          console.warn('Could not set up Firestore listener:', error.message);
          this.setDefaultValues();
        }
      } catch (error) {
        if (window.ErrorHandler) {
          window.ErrorHandler.handleFirebaseError(error);
        }
      }
    } else {
      console.log('Firestore disabled in local environment; using default dashboard placeholders.');
      this.applyLocalDashboardData();
    }
  }

  /**
   * Update stats from Firestore data
   * @param {Object} data - User data from Firestore
   */
  updateStatsFromData(data) {
    // Update credit utilization
    const creditUtil = data.creditUtilization;
    const creditElement = document.getElementById('creditUtilizationValue');
    if (creditElement) {
      if (creditUtil !== undefined && !isNaN(creditUtil)) {
        creditElement.textContent = `${Number(creditUtil).toFixed(1)}%`;
        creditElement.style.color = creditUtil < 30 ? '#22c55e' : creditUtil < 50 ? '#f59e42' : '#ef4444';
        this.stats.creditUtilization = creditUtil;
      } else {
        creditElement.textContent = 'No data yet';
        creditElement.style.color = '#64748b';
      }
    }
    
    // Update net worth
    const netWorth = data.netWorth;
    const netWorthElement = document.getElementById('netWorthValue');
    if (netWorthElement) {
      if (netWorth !== undefined && !isNaN(netWorth)) {
        const formatted = Number(netWorth).toLocaleString('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        });
        netWorthElement.textContent = formatted;
        netWorthElement.style.color = netWorth >= 0 ? '#22c55e' : '#ef4444';
        this.stats.netWorth = netWorth;
      } else {
        netWorthElement.textContent = 'No data yet';
        netWorthElement.style.color = '#64748b';
      }
    }
    
    // Update total debt
    const totalDebt = data.totalDebt;
    const debtElement = document.getElementById('debtSummaryValue');
    if (debtElement) {
      if (totalDebt !== undefined && !isNaN(totalDebt)) {
        const formatted = Number(totalDebt).toLocaleString('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        });
        debtElement.textContent = formatted;
        debtElement.style.color = totalDebt > 0 ? '#ef4444' : '#22c55e';
        this.stats.totalDebt = totalDebt;
      } else {
        debtElement.textContent = 'No data yet';
        debtElement.style.color = '#64748b';
      }
    }
    
    // Update savings progress
    const savings = data.savingsProgress;
    const savingsElement = document.getElementById('savingsValue');
    if (savingsElement) {
      if (savings !== undefined && !isNaN(savings)) {
        savingsElement.textContent = `${Number(savings).toFixed(1)}% of goals`;
        savingsElement.style.color = savings >= 100 ? '#22c55e' : savings >= 50 ? '#f59e42' : '#ef4444';
        this.stats.savingsProgress = savings;
      } else {
        savingsElement.textContent = 'No data yet';
        savingsElement.style.color = '#64748b';
      }
    }
  }

  /**
   * Set default values when Firestore fails
   */
  setDefaultValues() {
    const elements = ['creditUtilizationValue', 'netWorthValue', 'debtSummaryValue', 'savingsValue'];
    elements.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = 'No data yet';
        element.style.color = '#64748b';
      }
    });
  }

  /**
   * Apply local dashboard data (fallback)
   */
  applyLocalDashboardData() {
    // This would load from localStorage as fallback
    this.setDefaultValues();
  }

  /**
   * Get current stats
   * @returns {Object} Current statistics
   */
  getStats() {
    return { ...this.stats };
  }
}

// Export for use
export default DashboardData;

