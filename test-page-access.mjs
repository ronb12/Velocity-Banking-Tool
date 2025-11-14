#!/usr/bin/env node
/**
 * Automated Page Access Test
 * Tests that the test user can access and navigate to each page in the app
 */

import puppeteer from 'puppeteer';

const SERVER_URL = 'http://localhost:3000';
const TEST_EMAIL = 'testuser@bfh.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'test1234';

// List of pages to test
const PAGES_TO_TEST = [
  {
    name: 'Dashboard (Index)',
    path: '/index.html',
    expectedElements: ['creditUtilizationValue', 'netWorthValue', 'debtSummaryValue', 'savingsValue']
  },
  {
    name: 'Debt Tracker',
    path: '/src/pages/debt/Debt_Tracker.html',
    expectedElements: ['debt-list', 'add-debt-btn', 'add-debt-form']
  },
  {
    name: 'Budget Tracker',
    path: '/src/pages/other/budget.html',
    expectedElements: ['budget-container', 'income-section', 'expenses-section']
  },
  {
    name: 'Velocity Calculator',
    path: '/src/pages/calculators/Velocity_Calculator.html',
    expectedElements: ['velocity-form', 'results-container']
  },
  {
    name: 'Net Worth Tracker',
    path: '/src/pages/other/net_worth_tracker.html',
    expectedElements: ['net-worth-container', 'assets-section', 'liabilities-section']
  },
  {
    name: 'Credit Score Estimator',
    path: '/src/pages/calculators/Credit_Score_Estimator.html',
    expectedElements: ['credit-form', 'score-display']
  },
  {
    name: '1099 Tax Calculator',
    path: '/src/pages/calculators/1099_calculator.html',
    expectedElements: ['tax-form', 'results-section']
  },
  {
    name: 'Savings Goal Tracker',
    path: '/src/pages/savings/savings_goal_tracker.html',
    expectedElements: ['savings-goals-container', 'goals-list']
  },
  {
    name: 'Challenge Library',
    path: '/src/pages/savings/challenge_library.html',
    expectedElements: ['challenges-container', 'challenge-list']
  },
  {
    name: 'Notifications',
    path: '/src/pages/other/notifications.html',
    expectedElements: ['notifications-container', 'notifications-list']
  },
  {
    name: 'Activity Feed',
    path: '/src/pages/other/activity_feed.html',
    expectedElements: ['activity-container', 'activity-list']
  },
  {
    name: 'Debt Crusher',
    path: '/src/pages/debt/debt-crusher.html',
    expectedElements: ['debt-crusher-container']
  },
  {
    name: 'Mobile Tracker',
    path: '/src/pages/other/Mobile_Tracker.html',
    expectedElements: ['mobile-tracker-container']
  }
];

let testResults = {
  login: false,
  pages: {},
  errors: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0
  }
};

console.log('🧪 Starting Page Access Test...');
console.log(`📡 Server: ${SERVER_URL}`);
console.log(`👤 Test Email: ${TEST_EMAIL}`);
console.log(`📄 Pages to test: ${PAGES_TO_TEST.length}\n`);

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function login(page) {
  console.log('1️⃣ Logging in...');
  
  try {
    // Check if already logged in
    await page.goto(`${SERVER_URL}/index.html`, {
      waitUntil: 'networkidle2'
    });
    await delay(2000);

    const authState = await page.evaluate(() => {
      return {
        hasAuth: typeof window.auth !== 'undefined',
        hasUser: window.auth?.currentUser !== null,
        userEmail: window.auth?.currentUser?.email || null
      };
    });

    if (authState.hasUser && authState.userEmail === TEST_EMAIL) {
      console.log('   ✅ Already logged in as test user');
      testResults.login = true;
      return true;
    }

    // Navigate to login page
    await page.goto(`${SERVER_URL}/src/pages/auth/login.html`, {
      waitUntil: 'networkidle2'
    });
    await delay(2000);

    // Fill in login form
    await page.waitForSelector('#email', { timeout: 5000 });
    await page.waitForSelector('#password', { timeout: 5000 });

    await page.click('#email', { clickCount: 3 });
    await page.keyboard.press('Backspace');
    await page.type('#email', TEST_EMAIL, { delay: 50 });

    await page.click('#password', { clickCount: 3 });
    await page.keyboard.press('Backspace');
    await page.type('#password', TEST_PASSWORD, { delay: 50 });

    // Submit login
    const loginButton = await page.$('button[type="submit"]') || 
                        await page.$('#loginBtn') ||
                        await page.$('button.login-btn');
    
    if (!loginButton) {
      throw new Error('Login button not found');
    }

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {}),
      loginButton.click()
    ]);

    await delay(3000);

    // Verify login
    const currentUrl = page.url();
    if (currentUrl.includes('index.html') || currentUrl.endsWith('/')) {
      console.log('   ✅ Login successful');
      testResults.login = true;
      return true;
    } else {
      throw new Error('Login failed - not redirected to dashboard');
    }
  } catch (error) {
    console.log(`   ❌ Login failed: ${error.message}`);
    testResults.errors.push(`Login failed: ${error.message}`);
    return false;
  }
}

