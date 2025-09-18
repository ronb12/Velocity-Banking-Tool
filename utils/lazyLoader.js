// Lazy Loading and Code Splitting Utilities
class LazyLoader {
  constructor() {
    this.loadedModules = new Map();
    this.loadingPromises = new Map();
    this.preloadCache = new Set();
  }
  
  // Lazy load JavaScript modules
  async loadModule(modulePath, moduleName = null) {
    const key = moduleName || modulePath;
    
    // Return cached module if already loaded
    if (this.loadedModules.has(key)) {
      return this.loadedModules.get(key);
    }
    
    // Return existing promise if currently loading
    if (this.loadingPromises.has(key)) {
      return this.loadingPromises.get(key);
    }
    
    // Create loading promise
    const loadingPromise = this._loadModuleFile(modulePath, key);
    this.loadingPromises.set(key, loadingPromise);
    
    try {
      const module = await loadingPromise;
      this.loadedModules.set(key, module);
      this.loadingPromises.delete(key);
      return module;
    } catch (error) {
      this.loadingPromises.delete(key);
      throw error;
    }
  }
  
  // Internal method to load module file
  async _loadModuleFile(modulePath, key) {
    try {
      // For ES modules
      if (modulePath.endsWith('.js') && !modulePath.includes('firebase')) {
        const module = await import(modulePath);
        return module.default || module;
      }
      
      // For regular scripts
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = modulePath;
        script.type = 'module';
        script.onload = () => {
          // Try to get the module from global scope
          const moduleName = key.split('/').pop().replace('.js', '');
          const module = window[moduleName] || window[moduleName.charAt(0).toUpperCase() + moduleName.slice(1)];
          resolve(module);
        };
        script.onerror = () => reject(new Error(`Failed to load module: ${modulePath}`));
        document.head.appendChild(script);
      });
    } catch (error) {
      throw new Error(`Failed to load module ${modulePath}: ${error.message}`);
    }
  }
  
  // Preload modules for faster loading
  preloadModule(modulePath, moduleName = null) {
    const key = moduleName || modulePath;
    
    if (this.preloadCache.has(key)) {
      return;
    }
    
    this.preloadCache.add(key);
    
    // Create preload link
    const link = document.createElement('link');
    link.rel = 'modulepreload';
    link.href = modulePath;
    document.head.appendChild(link);
  }
  
  // Load financial tools on demand
  async loadFinancialTool(toolName) {
    const toolModules = {
      'debt-tracker': () => this.loadModule('./Debt_Tracker.html', 'DebtTracker'),
      'budget': () => this.loadModule('./budget.html', 'BudgetTracker'),
      'velocity-calculator': () => this.loadModule('./Velocity_Calculator.html', 'VelocityCalculator'),
      'net-worth': () => this.loadModule('./net_worth_tracker.html', 'NetWorthTracker'),
      'credit-score': () => this.loadModule('./Credit_Score_Estimator.html', 'CreditScoreEstimator'),
      'tax-calculator': () => this.loadModule('./1099_calculator.html', 'TaxCalculator'),
      'savings-goals': () => this.loadModule('./savings_goal_tracker.html', 'SavingsGoals'),
      'notifications': () => this.loadModule('./notifications.html', 'Notifications'),
      'activity-feed': () => this.loadModule('./activity_feed.html', 'ActivityFeed'),
      'challenges': () => this.loadModule('./challenge_library.html', 'Challenges')
    };
    
    if (toolModules[toolName]) {
      return await toolModules[toolName]();
    }
    
    throw new Error(`Unknown tool: ${toolName}`);
  }
  
  // Load tool with loading state
  async loadToolWithLoading(toolName, containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container not found: ${containerId}`);
    }
    
    // Show loading state
    container.innerHTML = `
      <div class="loading-container">
        <div class="spinner"></div>
        <p>Loading ${toolName}...</p>
      </div>
    `;
    
    try {
      const tool = await this.loadFinancialTool(toolName);
      
      // Hide loading state
      container.innerHTML = '';
      
      // Initialize tool if it has an init method
      if (tool && typeof tool.init === 'function') {
        tool.init(container);
      }
      
      return tool;
    } catch (error) {
      // Show error state
      container.innerHTML = `
        <div class="error-container">
          <h3>Failed to load ${toolName}</h3>
          <p>${error.message}</p>
          <button onclick="location.reload()">Retry</button>
        </div>
      `;
      throw error;
    }
  }
  
  // Preload all tools for better performance
  preloadAllTools() {
    const tools = [
      'debt-tracker', 'budget', 'velocity-calculator', 'net-worth',
      'credit-score', 'tax-calculator', 'savings-goals', 'notifications',
      'activity-feed', 'challenges'
    ];
    
    tools.forEach(tool => {
      this.preloadModule(`./${tool.replace('-', '_')}.html`);
    });
  }
  
  // Load CSS files dynamically
  async loadCSS(cssPath) {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = cssPath;
      link.onload = () => resolve(link);
      link.onerror = () => reject(new Error(`Failed to load CSS: ${cssPath}`));
      document.head.appendChild(link);
    });
  }
  
  // Load multiple resources in parallel
  async loadMultiple(resources) {
    const promises = resources.map(resource => {
      if (resource.type === 'module') {
        return this.loadModule(resource.path, resource.name);
      } else if (resource.type === 'css') {
        return this.loadCSS(resource.path);
      } else {
        return Promise.resolve();
      }
    });
    
    return Promise.all(promises);
  }
  
  // Get loading progress
  getLoadingProgress() {
    const total = this.loadingPromises.size + this.loadedModules.size;
    const loaded = this.loadedModules.size;
    return total > 0 ? (loaded / total) * 100 : 100;
  }
  
  // Clean up resources
  cleanup() {
    this.loadedModules.clear();
    this.loadingPromises.clear();
    this.preloadCache.clear();
  }
}

// Create global instance
window.LazyLoader = new LazyLoader();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LazyLoader;
}
