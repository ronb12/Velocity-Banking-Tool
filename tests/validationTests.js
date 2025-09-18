// Validation Tests
class ValidationTests {
  constructor() {
    this.testRunner = window.TestRunner;
  }
  
  // Run all validation tests
  async runAll() {
    console.log('🧪 Running Validation Tests...');
    
    // Financial input validation tests
    this.testRunner.addTest('validateFinancialInput - valid input', () => {
      const result = ValidationUtils.validateFinancialInput('100.50', 'amount');
      this.testRunner.assertEqual(result, 100.50, 'Should return parsed number');
    });
    
    this.testRunner.addTest('validateFinancialInput - invalid input', () => {
      this.testRunner.assertThrows(() => {
        ValidationUtils.validateFinancialInput('invalid', 'amount');
      }, 'must be a valid number');
    });
    
    this.testRunner.addTest('validateFinancialInput - negative input', () => {
      this.testRunner.assertThrows(() => {
        ValidationUtils.validateFinancialInput('-100', 'amount');
      }, 'must be at least');
    });
    
    this.testRunner.addTest('validateFinancialInput - empty input', () => {
      this.testRunner.assertThrows(() => {
        ValidationUtils.validateFinancialInput('', 'amount');
      }, 'is required');
    });
    
    // Email validation tests
    this.testRunner.addTest('validateEmail - valid email', () => {
      const result = ValidationUtils.validateEmail('test@example.com');
      this.testRunner.assertEqual(result, 'test@example.com', 'Should return valid email');
    });
    
    this.testRunner.addTest('validateEmail - invalid email', () => {
      this.testRunner.assertThrows(() => {
        ValidationUtils.validateEmail('invalid-email');
      }, 'valid email address');
    });
    
    this.testRunner.addTest('validateEmail - case normalization', () => {
      const result = ValidationUtils.validateEmail('TEST@EXAMPLE.COM');
      this.testRunner.assertEqual(result, 'test@example.com', 'Should normalize case');
    });
    
    // Password validation tests
    this.testRunner.addTest('validatePassword - valid password', () => {
      const result = ValidationUtils.validatePassword('Password123!');
      this.testRunner.assertEqual(result, 'Password123!', 'Should return valid password');
    });
    
    this.testRunner.addTest('validatePassword - too short', () => {
      this.testRunner.assertThrows(() => {
        ValidationUtils.validatePassword('123');
      }, 'at least 8 characters');
    });
    
    this.testRunner.addTest('validatePassword - missing uppercase', () => {
      this.testRunner.assertThrows(() => {
        ValidationUtils.validatePassword('password123!');
      }, 'uppercase');
    });
    
    this.testRunner.addTest('validatePassword - missing lowercase', () => {
      this.testRunner.assertThrows(() => {
        ValidationUtils.validatePassword('PASSWORD123!');
      }, 'lowercase');
    });
    
    this.testRunner.addTest('validatePassword - missing number', () => {
      this.testRunner.assertThrows(() => {
        ValidationUtils.validatePassword('Password!');
      }, 'number');
    });
    
    this.testRunner.addTest('validatePassword - missing special character', () => {
      this.testRunner.assertThrows(() => {
        ValidationUtils.validatePassword('Password123');
      }, 'special character');
    });
    
    // Credit score validation tests
    this.testRunner.addTest('validateCreditScore - valid score', () => {
      const result = ValidationUtils.validateCreditScore('750');
      this.testRunner.assertEqual(result, 750, 'Should return parsed score');
    });
    
    this.testRunner.addTest('validateCreditScore - too low', () => {
      this.testRunner.assertThrows(() => {
        ValidationUtils.validateCreditScore('200');
      }, 'between 300 and 850');
    });
    
    this.testRunner.addTest('validateCreditScore - too high', () => {
      this.testRunner.assertThrows(() => {
        ValidationUtils.validateCreditScore('900');
      }, 'between 300 and 850');
    });
    
    // Interest rate validation tests
    this.testRunner.addTest('validateInterestRate - valid rate', () => {
      const result = ValidationUtils.validateInterestRate('5.5');
      this.testRunner.assertEqual(result, 5.5, 'Should return parsed rate');
    });
    
    this.testRunner.addTest('validateInterestRate - negative rate', () => {
      this.testRunner.assertThrows(() => {
        ValidationUtils.validateInterestRate('-5');
      }, 'between 0% and 100%');
    });
    
    this.testRunner.addTest('validateInterestRate - too high rate', () => {
      this.testRunner.assertThrows(() => {
        ValidationUtils.validateInterestRate('150');
      }, 'between 0% and 100%');
    });
    
    // Date validation tests
    this.testRunner.addTest('validateDate - valid date', () => {
      const result = ValidationUtils.validateDate('2024-01-15');
      this.testRunner.assertTrue(result instanceof Date, 'Should return Date object');
    });
    
    this.testRunner.addTest('validateDate - invalid date', () => {
      this.testRunner.assertThrows(() => {
        ValidationUtils.validateDate('invalid-date');
      }, 'valid date');
    });
    
    this.testRunner.addTest('validateDate - future date', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      this.testRunner.assertThrows(() => {
        ValidationUtils.validateDate(futureDate.toISOString());
      }, 'cannot be in the future');
    });
    