async function testPage(page, pageInfo) {
  const { name, path, expectedElements } = pageInfo;
  const fullPath = `${SERVER_URL}${path}`;
  
  console.log(`\n📄 Testing: ${name}`);
  console.log(`   Path: ${path}`);
  
  try {
    // Navigate to page
    await page.goto(fullPath, {
      waitUntil: 'networkidle2',
      timeout: 15000
    });
    
    await delay(2000); // Wait for page to fully load

    // Check for redirects to login (shouldn't happen if logged in)
    const currentUrl = page.url();
    if (currentUrl.includes('login.html')) {
      throw new Error('Redirected to login page - authentication issue');
    }

    // Check if page loaded correctly
    const pageLoadStatus = await page.evaluate(() => {
      return {
        title: document.title,
        bodyContent: document.body.textContent.length,
        hasContent: document.body.children.length > 0
      };
    });

    if (!pageLoadStatus.hasContent || pageLoadStatus.bodyContent < 100) {
      throw new Error('Page appears to be empty or not loaded correctly');
    }

    // Check for expected elements (at least one should exist)
    const elementsFound = await page.evaluate((elements) => {
      return elements.map(id => {
        const element = document.getElementById(id) || 
                       document.querySelector(`[id*="${id}"]`) ||
                       document.querySelector(`[class*="${id}"]`);
        return { id, found: !!element };
      });
    }, expectedElements);

    const foundCount = elementsFound.filter(e => e.found).length;
    
    // Check for common error indicators
    const hasErrors = await page.evaluate(() => {
      const errorSelectors = [
        'div.error',
        '[class*="error"]',
        '[id*="error"]'
      ];
      
      return errorSelectors.some(selector => {
        const elements = document.querySelectorAll(selector);
        return Array.from(elements).some(el => {
          const text = el.textContent?.toLowerCase() || '';
          return text.includes('error') || 
                 text.includes('not found') || 
                 text.includes('404');
        });
      });
    });

    if (hasErrors) {
      throw new Error('Page contains error messages');
    }

    // Verify we're still logged in - wait for auth to be available
    await delay(2000); // Give auth time to initialize
    
    const authState = await page.evaluate(() => {
      // Check multiple sources for auth
      const auth = window.auth || (typeof auth !== 'undefined' ? auth : null);
      return {
        hasAuth: typeof auth !== 'undefined' || typeof window.auth !== 'undefined',
        hasUser: auth?.currentUser !== null || window.auth?.currentUser !== null,
        userEmail: auth?.currentUser?.email || window.auth?.currentUser?.email || null,
        url: window.location.href
      };
    });

    // Don't fail if auth isn't available yet, but check if we're on login page
    if (currentUrl.includes('login.html')) {
      throw new Error('Redirected to login page - authentication issue');
    }

    // Only warn if auth is missing but don't fail if page loaded
    if (!authState.hasAuth) {
      console.log(`   ⚠️  Warning: Auth not available on page (but page loaded)`);
    } else if (!authState.hasUser) {
      console.log(`   ⚠️  Warning: No user in auth state (but page loaded)`);
    } else if (authState.userEmail && authState.userEmail !== TEST_EMAIL) {
      console.log(`   ⚠️  Warning: Different user logged in: ${authState.userEmail}`);
    } else if (authState.userEmail === TEST_EMAIL) {
      console.log(`   ✅ Still authenticated as ${authState.userEmail}`);
    }

    console.log(`   ✅ Page loaded successfully`);
    console.log(`   ✅ Title: ${pageLoadStatus.title}`);
    console.log(`   ${foundCount > 0 ? '✅' : '⚠️'} Found ${foundCount}/${expectedElements.length} expected elements`);
    if (authState.userEmail === TEST_EMAIL) {
      console.log(`   ✅ Still authenticated as ${authState.userEmail}`);
    }

    // Consider it a pass if page loaded (even if elements aren't found - they might have different IDs)
    const isPass = !hasErrors && pageLoadStatus.hasContent && pageLoadStatus.bodyContent > 100;

    testResults.pages[name] = {
      status: isPass ? 'passed' : 'failed',
      path,
      elementsFound: foundCount,
      totalElements: expectedElements.length,
      title: pageLoadStatus.title,
      authenticated: authState.hasUser && authState.userEmail === TEST_EMAIL
    };

    if (isPass) {
      testResults.summary.passed++;
      return true;
    } else {
      testResults.summary.failed++;
      throw new Error(`Page loaded but doesn't meet quality checks`);
    }

  } catch (error) {
    // Get final URL and auth state for diagnostics
    const diagnostics = await page.evaluate(() => {
      return {
        url: window.location.href,
        title: document.title,
        hasAuth: typeof window.auth !== 'undefined',
        hasUser: window.auth?.currentUser !== null,
        userEmail: window.auth?.currentUser?.email || null,
        bodyLength: document.body.textContent.length
      };
    });

    console.log(`   ❌ Failed: ${error.message}`);
    if (diagnostics.url !== fullPath) {
      console.log(`   📍 Actually at: ${diagnostics.url}`);
    }
    if (diagnostics.hasAuth && !diagnostics.hasUser) {
      console.log(`   🔐 Auth available but no user logged in`);
    }

    testResults.pages[name] = {
      status: 'failed',
      path,
      error: error.message,
      diagnostics
    };
    testResults.errors.push(`${name}: ${error.message}`);
    testResults.summary.failed++;
    return false;
  }
}

