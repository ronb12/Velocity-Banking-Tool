/**
 * Centralized Logging Service
 * Replaces console.log with structured logging
 * 
 * @class Logger
 */
export class Logger {
  constructor() {
    this.logs = [];
    this.maxLogs = 100;
    this.levels = {
      DEBUG: 0,
      INFO: 1,
      WARN: 2,
      ERROR: 3
    };
    this.currentLevel = this.levels.INFO;
    this.enableConsole = process.env.NODE_ENV !== 'production';
  }

  /**
   * Log a debug message
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   */
  debug(message, data = {}) {
    this.log('DEBUG', message, data);
  }

  /**
   * Log an info message
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   */
  info(message, data = {}) {
    this.log('INFO', message, data);
  }

  /**
   * Log a warning message
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   */
  warn(message, data = {}) {
    this.log('WARN', message, data);
  }

  /**
   * Log an error message
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   */
  error(message, data = {}) {
    this.log('ERROR', message, data);
  }

  /**
   * Internal log method
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Object} data - Additional data
   */
  log(level, message, data = {}) {
    const logEntry = {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
    };

    // Store log
    this.logs.push(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console output (only in development)
    if (this.enableConsole && this.levels[level] >= this.currentLevel) {
      const consoleMethod = level === 'ERROR' ? 'error' :
                           level === 'WARN' ? 'warn' :
                           level === 'DEBUG' ? 'debug' : 'log';
      
      console[consoleMethod](`[${level}] ${message}`, data);
    }

    // Send to analytics if available
    if (typeof window !== 'undefined' && window.analytics) {
      try {
        window.analytics.track('log', {
          level,
          message: message.substring(0, 100) // Limit message length
        });
      } catch (e) {
        // Ignore analytics errors
      }
    }
  }

  /**
   * Get recent logs
   * @param {number} count - Number of logs to retrieve
   * @param {string} level - Filter by level
   * @returns {Array} Log entries
   */
  getLogs(count = 10, level = null) {
    let logs = [...this.logs].reverse();

    if (level) {
      logs = logs.filter(log => log.level === level);
    }

    return logs.slice(0, count);
  }

  /**
   * Clear logs
   */
  clearLogs() {
    this.logs = [];
  }

  /**
   * Set log level
   * @param {string} level - Log level (DEBUG, INFO, WARN, ERROR)
   */
  setLevel(level) {
    if (this.levels[level] !== undefined) {
      this.currentLevel = this.levels[level];
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Make globally available
window.Logger = Logger;
window.logger = logger;

// Replace console methods in production
if (process.env.NODE_ENV === 'production') {
  console.log = (...args) => logger.info(args.join(' '));
  console.debug = (...args) => logger.debug(args.join(' '));
  console.info = (...args) => logger.info(args.join(' '));
}

