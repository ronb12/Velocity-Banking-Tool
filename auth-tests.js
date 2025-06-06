// Authentication test suite
import { auth, db } from './firebase-config.js';
import { startSessionTimer, extendSession } from './auth.js';

const authTests = {
    // Password validation tests
    testPasswordValidation: {
        validateWeakPassword: () => {
            const password = 'password';
            const requirements = {
                length: password.length >= 8,
                lowercase: /[a-z]/.test(password),
                uppercase: /[A-Z]/.test(password),
                number: /[0-9]/.test(password),
                special: /[^a-zA-Z0-9]/.test(password)
            };
            return !Object.values(requirements).every(Boolean);
        },

        validateMediumPassword: () => {
            const password = 'Password123';
            const requirements = {
                length: password.length >= 8,
                lowercase: /[a-z]/.test(password),
                uppercase: /[A-Z]/.test(password),
                number: /[0-9]/.test(password),
                special: /[^a-zA-Z0-9]/.test(password)
            };
            return Object.values(requirements).filter(Boolean).length === 4;
        },

        validateStrongPassword: () => {
            const password = 'P@ssw0rd123!';
            const requirements = {
                length: password.length >= 8,
                lowercase: /[a-z]/.test(password),
                uppercase: /[A-Z]/.test(password),
                number: /[0-9]/.test(password),
                special: /[^a-zA-Z0-9]/.test(password)
            };
            return Object.values(requirements).every(Boolean);
        }
    },

    // Session management tests
    testSessionManagement: {
        startSession: () => {
            const timer = startSessionTimer();
            return timer !== null;
        },

        extendSession: () => {
            const result = extendSession();
            return result === true;
        }
    },

    // Login attempt tests
    testLoginAttempts: {
        trackAttempts: () => {
            const attempts = parseInt(localStorage.getItem('loginAttempts')) || 0;
            localStorage.setItem('loginAttempts', attempts + 1);
            return parseInt(localStorage.getItem('loginAttempts')) === attempts + 1;
        },

        resetAttempts: () => {
            localStorage.setItem('loginAttempts', '0');
            return parseInt(localStorage.getItem('loginAttempts')) === 0;
        }
    }
};

// Run authentication tests
const runAuthTests = async () => {
    let passed = 0;
    let failed = 0;
    let results = [];
    
    for (const category in authTests) {
        for (const test in authTests[category]) {
            try {
                const result = await authTests[category][test]();
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
    
    console.log('Authentication Test Results:');
    console.log('---------------------------');
    results.forEach(result => console.log(result));
    console.log('---------------------------');
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
export { authTests, runAuthTests }; 