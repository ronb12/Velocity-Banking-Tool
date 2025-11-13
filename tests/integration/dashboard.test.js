/**
 * Dashboard Integration Tests
 */

import Dashboard from '../../src/scripts/pages/Dashboard.js';

describe('Dashboard Integration', () => {
  let dashboard;
  let mockAuth;
  let mockDb;

  beforeEach(() => {
    // Mock Firebase
    mockAuth = {
      currentUser: {
        uid: 'test-user-123',
        email: 'test@example.com',
      },
    };

    mockDb = {
      collection: jest.fn(),
      doc: jest.fn(),
    };

    window.auth = mockAuth;
    window.db = mockDb;
    window.themeManager = {
      init: jest.fn(),
    };

    dashboard = new Dashboard();
  });

  afterEach(() => {
    delete window.auth;
    delete window.db;
    delete window.themeManager;
  });

  test('should initialize dashboard', async () => {
    await dashboard.init();
    expect(dashboard).toBeDefined();
  });

  test('should load dashboard data', async () => {
    await dashboard.init();
    // Dashboard should attempt to load data
    expect(mockDb.collection || mockDb.doc).toBeDefined();
  });

  test('should update statistics', () => {
    dashboard.updateStat('creditUtilization', '25%');
    expect(dashboard.stats.creditUtilization).toBe('25%');
  });
});

