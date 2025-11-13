/**
 * InputValidator Unit Tests
 */
import { InputValidator } from '../../src/scripts/core/InputValidator.js';

describe('InputValidator', () => {
  let validator;

  beforeEach(() => {
    validator = new InputValidator();
  });

  test('should validate email addresses', () => {
    expect(validator.validateEmail('test@example.com')).toBe(true);
    expect(validator.validateEmail('invalid-email')).toBe(false);
    expect(validator.validateEmail('')).toBe(false);
  });

  test('should validate strings', () => {
    const result = validator.validateString('test', {
      minLength: 3,
      maxLength: 10
    });
    expect(result.valid).toBe(true);
    expect(result.sanitized).toBe('test');
  });

  test('should require fields', () => {
    const result = validator.validateString('', { required: true });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('required');
  });

  test('should validate numbers', () => {
    const result = validator.validateNumber('123', {
      min: 0,
      max: 1000
    });
    expect(result.valid).toBe(true);
    expect(result.value).toBe(123);
  });

  test('should validate currency', () => {
    const result = validator.validateCurrency('$1,234.56', {
      min: 0,
      max: 10000
    });
    expect(result.valid).toBe(true);
    expect(result.value).toBe(1234.56);
  });

  test('should sanitize HTML', () => {
    const html = '<script>alert("xss")</script>Hello';
    const sanitized = validator.sanitizeHTML(html);
    expect(sanitized).not.toContain('<script>');
    expect(sanitized).toContain('Hello');
  });

  test('should validate forms', () => {
    const formData = {
      email: 'test@example.com',
      amount: '100.50',
      name: 'Test User'
    };

    const schema = {
      email: { type: 'email', required: true },
      amount: { type: 'currency', min: 0, required: true },
      name: { type: 'string', minLength: 3, required: true }
    };

    const result = validator.validateForm(formData, schema);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual({});
  });
});

