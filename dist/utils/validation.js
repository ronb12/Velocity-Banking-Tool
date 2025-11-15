// Input Validation Utilities
class ValidationUtils {
  // Financial input validation
  static validateFinancialInput(value, fieldName = 'amount', min = 0, max = 999999999) {
    if (value === null || value === undefined || value === '') {
      throw new Error(`${fieldName} is required`);
    }
    
    const num = parseFloat(value);
    if (isNaN(num)) {
      throw new Error(`${fieldName} must be a valid number`);
    }
    
    if (num < min) {
      throw new Error(`${fieldName} must be at least $${min.toLocaleString()}`);
    }
    
    if (num > max) {
      throw new Error(`${fieldName} cannot exceed $${max.toLocaleString()}`);
    }
    
    return Math.round(num * 100) / 100; // Round to 2 decimal places
  }
  
  // Email validation
  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Please enter a valid email address');
    }
    return email.toLowerCase().trim();
  }
  
  // Password validation
  static validatePassword(password, minLength = 8) {
    if (password.length < minLength) {
      throw new Error(`Password must be at least ${minLength} characters long`);
    }
    
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      throw new Error('Password must contain uppercase, lowercase, number, and special character');
    }
    
    return password;
  }
  
  // Credit score validation
  static validateCreditScore(score) {
    const num = parseInt(score);
    if (isNaN(num) || num < 300 || num > 850) {
      throw new Error('Credit score must be between 300 and 850');
    }
    return num;
  }
  
  // Interest rate validation
  static validateInterestRate(rate) {
    const num = parseFloat(rate);
    if (isNaN(num) || num < 0 || num > 100) {
      throw new Error('Interest rate must be between 0% and 100%');
    }
    return num;
  }
  
  // Date validation
  static validateDate(dateString, fieldName = 'date') {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new Error(`${fieldName} must be a valid date`);
    }
    
    const today = new Date();
    if (date > today) {
      throw new Error(`${fieldName} cannot be in the future`);
    }
    
    return date;
  }
  
  // Sanitize string input
  static sanitizeString(input, maxLength = 255) {
    if (typeof input !== 'string') {
      return '';
    }
    
    return input
      .trim()
      .substring(0, maxLength)
      .replace(/[<>]/g, ''); // Remove potential HTML tags
  }
  
  // Validate debt entry
  static validateDebtEntry(debt) {
    const validated = {};
    
    validated.name = this.sanitizeString(debt.name || '', 100);
    if (!validated.name) {
      throw new Error('Debt name is required');
    }
    
    validated.balance = this.validateFinancialInput(debt.balance, 'Balance');
    validated.interestRate = this.validateInterestRate(debt.interestRate || 0);
    validated.minimumPayment = this.validateFinancialInput(debt.minimumPayment, 'Minimum Payment');
    
    if (validated.minimumPayment > validated.balance) {
      throw new Error('Minimum payment cannot exceed balance');
    }
    
    return validated;
  }
  
  // Validate budget entry
  static validateBudgetEntry(entry) {
    const validated = {};
    
    validated.name = this.sanitizeString(entry.name || '', 100);
    if (!validated.name) {
      throw new Error('Category name is required');
    }
    
    validated.amount = this.validateFinancialInput(entry.amount, 'Amount');
    validated.type = ['income', 'expense'].includes(entry.type) ? entry.type : 'expense';
    
    return validated;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ValidationUtils;
} else {
  window.ValidationUtils = ValidationUtils;
}
