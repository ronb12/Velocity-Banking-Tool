// Advanced Financial Insights and AI-Powered Recommendations
class FinancialInsights {
  constructor() {
    this.insights = [];
    this.recommendations = [];
    this.trends = [];
    this.goals = [];
  }
  
  // Generate financial insights from user data
  async generateInsights(userData) {
    this.insights = [];
    
    // Set monthly income first if budget data is available
    if (userData.budget && userData.budget.incomes) {
      this.monthlyIncome = userData.budget.incomes.reduce((sum, income) => sum + (income.amount || 0), 0);
    }
    
    // Analyze debt situation
    if (userData.debts && userData.debts.length > 0) {
      this.analyzeDebtSituation(userData.debts);
    }
    
    // Analyze budget performance
    if (userData.budget) {
      this.analyzeBudgetPerformance(userData.budget);
    }
    
    // Analyze net worth trends
    if (userData.netWorth) {
      this.analyzeNetWorthTrends(userData.netWorth);
    }
    
    // Analyze savings patterns
    if (userData.savings) {
      this.analyzeSavingsPatterns(userData.savings);
    }
    
    // Generate recommendations
    this.generateRecommendations();
    
    return this.insights;
  }
  
  // Analyze debt situation
  analyzeDebtSituation(debts) {
    console.log('Analyzing debt situation with debts:', debts);
    
    // Ensure all values are numbers
    const processedDebts = debts.map(debt => ({
      ...debt,
      balance: parseFloat(debt.balance) || 0,
      interestRate: parseFloat(debt.interestRate) || 0,
      minPayment: parseFloat(debt.minPayment) || 0,
      limit: parseFloat(debt.limit) || 0
    }));
    
    console.log('Processed debts with numeric values:', processedDebts);
    console.log('Raw interest rates before processing:', debts.map(d => ({ name: d.name, interestRate: d.interestRate, raw: d.interestRate })));
    
    const totalDebt = processedDebts.reduce((sum, debt) => sum + debt.balance, 0);
    const totalInterest = processedDebts.reduce((sum, debt) => {
      const monthlyInterest = debt.balance * debt.interestRate / 100 / 12;
      return sum + monthlyInterest;
    }, 0);
    
    const avgInterestRate = processedDebts.length > 0 ? processedDebts.reduce((sum, debt) => sum + debt.interestRate, 0) / processedDebts.length : 0;
    const highestInterestDebt = processedDebts.reduce((max, debt) => 
      debt.interestRate > max.interestRate ? debt : max
    );
    
    console.log('Debt analysis results:', {
      totalDebt,
      totalInterest,
      avgInterestRate,
      highestInterestDebt,
      debtCount: processedDebts.length,
      interestRates: processedDebts.map(d => d.interestRate)
    });
    
    // Debt-to-income ratio (if income data available)
    const monthlyIncome = this.getMonthlyIncome();
    const debtToIncomeRatio = monthlyIncome > 0 ? (totalDebt / (monthlyIncome * 12)) * 100 : null;
    
    this.insights.push({
      type: 'debt_analysis',
      title: 'Debt Overview',
      data: {
        totalDebt: totalDebt,
        totalInterest: totalInterest,
        avgInterestRate: avgInterestRate,
        highestInterestDebt: highestInterestDebt,
        debtToIncomeRatio: debtToIncomeRatio
      },
      recommendations: this.getDebtRecommendations(totalDebt, avgInterestRate, debtToIncomeRatio)
    });
  }
  
