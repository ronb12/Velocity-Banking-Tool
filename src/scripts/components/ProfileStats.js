/**
 * Profile Stats Component
 * Handles updating and displaying user profile statistics
 */

export class ProfileStats {
  constructor() {
    this.stats = {
      netWorth: null,
      totalDebt: null,
      creditUtilization: null,
      savingsProgress: null,
    };
  }

  /**
   * Update profile statistics with current data
   * @param {Object} auth - Firebase auth instance
   */
  async updateProfileStats(auth) {
    console.log('Updating profile stats...');
    
    const currentUser = auth?.currentUser;
    if (currentUser) {
      const nameEl = document.getElementById('profileName');
      const emailEl = document.getElementById('profileEmail');
      if (nameEl) {
        nameEl.textContent = currentUser.displayName || 'User';
      }
      if (emailEl) {
        emailEl.textContent = currentUser.email || 'Email';
      }
    }
    
    // Get current financial data from localStorage or calculate from current state
    let netWorth = null;
    let totalDebt = null;
    let creditUtilization = null;
    let savingsProgress = null;
    let totalCreditLimit = null;
    let totalCreditBalance = null;

    const setDebtMetricsFromArray = (debts = []) => {
      if (!Array.isArray(debts)) return;
      const debtBalance = debts.reduce((sum, debt) => sum + (parseFloat(debt.balance) || 0), 0);
      if (!Number.isNaN(debtBalance)) {
        totalDebt = debtBalance;
      }

      const creditCards = debts.filter(debt => debt.type === 'credit');
      const limit = creditCards.reduce((sum, debt) => sum + (parseFloat(debt.limit) || 0), 0);
      const balance = creditCards.reduce((sum, debt) => sum + (parseFloat(debt.balance) || 0), 0);
      totalCreditLimit = limit;
      totalCreditBalance = balance;
      if (limit > 0) {
        creditUtilization = (balance / limit) * 100;
      } else if (creditUtilization === null && balance === 0) {
        creditUtilization = 0;
      }
    };
    
    try {
      // Try to get data from localStorage first
      const debtsData = localStorage.getItem('debts');
      if (debtsData) {
        setDebtMetricsFromArray(JSON.parse(debtsData));
      }

      if (totalDebt === null) {
        const localDebtsData = localStorage.getItem('local_test_debts');
        if (localDebtsData) {
          setDebtMetricsFromArray(JSON.parse(localDebtsData));
        }
      }
      
      // Get net worth data
      const netWorthData = localStorage.getItem('netWorth');
      if (netWorthData) {
        const netWorthObj = JSON.parse(netWorthData);
        if (netWorthObj && netWorthObj.history && netWorthObj.history.length > 0) {
          const latest = netWorthObj.history[netWorthObj.history.length - 1];
          const value = parseFloat(latest.netWorth);
          if (!Number.isNaN(value)) {
            netWorth = value;
          }
        }
      }

      if (netWorth === null) {
        const localNetWorth = localStorage.getItem('local_test_networth');
        if (localNetWorth) {
          const netWorthObj = JSON.parse(localNetWorth);
          if (netWorthObj && netWorthObj.history && netWorthObj.history.length > 0) {
            const latest = netWorthObj.history[netWorthObj.history.length - 1];
            const value = parseFloat(latest.netWorth);
            if (!Number.isNaN(value)) {
              netWorth = value;
            }
          }
        }
      }
      
      // Get savings progress
      const savingsData = localStorage.getItem('savingsGoals');
      if (savingsData) {
        const savings = JSON.parse(savingsData);
        if (Array.isArray(savings) && savings.length > 0) {
          const totalTarget = savings.reduce((sum, goal) => sum + (parseFloat(goal.target) || 0), 0);
          const totalSaved = savings.reduce((sum, goal) => sum + (parseFloat(goal.saved) || 0), 0);
          if (totalTarget > 0) {
            savingsProgress = (totalSaved / totalTarget) * 100;
          } else if (savingsProgress === null) {
            savingsProgress = 0;
          }
        }
      }

      if (savingsProgress === null) {
        const localSavings = localStorage.getItem('local_test_savings');
        if (localSavings) {
          const savings = JSON.parse(localSavings);
          if (Array.isArray(savings) && savings.length > 0) {
            const totalTarget = savings.reduce((sum, goal) => sum + (parseFloat(goal.target) || 0), 0);
            const totalSaved = savings.reduce((sum, goal) => sum + (parseFloat(goal.saved) || 0), 0);
            if (totalTarget > 0) {
              savingsProgress = (totalSaved / totalTarget) * 100;
            } else {
              savingsProgress = 0;
            }
          }
        }
      }

      if (typeof window.getLocalTestData === 'function') {
        try {
          const stats = window.getLocalTestData('userStats');
          if (stats) {
            if (typeof stats.netWorth === 'number') {
              netWorth = stats.netWorth;
            }
            if (typeof stats.totalDebt === 'number') {
              totalDebt = stats.totalDebt;
            }
            if (typeof stats.creditUtilization === 'number') {
              creditUtilization = stats.creditUtilization;
            }
            if (typeof stats.savingsProgress === 'number') {
              savingsProgress = stats.savingsProgress;
            }
          }
        } catch (testDataError) {
          console.warn('Unable to read local test stats:', testDataError);
        }
      }
      
      // Update the profile stats display
      const netWorthElement = document.getElementById('profileNetWorth');
      const totalDebtElement = document.getElementById('profileTotalDebt');
      const creditUtilElement = document.getElementById('profileCreditUtilization');
      const savingsElement = document.getElementById('profileSavings');

      if (netWorthElement) {
        netWorthElement.textContent = Number.isFinite(netWorth) ? `$${Math.round(netWorth).toLocaleString()}` : '-';
      }
      if (totalDebtElement) {
        totalDebtElement.textContent = Number.isFinite(totalDebt) ? `$${Math.round(totalDebt).toLocaleString()}` : '-';
      }
      if (creditUtilElement) {
        creditUtilElement.textContent = Number.isFinite(creditUtilization) ? `${creditUtilization.toFixed(1)}%` : '-';
      }
      if (savingsElement) {
        savingsElement.textContent = Number.isFinite(savingsProgress) ? `${savingsProgress.toFixed(1)}%` : '-';
      }
      
      this.stats = { netWorth, totalDebt, creditUtilization, savingsProgress };
      
      console.log('Profile stats updated:', this.stats);
      
    } catch (error) {
      console.error('Error updating profile stats:', error);
      // Set fallback values
      const elements = {
        'profileNetWorth': '-',
        'profileTotalDebt': '-',
        'profileCreditUtilization': '-',
        'profileSavings': '-',
      };
      
      Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
          element.textContent = value;
        }
      });
    }
  }

  /**
   * Get current stats
   * @returns {Object} Current statistics
   */
  getStats() {
    return { ...this.stats };
  }
}

// Export singleton instance
export const profileStats = new ProfileStats();

// Make globally available
window.ProfileStats = ProfileStats;
window.profileStats = profileStats;
window.updateProfileStats = (auth) => profileStats.updateProfileStats(auth);

