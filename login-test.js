// Import Firebase services
import { auth } from './firebase-config.js';
import { signInWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';

// Test credentials
const testUser = {
    email: 'testuser@BFH.com',
    password: 'test1234'
};

// Test results
let results = {
    login: null,
    logout: null,
    errors: []
};

// Run login test
async function testLogin() {
    try {
        console.log('Attempting login...');
        const userCredential = await signInWithEmailAndPassword(auth, testUser.email, testUser.password);
        results.login = {
            success: true,
            user: userCredential.user.email
        };
        console.log('Login successful:', userCredential.user.email);
        return true;
    } catch (error) {
        results.login = {
            success: false,
            error: error.message
        };
        results.errors.push(`Login error: ${error.message}`);
        console.error('Login failed:', error.message);
        return false;
    }
}

// Run logout test
async function testLogout() {
    try {
        console.log('Attempting logout...');
        await signOut(auth);
        results.logout = {
            success: true
        };
        console.log('Logout successful');
        return true;
    } catch (error) {
        results.logout = {
            success: false,
            error: error.message
        };
        results.errors.push(`Logout error: ${error.message}`);
        console.error('Logout failed:', error.message);
        return false;
    }
}

// Run all tests
async function runTests() {
    console.log('Starting authentication tests...');
    
    // Test login
    const loginSuccess = await testLogin();
    
    if (loginSuccess) {
        // Wait a moment before testing logout
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Test logout
        await testLogout();
    }
    
    // Display results
    console.log('\nTest Results:');
    console.log('-------------');
    console.log('Login:', results.login.success ? '✅ PASSED' : '❌ FAILED');
    if (!results.login.success) {
        console.log('Login Error:', results.login.error);
    }
    
    console.log('Logout:', results.logout.success ? '✅ PASSED' : '❌ FAILED');
    if (!results.logout.success) {
        console.log('Logout Error:', results.logout.error);
    }
    
    if (results.errors.length > 0) {
        console.log('\nErrors:');
        results.errors.forEach(error => console.log('-', error));
    }
}

// Run the tests
runTests(); 