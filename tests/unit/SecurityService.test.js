/**
 * SecurityService Unit Tests
 */
import { SecurityService } from '../../src/scripts/core/SecurityService.js';

describe('SecurityService', () => {
  let securityService;

  beforeEach(() => {
    securityService = new SecurityService();
  });

  test('should generate CSRF token', () => {
    const token = securityService.generateCSRFToken();
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
  });

  test('should validate CSRF token', () => {
    const token = securityService.generateCSRFToken();
    expect(securityService.validateCSRFToken(token)).toBe(true);
    expect(securityService.validateCSRFToken('invalid')).toBe(false);
  });

  test('should sanitize HTML for display', () => {
    const input = '<script>alert("xss")</script>Hello';
    const sanitized = securityService.sanitizeForDisplay(input);
    expect(sanitized).not.toContain('<script>');
    expect(sanitized).toContain('Hello');
  });

  test('should validate safe URLs', () => {
    expect(securityService.isSafeURL('https://example.com')).toBe(true);
    expect(securityService.isSafeURL('http://example.com')).toBe(true);
    expect(securityService.isSafeURL('/relative/path')).toBe(true);
    expect(securityService.isSafeURL('javascript:alert(1)')).toBe(false);
  });

  test('should validate file uploads', () => {
    const validFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const result = securityService.validateFileUpload(validFile);
    expect(result.valid).toBe(true);
  });

  test('should reject files that are too large', () => {
    const largeFile = new File(['x'.repeat(10 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
    const result = securityService.validateFileUpload(largeFile, { maxSize: 5 * 1024 * 1024 });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('exceeds maximum');
  });

  test('should check rate limits', () => {
    const key = 'test-key';
    expect(securityService.checkRateLimit(key, 3, 1000)).toBe(false);
    expect(securityService.checkRateLimit(key, 3, 1000)).toBe(false);
    expect(securityService.checkRateLimit(key, 3, 1000)).toBe(false);
    expect(securityService.checkRateLimit(key, 3, 1000)).toBe(true); // Exceeded
  });
});

