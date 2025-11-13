// Activity Logging Utility
const IS_LOCALHOST = typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

class ActivityLogger {
  constructor() {
    this.db = null;
    this.auth = null;
    this.isInitialized = false;
  }

  // Initialize with Firebase instances
  async initialize(db, auth) {
    this.db = db;
    this.auth = auth;
    this.isInitialized = true;
  }

  // Log activity to Firestore
  async logActivity(activityType, description, icon = '📝', metadata = {}) {
    if (IS_LOCALHOST) {
      return;
    }

    if (!this.isInitialized || !this.auth.currentUser) {
      console.warn('ActivityLogger not initialized or user not authenticated');
      return;
    }

    try {
      const { addDoc, collection, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js');
      
      const activityData = {
        icon: icon,
        text: description,
        type: activityType,
        timestamp: serverTimestamp(),
        metadata: metadata,
        userId: this.auth.currentUser.uid
      };

      await addDoc(collection(this.db, 'users', this.auth.currentUser.uid, 'activity_logs'), activityData);
      
      console.log('Activity logged:', activityData);
    } catch (error) {
      if (!IS_LOCALHOST) {
        console.error('Failed to log activity:', error);
      }
    }
  }

  // Predefined activity types with icons and templates
  static ACTIVITY_TYPES = {
    DEBT_PAYMENT: {
      icon: '💳',
      template: (amount, debtName) => `Paid $${amount} towards ${debtName}`
    },
    DEBT_ADDED: {
      icon: '➕',
      template: (debtName, amount) => `Added ${debtName} debt of $${amount}`
    },
    DEBT_UPDATED: {
      icon: '✏️',
      template: (debtName) => `Updated ${debtName} debt details`
    },
    DEBT_DELETED: {
      icon: '🗑️',
      template: (debtName) => `Deleted ${debtName} debt`
    },
    BUDGET_CREATED: {
      icon: '📊',
      template: (category, amount) => `Created budget for ${category}: $${amount}`
    },
    BUDGET_UPDATED: {
      icon: '✏️',
      template: (category, amount) => `Updated ${category} budget to $${amount}`
    },
    BUDGET_SPENT: {
      icon: '💸',
      template: (category, amount) => `Spent $${amount} on ${category}`
    },
    SAVINGS_GOAL_CREATED: {
      icon: '🎯',
      template: (goalName, amount) => `Created savings goal: ${goalName} ($${amount})`
    },
    SAVINGS_GOAL_UPDATED: {
      icon: '✏️',
      template: (goalName, amount) => `Updated savings goal: ${goalName} ($${amount})`
    },
    SAVINGS_GOAL_COMPLETED: {
      icon: '🎉',
      template: (goalName) => `Completed savings goal: ${goalName}`
    },
    SAVINGS_CONTRIBUTION: {
      icon: '💰',
      template: (goalName, amount) => `Added $${amount} to ${goalName} savings goal`
    },
    NET_WORTH_UPDATED: {
      icon: '📈',
      template: (type, amount) => `Updated ${type}: $${amount}`
    },
    VELOCITY_CALCULATED: {
      icon: '🧮',
      template: (debtAmount, payment) => `Calculated velocity strategy for $${debtAmount} debt with $${payment} payment`
    },
    TAX_CALCULATED: {
      icon: '🧾',
      template: (year, amount) => `Calculated ${year} taxes: $${amount}`
    },
    LOGIN: {
      icon: '🔐',
      template: () => 'Logged into account'
    },
    LOGOUT: {
      icon: '🚪',
      template: () => 'Logged out of account'
    },
    PROFILE_UPDATED: {
      icon: '👤',
      template: (field) => `Updated profile ${field}`
    }
  };

  // Helper methods for common activities
  async logDebtPayment(debtName, amount, remainingBalance) {
    const description = ActivityLogger.ACTIVITY_TYPES.DEBT_PAYMENT.template(amount, debtName);
    await this.logActivity('debt_payment', description, ActivityLogger.ACTIVITY_TYPES.DEBT_PAYMENT.icon, {
      debtName,
      amount,
      remainingBalance
    });
  }

  async logDebtAdded(debtName, amount, interestRate) {
    const description = ActivityLogger.ACTIVITY_TYPES.DEBT_ADDED.template(debtName, amount);
    await this.logActivity('debt_added', description, ActivityLogger.ACTIVITY_TYPES.DEBT_ADDED.icon, {
      debtName,
      amount,
      interestRate
    });
  }

  async logBudgetCreated(category, amount) {
    const description = ActivityLogger.ACTIVITY_TYPES.BUDGET_CREATED.template(category, amount);
    await this.logActivity('budget_created', description, ActivityLogger.ACTIVITY_TYPES.BUDGET_CREATED.icon, {
      category,
      amount
    });
  }

  async logBudgetUpdated(category, oldAmount, newAmount) {
    const description = ActivityLogger.ACTIVITY_TYPES.BUDGET_UPDATED.template(category, newAmount);
    await this.logActivity('budget_updated', description, ActivityLogger.ACTIVITY_TYPES.BUDGET_UPDATED.icon, {
      category,
      oldAmount,
      newAmount
    });
  }

  async logSavingsGoalCreated(goalName, targetAmount, category) {
    const description = ActivityLogger.ACTIVITY_TYPES.SAVINGS_GOAL_CREATED.template(goalName, targetAmount);
    await this.logActivity('savings_goal_created', description, ActivityLogger.ACTIVITY_TYPES.SAVINGS_GOAL_CREATED.icon, {
      goalName,
      targetAmount,
      category
    });
  }

  async logSavingsContribution(goalName, amount, newProgress) {
    const description = ActivityLogger.ACTIVITY_TYPES.SAVINGS_CONTRIBUTION.template(goalName, amount);
    await this.logActivity('savings_contribution', description, ActivityLogger.ACTIVITY_TYPES.SAVINGS_CONTRIBUTION.icon, {
      goalName,
      amount,
      progress: newProgress
    });
  }

  async logNetWorthUpdate(type, amount, totalNetWorth) {
    const description = ActivityLogger.ACTIVITY_TYPES.NET_WORTH_UPDATED.template(type, amount);
    await this.logActivity('net_worth_updated', description, ActivityLogger.ACTIVITY_TYPES.NET_WORTH_UPDATED.icon, {
      type,
      amount,
      totalNetWorth
    });
  }

  async logVelocityCalculation(debtAmount, payment, strategy) {
    const description = ActivityLogger.ACTIVITY_TYPES.VELOCITY_CALCULATED.template(debtAmount, payment);
    await this.logActivity('velocity_calculated', description, ActivityLogger.ACTIVITY_TYPES.VELOCITY_CALCULATED.icon, {
      debtAmount,
      payment,
      strategy
    });
  }

  async logTaxCalculation(year, totalTax, netIncome) {
    const description = ActivityLogger.ACTIVITY_TYPES.TAX_CALCULATED.template(year, totalTax);
    await this.logActivity('tax_calculated', description, ActivityLogger.ACTIVITY_TYPES.TAX_CALCULATED.icon, {
      year,
      totalTax,
      netIncome
    });
  }

  async logLogin() {
    const description = ActivityLogger.ACTIVITY_TYPES.LOGIN.template();
    await this.logActivity('login', description, ActivityLogger.ACTIVITY_TYPES.LOGIN.icon);
  }

  async logLogout() {
    const description = ActivityLogger.ACTIVITY_TYPES.LOGOUT.template();
    await this.logActivity('logout', description, ActivityLogger.ACTIVITY_TYPES.LOGOUT.icon);
  }

  // Get recent activities for display
  async getRecentActivities(limit = 10) {
    if (!this.isInitialized || !this.auth.currentUser) {
      return [];
    }

    try {
      const { collection, query, orderBy, limitToLast, getDocs } = await import('https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js');
      
      const q = query(
        collection(this.db, 'users', this.auth.currentUser.uid, 'activity_logs'),
        orderBy('timestamp', 'desc'),
        limitToLast(limit)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Failed to get recent activities:', error);
      return [];
    }
  }
}

// Create global instance
window.activityLogger = new ActivityLogger();

// Auto-initialize when Firebase is available
document.addEventListener('DOMContentLoaded', async function() {
  // Wait for Firebase to be available
  function checkFirebase() {
    if (window.db && window.auth) {
      window.activityLogger.initialize(window.db, window.auth);
    } else {
      setTimeout(checkFirebase, 100);
    }
  }
  checkFirebase();
});

export default ActivityLogger;
