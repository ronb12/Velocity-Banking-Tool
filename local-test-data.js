(() => {
  const isBrowser = typeof window !== 'undefined';
  if (!isBrowser) return;

  const host = window.location && window.location.hostname;
  if (!(host === 'localhost' || host === '127.0.0.1')) return;

  const DEFAULT_TEST_USER_ID = '4NdFPTbkXYNs8hxn3q8One46FwR2';
  if (!window.LOCAL_TEST_USER_ID) {
    window.LOCAL_TEST_USER_ID = DEFAULT_TEST_USER_ID;
  }
  const LOCAL_USER_ID = window.LOCAL_TEST_USER_ID;
  const now = new Date();
  const currentMonth = now.toISOString().slice(0, 7);
  const timestamp = (offsetDays = 0, offsetHours = 0) => {
    const date = new Date(now);
    date.setDate(date.getDate() - offsetDays);
    date.setHours(date.getHours() - offsetHours);
    return {
      seconds: Math.floor(date.getTime() / 1000),
      nanoseconds: 0
    };
  };

  const dueDate = (dayOfMonth) => {
    const date = new Date(now.getFullYear(), now.getMonth(), dayOfMonth);
    return date.toISOString().slice(0, 10);
  };

  const debts = [
    { name: 'Platinum Credit Card', type: 'credit', limit: 12000, balance: 4200, interestRate: 18.99, minPayment: 150 },
    { name: 'Hybrid Auto Loan', type: 'loan', limit: 0, balance: 10500, interestRate: 3.49, minPayment: 275 },
    { name: 'Student Loan Bundle', type: 'loan', limit: 0, balance: 8600, interestRate: 4.25, minPayment: 120 }
  ];

  const budget = {
    month: currentMonth,
    income: [
      { source: 'Primary Salary', amount: 6500 },
      { source: 'Freelance Design', amount: 950 }
    ],
    expenses: [
      { category: 'Housing', name: 'Mortgage', budgeted: 1800, spent: 1800, due: dueDate(1), paidFrom: 'Checking' },
      { category: 'Transportation', name: 'Car Payment', budgeted: 320, spent: 320, due: dueDate(12), paidFrom: 'Checking' },
      { category: 'Food', name: 'Groceries', budgeted: 550, spent: 480, due: dueDate(7), paidFrom: 'Credit Card' },
      { category: 'Utilities', name: 'Electric', budgeted: 140, spent: 135, due: dueDate(18), paidFrom: 'Checking' },
      { category: 'Lifestyle', name: 'Streaming & Entertainment', budgeted: 120, spent: 90, due: dueDate(25), paidFrom: 'Credit Card' },
      { category: 'Savings', name: 'Emergency Fund Contribution', budgeted: 400, spent: 400, due: dueDate(30), paidFrom: 'Savings' }
    ],
    notes: 'Demo budget for local testing. Adjust numbers freely to explore charts and summaries.'
  };

  const netWorth = {
    assets: [
      { name: 'Checking Account', value: 5200 },
      { name: 'High-Yield Savings', value: 8300 },
      { name: '401k Retirement', value: 38500 },
      { name: 'Home Equity', value: 95000 }
    ],
    liabilities: [
      { name: 'Mortgage Balance', value: 145000 },
      { name: 'Auto Loan', value: 10500 }
    ],
    history: [
      { date: currentMonth, netWorth: 54200 },
      { date: new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 7), netWorth: 53350 },
      { date: new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString().slice(0, 7), netWorth: 51980 }
    ]
  };

  const savingsGoals = [
    { name: 'Emergency Fund', category: 'Emergency Fund', target: 10000, saved: 4200, targetDate: `${now.getFullYear()}-12-31`, createdDate: now.toISOString() },
    { name: 'Family Vacation', category: 'Vacation', target: 5000, saved: 2800, targetDate: `${now.getFullYear()}-08-15`, createdDate: now.toISOString() },
    { name: 'Home Renovation', category: 'Home', target: 15000, saved: 6200, targetDate: `${now.getFullYear() + 1}-05-30`, createdDate: now.toISOString() }
  ];

  const notifications = [
    { id: 'local-notif-1', message: 'Budget update: You finished the month with $250 left to allocate.', read: false, timestamp: timestamp(0, 2) },
    { id: 'local-notif-2', message: 'Savings goal progress: Emergency Fund is 42% funded.', read: false, timestamp: timestamp(1, 4) },
    { id: 'local-notif-3', message: 'Payment reminder: Auto loan payment due in 3 days.', read: true, timestamp: timestamp(3, 0) },
    { id: 'local-notif-4', message: 'Investment update: 401k balance has grown 4.2% this quarter.', read: true, timestamp: timestamp(6, 0) }
  ];

  const activityLogs = [
    { id: 'local-activity-1', text: 'Updated monthly budget with new freelance income.', type: 'budget_updated', icon: '📊', timestamp: timestamp(0, 5) },
    { id: 'local-activity-2', text: 'Recorded $400 savings contribution toward Emergency Fund.', type: 'savings_contribution', icon: '💰', timestamp: timestamp(1, 2) },
    { id: 'local-activity-3', text: 'Recalculated amortization schedule for Hybrid Auto Loan.', type: 'debt_updated', icon: '🚗', timestamp: timestamp(2, 6) },
    { id: 'local-activity-4', text: 'Logged into Bradley’s Financial Tools from Chrome on macOS.', type: 'login', icon: '🗝️', timestamp: timestamp(0, 1) }
  ];

  const userStats = {
    creditUtilization: 37.5,
    netWorth: netWorth.history[0].netWorth,
    totalDebt: debts.reduce((sum, debt) => sum + (debt.balance || 0), 0),
    savingsProgress: Math.round((savingsGoals.reduce((sum, goal) => sum + goal.saved, 0) / savingsGoals.reduce((sum, goal) => sum + goal.target, 0)) * 100)
  };

  const localTestData = {
    userId: LOCAL_USER_ID,
    month: currentMonth,
    debts,
    budget,
    netWorth,
    savingsGoals,
    notifications,
    activityLogs,
    userStats
  };

  const deepClone = (value) => JSON.parse(JSON.stringify(value));

  window.LOCAL_TEST_USER_ID = LOCAL_USER_ID;
  window.LOCAL_TEST_DATA = localTestData;
  window.getLocalTestData = (key) => {
    if (!key) return deepClone(localTestData);
    return deepClone(localTestData[key]);
  };

  if (!window.activityLogger) {
    window.activityLogger = {
      isInitialized: true,
      logDebtAdded: () => {},
      logActivity: () => {},
      logBudgetUpdated: () => {},
      logSavingsGoal: () => {},
      logGoalCompleted: () => {},
      logNetWorth: () => {}
    };
  }

  try {
    const financialDataKey = `financialData_${LOCAL_USER_ID}`;
    const financialData = {
      debts: deepClone(debts),
      budget: deepClone({
        income: budget.income,
        expenses: budget.expenses,
        notes: budget.notes
      }),
      netWorth: deepClone(netWorth.history),
      savings: deepClone(savingsGoals)
    };
    localStorage.setItem(financialDataKey, JSON.stringify(financialData));

    localStorage.setItem('local_test_debts', JSON.stringify(debts));
    localStorage.setItem('local_test_budget', JSON.stringify(budget));
    localStorage.setItem('local_test_networth', JSON.stringify(netWorth));
    localStorage.setItem('netWorth', JSON.stringify({ history: deepClone(netWorth.history) }));
    localStorage.setItem('savingsGoals', JSON.stringify(deepClone(savingsGoals)));
    localStorage.setItem('savings_goals', JSON.stringify(deepClone(savingsGoals)));
    localStorage.setItem('savings_goals_archive', JSON.stringify([]));

    localStorage.setItem('local_test_notifications', JSON.stringify(notifications));
    localStorage.setItem('local_test_activity', JSON.stringify(activityLogs));
  } catch (storageError) {
    console.warn('Unable to seed local test data in storage:', storageError);
  }
})();

