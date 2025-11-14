// Analytics and Monitoring Utilities
class Analytics {
  constructor() {
    this.events = [];
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
    this.pageViews = 0;
    this.userInteractions = 0;
    this.errors = 0;
    this.performanceMetrics = {};
    
    this.init();
  }
  
  // Initialize analytics
  init() {
    this.trackPageView();
    this.setupPerformanceMonitoring();
    this.setupUserInteractionTracking();
    this.setupErrorTracking();
    this.setupCustomEvents();
  }
  
  // Generate unique session ID
  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }
  
  // Track page view
  trackPageView() {
    this.pageViews++;
    const pageData = {
      event: 'page_view',
      page: window.location.pathname,
      title: document.title,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };
    
    this.events.push(pageData);
    this.log('Page view tracked', pageData);
  }
  
  // Track user interactions
  setupUserInteractionTracking() {
    // Track clicks
    document.addEventListener('click', (e) => {
      this.userInteractions++;
      this.trackEvent('click', {
        element: e.target.tagName,
        id: e.target.id,
        className: e.target.className,
        text: e.target.textContent?.substring(0, 100),
        x: e.clientX,
        y: e.clientY
      });
    });
    
    // Track form submissions
    document.addEventListener('submit', (e) => {
      this.trackEvent('form_submit', {
        formId: e.target.id,
        formAction: e.target.action,
        formMethod: e.target.method
      });
    });
    
    // Track input changes
    document.addEventListener('input', (e) => {
      if (e.target.type === 'text' || e.target.type === 'email' || e.target.type === 'password') {
        this.trackEvent('input_change', {
          elementId: e.target.id,
          elementType: e.target.type,
          fieldName: e.target.name
        });
      }
    });
    
    // Track tool usage - use event delegation to avoid interfering with navigation
    // Use capture phase to track before navigation happens, but don't prevent default
    document.addEventListener('click', (e) => {
      // Check if clicked element is a tool-card or inside one
      const toolCard = e.target.closest('.tool-card');
      if (toolCard && toolCard.tagName === 'A' && toolCard.href) {
        const toolName = toolCard.querySelector('h3')?.textContent;
        this.trackEvent('tool_click', {
          toolName: toolName,
          toolUrl: toolCard.href
        });
        // Don't prevent default - let navigation proceed normally
      }
    }, true); // Use capture phase so it fires before other handlers
  }
  
  // Track custom events
  trackEvent(eventName, properties = {}) {
    const eventData = {
      event: eventName,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      page: window.location.pathname,
      ...properties
    };
    
    this.events.push(eventData);
    this.log('Event tracked', eventData);
  }
  
  // Track financial calculations
  trackFinancialCalculation(calculationType, inputData, result) {
    this.trackEvent('financial_calculation', {
      calculationType: calculationType,
      inputData: this.sanitizeData(inputData),
      result: this.sanitizeData(result),
      timestamp: new Date().toISOString()
    });
  }
  
  // Track errors
  setupErrorTracking() {
    window.addEventListener('error', (e) => {
      this.errors++;
      this.trackEvent('javascript_error', {
        message: e.message,
        filename: e.filename,
        lineno: e.lineno,
        colno: e.colno,
        stack: e.error?.stack
      });
    });
    
    window.addEventListener('unhandledrejection', (e) => {
      this.errors++;
      this.trackEvent('unhandled_promise_rejection', {
        reason: e.reason?.toString(),
        stack: e.reason?.stack
      });
    });
  }
  
  // Setup performance monitoring
  setupPerformanceMonitoring() {
    // Track page load performance
    window.addEventListener('load', () => {
      const perfData = performance.getEntriesByType('navigation')[0];
      if (perfData) {
        this.performanceMetrics = {
          domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
          loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
          totalLoadTime: perfData.loadEventEnd - perfData.fetchStart,
          firstPaint: this.getFirstPaint(),
          firstContentfulPaint: this.getFirstContentfulPaint()
        };
        
        this.trackEvent('performance_metrics', this.performanceMetrics);
      }
    });
    
    // Track memory usage
    if (performance.memory) {
      setInterval(() => {
        this.trackEvent('memory_usage', {
          used: Math.round(performance.memory.usedJSHeapSize / 1048576),
          total: Math.round(performance.memory.totalJSHeapSize / 1048576),
          limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576)
        });
      }, 30000); // Every 30 seconds
    }
  }
  
  // Get first paint time
  getFirstPaint() {
    const paintEntries = performance.getEntriesByType('paint');
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
    return firstPaint ? firstPaint.startTime : null;
  }
  
  // Get first contentful paint time
  getFirstContentfulPaint() {
    const paintEntries = performance.getEntriesByType('paint');
    const firstContentfulPaint = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    return firstContentfulPaint ? firstContentfulPaint.startTime : null;
  }
  
  // Setup custom events
  setupCustomEvents() {
    // Track authentication events
    if (window.auth) {
      window.auth.onAuthStateChanged((user) => {
        if (user) {
          this.trackEvent('user_login', {
            userId: user.uid,
            email: user.email,
            loginMethod: 'email'
          });
        } else {
          this.trackEvent('user_logout');
        }
      });
    }
    
    // Track session timeout
    if (window.extendSession) {
      const originalExtendSession = window.extendSession;
      window.extendSession = () => {
        this.trackEvent('session_extended');
        return originalExtendSession();
      };
    }
  }
  
  // Track user journey
  trackUserJourney(step, data = {}) {
    this.trackEvent('user_journey', {
      step: step,
      journeyData: data,
      timestamp: new Date().toISOString()
    });
  }
  
  // Track financial goals
  trackFinancialGoal(goalType, goalData) {
    this.trackEvent('financial_goal', {
      goalType: goalType,
      goalData: this.sanitizeData(goalData),
      timestamp: new Date().toISOString()
    });
  }
  
  // Track debt payoff progress
  trackDebtProgress(debtData, progressData) {
    this.trackEvent('debt_progress', {
      debtCount: debtData.length,
      totalDebt: debtData.reduce((sum, debt) => sum + (debt.balance || 0), 0),
      progressData: this.sanitizeData(progressData),
      timestamp: new Date().toISOString()
    });
  }
  
  // Track budget performance
  trackBudgetPerformance(budgetData, actualSpending) {
    this.trackEvent('budget_performance', {
      budgetedAmount: budgetData.reduce((sum, item) => sum + (item.budgeted || 0), 0),
      actualSpending: actualSpending.reduce((sum, item) => sum + (item.actual || 0), 0),
      variance: this.calculateVariance(budgetData, actualSpending),
      timestamp: new Date().toISOString()
    });
  }
  
  // Calculate budget variance
  calculateVariance(budgetData, actualSpending) {
    const budgeted = budgetData.reduce((sum, item) => sum + (item.budgeted || 0), 0);
    const actual = actualSpending.reduce((sum, item) => sum + (item.actual || 0), 0);
    return ((actual - budgeted) / budgeted) * 100;
  }
  
  // Sanitize sensitive data
  sanitizeData(data) {
    if (typeof data !== 'object' || data === null) {
      return data;
    }
    
    const sanitized = {};
    const sensitiveFields = ['password', 'ssn', 'creditCard', 'bankAccount'];
    
    for (const [key, value] of Object.entries(data)) {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object') {
        sanitized[key] = this.sanitizeData(value);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }
  
  // Get session summary
  getSessionSummary() {
    const duration = Date.now() - this.startTime;
    
    return {
      sessionId: this.sessionId,
      duration: Math.round(duration / 1000), // seconds
      pageViews: this.pageViews,
      userInteractions: this.userInteractions,
      errors: this.errors,
      events: this.events.length,
      performance: this.performanceMetrics,
      timestamp: new Date().toISOString()
    };
  }
  
  // Export analytics data
  exportData() {
    return {
      session: this.getSessionSummary(),
      events: this.events,
      timestamp: new Date().toISOString()
    };
  }
  
  // Send analytics data to server
  async sendAnalytics() {
    if (!window.CONFIG?.features?.enableAnalytics) {
      return;
    }
    
    try {
      const data = this.exportData();
      
      // In a real implementation, you would send this to your analytics service
      console.log('Analytics data:', data);
      
      // Store in localStorage for debugging
      localStorage.setItem('analytics_data', JSON.stringify(data));
      
    } catch (error) {
      console.error('Failed to send analytics:', error);
    }
  }
  
  // Log analytics events
  log(message, data) {
    if (window.CONFIG?.features?.enableAnalytics) {
      console.log(`[Analytics] ${message}`, data);
    }
  }
  
  // Track A/B test
  trackABTest(testName, variant, action) {
    this.trackEvent('ab_test', {
      testName: testName,
      variant: variant,
      action: action,
      timestamp: new Date().toISOString()
    });
  }
  
  // Track feature usage
  trackFeatureUsage(featureName, usageData = {}) {
    this.trackEvent('feature_usage', {
      feature: featureName,
      usageData: this.sanitizeData(usageData),
      timestamp: new Date().toISOString()
    });
  }
  
  // Track conversion
  trackConversion(conversionType, value = null) {
    this.trackEvent('conversion', {
      type: conversionType,
      value: value,
      timestamp: new Date().toISOString()
    });
  }
  
  // Clean up old data
  cleanup() {
    // Keep only last 100 events
    if (this.events.length > 100) {
      this.events = this.events.slice(-100);
    }
  }
}

// Create global analytics instance
window.Analytics = new Analytics();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Analytics;
}
