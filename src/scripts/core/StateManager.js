/**
 * State Management System
 * Simple Redux-like state management for the app
 */

class StateManager {
  constructor() {
    this.state = {
      user: null,
      financialData: {
        debts: [],
        savings: [],
        budgets: [],
        netWorth: null,
      },
      ui: {
        theme: 'blue',
        sidebarOpen: false,
        notifications: [],
      },
    };
    this.listeners = [];
  }

  getState() {
    return { ...this.state };
  }

  setState(updates) {
    const prevState = { ...this.state };
    this.state = { ...this.state, ...updates };
    this.notifyListeners(prevState, this.state);
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notifyListeners(prevState, newState) {
    this.listeners.forEach(listener => {
      try {
        listener(newState, prevState);
      } catch (error) {
        console.error('[StateManager] Listener error:', error);
      }
    });
  }

  // User actions
  setUser(user) {
    this.setState({ user });
  }

  clearUser() {
    this.setState({ user: null });
  }

  // Financial data actions
  setDebts(debts) {
    this.setState({
      financialData: {
        ...this.state.financialData,
        debts,
      },
    });
  }

  setSavings(savings) {
    this.setState({
      financialData: {
        ...this.state.financialData,
        savings,
      },
    });
  }

  setNetWorth(netWorth) {
    this.setState({
      financialData: {
        ...this.state.financialData,
        netWorth,
      },
    });
  }

  // UI actions
  setTheme(theme) {
    this.setState({
      ui: {
        ...this.state.ui,
        theme,
      },
    });
  }

  addNotification(notification) {
    this.setState({
      ui: {
        ...this.state.ui,
        notifications: [...this.state.ui.notifications, notification],
      },
    });
  }

  removeNotification(id) {
    this.setState({
      ui: {
        ...this.state.ui,
        notifications: this.state.ui.notifications.filter(n => n.id !== id),
      },
    });
  }
}

// Export singleton instance
export const stateManager = new StateManager();

// Make globally available
window.stateManager = stateManager;

export default stateManager;