  // Analyze budget performance
  analyzeBudgetPerformance(budget) {
    const totalBudgeted = budget.expenses?.reduce((sum, expense) => sum + (expense.budgeted || 0), 0) || 0;
    const totalSpent = budget.expenses?.reduce((sum, expense) => sum + (expense.actual || 0), 0) || 0;
    const totalIncome = budget.incomes?.reduce((sum, income) => sum + (income.amount || 0), 0) || 0;
    
    // Set monthly income for debt analysis
    this.monthlyIncome = totalIncome;
    
    const budgetVariance = totalBudgeted > 0 ? ((totalSpent - totalBudgeted) / totalBudgeted) * 100 : 0;
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalSpent) / totalIncome) * 100 : 0;
    
    // Find categories with highest variance
    const categoryVariances = budget.expenses?.map(expense => ({
      category: expense.name,
      budgeted: expense.budgeted || 0,
      actual: expense.actual || 0,
      variance: expense.budgeted > 0 ? ((expense.actual - expense.budgeted) / expense.budgeted) * 100 : 0
    })).sort((a, b) => Math.abs(b.variance) - Math.abs(a.variance)) || [];
    
    this.insights.push({
      type: 'budget_analysis',
      title: 'Budget Performance',
      data: {
        totalBudgeted: totalBudgeted,
        totalSpent: totalSpent,
        totalIncome: totalIncome,
        budgetVariance: budgetVariance,
        savingsRate: savingsRate,
        categoryVariances: categoryVariances.slice(0, 5) // Top 5 categories
      },
      recommendations: this.getBudgetRecommendations(budgetVariance, savingsRate, categoryVariances)
    });
  }
  
  // Analyze net worth trends
  analyzeNetWorthTrends(netWorthData) {
    if (!Array.isArray(netWorthData) || netWorthData.length < 2) return;
    
    const sortedData = netWorthData.sort((a, b) => new Date(a.date) - new Date(b.date));
    const currentNetWorth = sortedData[sortedData.length - 1].value;
    const previousNetWorth = sortedData[sortedData.length - 2].value;
    const netWorthChange = currentNetWorth - previousNetWorth;
    const netWorthChangePercent = previousNetWorth > 0 ? (netWorthChange / previousNetWorth) * 100 : 0;
    
    // Calculate trend
    const trend = this.calculateTrend(sortedData.map(d => d.value));
    
    this.insights.push({
      type: 'net_worth_analysis',
      title: 'Net Worth Trends',
      data: {
        currentNetWorth: currentNetWorth,
        netWorthChange: netWorthChange,
        netWorthChangePercent: netWorthChangePercent,
        trend: trend,
        dataPoints: sortedData.length
      },
      recommendations: this.getNetWorthRecommendations(netWorthChange, trend)
    });
  }
  
  // Analyze savings patterns
  analyzeSavingsPatterns(savingsData) {
    if (!Array.isArray(savingsData) || savingsData.length === 0) return;
    
    const totalSaved = savingsData.reduce((sum, saving) => sum + (saving.amount || 0), 0);
    const avgMonthlySaving = totalSaved / savingsData.length;
    const savingsGoal = savingsData[0]?.goal || 0;
    const goalProgress = savingsGoal > 0 ? (totalSaved / savingsGoal) * 100 : 0;
    
    // Calculate savings consistency
    const monthlyAmounts = savingsData.map(s => s.amount || 0);
    const savingsConsistency = this.calculateConsistency(monthlyAmounts);
    
    this.insights.push({
      type: 'savings_analysis',
      title: 'Savings Analysis',
      data: {
        totalSaved: totalSaved,
        avgMonthlySaving: avgMonthlySaving,
        savingsGoal: savingsGoal,
        goalProgress: goalProgress,
        savingsConsistency: savingsConsistency
      },
      recommendations: this.getSavingsRecommendations(goalProgress, savingsConsistency, avgMonthlySaving)
    });
  }
  
  // Generate recommendations based on insights
  generateRecommendations() {
    this.recommendations = [];
    
    // Debt recommendations
    const debtInsight = this.insights.find(i => i.type === 'debt_analysis');
    if (debtInsight) {
      this.recommendations.push(...debtInsight.recommendations);
    }
    
    // Budget recommendations
    const budgetInsight = this.insights.find(i => i.type === 'budget_analysis');
    if (budgetInsight) {
      this.recommendations.push(...budgetInsight.recommendations);
    }
    
    // Net worth recommendations
    const netWorthInsight = this.insights.find(i => i.type === 'net_worth_analysis');
    if (netWorthInsight) {
      this.recommendations.push(...netWorthInsight.recommendations);
    }
    
    // Savings recommendations
    const savingsInsight = this.insights.find(i => i.type === 'savings_analysis');
    if (savingsInsight) {
      this.recommendations.push(...savingsInsight.recommendations);
    }
    
    // Sort by priority
    this.recommendations.sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }
  
  // Get debt recommendations
  getDebtRecommendations(totalDebt, avgInterestRate, debtToIncomeRatio) {
    const recommendations = [];
    
    if (debtToIncomeRatio > 40) {
      recommendations.push({
        type: 'debt',
        priority: 5,
        title: 'High Debt-to-Income Ratio',
        description: `Your debt-to-income ratio is ${debtToIncomeRatio.toFixed(1)}%, which is above the recommended 40%. Consider increasing income or reducing debt.`,
        action: 'Focus on debt reduction strategies or income increase'
      });
    }
    
    if (avgInterestRate > 15) {
      recommendations.push({
        type: 'debt',
        priority: 4,
        title: 'High Interest Rates',
        description: `Your average interest rate is ${avgInterestRate.toFixed(1)}%. Consider debt consolidation or balance transfers.`,
        action: 'Research debt consolidation options'
      });
    }
    
    if (totalDebt > 0) {
      recommendations.push({
        type: 'debt',
        priority: 3,
        title: 'Debt Payoff Strategy',
        description: 'Consider using the debt avalanche method to pay off high-interest debts first.',
        action: 'Implement debt avalanche strategy'
      });
    }
    
    return recommendations;
  }
  
  // Get budget recommendations
  getBudgetRecommendations(budgetVariance, savingsRate, categoryVariances) {
    const recommendations = [];
    
    if (budgetVariance > 20) {
      recommendations.push({
        type: 'budget',
        priority: 4,
        title: 'Over Budget',
        description: `You're spending ${budgetVariance.toFixed(1)}% more than budgeted. Review your spending habits.`,
        action: 'Review and adjust budget categories'
      });
    }
    
    if (savingsRate < 20) {
      recommendations.push({
        type: 'budget',
        priority: 3,
        title: 'Low Savings Rate',
        description: `Your savings rate is ${savingsRate.toFixed(1)}%. Aim for at least 20% of income.`,
        action: 'Increase savings rate by reducing expenses or increasing income'
      });
    }
    
    const topVarianceCategory = categoryVariances[0];
    if (topVarianceCategory && Math.abs(topVarianceCategory.variance) > 30) {
      recommendations.push({
        type: 'budget',
        priority: 2,
        title: 'Category Over Budget',
        description: `${topVarianceCategory.category} is ${Math.abs(topVarianceCategory.variance).toFixed(1)}% over budget.`,
        action: `Review spending in ${topVarianceCategory.category} category`
      });
    }
    
    return recommendations;
  }
  
  // Get net worth recommendations
  getNetWorthRecommendations(netWorthChange, trend) {
    const recommendations = [];
    
    if (netWorthChange < 0) {
      recommendations.push({
        type: 'net_worth',
        priority: 4,
        title: 'Declining Net Worth',
        description: 'Your net worth decreased. Focus on increasing assets or reducing liabilities.',
        action: 'Review asset allocation and debt reduction strategies'
      });
    }
    
    if (trend === 'declining') {
      recommendations.push({
        type: 'net_worth',
        priority: 3,
        title: 'Negative Trend',
        description: 'Your net worth has been declining over time. Consider financial planning.',
        action: 'Create a comprehensive financial plan'
      });
    }
    
    return recommendations;
  }
  
  // Get savings recommendations
  getSavingsRecommendations(goalProgress, savingsConsistency, avgMonthlySaving) {
    const recommendations = [];
    
    if (goalProgress < 50) {
      recommendations.push({
        type: 'savings',
        priority: 3,
        title: 'Low Goal Progress',
        description: `You've saved ${goalProgress.toFixed(1)}% of your goal. Consider increasing monthly savings.`,
        action: 'Increase monthly savings amount'
      });
    }
    
    if (savingsConsistency < 0.7) {
      recommendations.push({
        type: 'savings',
        priority: 2,
        title: 'Inconsistent Savings',
        description: 'Your savings pattern is inconsistent. Set up automatic transfers.',
        action: 'Set up automatic savings transfers'
      });
    }
    
    return recommendations;
  }
  
  // Calculate trend from data points
  calculateTrend(values) {
    if (values.length < 2) return 'stable';
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    
    const change = ((secondAvg - firstAvg) / firstAvg) * 100;
    
    if (change > 5) return 'increasing';
    if (change < -5) return 'declining';
    return 'stable';
  }
  
  // Calculate consistency score (0-1)
  calculateConsistency(values) {
    if (values.length < 2) return 1;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const standardDeviation = Math.sqrt(variance);
    const coefficientOfVariation = mean > 0 ? standardDeviation / mean : 0;
    
    return Math.max(0, 1 - coefficientOfVariation);
  }
  
  // Get monthly income from budget data
  getMonthlyIncome() {
    // This will be set when analyzing budget data
    return this.monthlyIncome || 0;
  }
  
  // Generate financial health score
  generateFinancialHealthScore() {
    let score = 100;
    
    // Debt score (0-40 points)
    const debtInsight = this.insights.find(i => i.type === 'debt_analysis');
    if (debtInsight) {
      const debtToIncomeRatio = debtInsight.data.debtToIncomeRatio;
      if (debtToIncomeRatio > 40) score -= 40;
      else if (debtToIncomeRatio > 30) score -= 30;
      else if (debtToIncomeRatio > 20) score -= 20;
      else if (debtToIncomeRatio > 10) score -= 10;
    }
    
    // Budget score (0-30 points)
    const budgetInsight = this.insights.find(i => i.type === 'budget_analysis');
    if (budgetInsight) {
      const savingsRate = budgetInsight.data.savingsRate;
      if (savingsRate < 5) score -= 30;
      else if (savingsRate < 10) score -= 20;
      else if (savingsRate < 15) score -= 10;
      else if (savingsRate < 20) score -= 5;
    }
    
    // Net worth score (0-20 points)
    const netWorthInsight = this.insights.find(i => i.type === 'net_worth_analysis');
    if (netWorthInsight) {
      if (netWorthInsight.data.trend === 'declining') score -= 20;
      else if (netWorthInsight.data.trend === 'stable') score -= 10;
    }
    
    // Savings score (0-10 points)
    const savingsInsight = this.insights.find(i => i.type === 'savings_analysis');
    if (savingsInsight) {
      const consistency = savingsInsight.data.savingsConsistency;
      if (consistency < 0.5) score -= 10;
      else if (consistency < 0.7) score -= 5;
    }
    
    return Math.max(0, Math.min(100, score));
  }
  
  // Get all insights and recommendations
  getAllInsights() {
    return {
      insights: this.insights,
      recommendations: this.recommendations,
      financialHealthScore: this.generateFinancialHealthScore(),
      timestamp: new Date().toISOString()
    };
  }
}

// Create global instance
window.FinancialInsights = new FinancialInsights();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FinancialInsights;
}
