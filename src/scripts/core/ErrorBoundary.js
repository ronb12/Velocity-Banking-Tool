/**
 * Centralized Error Boundary for the Application
 * Catches and handles errors gracefully throughout the app
 * 
 * @class ErrorBoundary
 */
export class ErrorBoundary {
  constructor() {
    this.errorListeners = [];
    this.errorCount = 0;
    this.maxErrors = 10;
    this.errorWindow = 60000; // 1 minute
    this.errorTimestamps = [];
  }

  /**
   * Initialize error boundary
   */
  init() {
    // Global error handlers
    window.addEventListener('error', (event) => {
      this.handleError(event.error || event.message, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        type: 'javascript_error'
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(event.reason, {
        type: 'unhandled_promise_rejection'
      });
    });

    // Wrap console.error to capture errors
    const originalError = console.error;
    console.error = (...args) => {
      this.handleError(args.join(' '), { type: 'console_error' });
      originalError.apply(console, args);
    };
  }

  /**
   * Handle an error
   * @param {Error|string} error - The error object or message
   * @param {Object} context - Additional context about the error
   */
  handleError(error, context = {}) {
    // Rate limiting - prevent error spam
    const now = Date.now();
    this.errorTimestamps = this.errorTimestamps.filter(
      timestamp => now - timestamp < this.errorWindow
    );

    if (this.errorTimestamps.length >= this.maxErrors) {
      console.warn('[ErrorBoundary] Too many errors, suppressing further errors');
      return;
    }

    this.errorTimestamps.push(now);
    this.errorCount++;

    const errorInfo = {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      ...context
    };

    // Log to error tracking service
    this.logError(errorInfo);

    // Notify listeners
    this.errorListeners.forEach(listener => {
      try {
        listener(errorInfo);
      } catch (e) {
        console.error('[ErrorBoundary] Error in error listener:', e);
      }
    });

    // Show user-friendly error message
    this.showUserError(errorInfo);
  }

  /**
   * Log error to tracking service
   * @param {Object} errorInfo - Error information
   */
  logError(errorInfo) {
    // Try to send to error tracking service
    if (typeof window !== 'undefined' && window.ErrorHandler) {
      try {
        window.ErrorHandler.logError(errorInfo);
      } catch (e) {
        console.error('[ErrorBoundary] Failed to log error:', e);
      }
    }

    // Store in localStorage for debugging (limited to last 10 errors)
    try {
      const storedErrors = JSON.parse(
        localStorage.getItem('app_errors') || '[]'
      );
      storedErrors.unshift(errorInfo);
      storedErrors.splice(10); // Keep only last 10
      localStorage.setItem('app_errors', JSON.stringify(storedErrors));
    } catch (e) {
      // Ignore localStorage errors
    }
  }

  /**
   * Show user-friendly error message
   * @param {Object} errorInfo - Error information
   */
  showUserError(errorInfo) {
    // Don't show errors for console errors or minor issues
    if (errorInfo.type === 'console_error') {
      return;
    }

    // Show notification if notification system is available
    if (typeof window !== 'undefined' && window.showNotification) {
      const userMessage = this.getUserFriendlyMessage(errorInfo);
      window.showNotification(userMessage, 'error');
    }
  }

  /**
   * Get user-friendly error message
   * @param {Object} errorInfo - Error information
   * @returns {string} User-friendly message
   */
  getUserFriendlyMessage(errorInfo) {
    const message = errorInfo.message.toLowerCase();

    if (message.includes('network') || message.includes('fetch')) {
      return 'Network error. Please check your connection and try again.';
    }

    if (message.includes('firebase') || message.includes('auth')) {
      return 'Authentication error. Please try logging in again.';
    }

    if (message.includes('permission') || message.includes('denied')) {
      return 'Permission denied. Please check your account settings.';
    }

    if (message.includes('quota') || message.includes('limit')) {
      return 'Storage limit reached. Please free up some space.';
    }

    return 'An unexpected error occurred. Please try again or contact support if the problem persists.';
  }

  /**
   * Add error listener
   * @param {Function} listener - Function to call when error occurs
   */
  addErrorListener(listener) {
    this.errorListeners.push(listener);
  }

  /**
   * Remove error listener
   * @param {Function} listener - Function to remove
   */
  removeErrorListener(listener) {
    this.errorListeners = this.errorListeners.filter(l => l !== listener);
  }

  /**
   * Wrap async function with error handling
   * @param {Function} fn - Async function to wrap
   * @param {string} context - Context description
   * @returns {Function} Wrapped function
   */
  wrapAsync(fn, context = 'unknown') {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        this.handleError(error, { context, type: 'async_error' });
        throw error; // Re-throw for caller to handle if needed
      }
    };
  }

  /**
   * Retry logic for network operations
   * @param {Function} fn - Function to retry
   * @param {number} maxRetries - Maximum number of retries
   * @param {number} delay - Delay between retries in ms
   * @returns {Promise} Result of function
   */
  async retry(fn, maxRetries = 3, delay = 1000) {
    let lastError;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        // Don't retry on certain errors
        if (error.message && (
          error.message.includes('permission') ||
          error.message.includes('auth') ||
          error.message.includes('invalid')
        )) {
          throw error;
        }

        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
        }
      }
    }

    throw lastError;
  }
}

// Export singleton instance
export const errorBoundary = new ErrorBoundary();

// Initialize on load
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      errorBoundary.init();
    });
  } else {
    errorBoundary.init();
  }
}

// Make globally available
window.ErrorBoundary = ErrorBoundary;
window.errorBoundary = errorBoundary;

