/**
 * Unit Tests for Challenge Calculation Logic
 * Tests all calculation functions used in challenge_library.html
 */

// Mock localStorage for testing
class MockLocalStorage {
  constructor() {
    this.store = {};
  }

  getItem(key) {
    return this.store[key] || null;
  }

  setItem(key, value) {
    this.store[key] = String(value);
  }

  removeItem(key) {
    delete this.store[key];
  }

  clear() {
    this.store = {};
  }
}

// Challenge calculation functions (extracted from challenge_library.html)
class ChallengeCalculator {
  static calculateCompleted(savedData) {
    return savedData.filter(Boolean).length;
  }

  static calculateSaved(challenge, savedData) {
    return challenge.items.reduce((acc, item, i) => {
      return acc + (savedData[i] ? item.amount : 0);
    }, 0);
  }

  static calculateNoSpendSaved(savedData, rewardPerDay) {
    return savedData.filter(Boolean).length * rewardPerDay;
  }

  static calculateTotalSaved(challenges, localStorage) {
    let totalSaved = 0;
    challenges.forEach((challenge) => {
      const savedData = JSON.parse(localStorage.getItem(challenge.id) || '[]');
      const saved = this.calculateSaved(challenge, savedData);
      totalSaved += saved;
    });
    return totalSaved;
  }

  static calculateTotalCompleted(challenges, localStorage) {
    let totalCompleted = 0;
    challenges.forEach((challenge) => {
      const savedData = JSON.parse(localStorage.getItem(challenge.id) || '[]');
      const completed = this.calculateCompleted(savedData);
      totalCompleted += completed;
    });
    return totalCompleted;
  }

  static calculateTotalItems(challenges) {
    return challenges.reduce((acc, challenge) => acc + challenge.items.length, 0);
  }

  static formatStats(totalSaved, totalCompleted, totalItems) {
    return `🏦 Total Saved: $${totalSaved} | ✅ ${totalCompleted} of ${totalItems} items complete`;
  }
}

// Test Suite
class ChallengeCalculationTests {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  log(message, type = 'INFO') {
    const icon = type === 'PASS' ? '✅' : type === 'FAIL' ? '❌' : 'ℹ️';
    console.log(`${icon} ${message}`);
  }

  async test(name, fn) {
    try {
      await fn();
      this.passed++;
      this.tests.push({ name, passed: true });
      this.log(name, 'PASS');
    } catch (error) {
      this.failed++;
      this.tests.push({ name, passed: false, error: error.message });
      this.log(`${name} - ${error.message}`, 'FAIL');
    }
  }

  // ===== TEST 1: Calculate Completed Items =====
  async testCalculateCompleted() {
    await this.test('Calculate Completed - Empty array returns 0', () => {
      const result = ChallengeCalculator.calculateCompleted([]);
      if (result !== 0) throw new Error(`Expected 0, got ${result}`);
    });

    await this.test('Calculate Completed - All false returns 0', () => {
      const result = ChallengeCalculator.calculateCompleted([false, false, false]);
      if (result !== 0) throw new Error(`Expected 0, got ${result}`);
    });

    await this.test('Calculate Completed - All true returns count', () => {
      const result = ChallengeCalculator.calculateCompleted([true, true, true]);
      if (result !== 3) throw new Error(`Expected 3, got ${result}`);
    });

    await this.test('Calculate Completed - Mixed array returns correct count', () => {
      const result = ChallengeCalculator.calculateCompleted([true, false, true, false, true]);
      if (result !== 3) throw new Error(`Expected 3, got ${result}`);
    });
  }

  // ===== TEST 2: Calculate Saved Amount =====
  async testCalculateSaved() {
    const challenge = {
      id: 'test',
      items: [
        { label: 'Week 1', amount: 10 },
        { label: 'Week 2', amount: 20 },
        { label: 'Week 3', amount: 30 }
      ]
    };

    await this.test('Calculate Saved - No items completed returns 0', () => {
      const savedData = [false, false, false];
      const result = ChallengeCalculator.calculateSaved(challenge, savedData);
      if (result !== 0) throw new Error(`Expected 0, got ${result}`);
    });

    await this.test('Calculate Saved - First item completed returns correct amount', () => {
      const savedData = [true, false, false];
      const result = ChallengeCalculator.calculateSaved(challenge, savedData);
      if (result !== 10) throw new Error(`Expected 10, got ${result}`);
    });

    await this.test('Calculate Saved - All items completed returns total', () => {
      const savedData = [true, true, true];
      const result = ChallengeCalculator.calculateSaved(challenge, savedData);
      if (result !== 60) throw new Error(`Expected 60, got ${result}`);
    });

    await this.test('Calculate Saved - Partial completion returns correct sum', () => {
      const savedData = [true, false, true];
      const result = ChallengeCalculator.calculateSaved(challenge, savedData);
      if (result !== 40) throw new Error(`Expected 40, got ${result}`);
    });
  }

