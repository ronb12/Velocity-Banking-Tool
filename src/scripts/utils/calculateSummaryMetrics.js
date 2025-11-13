/**
 * Calculate Summary Metrics from Financial Data
 * Provides type-safe financial calculations with JSDoc annotations
 * 
 * @typedef {Object} Debt
 * @property {number} balance - Debt balance
 * @property {number} [interestRate] - Interest rate percentage
 * @property {number} [creditLimit] - Credit limit (for credit cards)
 * @property {string} [type] - Debt type (e.g., 'credit_card', 'loan')
 * 
 * @typedef {Object} Savings
 * @property {number} balance - Savings balance
 * @property {string} [name] - Savings account name
 * 
 * @typedef {Object} Asset
 * @property {number} value - Asset value
 * @property {string} [name] - Asset name
 * 
 * @typedef {Object} Income
 * @property {number} amount - Income amount
 * @property {string} [source] - Income source
 * 
 * @typedef {Object} FinancialData
 * @property {Debt[]} debts - Array of debts
 * @property {Savings[]} savings - Array of savings accounts
 * @property {Asset[]} [assets] - Array of assets
 * @property {Income[]} [income] - Array of income sources
 * 
 * @typedef {Object} SummaryMetrics
 * @property {number} totalDebt - Total debt amount
 * @property {number} totalSavings - Total savings amount
 * @property {number} totalAssets - Total assets value
 * @property {number} totalIncome - Total income amount
 * @property {number} netWorth - Net worth (assets + savings - debts)
 * @property {number} creditUtilization - Credit utilization percentage
 * @property {number} debtToIncomeRatio - Debt to income ratio
 * 
 * @param {FinancialData} data - Financial data object
 * @returns {{metrics: SummaryMetrics, recommendations: string[]}} Summary metrics and recommendations
 */
export function calculateSummaryMetrics(data) {
  // Validate input
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid financial data: data must be an object');
  }

  // Initialize with safe defaults
  const debts = Array.isArray(data.debts) ? data.debts : [];
  const savings = Array.isArray(data.savings) ? data.savings : [];
  const assets = Array.isArray(data.assets) ? data.assets : [];
  const income = Array.isArray(data.income) ? data.income : [];

  // Calculate totals with validation
  const totalDebt = debts.reduce((sum, debt) => {
    const balance = typeof debt.balance === 'number' && !isNaN(debt.balance) ? debt.balance : 0;
    return sum + Math.max(0, balance); // Ensure non-negative
  }, 0);

  const totalSavings = savings.reduce((sum, saving) => {
    const balance = typeof saving.balance === 'number' && !isNaN(saving.balance) ? saving.balance : 0;
    return sum + Math.max(0, balance);
  }, 0);

  const totalAssets = assets.reduce((sum, asset) => {
    const value = typeof asset.value === 'number' && !isNaN(asset.value) ? asset.value : 0;
    return sum + Math.max(0, value);
  }, 0);

  const totalIncome = income.reduce((sum, inc) => {
    const amount = typeof inc.amount === 'number' && !isNaN(inc.amount) ? inc.amount : 0;
    return sum + Math.max(0, amount);
  }, 0);

  // Calculate credit utilization
  const creditCards = debts.filter(d => d.type === 'credit_card' || d.creditLimit);
  const totalCreditBalance = creditCards.reduce((sum, card) => {
    const balance = typeof card.balance === 'number' && !isNaN(card.balance) ? card.balance : 0;
    return sum + Math.max(0, balance);
  }, 0);

  const totalCreditLimit = creditCards.reduce((sum, card) => {
    const limit = typeof card.creditLimit === 'number' && !isNaN(card.creditLimit) ? card.creditLimit : 0;
    return sum + Math.max(0, limit);
  }, 0);

  const creditUtilization = totalCreditLimit > 0
    ? (totalCreditBalance / totalCreditLimit) * 100
    : 0;

  // Calculate net worth
  const netWorth = totalAssets + totalSavings - totalDebt;

  // Calculate debt to income ratio
  const debtToIncomeRatio = totalIncome > 0
    ? (totalDebt / totalIncome) * 100
    : totalDebt > 0 ? Infinity : 0;

  // Generate recommendations
  const recommendations = [];

  if (creditUtilization > 30) {
    recommendations.push('Your credit utilization is above the recommended 30%. Consider paying down credit card balances.');
  }

  if (debtToIncomeRatio > 36) {
    recommendations.push('Your debt-to-income ratio is high. Focus on reducing debt or increasing income.');
  }

  if (netWorth < 0) {
    recommendations.push('Your net worth is negative. Create a plan to reduce debt and build savings.');
  }

  if (totalSavings === 0 && totalDebt > 0) {
    recommendations.push('Consider building an emergency fund while paying down debt.');
  }

  return {
    metrics: {
      totalDebt: Math.round(totalDebt * 100) / 100, // Round to 2 decimal places
      totalSavings: Math.round(totalSavings * 100) / 100,
      totalAssets: Math.round(totalAssets * 100) / 100,
      totalIncome: Math.round(totalIncome * 100) / 100,
      netWorth: Math.round(netWorth * 100) / 100,
      creditUtilization: Math.round(creditUtilization * 100) / 100,
      debtToIncomeRatio: Math.round(debtToIncomeRatio * 100) / 100
    },
    recommendations
  };
}
