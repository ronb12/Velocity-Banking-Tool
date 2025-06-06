// Test runner script
import { auth, db } from './firebase-config.js';
import { startSessionTimer, extendSession } from './auth.js';

// Test suite
const tests = {
    // Password validation tests
    passwordValidation: {
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
    sessionManagement: {
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
    loginAttempts: {
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

// Run tests
async function runTests() {
    console.log('Starting test suite...\n');
    
    let passed = 0;
    let failed = 0;
    let error = 0;
    
    for (const [category, categoryTests] of Object.entries(tests)) {
        console.log(`\n=== ${category.toUpperCase()} ===`);
        
        for (const [testName, testFn] of Object.entries(categoryTests)) {
            try {
                const result = await testFn();
                if (result) {
                    passed++;
                    console.log(`✅ ${testName}: PASSED`);
                } else {
                    failed++;
                    console.log(`❌ ${testName}: FAILED`);
                }
            } catch (e) {
                error++;
                console.log(`⚠️ ${testName}: ERROR - ${e.message}`);
            }
        }
    }
    
    const total = passed + failed + error;
    const successRate = ((passed / total) * 100).toFixed(2);
    
    console.log('\n=== TEST SUMMARY ===');
    console.log(`Total Tests: ${total}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Errors: ${error}`);
    console.log(`Success Rate: ${successRate}%`);
}

// Execute tests
runTests().catch(console.error); 