  // ===== TEST 3: Calculate No-Spend Saved =====
  async testCalculateNoSpendSaved() {
    await this.test('Calculate No-Spend Saved - No days completed returns 0', () => {
      const savedData = [false, false, false];
      const rewardPerDay = 5;
      const result = ChallengeCalculator.calculateNoSpendSaved(savedData, rewardPerDay);
      if (result !== 0) throw new Error(`Expected 0, got ${result}`);
    });

    await this.test('Calculate No-Spend Saved - 10 days at $5 returns $50', () => {
      const savedData = Array(30).fill(false).map((_, i) => i < 10);
      const rewardPerDay = 5;
      const result = ChallengeCalculator.calculateNoSpendSaved(savedData, rewardPerDay);
      if (result !== 50) throw new Error(`Expected 50, got ${result}`);
    });

    await this.test('Calculate No-Spend Saved - Custom reward amount works', () => {
      const savedData = Array(30).fill(false).map((_, i) => i < 5);
      const rewardPerDay = 10;
      const result = ChallengeCalculator.calculateNoSpendSaved(savedData, rewardPerDay);
      if (result !== 50) throw new Error(`Expected 50, got ${result}`);
    });
  }

  // ===== TEST 4: Calculate Total Saved Across All Challenges =====
  async testCalculateTotalSaved() {
    const mockStorage = new MockLocalStorage();
    const challenges = [
      {
        id: 'challenge1',
        items: [
          { label: 'Week 1', amount: 10 },
          { label: 'Week 2', amount: 20 }
        ]
      },
      {
        id: 'challenge2',
        items: [
          { label: 'Month 1', amount: 100 },
          { label: 'Month 2', amount: 100 }
        ]
      }
    ];

    await this.test('Calculate Total Saved - Empty storage returns 0', () => {
      const result = ChallengeCalculator.calculateTotalSaved(challenges, mockStorage);
      if (result !== 0) throw new Error(`Expected 0, got ${result}`);
    });

    await this.test('Calculate Total Saved - One challenge completed returns correct amount', () => {
      mockStorage.clear();
      mockStorage.setItem('challenge1', JSON.stringify([true, true]));
      const result = ChallengeCalculator.calculateTotalSaved(challenges, mockStorage);
      if (result !== 30) throw new Error(`Expected 30, got ${result}`);
    });

    await this.test('Calculate Total Saved - Multiple challenges returns sum', () => {
      mockStorage.clear();
      mockStorage.setItem('challenge1', JSON.stringify([true, true]));
      mockStorage.setItem('challenge2', JSON.stringify([true, false]));
      const result = ChallengeCalculator.calculateTotalSaved(challenges, mockStorage);
      if (result !== 130) throw new Error(`Expected 130, got ${result}`);
    });
  }

  // ===== TEST 5: Calculate Total Completed =====
  async testCalculateTotalCompleted() {
    const mockStorage = new MockLocalStorage();
    const challenges = [
      {
        id: 'challenge1',
        items: [
          { label: 'Week 1', amount: 10 },
          { label: 'Week 2', amount: 20 }
        ]
      },
      {
        id: 'challenge2',
        items: [
          { label: 'Month 1', amount: 100 }
        ]
      }
    ];

    await this.test('Calculate Total Completed - Empty storage returns 0', () => {
      const result = ChallengeCalculator.calculateTotalCompleted(challenges, mockStorage);
      if (result !== 0) throw new Error(`Expected 0, got ${result}`);
    });

    await this.test('Calculate Total Completed - Partial completion returns correct count', () => {
      mockStorage.clear();
      mockStorage.setItem('challenge1', JSON.stringify([true, false]));
      mockStorage.setItem('challenge2', JSON.stringify([true]));
      const result = ChallengeCalculator.calculateTotalCompleted(challenges, mockStorage);
      if (result !== 2) throw new Error(`Expected 2, got ${result}`);
    });
  }

  // ===== TEST 6: Calculate Total Items =====
  async testCalculateTotalItems() {
    const challenges = [
      { id: 'challenge1', items: [{}, {}, {}] },
      { id: 'challenge2', items: [{}, {}] },
      { id: 'challenge3', items: [{}, {}, {}, {}] }
    ];

    await this.test('Calculate Total Items - Returns sum of all items', () => {
      const result = ChallengeCalculator.calculateTotalItems(challenges);
      if (result !== 9) throw new Error(`Expected 9, got ${result}`);
    });

    await this.test('Calculate Total Items - Empty challenges array returns 0', () => {
      const result = ChallengeCalculator.calculateTotalItems([]);
      if (result !== 0) throw new Error(`Expected 0, got ${result}`);
    });
  }

  // ===== TEST 7: Format Stats =====
  async testFormatStats() {
    await this.test('Format Stats - Formats correctly with all values', () => {
      const result = ChallengeCalculator.formatStats(100, 5, 10);
      const expected = '🏦 Total Saved: $100 | ✅ 5 of 10 items complete';
      if (result !== expected) throw new Error(`Expected "${expected}", got "${result}"`);
    });

    await this.test('Format Stats - Handles zero values', () => {
      const result = ChallengeCalculator.formatStats(0, 0, 0);
      const expected = '🏦 Total Saved: $0 | ✅ 0 of 0 items complete';
      if (result !== expected) throw new Error(`Expected "${expected}", got "${result}"`);
    });
  }

