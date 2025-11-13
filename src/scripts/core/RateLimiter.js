/**
 * Rate Limiter for API Calls
 * Prevents abuse and excessive API usage
 * 
 * @class RateLimiter
 */
export class RateLimiter {
  constructor() {
    this.requests = new Map();
    this.defaultLimit = {
      window: 60000, // 1 minute
      max: 60 // 60 requests per minute
    };
  }

  /**
   * Check if request is allowed
   * @param {string} key - Unique key for the rate limit (e.g., user ID, IP, endpoint)
   * @param {Object} options - Rate limit options
   * @returns {Object} {allowed: boolean, remaining: number, resetTime: number}
   */
  check(key, options = {}) {
    const limit = {
      window: options.window || this.defaultLimit.window,
      max: options.max || this.defaultLimit.max
    };

    const now = Date.now();
    let record = this.requests.get(key);

    // Clean up old records
    if (record && now - record.windowStart > limit.window) {
      record = null;
    }

    // Create new record if needed
    if (!record) {
      record = {
        count: 0,
        windowStart: now
      };
      this.requests.set(key, record);
    }

    // Check limit
    const remaining = Math.max(0, limit.max - record.count);
    const allowed = record.count < limit.max;

    if (allowed) {
      record.count++;
    }

    const resetTime = record.windowStart + limit.window;

    return {
      allowed,
      remaining,
      resetTime,
      limit: limit.max
    };
  }

  /**
   * Reset rate limit for a key
   * @param {string} key - Key to reset
   */
  reset(key) {
    this.requests.delete(key);
  }

  /**
   * Clear all rate limits
   */
  clear() {
    this.requests.clear();
  }

  /**
   * Clean up old records
   */
  cleanup() {
    const now = Date.now();
    for (const [key, record] of this.requests.entries()) {
      // Remove records older than 1 hour
      if (now - record.windowStart > 3600000) {
        this.requests.delete(key);
      }
    }
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter();

// Cleanup every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    rateLimiter.cleanup();
  }, 300000);
}

// Make globally available
window.RateLimiter = RateLimiter;
window.rateLimiter = rateLimiter;

