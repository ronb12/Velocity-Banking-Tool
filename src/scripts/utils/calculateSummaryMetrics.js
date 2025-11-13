/**
 * Calculate Summary Metrics Utility
 * Calculates summary statistics from financial data
 */

export function calculateSummaryMetrics(financialData) {
  const metrics = {
    totalDebt: 0,
    creditBalance: 0,
    creditLimit: 0,
    creditUtilization: null,
    netWorth: null,
    netWorthChange: null,
    netWorthChangePercent: null,
    incomeTotal: 0,
    expenseBudgeted: 0,
    expenseActual: 0,
    netCashFlow: null,
    savingsProgress: null,
    savingsTarget: 0,
    savingsSaved: 0
  };

  const datasetCounts = {};

  const debts = Array.isArray(financialData.debts) ? financialData.debts : [];
  datasetCounts.debts = debts.length;
  debts.forEach(debt => {
    const balance = parseFloat(debt.balance) || 0;
    metrics.totalDebt += balance;
    if ((debt.type || '').toLowerCase() === 'credit') {
      metrics.creditBalance += balance;
      metrics.creditLimit += parseFloat(debt.limit) || 0;
    }
  });
  if (metrics.creditLimit > 0) {
    metrics.creditUtilization = (metrics.creditBalance / metrics.creditLimit) * 100;
  } else if (metrics.creditBalance > 0) {
    metrics.creditUtilization = 100;
  } else {
    metrics.creditUtilization = 0;
  }

  let netWorthHistory = [];
  const netWorthRaw = financialData.netWorth;
  if (Array.isArray(netWorthRaw)) {
    netWorthHistory = netWorthRaw;
  } else if (netWorthRaw && typeof netWorthRaw === 'object') {
    if (Array.isArray(netWorthRaw.history)) {
      netWorthHistory = netWorthRaw.history;
    }
  }
  datasetCounts.netWorthHistory = netWorthHistory.length;
  if (netWorthHistory.length) {
    const ordered = netWorthHistory
      .slice()
      .sort((a, b) => new Date(a.date || a.timestamp || 0) - new Date(b.date || b.timestamp || 0));
    const latest = ordered[ordered.length - 1];
    const previous = ordered[ordered.length - 2];
    metrics.netWorth = parseFloat(latest?.netWorth) || 0;
    if (previous) {
      const prevValue = parseFloat(previous.netWorth) || 0;
      const delta = metrics.netWorth - prevValue;
      metrics.netWorthChange = delta;
      if (prevValue !== 0) {
        metrics.netWorthChangePercent = (delta / Math.abs(prevValue)) * 100;
      }
    }
  }

  const savingsGoals = Array.isArray(financialData.savingsGoals) ? financialData.savingsGoals : [];
  datasetCounts.savingsGoals = savingsGoals.length;
  const totalSaved = savingsGoals.reduce((sum, goal) => sum + (parseFloat(goal.saved ?? goal.current ?? 0) || 0), 0);
  const totalTarget = savingsGoals.reduce((sum, goal) => sum + (parseFloat(goal.target ?? 0) || 0), 0);
  metrics.savingsSaved = totalSaved;
  metrics.savingsTarget = totalTarget;
  if (totalTarget > 0) {
    metrics.savingsProgress = (totalSaved / totalTarget) * 100;
  }

  let budgetRecords = [];
  if (Array.isArray(financialData.budgets)) {
    budgetRecords = financialData.budgets;
  } else if (financialData.budgets && typeof financialData.budgets === 'object') {
    budgetRecords = Object.values(financialData.budgets);
  } else if (financialData.budget && typeof financialData.budget === 'object') {
    budgetRecords = [financialData.budget];
  }
  datasetCounts.budgets = budgetRecords.length;

  budgetRecords.forEach(record => {
    const incomes = Array.isArray(record.incomes) ? record.incomes : (Array.isArray(record.income) ? record.income : []);
    incomes.forEach(entry => {
      metrics.incomeTotal += parseFloat(entry.amount) || 0;
    });
    const expenses = Array.isArray(record.expenses) ? record.expenses : [];
    expenses.forEach(exp => {
      metrics.expenseBudgeted += parseFloat(exp.budgeted ?? exp.amount ?? 0) || 0;
      metrics.expenseActual += parseFloat(exp.spent ?? exp.amount ?? 0) || 0;
    });
  });
  metrics.netCashFlow = metrics.incomeTotal - metrics.expenseActual;

  const velocityCalculations = Array.isArray(financialData.velocityCalculations) ? financialData.velocityCalculations : [];
  datasetCounts.velocityCalculations = velocityCalculations.length;

  const taxCalculations = Array.isArray(financialData.taxCalculations) ? financialData.taxCalculations : [];
  datasetCounts.taxCalculations = taxCalculations.length;

  const activityLogs = Array.isArray(financialData.activityLogs) ? financialData.activityLogs : [];
  datasetCounts.activityLogs = activityLogs.length;

  if (typeof window !== 'undefined') {
    try {
      const localStats = typeof window.getLocalTestData === 'function'
        ? window.getLocalTestData('userStats')
        : window.LOCAL_TEST_DATA?.userStats;
      if (localStats) {
        if ((metrics.netWorth ?? null) === null || metrics.netWorth === 0) {
          metrics.netWorth = typeof localStats.netWorth === 'number' ? localStats.netWorth : metrics.netWorth;
        }
        if ((metrics.totalDebt ?? null) === null || metrics.totalDebt === 0) {
          metrics.totalDebt = typeof localStats.totalDebt === 'number' ? localStats.totalDebt : metrics.totalDebt;
        }
        if (metrics.creditUtilization === null || Number.isNaN(metrics.creditUtilization)) {
          if (typeof localStats.creditUtilization === 'number') {
            metrics.creditUtilization = localStats.creditUtilization;
          }
        }
        if (metrics.savingsProgress === null || Number.isNaN(metrics.savingsProgress)) {
          if (typeof localStats.savingsProgress === 'number') {
            metrics.savingsProgress = localStats.savingsProgress;
          }
        }
      }
    } catch (error) {
      console.warn('Unable to merge local summary stats:', error);
    }
  }

  datasetCounts.totalDatasets = Object.values(datasetCounts).reduce((sum, value) => sum + (Number(value) || 0), 0);

  return {
    generatedAt: new Date().toISOString(),
    metrics,
    datasetCounts
  };
}

