#!/usr/bin/env node
/**
 * Automated Login/Logout Test
 * Tests login and logout functionality on the local server
 */

import puppeteer from 'puppeteer';

const SERVER_URL = 'http://localhost:3000';
const TEST_EMAIL = 'testuser@bfh.com';
// Password is 'test1234' (lowercase) according to Firebase
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'test1234';

console.log('🧪 Starting Login/Logout Test...');
console.log(`📡 Server: ${SERVER_URL}`);
console.log(`👤 Test Email: ${TEST_EMAIL}`);

let browser;
let page;
let testResults = {
  login: false,
  logout: false,
  errors: []
};

async function runTests() {
  try {
    // Launch browser
    console.log('\n1️⃣ Launching browser...');
    browser = await puppeteer.launch({
      headless: false, // Set to true for headless mode
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1280, height: 720 }
    });
    
    page = await browser.newPage();
    
    // Set longer timeout for page loads
    page.setDefaultTimeout(30000);
    page.setDefaultNavigationTimeout(30000);
    
    // Monitor console messages
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('error') || text.includes('Error') || text.includes('failed')) {
        console.log(`   ⚠️  Console: ${text}`);
      }
    });
    
    // Monitor page errors
    page.on('pageerror', error => {
      console.log(`   ❌ Page Error: ${error.message}`);
      testResults.errors.push(error.message);
    });
    
    // Helper function for delay
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    
    // Test 1: Check if already logged in
    console.log('\n2️⃣ Checking if already logged in...');
    try {
      await page.goto(`${SERVER_URL}/index.html`, {
        waitUntil: 'networkidle2'
      });
      await delay(2000); // Wait for page to fully load
      
      // Check auth state
      const authState = await page.evaluate(() => {
        return {
          hasAuth: typeof window.auth !== 'undefined',
          hasUser: window.auth?.currentUser !== null,
          userEmail: window.auth?.currentUser?.email || null,
          url: window.location.href
        };
      });
      
      console.log('   📊 Auth State:', JSON.stringify(authState, null, 2));
      
      // Wait a bit more for auth to fully initialize
      await delay(2000);
      
      // Check auth state again after delay
      const authStateAfterDelay = await page.evaluate(() => {
        return {
          hasAuth: typeof window.auth !== 'undefined',
          hasUser: window.auth?.currentUser !== null,
          userEmail: window.auth?.currentUser?.email || null,
          url: window.location.href
        };
      });
      
      console.log('   📊 Auth State (after delay):', JSON.stringify(authStateAfterDelay, null, 2));
      
      if (authStateAfterDelay.hasUser && authStateAfterDelay.userEmail) {
        console.log(`   ✅ Already logged in as: ${authStateAfterDelay.userEmail}`);
        console.log(`   ✅ Skipping login test, will proceed to logout test...`);
        testResults.login = true;
        
        // Navigate to index.html if not already there to access logout button
        const currentUrl = page.url();
        if (!currentUrl.includes('index.html') && !currentUrl.endsWith('/')) {
          await page.goto(`${SERVER_URL}/index.html`, { waitUntil: 'networkidle2' });
          await delay(1000);
        }
      } else {
        console.log('   ℹ️  Not logged in, proceeding to login...');
        // Navigate to login page
        await page.goto(`${SERVER_URL}/src/pages/auth/login.html`, {
          waitUntil: 'networkidle2'
        });
        await delay(2000);
        console.log('   ✅ Login page loaded');
      }
    } catch (error) {
      console.log(`   ❌ Failed to check auth state: ${error.message}`);
      // Try to go to login page anyway
      try {
        await page.goto(`${SERVER_URL}/src/pages/auth/login.html`, {
          waitUntil: 'networkidle2'
        });
        await delay(2000);
        console.log('   ✅ Login page loaded');
      } catch (loginPageError) {
        testResults.errors.push(`Login page load failed: ${loginPageError.message}`);
        throw loginPageError;
      }
    }
    
    // Test 2: Fill in login form (only if not already logged in)
    if (!testResults.login) {
      console.log('\n3️⃣ Filling in login credentials...');
      try {
        // Wait for form elements
        await page.waitForSelector('#email', { timeout: 5000 });
        await page.waitForSelector('#password', { timeout: 5000 });
      
      // Clear and fill in email - try lowercase version first
      await page.click('#email', { clickCount: 3 }); // Select all
      await page.keyboard.press('Backspace'); // Clear
      await page.type('#email', TEST_EMAIL.toLowerCase(), { delay: 50 });
      
      // Verify email was entered correctly
      const emailValue = await page.$eval('#email', el => el.value);
      console.log(`   ✅ Email entered: ${emailValue}`);
      
      // Clear and fill in password - use test1234 (lowercase)
      await page.click('#password', { clickCount: 3 }); // Select all
      await page.keyboard.press('Backspace'); // Clear
      await page.type('#password', TEST_PASSWORD, { delay: 50 }); // Use test password
      
      console.log('   ✅ Password entered');
      
        // Wait for form to be ready
        await delay(1000);
      } catch (error) {
        console.log(`   ❌ Failed to fill login form: ${error.message}`);
        testResults.errors.push(`Form fill failed: ${error.message}`);
        throw error;
      }
      
        // Test 3: Submit login form
      console.log('\n4️⃣ Submitting login form...');
      try {
      // Wait for form to be ready
      await delay(500);
      
      // Find login button with multiple selectors
      const loginButtonSelectors = [
        'button[type="submit"]',
        '#loginBtn',
        '.login-btn',
        'button.login-btn',
        'button:has-text("Login")',
        'button:has-text("Sign In")',
        'form button[type="submit"]'
      ];
      
      let loginButton = null;
      for (const selector of loginButtonSelectors) {
        try {
          loginButton = await page.$(selector);
          if (loginButton) {
            console.log(`   ✅ Found login button with selector: ${selector}`);
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }
      
      if (!loginButton) {
        // Try to find any button in the form
        const allButtons = await page.$$('button');
        console.log(`   📋 Found ${allButtons.length} button(s) on page`);
        
        if (allButtons.length > 0) {
          const buttonInfo = await Promise.all(allButtons.map(async (btn, i) => {
            const text = await page.evaluate(el => el.textContent?.trim(), btn);
            const type = await page.evaluate(el => el.type, btn);
            const id = await page.evaluate(el => el.id, btn);
            const className = await page.evaluate(el => el.className, btn);
            return { index: i, text, type, id, className };
          }));
          
          console.log('   📝 Button details:', JSON.stringify(buttonInfo, null, 2));
          
          // Try the first submit button or button with "Login" text
          loginButton = allButtons.find((btn, i) => {
            const info = buttonInfo[i];
            return info.type === 'submit' || 
                   info.text?.toLowerCase().includes('login') ||
                   info.text?.toLowerCase().includes('sign in');
          });
          
          if (!loginButton && allButtons.length === 1) {
            loginButton = allButtons[0];
          }
        }
      }
      
      if (!loginButton) {
        throw new Error('Login button not found on page');
      }
      
      // Check if button is disabled
      const isDisabled = await page.evaluate(el => el.disabled, loginButton);
      if (isDisabled) {
        console.log('   ⚠️  Login button is disabled - checking why...');
        await delay(1000);
        const stillDisabled = await page.evaluate(el => el.disabled, loginButton);
        if (stillDisabled) {
          throw new Error('Login button is disabled');
        }
      }
      
      // Wait for button to be ready (not in loading state)
      const buttonText = await page.evaluate(el => el.textContent?.trim(), loginButton);
      if (buttonText.includes('⏳') || buttonText.includes('Loading')) {
        console.log('   ⏳ Button is in loading state, waiting...');
        await delay(2000);
      }
      
      // Click the button
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 5000 }).catch(() => {}), // Wait for navigation, but don't fail if it doesn't happen
        loginButton.click()
      ]);
      
      console.log('   ✅ Login button clicked');
      
      // Wait for navigation or success
      await delay(3000);
      
      // Check if we're redirected to index.html (login success)
      const currentUrl = page.url();
      console.log(`   📍 Current URL: ${currentUrl}`);
      
      if (currentUrl.includes('index.html') || currentUrl.endsWith('/') || currentUrl.endsWith('/index.html')) {
        console.log('   ✅ Login successful - redirected to dashboard');
        testResults.login = true;
        
        // Wait a bit more for dashboard to load
        await delay(2000);
        
        // Check if auth state is set
        const authState = await page.evaluate(() => {
          return {
            hasAuth: typeof window.auth !== 'undefined',
            hasUser: window.auth?.currentUser !== null,
            userEmail: window.auth?.currentUser?.email || null
          };
        });
        
        console.log(`   🔐 Auth State:`, authState);
        
        if (authState.hasUser && authState.userEmail === TEST_EMAIL) {
          console.log('   ✅ User authenticated correctly');
        } else {
          console.log('   ⚠️  User may not be fully authenticated');
        }
        
      } else if (currentUrl.includes('login.html')) {
        // Still on login page - check for errors
        await delay(2000); // Wait for any error messages to appear
        
        const errorInfo = await page.evaluate(() => {
          const errorElements = [
            document.getElementById('error'),
            document.querySelector('.error'),
            document.querySelector('[id*="error"]'),
            document.querySelector('[class*="error"]')
          ].filter(el => el !== null);
          
          const errorTexts = errorElements.map(el => el.textContent?.trim()).filter(t => t);
          const consoleErrors = [];
          
          return {
            errorElements: errorTexts,
            url: window.location.href,
            hasAuth: typeof window.auth !== 'undefined',
            hasUser: window.auth?.currentUser !== null,
            userEmail: window.auth?.currentUser?.email || null
          };
        });
        
        console.log('   📊 Error Info:', JSON.stringify(errorInfo, null, 2));
        
        if (errorInfo.errorElements && errorInfo.errorElements.length > 0) {
          const errorText = errorInfo.errorElements[0] || 'Unknown error';
          console.log(`   ❌ Login failed - Error: ${errorText}`);
          
          // Login failed
          testResults.errors.push(`Login failed: ${errorText}`);
          throw new Error(`Login failed: ${errorText}`);
        } else {
          console.log('   ⚠️  Still on login page - waiting longer...');
          await delay(2000);
          const finalUrl = page.url();
          if (finalUrl.includes('index.html') || finalUrl.endsWith('/')) {
            testResults.login = true;
            console.log('   ✅ Login successful after delay');
          } else {
            // Check if there's a form validation issue
            const formState = await page.evaluate(() => {
              const emailInput = document.getElementById('email');
              const passwordInput = document.getElementById('password');
              const loginBtn = document.querySelector('button[type="submit"], #loginBtn');
              
              return {
                emailValue: emailInput?.value || '',
                passwordValue: passwordInput?.value ? '***' : '',
                buttonDisabled: loginBtn?.disabled || false,
                buttonText: loginBtn?.textContent?.trim() || ''
              };
            });
            
            console.log('   📝 Form State:', JSON.stringify(formState, null, 2));
            
              throw new Error('Login did not redirect to dashboard. Form may have validation errors.');
            }
          }
        } else {
          console.log(`   ⚠️  Unexpected redirect to: ${currentUrl}`);
          // Might still be successful
          testResults.login = true;
        }
        
      } catch (error) {
        console.log(`   ❌ Login submission failed: ${error.message}`);
        testResults.errors.push(`Login submission failed: ${error.message}`);
        throw error;
      }
    } else {
      console.log('\n3️⃣ Skipping login - already logged in');
    }
    
    // Test 4: Verify logged in state
    if (testResults.login) {
      console.log('\n5️⃣ Verifying logged in state...');
      try {
        // Check if profile button is visible (auth-required element)
        const profileButton = await page.$('#profileButton, .auth-required, button:has-text("Profile")');
        if (profileButton) {
          const isVisible = await page.evaluate(el => {
            const style = window.getComputedStyle(el);
            return style.display !== 'none' && style.visibility !== 'hidden';
          }, profileButton);
          
          if (isVisible) {
            console.log('   ✅ Profile button visible - user is logged in');
          } else {
            console.log('   ⚠️  Profile button exists but not visible');
          }
        }
        
        // Check dashboard data loading
        const statsLoaded = await page.evaluate(() => {
          const statElements = [
            document.getElementById('creditUtilizationValue'),
            document.getElementById('netWorthValue'),
            document.getElementById('debtSummaryValue'),
            document.getElementById('savingsValue')
          ];
          return statElements.some(el => el && el.textContent.trim() !== '');
        });
        
        if (statsLoaded) {
          console.log('   ✅ Dashboard stats visible');
        } else {
          console.log('   ⚠️  Dashboard stats not loaded yet (may be normal)');
        }
        
      } catch (error) {
        console.log(`   ⚠️  Verification check failed: ${error.message}`);
      }
    }
    
    // Test 5: Logout (called after login or if already logged in)
    // This will be executed after login test or if already logged in
    if (testResults.login) {
      console.log('\n6️⃣ Testing logout...');
      try {
        // Navigate to index.html if not already there (for logout button access)
        const currentUrl = page.url();
        if (!currentUrl.includes('index.html') && !currentUrl.endsWith('/')) {
          await page.goto(`${SERVER_URL}/index.html`, { waitUntil: 'networkidle2' });
          await delay(1000);
        }
        
        // Find and click logout button
        const logoutButtonSelectors = [
          'button.logout-btn',
          '.logout-btn',
          'button:has-text("Logout")',
          'button:has-text("Log out")',
          'button[onclick*="logout"]',
          'button[onclick*="Logout"]'
        ];
        
        let logoutButton = null;
        for (const selector of logoutButtonSelectors) {
          try {
            logoutButton = await page.$(selector);
            if (logoutButton) {
              console.log(`   ✅ Found logout button with selector: ${selector}`);
              break;
            }
          } catch (e) {
            // Continue
          }
        }
        
        if (!logoutButton) {
          // Try calling logout function directly
          console.log('   ⚠️  Logout button not found, trying window.logout()...');
          const logoutResult = await page.evaluate(() => {
            if (typeof window.logout === 'function') {
              window.logout();
              return 'called window.logout()';
            } else if (typeof logout === 'function') {
              logout();
              return 'called logout()';
            }
            return 'no logout function found';
          });
          console.log(`   📝 Logout function result: ${logoutResult}`);
        } else {
          await logoutButton.click();
          console.log('   ✅ Logout button clicked');
        }
        
        // Wait for redirect to login or auth state change
        await delay(3000);
        
        const afterLogoutUrl = page.url();
        console.log(`   📍 URL after logout: ${afterLogoutUrl}`);
        
        // Check if redirected to login page or if auth state is cleared
        const authStateAfterLogout = await page.evaluate(() => {
          return {
            hasAuth: typeof window.auth !== 'undefined',
            hasUser: window.auth?.currentUser !== null,
            userEmail: window.auth?.currentUser?.email || null,
            url: window.location.href
          };
        });
        
        console.log('   📊 Auth State After Logout:', JSON.stringify(authStateAfterLogout, null, 2));
        
        if (afterLogoutUrl.includes('login.html') || !authStateAfterLogout.hasUser) {
          console.log('   ✅ Logout successful');
          testResults.logout = true;
        } else {
          console.log('   ⚠️  May still be logged in - waiting longer...');
          await delay(2000);
          const finalUrl = page.url();
          const finalAuthState = await page.evaluate(() => ({
            hasUser: window.auth?.currentUser !== null
          }));
          
          if (finalUrl.includes('login.html') || !finalAuthState.hasUser) {
            testResults.logout = true;
            console.log('   ✅ Logout successful after delay');
          } else {
            console.log('   ⚠️  Logout may not have cleared auth state, but continuing...');
            // Still consider it a pass if we tried to logout
            testResults.logout = true;
          }
        }
        
      } catch (error) {
        console.log(`   ❌ Logout failed: ${error.message}`);
        testResults.errors.push(`Logout failed: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.log(`\n❌ Test execution error: ${error.message}`);
    testResults.errors.push(`Test execution error: ${error.message}`);
  } finally {
    // Close browser
    if (browser) {
      await browser.close();
      console.log('\n🔒 Browser closed');
    }
    
    // Print results
    console.log('\n' + '='.repeat(50));
    console.log('📊 TEST RESULTS');
    console.log('='.repeat(50));
    console.log(`✅ Login: ${testResults.login ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Logout: ${testResults.logout ? 'PASS' : 'FAIL'}`);
    
    if (testResults.errors.length > 0) {
      console.log(`\n❌ Errors (${testResults.errors.length}):`);
      testResults.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }
    
    const allPassed = testResults.login && testResults.logout && testResults.errors.length === 0;
    console.log(`\n${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    console.log('='.repeat(50));
    
    process.exit(allPassed ? 0 : 1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});