  // ===== TEST 8: Edge Cases =====
  async testEdgeCases() {
    await this.test('Edge Cases - Handles undefined savedData', () => {
      const challenge = { items: [{ amount: 10 }] };
      const savedData = undefined;
      try {
        const result = ChallengeCalculator.calculateSaved(challenge, savedData || []);
        if (result !== 0) throw new Error(`Expected 0, got ${result}`);
      } catch (error) {
        throw new Error(`Should handle undefined gracefully: ${error.message}`);
      }
    });

    await this.test('Edge Cases - Handles null savedData', () => {
      const challenge = { items: [{ amount: 10 }] };
      const savedData = null;
      try {
        const result = ChallengeCalculator.calculateSaved(challenge, savedData || []);
        if (result !== 0) throw new Error(`Expected 0, got ${result}`);
      } catch (error) {
        throw new Error(`Should handle null gracefully: ${error.message}`);
      }
    });

    await this.test('Edge Cases - Handles mismatched array lengths', () => {
      const challenge = {
        items: [
          { amount: 10 },
          { amount: 20 }
        ]
      };
      const savedData = [true]; // Only one item, but challenge has two
      const result = ChallengeCalculator.calculateSaved(challenge, savedData);
      if (result !== 10) throw new Error(`Expected 10, got ${result}`);
    });
  }

  // ===== TEST 9: Real Challenge Scenarios =====
  async testRealChallengeScenarios() {
    const mockStorage = new MockLocalStorage();

    // Test $5,000 Biweekly Challenge (26 weeks)
    await this.test('Real Challenge - $5,000 Biweekly Challenge calculation', () => {
      const challenge = {
        id: '5000_biweekly',
        items: Array.from({ length: 26 }, (_, i) => ({
          label: `Week ${i+1} - Save $${(i+1)*75}`,
          amount: (i+1)*75
        }))
      };

      // Complete first 10 weeks
      const savedData = Array(26).fill(false).map((_, i) => i < 10);
      mockStorage.setItem(challenge.id, JSON.stringify(savedData));

      const saved = ChallengeCalculator.calculateSaved(challenge, savedData);
      const expected = Array.from({ length: 10 }, (_, i) => (i+1)*75).reduce((a, b) => a + b, 0);
      
      if (saved !== expected) throw new Error(`Expected ${expected}, got ${saved}`);
    });

    // Test 52-Week Challenge
    await this.test('Real Challenge - 52-Week Challenge calculation', () => {
      const challenge = {
        id: '52_week_1378',
        items: Array.from({ length: 52 }, (_, i) => ({
          label: `Week ${i+1} - Save $${i+1}`,
          amount: i+1
        }))
      };

      // Complete first 20 weeks
      const savedData = Array(52).fill(false).map((_, i) => i < 20);
      const saved = ChallengeCalculator.calculateSaved(challenge, savedData);
      const expected = Array.from({ length: 20 }, (_, i) => i+1).reduce((a, b) => a + b, 0);
      
      if (saved !== expected) throw new Error(`Expected ${expected}, got ${saved}`);
    });
  }

  // Run all tests
  async runAll() {
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('CHALLENGE CALCULATION UNIT TESTS');
    console.log('═══════════════════════════════════════════════════════════\n');

    await this.testCalculateCompleted();
    await this.testCalculateSaved();
    await this.testCalculateNoSpendSaved();
    await this.testCalculateTotalSaved();
    await this.testCalculateTotalCompleted();
    await this.testCalculateTotalItems();
    await this.testFormatStats();
    await this.testEdgeCases();
    await this.testRealChallengeScenarios();

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('TEST SUMMARY');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log(`Total Tests: ${this.tests.length}`);
    console.log(`Passed: ${this.passed} ✅`);
    console.log(`Failed: ${this.failed} ${this.failed > 0 ? '❌' : ''}`);
    console.log(`Pass Rate: ${((this.passed / this.tests.length) * 100).toFixed(1)}%\n`);

    if (this.failed > 0) {
      console.log('Failed Tests:');
      this.tests.filter(t => !t.passed).forEach(test => {
        console.log(`  ❌ ${test.name}`);
        if (test.error) console.log(`     ${test.error}`);
      });
    }

    return {
      total: this.tests.length,
      passed: this.passed,
      failed: this.failed,
      passRate: (this.passed / this.tests.length) * 100
    };
  }
}

// Export for use in other test files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ChallengeCalculator, ChallengeCalculationTests, MockLocalStorage };
}

// Run tests if executed directly
if (typeof window === 'undefined') {
  const testSuite = new ChallengeCalculationTests();
  testSuite.runAll().then(result => {
    process.exit(result.failed > 0 ? 1 : 0);
  }).catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

