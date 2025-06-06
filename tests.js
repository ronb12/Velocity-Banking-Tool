// Test suite for Velocity Banking Tool
import { auth, db } from './firebase-config.js';

const tests = {
    // Authentication tests
    testAuth: {
        validatePassword: () => {
            const weakPassword = 'password';
            const mediumPassword = 'Password123';
            const strongPassword = 'P@ssw0rd123!';
            
            const weakResult = validatePassword(weakPassword);
            const mediumResult = validatePassword(mediumPassword);
            const strongResult = validatePassword(strongPassword);
            
            return !weakResult && mediumResult && strongResult;
        },
        
        checkPasswordStrength: () => {
            const password = 'P@ssw0rd123!';
            const strength = checkPasswordStrength(password);
            return strength === 'strong';
        },
        
        sessionManagement: () => {
            const sessionTimer = startSessionTimer();
            return sessionTimer !== null;
        }
    },

    // Budget tests
    testBudget: {
        addIncome: () => {
            const income = { source: 'Salary', amount: 5000 };
            addIncome(income.source, income.amount);
            const savedIncome = storage.get('income');
            return savedIncome && savedIncome.some(i => i.source === income.source && i.amount === income.amount);
        },
        
        addExpense: () => {
            const expense = { category: 'Housing', description: 'Rent', amount: 1500 };
            addExpense(expense.category, expense.description, expense.amount);
            const savedExpenses = storage.get('expenses');
            return savedExpenses && savedExpenses.some(e => 
                e.category === expense.category && 
                e.description === expense.description && 
                e.amount === expense.amount
            );
        },
        
        zeroBasedBudget: () => {
            const income = 5000;
            const expenses = [
                { amount: 2000 },
                { amount: 1500 },
                { amount: 1500 }
            ];
            return calculateRemaining(income, expenses) === 0;
        }
    },
    
    // Debt tracker tests
    testDebtTracker: {
        addDebt: () => {
            const debt = {
                name: 'Credit Card',
                balance: 5000,
                interest: 15,
                payment: 200
            };
            addDebt(debt.name, debt.balance, debt.interest, debt.payment);
            const savedDebts = storage.get('debts');
            return savedDebts && savedDebts.some(d => 
                d.name === debt.name && 
                d.balance === debt.balance && 
                d.interest === debt.interest && 
                d.payment === debt.payment
            );
        },
        
        calculateAmortization: () => {
            const debt = {
                balance: 5000,
                interest: 15,
                payment: 200
            };
            const schedule = calculateAmortization(debt.balance, debt.interest, debt.payment);
            return schedule && schedule.length > 0 && schedule[0].payment === debt.payment;
        }
    },
    
    // Velocity calculator tests
    testVelocityCalculator: {
        calculateStrategy: () => {
            const inputs = {
                income: 5000,
                expenses: 3000,
                debt: 10000,
                interest: 15,
                payment: 200
            };
            const strategy = calculateVelocityStrategy(inputs);
            return strategy && strategy.payoffDate && strategy.totalInterest;
        }
    },
    
    // Utility function tests
    testUtilities: {
        formatCurrency: () => {
            return formatCurrency(1000) === '$1,000.00';
        },
        
        validateNumber: () => {
            try {
                validateNumber('100', 0, 1000);
                return true;
            } catch (e) {
                return false;
            }
        },
        
        sanitizeInput: () => {
            const input = '<script>alert("test")</script>';
            return sanitizeInput(input) === 'scriptalert("test")/script';
        }
    }
};

// Run all tests
const runTests = async () => {
    let passed = 0;
    let failed = 0;
    let results = [];
    
    for (const category in tests) {
        for (const test in tests[category]) {
            try {
                const result = await tests[category][test]();
                if (result) {
                    passed++;
                    results.push(`✅ ${category}.${test}: PASSED`);
                } else {
                    failed++;
                    results.push(`❌ ${category}.${test}: FAILED`);
                }
            } catch (error) {
                failed++;
                results.push(`❌ ${category}.${test}: ERROR - ${error.message}`);
            }
        }
    }
    
    console.log('Test Results:');
    console.log('-------------');
    results.forEach(result => console.log(result));
    console.log('-------------');
    console.log(`Total: ${passed + failed}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Success Rate: ${((passed / (passed + failed)) * 100).toFixed(2)}%`);
    
    return {
        passed,
        failed,
        total: passed + failed,
        successRate: (passed / (passed + failed)) * 100
    };
};

// Export test suite
export { tests, runTests }; 