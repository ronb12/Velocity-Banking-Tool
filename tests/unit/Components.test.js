/**
 * Component Unit Tests
 */
import { FinancialTips } from '../../src/scripts/components/FinancialTips.js';
import { NotificationSystem } from '../../src/scripts/components/NotificationSystem.js';
import { SettingsManager } from '../../src/scripts/components/SettingsManager.js';

describe('Components', () => {
  describe('FinancialTips', () => {
    let financialTips;

    beforeEach(() => {
      financialTips = new FinancialTips();
    });

    test('should initialize with empty tips', () => {
      expect(financialTips.tips).toEqual([]);
      expect(financialTips.currentTipIndex).toBe(0);
    });

    test('should initialize with tips', () => {
      const tips = [
        { category: 'Debt', title: 'Tip 1', content: 'Content 1' },
        { category: 'Savings', title: 'Tip 2', content: 'Content 2' }
      ];

      financialTips.init(tips);
      expect(financialTips.tips).toEqual(tips);
    });

    test('should navigate to next tip', () => {
      financialTips.tips = [
        { category: 'Debt', title: 'Tip 1', content: 'Content 1' },
        { category: 'Savings', title: 'Tip 2', content: 'Content 2' }
      ];

      financialTips.nextTip();
      expect(financialTips.currentTipIndex).toBe(1);
    });

    test('should wrap around to first tip', () => {
      financialTips.tips = [
        { category: 'Debt', title: 'Tip 1', content: 'Content 1' },
        { category: 'Savings', title: 'Tip 2', content: 'Content 2' }
      ];
      financialTips.currentTipIndex = 1;

      financialTips.nextTip();
      expect(financialTips.currentTipIndex).toBe(0);
    });
  });

  describe('NotificationSystem', () => {
    let notificationSystem;

    beforeEach(() => {
      notificationSystem = new NotificationSystem();
      // Clear any existing notifications
      notificationSystem.notifications = [];
    });

    test('should create notification', () => {
      // Mock DOM for NotificationSystem
      if (typeof document === 'undefined') {
        global.document = {
          createElement: () => ({
            id: '',
            className: '',
            style: {},
            innerHTML: '',
            appendChild: () => {},
            classList: { add: () => {}, remove: () => {} }
          }),
          body: { appendChild: () => {} },
          head: { appendChild: () => {} },
          getElementById: () => null,
          querySelector: () => null
        };
      }
      
      const notificationId = notificationSystem.show('Test message', 'info');
      expect(notificationId).toBeDefined();
      expect(typeof notificationId).toBe('string');
      expect(notificationSystem.notifications.length).toBeGreaterThan(0);
    });

    test('should remove notification', () => {
      const notificationId = notificationSystem.show('Test', 'info');
      notificationSystem.remove(notificationId);
      expect(notificationSystem.notifications.find(n => n.id === notificationId)).toBeUndefined();
    });
  });

  describe('SettingsManager', () => {
    let settingsManager;

    beforeEach(() => {
      settingsManager = new SettingsManager();
      // Clear localStorage
      localStorage.clear();
    });

    test('should save settings', () => {
      settingsManager.saveSetting('testKey', 'testValue');
      // saveSetting uses JSON.stringify, so we need to parse it
      const saved = localStorage.getItem('testKey');
      expect(saved).toBe('"testValue"'); // JSON.stringify adds quotes
      expect(JSON.parse(saved)).toBe('testValue');
    });

    test('should load settings', () => {
      // loadSetting expects JSON format, so we need to set it as JSON
      localStorage.setItem('testKey', JSON.stringify('testValue'));
      const value = settingsManager.loadSetting('testKey');
      expect(value).toBe('testValue');
    });
  });
});

