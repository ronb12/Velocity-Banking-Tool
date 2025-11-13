/**
 * ErrorBoundary Unit Tests
 */
import { ErrorBoundary } from '../../src/scripts/core/ErrorBoundary.js';

describe('ErrorBoundary', () => {
  let errorBoundary;

  beforeEach(() => {
    errorBoundary = new ErrorBoundary();
    errorBoundary.errorCount = 0;
    errorBoundary.errorTimestamps = [];
  });

  test('should initialize error boundary', () => {
    expect(errorBoundary.errorListeners).toEqual([]);
    expect(errorBoundary.errorCount).toBe(0);
  });

  test('should handle errors', () => {
    const error = new Error('Test error');
    const context = { type: 'test' };

    errorBoundary.handleError(error, context);

    expect(errorBoundary.errorCount).toBe(1);
  });

  test('should rate limit errors', () => {
    errorBoundary.maxErrors = 3;
    errorBoundary.errorWindow = 1000;

    // Add errors within window
    for (let i = 0; i < 5; i++) {
      errorBoundary.handleError(new Error(`Error ${i}`));
    }

    // Should only count up to maxErrors
    expect(errorBoundary.errorCount).toBeLessThanOrEqual(3);
  });

  test('should get user-friendly error messages', () => {
    const networkError = { message: 'Network error occurred' };
    const message = errorBoundary.getUserFriendlyMessage(networkError);
    expect(message).toContain('Network error');
  });

  test('should wrap async functions', async () => {
    const asyncFn = async () => {
      throw new Error('Async error');
    };

    const wrapped = errorBoundary.wrapAsync(asyncFn, 'test');

    await expect(wrapped()).rejects.toThrow('Async error');
    expect(errorBoundary.errorCount).toBeGreaterThan(0);
  });

  test('should retry failed operations', async () => {
    let attempts = 0;
    const fn = async () => {
      attempts++;
      if (attempts < 3) {
        throw new Error('Retry me');
      }
      return 'success';
    };

    const result = await errorBoundary.retry(fn, 3, 10);
    expect(result).toBe('success');
    expect(attempts).toBe(3);
  });
});

