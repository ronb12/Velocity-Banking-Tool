/**
 * Notification System Component
 * Handles toast notifications and user feedback
 */

export class NotificationSystem {
  constructor() {
    this.notifications = [];
    this.container = null;
    this.maxNotifications = 5;
    this.defaultDuration = 3000;
  }

  /**
   * Initialize notification system
   */
  init() {
    // Create notification container if it doesn't exist
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'notificationContainer';
      this.container.className = 'notification-container';
      document.body.appendChild(this.container);
      
      // Add styles if not already present
      if (!document.getElementById('notificationSystemStyles')) {
        const style = document.createElement('style');
        style.id = 'notificationSystemStyles';
        style.textContent = `
          .notification-container {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 12px;
            max-width: 400px;
            pointer-events: none;
          }
          .notification {
            background: white;
            border-radius: 8px;
            padding: 16px 20px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06);
            display: flex;
            align-items: center;
            gap: 12px;
            pointer-events: auto;
            animation: slideIn 0.3s ease-out;
            border-left: 4px solid #2563eb;
          }
          .notification.success {
            border-left-color: #22c55e;
          }
          .notification.error {
            border-left-color: #ef4444;
          }
          .notification.warning {
            border-left-color: #f59e0b;
          }
          .notification.info {
            border-left-color: #3b82f6;
          }
          .notification-icon {
            font-size: 1.5rem;
            flex-shrink: 0;
          }
          .notification-content {
            flex: 1;
          }
          .notification-message {
            margin: 0;
            font-size: 0.875rem;
            color: #1f2937;
            font-weight: 500;
          }
          .notification-close {
            background: none;
            border: none;
            font-size: 1.25rem;
            cursor: pointer;
            color: #6b7280;
            padding: 0;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }
          .notification-close:hover {
            color: #1f2937;
          }
          @keyframes slideIn {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
          @keyframes slideOut {
            from {
              transform: translateX(0);
              opacity: 1;
            }
            to {
              transform: translateX(100%);
              opacity: 0;
            }
          }
          .notification.removing {
            animation: slideOut 0.3s ease-in forwards;
          }
        `;
        document.head.appendChild(style);
      }
    }
  }

  /**
   * Show a notification
   * @param {string} message - Notification message
   * @param {string} type - Notification type ('success', 'error', 'warning', 'info')
   * @param {number} duration - Duration in milliseconds (0 = permanent)
   */
  show(message, type = 'info', duration = this.defaultDuration) {
    if (!this.container) {
      this.init();
    }
    
    // Limit number of notifications
    if (this.notifications.length >= this.maxNotifications) {
      const oldest = this.notifications.shift();
      this.remove(oldest.id);
    }
    
    // Create notification element
    const notification = document.createElement('div');
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    notification.id = id;
    notification.className = `notification ${type}`;
    
    // Get icon based on type
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️',
    };
    
    notification.innerHTML = `
      <span class="notification-icon">${icons[type] || icons.info}</span>
      <div class="notification-content">
        <p class="notification-message">${this.escapeHtml(message)}</p>
      </div>
      <button class="notification-close" onclick="window.notificationSystem.remove('${id}')">&times;</button>
    `;
    
    this.container.appendChild(notification);
    this.notifications.push({ id, element: notification, duration });
    
    // Auto-remove after duration (if not permanent)
    if (duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, duration);
    }
    
    return id;
  }

  /**
   * Remove a notification
   * @param {string} id - Notification ID
   */
  remove(id) {
    const notification = this.notifications.find(n => n.id === id);
    if (!notification) {
      return;
    }
    
    // Add removing class for animation
    notification.element.classList.add('removing');
    
    // Remove from DOM after animation
    setTimeout(() => {
      if (notification.element.parentNode) {
        notification.element.parentNode.removeChild(notification.element);
      }
      this.notifications = this.notifications.filter(n => n.id !== id);
    }, 300);
  }

  /**
   * Remove all notifications
   */
  clear() {
    this.notifications.forEach(notification => {
      this.remove(notification.id);
    });
  }

  /**
   * Escape HTML to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Show success notification
   * @param {string} message - Success message
   * @param {number} duration - Duration in milliseconds
   */
  success(message, duration = this.defaultDuration) {
    return this.show(message, 'success', duration);
  }

  /**
   * Show error notification
   * @param {string} message - Error message
   * @param {number} duration - Duration in milliseconds
   */
  error(message, duration = this.defaultDuration) {
    return this.show(message, 'error', duration);
  }

  /**
   * Show warning notification
   * @param {string} message - Warning message
   * @param {number} duration - Duration in milliseconds
   */
  warning(message, duration = this.defaultDuration) {
    return this.show(message, 'warning', duration);
  }

  /**
   * Show info notification
   * @param {string} message - Info message
   * @param {number} duration - Duration in milliseconds
   */
  info(message, duration = this.defaultDuration) {
    return this.show(message, 'info', duration);
  }
}

// Export singleton instance
export const notificationSystem = new NotificationSystem();

// Make globally available
window.NotificationSystem = NotificationSystem;
window.notificationSystem = notificationSystem;
window.showNotification = (message, type, duration) => notificationSystem.show(message, type, duration);

// Initialize on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => notificationSystem.init());
} else {
  notificationSystem.init();
}

