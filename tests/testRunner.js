// Test Runner and Testing Utilities
class TestRunner {
  constructor() {
    this.tests = [];
    this.results = [];
    this.isRunning = false;
  }
  
  // Add test to suite
  addTest(name, testFn) {
    this.tests.push({ name, testFn });
  }
  
  // Run all tests
  async runAll() {
    this.isRunning = true;
    this.results = [];
    
    console.log('🧪 Starting test suite...');
    console.log('='.repeat(50));
    
    for (const test of this.tests) {
      try {
        console.log(`Running: ${test.name}`);
        await test.testFn();
        this.results.push({ name: test.name, status: 'PASS', error: null });
        console.log(`✅ ${test.name} - PASSED`);
      } catch (error) {
        this.results.push({ name: test.name, status: 'FAIL', error: error.message });
        console.log(`❌ ${test.name} - FAILED: ${error.message}`);
      }
    }
    
    this.isRunning = false;
    this.printSummary();
    return this.results;
  }
  
  // Print test summary
  printSummary() {
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const total = this.results.length;
    
    console.log('='.repeat(50));
    console.log(`📊 Test Summary: ${passed}/${total} passed, ${failed} failed`);
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results.filter(r => r.status === 'FAIL').forEach(test => {
        console.log(`  - ${test.name}: ${test.error}`);
      });
    }
    
    console.log('='.repeat(50));
  }
  
  // Assertion utilities
  assert(condition, message) {
    if (!condition) {
      throw new Error(message || 'Assertion failed');
    }
  }
  
  assertEqual(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(message || `Expected ${expected}, got ${actual}`);
    }
  }
  
  assertNotEqual(actual, expected, message) {
    if (actual === expected) {
      throw new Error(message || `Expected not ${expected}, got ${actual}`);
    }
  }
  
  assertTrue(actual, message) {
    if (actual !== true) {
      throw new Error(message || `Expected true, got ${actual}`);
    }
  }
  
  assertFalse(actual, message) {
    if (actual !== false) {
      throw new Error(message || `Expected false, got ${actual}`);
    }
  }
  
  assertThrows(fn, expectedError, message) {
    try {
      fn();
      throw new Error(message || 'Expected function to throw');
    } catch (error) {
      if (expectedError && !error.message.includes(expectedError)) {
        throw new Error(message || `Expected error containing "${expectedError}", got "${error.message}"`);
      }
    }
  }
  
  assertContains(container, item, message) {
    if (!container.includes(item)) {
      throw new Error(message || `Expected container to contain "${item}"`);
    }
  }
  
  assertNotContains(container, item, message) {
    if (container.includes(item)) {
      throw new Error(message || `Expected container not to contain "${item}"`);
    }
  }
}

// Create global test runner
window.TestRunner = new TestRunner();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TestRunner;
}
