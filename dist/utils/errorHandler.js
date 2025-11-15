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
    if (!document.querySelector('#toast-styles')) {
      const style = document.createElement('style');
      style.id = 'toast-styles';
      style.textContent = `
        .toast-stack {
          position: fixed;
          top: 24px;
          right: 24px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          z-index: 11000;
          pointer-events: none;
        }

        .toast {
          width: min(360px, calc(100vw - 32px));
          background: rgba(15, 23, 42, 0.88);
          backdrop-filter: blur(16px);
          border-radius: 16px;
          border: 1px solid rgba(148, 163, 184, 0.25);
          padding: 18px 20px;
          color: #e2e8f0;
          box-shadow: 0 16px 40px rgba(15, 23, 42, 0.35);
          transform: translateY(-16px);
          opacity: 0;
          transition: transform 0.3s ease, opacity 0.3s ease;
          pointer-events: auto;
          position: relative;
          overflow: hidden;
        }

        .toast.visible {
          transform: translateY(0);
          opacity: 1;
        }

        .toast::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0));
          pointer-events: none;
        }

        .toast-icon {
          width: 36px;
          height: 36px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
        }

        .toast-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .toast-body strong {
          font-size: 0.95rem;
          letter-spacing: 0.02em;
        }

        .toast-body p {
          margin: 0;
          font-size: 0.85rem;
          color: #cbd5f5;
          line-height: 1.45;
        }

        .toast-close {
          background: rgba(148, 163, 184, 0.18);
          border: none;
          color: #cbd5f5;
          width: 28px;
          height: 28px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s ease;
        }

        .toast-close:hover {
          background: rgba(148, 163, 184, 0.32);
        }

        .toast.toast-success .toast-icon { background: rgba(34, 197, 94, 0.18); color: #34d399; }
        .toast.toast-error .toast-icon { background: rgba(248, 113, 113, 0.18); color: #f87171; }
        .toast.toast-warning .toast-icon { background: rgba(250, 204, 21, 0.18); color: #facc15; }
        .toast.toast-info .toast-icon { background: rgba(96, 165, 250, 0.18); color: #60a5fa; }

        .toast-progress {
          position: absolute;
          left: 0;
          bottom: 0;
          height: 3px;
          background: currentColor;
          width: 0%;
          opacity: 0.85;
        }

        .toast.toast-success { color: #d1fae5; }
        .toast.toast-error { color: #fee2e2; }
        .toast.toast-warning { color: #fef9c3; }
        .toast.toast-info { color: #dbeafe; }

        @keyframes toastProgress {
          from { width: 0%; }
          to { width: 100%; }
        }

        @media (max-width: 480px) {
          .toast-stack {
            left: 50%;
            right: auto;
            transform: translateX(-50%);
            top: 16px;
          }

          .toast {
            width: min(92vw, 360px);
          }
        }
      `;
      document.head.appendChild(style);
    }

    let stack = document.querySelector('.toast-stack');
    if (!stack) {
      stack = document.createElement('div');
      stack.className = 'toast-stack';
      document.body.appendChild(stack);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-content" style="display:flex;gap:14px;align-items:flex-start;position:relative;z-index:1;">
        <div class="toast-icon">${this.getIcon(type)}</div>
        <div class="toast-body">
          <strong>${this.getTitle(type)}</strong>
          <p>${message}</p>
        </div>
        <button class="toast-close" aria-label="Dismiss notification">×</button>
      </div>
      <div class="toast-progress"></div>
    `;

    stack.prepend(toast);

    const progress = toast.querySelector('.toast-progress');
    let remaining = duration;
    let start = performance.now();

    requestAnimationFrame(() => {
      toast.classList.add('visible');
      if (progress) {
        progress.style.animation = `toastProgress ${duration}ms linear forwards`;
      }
    });

    const finalizeRemoval = () => {
      toast.remove();
      if (!stack.children.length) stack.remove();
    };

    const removeToast = () => {
      clearTimeout(hideTimer);
      toast.classList.remove('visible');
      setTimeout(finalizeRemoval, 220);
    };

    let hideTimer = setTimeout(removeToast, duration);

    toast.querySelector('.toast-close').addEventListener('click', removeToast);

    toast.addEventListener('mouseenter', () => {
      clearTimeout(hideTimer);
      const elapsed = performance.now() - start;
      remaining = Math.max(0, remaining - elapsed);
      if (progress) progress.style.animationPlayState = 'paused';
    });

    toast.addEventListener('mouseleave', () => {
      start = performance.now();
      if (progress) {
        progress.style.animation = 'none';
        // Force reflow to restart animation
        void progress.offsetWidth;
        progress.style.animation = `toastProgress ${remaining}ms linear forwards`;
        progress.style.animationPlayState = 'running';
      }
      hideTimer = setTimeout(removeToast, remaining);
    });
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
  
  static getTitle(type) {
    const titles = {
      success: 'Success',
      error: 'Something went wrong',
      warning: 'Heads up',
      info: 'FYI'
    };
    return titles[type] || 'Notice';
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
      console.log('Error reported:', JSON.stringify(errorEntry, null, 2));
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