    // String sanitization tests
    this.testRunner.addTest('sanitizeString - normal string', () => {
      const result = ValidationUtils.sanitizeString('  Hello World  ');
      this.testRunner.assertEqual(result, 'Hello World', 'Should trim whitespace');
    });
    
    this.testRunner.addTest('sanitizeString - remove HTML tags', () => {
      const result = ValidationUtils.sanitizeString('Hello <script>alert("xss")</script> World');
      this.testRunner.assertNotContains(result, '<script>', 'Should remove HTML tags');
    });
    
    this.testRunner.addTest('sanitizeString - truncate long string', () => {
      const longString = 'a'.repeat(300);
      const result = ValidationUtils.sanitizeString(longString, 100);
      this.testRunner.assertEqual(result.length, 100, 'Should truncate to max length');
    });
    
    // Debt entry validation tests
    this.testRunner.addTest('validateDebtEntry - valid entry', () => {
      const debt = {
        name: 'Credit Card',
        balance: '5000',
        interestRate: '18.5',
        minimumPayment: '150'
      };
      const result = ValidationUtils.validateDebtEntry(debt);
      this.testRunner.assertEqual(result.name, 'Credit Card', 'Should validate debt name');
      this.testRunner.assertEqual(result.balance, 5000, 'Should validate balance');
      this.testRunner.assertEqual(result.interestRate, 18.5, 'Should validate interest rate');
      this.testRunner.assertEqual(result.minimumPayment, 150, 'Should validate minimum payment');
    });
    
    this.testRunner.addTest('validateDebtEntry - missing name', () => {
      this.testRunner.assertThrows(() => {
        ValidationUtils.validateDebtEntry({ balance: '5000' });
      }, 'Debt name is required');
    });
    
    this.testRunner.addTest('validateDebtEntry - minimum payment exceeds balance', () => {
      this.testRunner.assertThrows(() => {
        ValidationUtils.validateDebtEntry({
          name: 'Credit Card',
          balance: '100',
          minimumPayment: '200'
        });
      }, 'Minimum payment cannot exceed balance');
    });
    
    // Budget entry validation tests
    this.testRunner.addTest('validateBudgetEntry - valid entry', () => {
      const entry = {
        name: 'Groceries',
        amount: '500',
        type: 'expense'
      };
      const result = ValidationUtils.validateBudgetEntry(entry);
      this.testRunner.assertEqual(result.name, 'Groceries', 'Should validate name');
      this.testRunner.assertEqual(result.amount, 500, 'Should validate amount');
      this.testRunner.assertEqual(result.type, 'expense', 'Should validate type');
    });
    
    this.testRunner.addTest('validateBudgetEntry - default type', () => {
      const entry = {
        name: 'Income',
        amount: '3000'
      };
      const result = ValidationUtils.validateBudgetEntry(entry);
      this.testRunner.assertEqual(result.type, 'expense', 'Should default to expense type');
    });
    
    return await this.testRunner.runAll();
  }
}

// Create and export instance
window.ValidationTests = new ValidationTests();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ValidationTests;
}
