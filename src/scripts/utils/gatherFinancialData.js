/**
 * Gather Financial Data Utility
 * Collects all financial data from various sources
 */

export async function gatherAllFinancialData() {
  const data = {};
  
  // Get data from localStorage (fallback for when Firebase is not available)
  try {
    // Debts
    const debtsData = localStorage.getItem('debts');
    if (debtsData) {
      data.debts = JSON.parse(debtsData);
    }
    
    // Budgets
    const budgetsData = localStorage.getItem('budgets');
    if (budgetsData) {
      data.budgets = JSON.parse(budgetsData);
    }
    
    // Savings Goals
    const savingsData = localStorage.getItem('savingsGoals');
    if (savingsData) {
      data.savingsGoals = JSON.parse(savingsData);
    }
    
    // Net Worth
    const netWorthData = localStorage.getItem('netWorth');
    if (netWorthData) {
      data.netWorth = JSON.parse(netWorthData);
    }
    
    // Velocity Calculations
    const velocityData = localStorage.getItem('velocityCalculations');
    if (velocityData) {
      data.velocityCalculations = JSON.parse(velocityData);
    }
    
    // Tax Calculations
    const taxData = localStorage.getItem('taxCalculations');
    if (taxData) {
      data.taxCalculations = JSON.parse(taxData);
    }
    
    // Activity Logs
    const activityData = localStorage.getItem('activityLogs');
    if (activityData) {
      data.activityLogs = JSON.parse(activityData);
    }
    
  } catch (error) {
    console.warn('Error gathering local data:', error);
  }
  
  return data;
}

export async function gatherUserData(userId, db, USE_FIRESTORE) {
  const userData = {};
  
  if (!USE_FIRESTORE) {
    throw new Error('Firestore disabled in local environment');
  }
  
  try {
    // Get debts
    try {
      const debtsRef = db.doc(`debts/${userId}`);
      const debtsSnap = await debtsRef.get();
      if (debtsSnap.exists()) {
        userData.debts = debtsSnap.data().debts || [];
        console.log('Fetched debts from Firestore:', userData.debts);
      } else {
        console.log('No debts document found for user:', userId);
      }
    } catch (error) {
      console.warn('Could not fetch debts:', error.message);
    }
    
    // Get budget
    try {
      const budgetRef = db.doc(`budgets/${userId}_${new Date().toISOString().slice(0,7)}`);
      const budgetSnap = await budgetRef.get();
      if (budgetSnap.exists()) {
        userData.budget = budgetSnap.data();
      }
    } catch (error) {
      console.warn('Could not fetch budget:', error.message);
    }
    
    // Get net worth
    try {
      const netWorthRef = db.doc(`networth/${userId}`);
      const netWorthSnap = await netWorthRef.get();
      if (netWorthSnap.exists()) {
        userData.netWorth = netWorthSnap.data().history || [];
      }
    } catch (error) {
      console.warn('Could not fetch net worth:', error.message);
    }
    
    // Get savings
    try {
      const savingsRef = db.doc(`savings/${userId}`);
      const savingsSnap = await savingsRef.get();
      if (savingsSnap.exists()) {
        userData.savings = savingsSnap.data().goals || [];
      }
    } catch (error) {
      console.warn('Could not fetch savings:', error.message);
    }
    
  } catch (error) {
    console.error('Error gathering user data:', error);
    throw error; // Re-throw to be handled by caller
  }
  
  return userData;
}

