// Error Handling Utilities
class ErrorHandler {
  constructor() {
    this.errorLog = [];
    this.maxLogSize = 100;
  }
  
  // User-friendly error messages
  static getUserMessage(error) {
    const errorMessages = {
      'auth/user-not-found': 'No account found with this email address',
      'auth/wrong-password': 'Incorrect password. Please try again',
      'auth/email-already-in-use': 'An account with this email already exists',
      'auth/weak-password': 'Password is too weak. Please choose a stronger password',
      'auth/invalid-email': 'Please enter a valid email address',
      'auth/too-many-requests': 'Too many failed attempts. Please try again later',
      'auth/network-request-failed': 'Network error. Please check your connection',
      'permission-denied': 'You do not have permission to perform this action',
      'unavailable': 'Service temporarily unavailable. Please try again later',
      'invalid-argument': 'Invalid input. Please check your data and try again'
    };
    
    return errorMessages[error.code] || error.message || 'An unexpected error occurred';
  }
  
  // Show error notification to user
  static showError(message, duration = 5000) {
    this.showNotification(message, 'error', duration);
  }
  
  // Show success notification
  static showSuccess(message, duration = 3000) {
    this.showNotification(message, 'success', duration);
  }
  
  // Show warning notification
  static showWarning(message, duration = 4000) {
    this.showNotification(message, 'warning', duration);
  }
  
  // Show info notification
  static showInfo(message, duration = 3000) {
    this.showNotification(message, 'info', duration);
  }
  
  // Generic notification display
  static showNotification(message, type = 'info', duration = 3000) {
    // Remove existing notifications
    const existing = document.querySelectorAll('.notification');
    existing.forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-icon">${this.getIcon(type)}</span>
        <span class="notification-message">${message}</span>
        <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;
    
    // Add styles if not already present
    if (!document.querySelector('#notification-styles')) {
      const style = document.createElement('style');
      style.id = 'notification-styles';
      style.textContent = `
        .notification {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 10000;
          max-width: 400px;
          padding: 16px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          animation: slideInRight 0.3s ease;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        .notification-content {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .notification-icon {
          font-size: 20px;
          flex-shrink: 0;
        }
        
        .notification-message {
          flex: 1;
          font-size: 14px;
          line-height: 1.4;
        }
        
        .notification-close {
          background: none;
          border: none;
          font-size: 18px;
          cursor: pointer;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: background-color 0.2s;
        }
        
        .notification-close:hover {
          background-color: rgba(0, 0, 0, 0.1);
        }
        
        .notification.success {
          background: #d4edda;
          color: #155724;
          border-left: 4px solid #28a745;
        }
        
        .notification.error {
          background: #f8d7da;
          color: #721c24;
          border-left: 4px solid #dc3545;
        }
        
        .notification.warning {
          background: #fff3cd;
          color: #856404;
          border-left: 4px solid #ffc107;
        }
        
        .notification.info {
          background: #d1ecf1;
          color: #0c5460;
          border-left: 4px solid #17a2b8;
        }
        
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @media (max-width: 480px) {
          .notification {
            right: 10px;
            left: 10px;
            max-width: none;
          }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Auto-remove after duration
    setTimeout(() => {
      if (notification.parentElement) {
        notification.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => notification.remove(), 300);
      }
    }, duration);
  }
  
  // Get icon for notification type
  static getIcon(type) {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    return icons[type] || 'ℹ️';
  }
  
  // Log error for debugging
  static logError(error, context = {}) {
    const errorEntry = {
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      context: context,
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    // Store in localStorage for debugging
    try {
      const logs = JSON.parse(localStorage.getItem('errorLogs') || '[]');
      logs.push(errorEntry);
      
      // Keep only last 50 errors
      if (logs.length > 50) {
        logs.splice(0, logs.length - 50);
      }
      
      localStorage.setItem('errorLogs', JSON.stringify(logs));
    } catch (e) {
      console.error('Failed to log error:', e);
    }
    
    // In production, send to error reporting service
    if (window.CONFIG?.features?.enableErrorReporting) {
      this.reportError(errorEntry);
    }
  }
  
  // Report error to external service
  static async reportError(errorEntry) {
    try {
      // This would integrate with services like Sentry, LogRocket, etc.
      console.log('Error reported:', errorEntry);
    } catch (e) {
      console.error('Failed to report error:', e);
    }
  }
  
  // Handle Firebase errors
  static handleFirebaseError(error) {
    const userMessage = this.getUserMessage(error);
    this.showError(userMessage);
    this.logError(error, { type: 'firebase' });
  }
  
  // Handle validation errors
  static handleValidationError(error) {
    this.showError(error.message);
    this.logError(error, { type: 'validation' });
  }
  
  // Handle network errors
  static handleNetworkError(error) {
    this.showError('Network error. Please check your connection and try again.');
    this.logError(error, { type: 'network' });
  }
  
  // Global error handler
  static setupGlobalErrorHandling() {
    window.addEventListener('error', (event) => {
      this.logError(event.error, { type: 'global', filename: event.filename, lineno: event.lineno });
    });
    
    window.addEventListener('unhandledrejection', (event) => {
      this.logError(new Error(event.reason), { type: 'unhandledPromise' });
    });
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ErrorHandler;
} else {
  window.ErrorHandler = ErrorHandler;
}
