// Performance Tests
class PerformanceTests {
  constructor() {
    this.testRunner = window.TestRunner;
  }
  
  // Run all performance tests
  async runAll() {
    console.log('🧪 Running Performance Tests...');
    
    // Debounce tests
    this.testRunner.addTest('debounce - should delay execution', async () => {
      let callCount = 0;
      const debouncedFn = PerformanceUtils.debounce(() => {
        callCount++;
      }, 100);
      
      debouncedFn();
      debouncedFn();
      debouncedFn();
      
      // Should not have been called yet
      this.testRunner.assertEqual(callCount, 0, 'Should not call immediately');
      
      // Wait for debounce delay
      await new Promise(resolve => setTimeout(resolve, 150));
      this.testRunner.assertEqual(callCount, 1, 'Should call once after delay');
    });
    
    // Throttle tests
    this.testRunner.addTest('throttle - should limit execution rate', async () => {
      let callCount = 0;
      const throttledFn = PerformanceUtils.throttle(() => {
        callCount++;
      }, 100);
      
      // Call multiple times rapidly
      throttledFn();
      throttledFn();
      throttledFn();
      
      // Should only call once immediately
      this.testRunner.assertEqual(callCount, 1, 'Should call once immediately');
      
      // Wait and call again
      await new Promise(resolve => setTimeout(resolve, 150));
      throttledFn();
      this.testRunner.assertEqual(callCount, 2, 'Should call again after throttle period');
    });
    
    // Memoization tests
    this.testRunner.addTest('memoize - should cache results', () => {
      let callCount = 0;
      const expensiveFn = (x) => {
        callCount++;
        return x * 2;
      };
      
      const memoizedFn = PerformanceUtils.memoize(expensiveFn);
      
      // First call
      const result1 = memoizedFn(5);
      this.testRunner.assertEqual(result1, 10, 'Should return correct result');
      this.testRunner.assertEqual(callCount, 1, 'Should call function once');
      
      // Second call with same input
      const result2 = memoizedFn(5);
      this.testRunner.assertEqual(result2, 10, 'Should return cached result');
      this.testRunner.assertEqual(callCount, 1, 'Should not call function again');
      
      // Call with different input
      const result3 = memoizedFn(10);
      this.testRunner.assertEqual(result3, 20, 'Should return correct result for new input');
      this.testRunner.assertEqual(callCount, 2, 'Should call function for new input');
    });
    
    // DOM query optimization tests
    this.testRunner.addTest('querySelector - should cache results', () => {
      // Create test elements
      const testDiv = document.createElement('div');
      testDiv.id = 'test-element';
      testDiv.className = 'test-class';
      document.body.appendChild(testDiv);
      
      // First query
      const element1 = PerformanceUtils.querySelector('#test-element');
      this.testRunner.assertTrue(element1 !== null, 'Should find element');
      
      // Second query (should use cache)
      const element2 = PerformanceUtils.querySelector('#test-element');
      this.testRunner.assertEqual(element1, element2, 'Should return cached element');
      
      // Clean up
      document.body.removeChild(testDiv);
    });
    
    // Memory usage tests
    this.testRunner.addTest('getMemoryUsage - should return memory info', () => {
      const memoryInfo = PerformanceUtils.getMemoryUsage();
      
      if (memoryInfo) {
        this.testRunner.assertTrue(typeof memoryInfo.used === 'number', 'Should return used memory');
        this.testRunner.assertTrue(typeof memoryInfo.total === 'number', 'Should return total memory');
        this.testRunner.assertTrue(typeof memoryInfo.limit === 'number', 'Should return memory limit');
        this.testRunner.assertTrue(memoryInfo.used <= memoryInfo.total, 'Used should be <= total');
        this.testRunner.assertTrue(memoryInfo.total <= memoryInfo.limit, 'Total should be <= limit');
      } else {
        console.log('Memory API not available in this environment');
      }
    });
    
    // Performance measurement tests
    this.testRunner.addTest('measurePerformance - should measure execution time', () => {
      const testFn = () => {
        // Simulate some work
        let sum = 0;
        for (let i = 0; i < 1000; i++) {
          sum += i;
        }
        return sum;
      };
      
      const result = PerformanceUtils.measurePerformance('testFn', testFn);
      this.testRunner.assertEqual(result, 499500, 'Should return correct result');
    });
    
    // Batch DOM updates tests
    this.testRunner.addTest('batchDOMUpdates - should batch updates', async () => {
      const testDiv = document.createElement('div');
      testDiv.id = 'batch-test';
      document.body.appendChild(testDiv);
      
      let updateCount = 0;
      const updates = [
        () => { testDiv.textContent = 'Update 1'; updateCount++; },
        () => { testDiv.textContent = 'Update 2'; updateCount++; },
        () => { testDiv.textContent = 'Update 3'; updateCount++; }
      ];
      
      PerformanceUtils.batchDOMUpdates(updates);
      
      // Updates should be batched in next frame
      this.testRunner.assertEqual(updateCount, 0, 'Should not update immediately');
      
      // Wait for next frame
      await new Promise(resolve => requestAnimationFrame(resolve));
      this.testRunner.assertEqual(updateCount, 3, 'Should update in batch');
      this.testRunner.assertEqual(testDiv.textContent, 'Update 3', 'Should have final update');
      
      // Clean up
      document.body.removeChild(testDiv);
    });
    
    // Scroll optimization tests
    this.testRunner.addTest('optimizeScroll - should throttle scroll events', async () => {
      let scrollCount = 0;
      const cleanup = PerformanceUtils.optimizeScroll(() => {
        scrollCount++;
      }, { throttle: 100 });
      
      // Simulate scroll events
      for (let i = 0; i < 10; i++) {
        window.dispatchEvent(new Event('scroll'));
      }
      
      // Should be throttled
      this.testRunner.assertTrue(scrollCount <= 2, 'Should throttle scroll events');
      
      // Wait for throttle period
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Trigger one more scroll
      window.dispatchEvent(new Event('scroll'));
      
      // Clean up
      cleanup();
    });
    
    // Resize optimization tests
    this.testRunner.addTest('optimizeResize - should throttle resize events', async () => {
      let resizeCount = 0;
      const cleanup = PerformanceUtils.optimizeResize(() => {
        resizeCount++;
      }, { throttle: 100 });
      
      // Simulate resize events
      for (let i = 0; i < 10; i++) {
        window.dispatchEvent(new Event('resize'));
      }
      
      // Should be throttled
      this.testRunner.assertTrue(resizeCount <= 2, 'Should throttle resize events');
      
      // Clean up
      cleanup();
    });
    
    // Cache cleanup tests
    this.testRunner.addTest('cleanup - should clear all caches', () => {
      // Add some data to caches
      PerformanceUtils.cache.set('test1', 'value1');
      PerformanceUtils.debounceTimers.set('test2', setTimeout(() => {}, 1000));
      
      // Verify data exists
      this.testRunner.assertTrue(PerformanceUtils.cache.has('test1'), 'Should have cached data');
      this.testRunner.assertTrue(PerformanceUtils.debounceTimers.has('test2'), 'Should have timer');
      
      // Clean up
      PerformanceUtils.cleanup();
      
      // Verify caches are cleared
      this.testRunner.assertEqual(PerformanceUtils.cache.size, 0, 'Should clear cache');
      this.testRunner.assertEqual(PerformanceUtils.debounceTimers.size, 0, 'Should clear timers');
    });
    
    return await this.testRunner.runAll();
  }
}

// Create and export instance
window.PerformanceTests = new PerformanceTests();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PerformanceTests;
}
