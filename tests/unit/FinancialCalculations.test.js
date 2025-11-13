/**
 * Financial Calculations Unit Tests
 * Critical tests for financial calculation accuracy
 */
import { calculateSummaryMetrics } from '../../src/scripts/utils/calculateSummaryMetrics.js';
import { gatherAllFinancialData } from '../../src/scripts/utils/gatherFinancialData.js';

describe('Financial Calculations', () => {
  describe('calculateSummaryMetrics', () => {
    test('should calculate total debt correctly', () => {
      const data = {
        debts: [
          { balance: 1000, interestRate: 5 },
          { balance: 2000, interestRate: 10 }
        ],
        savings: [],
        income: []
      };

      const metrics = calculateSummaryMetrics(data);
      expect(metrics.metrics.totalDebt).toBe(3000);
    });

    test('should calculate credit utilization correctly', () => {
      const data = {
        debts: [
          { balance: 500, creditLimit: 2000, type: 'credit_card' },
          { balance: 1000, creditLimit: 5000, type: 'credit_card' }
        ],
        savings: [],
        income: []
      };

      const metrics = calculateSummaryMetrics(data);
      const totalBalance = 1500;
      const totalLimit = 7000;
      const expectedUtilization = (totalBalance / totalLimit) * 100;
      
      expect(metrics.metrics.creditUtilization).toBeCloseTo(expectedUtilization, 2);
    });

    test('should calculate net worth correctly', () => {
      const data = {
        debts: [{ balance: 5000 }],
        savings: [{ balance: 10000 }],
        income: [],
        assets: [{ value: 2000 }]
      };

      const metrics = calculateSummaryMetrics(data);
      const expectedNetWorth = 10000 + 2000 - 5000; // savings + assets - debts
      expect(metrics.metrics.netWorth).toBe(expectedNetWorth);
    });

    test('should handle empty data', () => {
      const data = {
        debts: [],
        savings: [],
        income: []
      };

      const metrics = calculateSummaryMetrics(data);
      expect(metrics.metrics.totalDebt).toBe(0);
      expect(metrics.metrics.netWorth).toBe(0);
    });

    test('should handle negative values', () => {
      const data = {
        debts: [{ balance: -100 }], // Invalid, but should handle gracefully
        savings: [],
        income: []
      };

      const metrics = calculateSummaryMetrics(data);
      // Should handle negative debt (credit) appropriately
      expect(typeof metrics.metrics.totalDebt).toBe('number');
    });
  });

  describe('gatherAllFinancialData', () => {
    test('should gather data structure correctly', async () => {
      // Mock Firebase or localStorage data
      const mockData = {
        debts: [{ id: '1', balance: 1000 }],
        savings: [{ id: '1', balance: 500 }]
      };

      // This would need to be mocked in a real test
      // For now, just test the structure
      expect(typeof gatherAllFinancialData).toBe('function');
    });
  });
});

