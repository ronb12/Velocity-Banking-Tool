/**
 * Security Service
 * Provides security utilities and validation
 * 
 * @class SecurityService
 */
export class SecurityService {
  constructor() {
    this.csrfToken = this.generateCSRFToken();
    this.rateLimits = new Map();
  }

  /**
   * Generate CSRF token
   * @returns {string} CSRF token
   */
  generateCSRFToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Validate CSRF token
   * @param {string} token - Token to validate
   * @returns {boolean} True if valid
   */
  validateCSRFToken(token) {
    return token === this.csrfToken;
  }

  /**
   * Sanitize user input for display
   * @param {string} input - Input to sanitize
   * @returns {string} Sanitized input
   */
  sanitizeForDisplay(input) {
    if (!input || typeof input !== 'string') {
      return '';
    }

    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
  }

  /**
   * Check if URL is safe
   * @param {string} url - URL to check
   * @returns {boolean} True if safe
   */
  isSafeURL(url) {
    if (!url || typeof url !== 'string') {
      return false;
    }

    try {
      const parsed = new URL(url, window.location.origin);
      // Only allow http, https, and relative URLs
      return ['http:', 'https:', ''].includes(parsed.protocol);
    } catch {
      return false;
    }
  }

  /**
   * Validate file upload
   * @param {File} file - File to validate
   * @param {Object} options - Validation options
   * @returns {Object} {valid: boolean, error: string}
   */
  validateFileUpload(file, options = {}) {
    const {
      maxSize = 5 * 1024 * 1024, // 5MB default
      allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
      allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf']
    } = options;

    if (!file) {
      return { valid: false, error: 'No file provided' };
    }

    // Check file size
    if (file.size > maxSize) {
      return { 
        valid: false, 
        error: `File size exceeds maximum of ${maxSize / 1024 / 1024}MB` 
      };
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'File type not allowed' };
    }

    // Check file extension
    const extension = '.' + file.name.split('.').pop().toLowerCase();
    if (!allowedExtensions.includes(extension)) {
      return { valid: false, error: 'File extension not allowed' };
    }

    return { valid: true, error: null };
  }

  /**
   * Hash sensitive data (simple hash, not for passwords)
   * @param {string} data - Data to hash
   * @returns {Promise<string>} Hashed data
   */
  async hashData(data) {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Check if request should be rate limited
   * @param {string} key - Rate limit key
   * @param {number} maxRequests - Maximum requests
   * @param {number} windowMs - Time window in milliseconds
   * @returns {boolean} True if rate limited
   */
  checkRateLimit(key, maxRequests = 10, windowMs = 60000) {
    const now = Date.now();
    const record = this.rateLimits.get(key);

    if (!record || now - record.start > windowMs) {
      this.rateLimits.set(key, { start: now, count: 1 });
      return false;
    }

    if (record.count >= maxRequests) {
      return true;
    }

    record.count++;
    return false;
  }

  /**
   * Clear rate limit for a key
   * @param {string} key - Key to clear
   */
  clearRateLimit(key) {
    this.rateLimits.delete(key);
  }

  /**
   * Clean up old rate limit records
   */
  cleanupRateLimits() {
    const now = Date.now();
    for (const [key, record] of this.rateLimits.entries()) {
      if (now - record.start > 300000) { // 5 minutes
        this.rateLimits.delete(key);
      }
    }
  }
}

// Export singleton instance
export const securityService = new SecurityService();

// Cleanup rate limits every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    securityService.cleanupRateLimits();
  }, 300000);
}

// Make globally available
window.SecurityService = SecurityService;
window.securityService = securityService;