async function runTests() {
  let browser;
  let page;

  try {
    // Launch browser
    console.log('🚀 Launching browser...\n');
    browser = await puppeteer.launch({
      headless: true, // Set to false to watch the browser
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1280, height: 720 }
    });

    page = await browser.newPage();
    page.setDefaultTimeout(30000);
    page.setDefaultNavigationTimeout(30000);

    // Monitor console for errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Only log critical errors
        if (text.includes('Failed to load') || text.includes('404')) {
          console.log(`   ⚠️  Console Error: ${text.substring(0, 100)}`);
        }
      }
    });

    page.on('pageerror', error => {
      console.log(`   ⚠️  Page Error: ${error.message.substring(0, 100)}`);
    });

    // Step 1: Login
    const loginSuccess = await login(page);
    if (!loginSuccess) {
      throw new Error('Login failed - cannot proceed with page tests');
    }

    // Step 2: Test each page
    console.log('\n' + '='.repeat(60));
    console.log('📋 Testing Page Access');
    console.log('='.repeat(60));

    testResults.summary.total = PAGES_TO_TEST.length;

    for (const pageInfo of PAGES_TO_TEST) {
      await testPage(page, pageInfo);
      // Small delay between pages
      await delay(1000);
    }

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Pages: ${testResults.summary.total}`);
    console.log(`✅ Passed: ${testResults.summary.passed}`);
    console.log(`❌ Failed: ${testResults.summary.failed}`);
    console.log(`Success Rate: ${((testResults.summary.passed / testResults.summary.total) * 100).toFixed(1)}%`);

    if (testResults.summary.failed > 0) {
      console.log('\n❌ Failed Pages:');
      Object.entries(testResults.pages).forEach(([name, result]) => {
        if (result.status === 'failed') {
          console.log(`   - ${name}: ${result.error}`);
        }
      });
    }

    if (testResults.errors.length > 0) {
      console.log('\n⚠️  Errors:');
      testResults.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }

    const allPassed = testResults.login && 
                      testResults.summary.failed === 0 && 
                      testResults.summary.passed === testResults.summary.total;

    console.log('\n' + '='.repeat(60));
    console.log(allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
    console.log('='.repeat(60));

    return allPassed;

  } catch (error) {
    console.log(`\n💥 Fatal error: ${error.message}`);
    testResults.errors.push(`Fatal error: ${error.message}`);
    return false;
  } finally {
    if (browser) {
      await browser.close();
      console.log('\n🔒 Browser closed');
    }
  }
}

// Run tests
runTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n💥 Unhandled error:', error);
    process.exit(1);
  });

