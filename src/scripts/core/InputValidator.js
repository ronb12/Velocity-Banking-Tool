/**
 * Input Validation and Sanitization Service
 * Provides comprehensive input validation and sanitization
 * 
 * @class InputValidator
 */
export class InputValidator {
  constructor() {
    this.patterns = {
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      phone: /^[\d\s\-\+\(\)]+$/,
      url: /^https?:\/\/.+/,
      numeric: /^\d+(\.\d+)?$/,
      alphanumeric: /^[a-zA-Z0-9\s]+$/,
      currency: /^\$?\d+(\.\d{2})?$/
    };
  }

  /**
   * Validate email address
   * @param {string} email - Email to validate
   * @returns {boolean} True if valid
   */
  validateEmail(email) {
    if (!email || typeof email !== 'string') {
      return false;
    }
    return this.patterns.email.test(email.trim());
  }

  /**
   * Validate and sanitize string input
   * @param {string} input - Input to validate
   * @param {Object} options - Validation options
   * @returns {Object} {valid: boolean, sanitized: string, error: string}
   */
  validateString(input, options = {}) {
    const {
      minLength = 0,
      maxLength = Infinity,
      required = false,
      pattern = null,
      trim = true
    } = options;

    // Check required
    if (required && (!input || input.trim().length === 0)) {
      return {
        valid: false,
        sanitized: '',
        error: 'This field is required'
      };
    }

    // Handle null/undefined
    if (!input) {
      return {
        valid: !required,
        sanitized: '',
        error: required ? 'This field is required' : null
      };
    }

    // Convert to string
    const str = String(input);
    let sanitized = trim ? str.trim() : str;

    // Check length
    if (sanitized.length < minLength) {
      return {
        valid: false,
        sanitized,
        error: `Must be at least ${minLength} characters`
      };
    }

    if (sanitized.length > maxLength) {
      return {
        valid: false,
        sanitized,
        error: `Must be no more than ${maxLength} characters`
      };
    }

    // Check pattern
    if (pattern && !pattern.test(sanitized)) {
      return {
        valid: false,
        sanitized,
        error: 'Invalid format'
      };
    }

    // Sanitize HTML
    sanitized = this.sanitizeHTML(sanitized);

    return {
      valid: true,
      sanitized,
      error: null
    };
  }

  /**
   * Validate number
   * @param {*} input - Input to validate
   * @param {Object} options - Validation options
   * @returns {Object} {valid: boolean, value: number, error: string}
   */
  validateNumber(input, options = {}) {
    const {
      min = -Infinity,
      max = Infinity,
      required = false,
      integer = false
    } = options;

    // Check required
    if (required && (input === null || input === undefined || input === '')) {
      return {
        valid: false,
        value: null,
        error: 'This field is required'
      };
    }

    // Handle null/undefined
    if (input === null || input === undefined || input === '') {
      return {
        valid: !required,
        value: null,
        error: required ? 'This field is required' : null
      };
    }

    // Convert to number
    const num = Number(input);

    // Check if valid number
    if (isNaN(num)) {
      return {
        valid: false,
        value: null,
        error: 'Must be a valid number'
      };
    }

    // Check integer
    if (integer && !Number.isInteger(num)) {
      return {
        valid: false,
        value: num,
        error: 'Must be an integer'
      };
    }

    // Check range
    if (num < min) {
      return {
        valid: false,
        value: num,
        error: `Must be at least ${min}`
      };
    }

    if (num > max) {
      return {
        valid: false,
        value: num,
        error: `Must be no more than ${max}`
      };
    }

    return {
      valid: true,
      value: num,
      error: null
    };
  }

  /**
   * Validate currency amount
   * @param {*} input - Input to validate
   * @param {Object} options - Validation options
   * @returns {Object} {valid: boolean, value: number, error: string}
   */
  validateCurrency(input, options = {}) {
    const {
      min = 0,
      max = Infinity,
      required = false
    } = options;

    // Remove currency symbols and commas
    const cleaned = String(input).replace(/[$,\s]/g, '');

    const result = this.validateNumber(cleaned, {
      min,
      max,
      required
    });

    if (!result.valid) {
      return result;
    }

    // Round to 2 decimal places
    const value = Math.round(result.value * 100) / 100;

    return {
      valid: true,
      value,
      error: null
    };
  }

  /**
   * Sanitize HTML to prevent XSS
   * @param {string} html - HTML to sanitize
   * @returns {string} Sanitized HTML
   */
  sanitizeHTML(html) {
    if (!html || typeof html !== 'string') {
      return '';
    }

    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
  }

  /**
   * Sanitize input for database storage
   * @param {*} input - Input to sanitize
   * @returns {*} Sanitized input
   */
  sanitizeForDB(input) {
    if (input === null || input === undefined) {
      return null;
    }

    if (typeof input === 'string') {
      return this.sanitizeHTML(input.trim());
    }

    if (typeof input === 'number') {
      return isNaN(input) ? null : input;
    }

    if (Array.isArray(input)) {
      return input.map(item => this.sanitizeForDB(item));
    }

    if (typeof input === 'object') {
      const sanitized = {};
      for (const [key, value] of Object.entries(input)) {
        // Sanitize key
        const sanitizedKey = this.sanitizeHTML(String(key));
        sanitized[sanitizedKey] = this.sanitizeForDB(value);
      }
      return sanitized;
    }

    return input;
  }

  /**
   * Validate form data
   * @param {Object} formData - Form data to validate
   * @param {Object} schema - Validation schema
   * @returns {Object} {valid: boolean, errors: Object, sanitized: Object}
   */
  validateForm(formData, schema) {
    const errors = {};
    const sanitized = {};

    for (const [field, rules] of Object.entries(schema)) {
      const value = formData[field];
      let result;

      if (rules.type === 'string') {
        result = this.validateString(value, rules);
      } else if (rules.type === 'number') {
        result = this.validateNumber(value, rules);
      } else if (rules.type === 'currency') {
        result = this.validateCurrency(value, rules);
      } else if (rules.type === 'email') {
        const valid = this.validateEmail(value);
        result = {
          valid,
          sanitized: valid ? value.trim() : '',
          error: valid ? null : 'Invalid email address'
        };
      } else {
        result = { valid: true, sanitized: value, error: null };
      }

      if (!result.valid) {
        errors[field] = result.error;
      }

      sanitized[field] = result.sanitized !== undefined ? result.sanitized : result.value;
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
      sanitized
    };
  }
}

// Export singleton instance
export const inputValidator = new InputValidator();

// Make globally available
window.InputValidator = InputValidator;
window.inputValidator = inputValidator;

