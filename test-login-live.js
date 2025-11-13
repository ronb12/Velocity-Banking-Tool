/**
 * Automated test to login to live site with test user credentials
 * Run with: node test-login-live.js
 */

const puppeteer = require('puppeteer');

const TEST_EMAIL = 'testuser@bfh.com';
const TEST_PASSWORD = 'test1234'; // Update if different
const LIVE_URL = 'https://mobile-debt-tracker.web.app/login.html';

async function testLogin() {
  console.log('🚀 Starting automated login test...');
  console.log(`📧 Test Email: ${TEST_EMAIL}`);
  console.log(`🌐 Live URL: ${LIVE_URL}\n`);

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: false, // Set to true for headless mode
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({ width: 1280, height: 720 });

    // Enable console logging - capture all logs
    const consoleLogs = [];
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      consoleLogs.push({ type, text, timestamp: new Date().toISOString() });
      if (text.includes('[Auth]') || text.includes('[Login]') || text.includes('Error') || text.includes('success') || text.includes('failed')) {
        console.log(`[${type.toUpperCase()}] ${text}`);
      }
    });

    // Capture page errors
    page.on('pageerror', error => {
      console.error('❌ Page Error:', error.message);
    });

    // Capture request failures
    page.on('requestfailed', request => {
      console.error('❌ Request Failed:', request.url(), request.failure()?.errorText);
    });

    // Navigate to login page
    console.log('📄 Navigating to login page...');
    await page.goto(LIVE_URL, { waitUntil: 'networkidle2', timeout: 30000 });

    // Wait for page to load
    await page.waitForSelector('#email', { timeout: 10000 });
    console.log('✅ Login page loaded\n');

    // Fill in credentials
    console.log('✍️  Filling in credentials...');
    await page.type('#email', TEST_EMAIL, { delay: 50 });
    await page.type('#password', TEST_PASSWORD, { delay: 50 });
    console.log('✅ Credentials entered\n');

    // Click login button
    console.log('🔘 Clicking login button...');
    await page.click('#loginBtn');
    console.log('✅ Login button clicked\n');

    // Wait for login to complete
    console.log('⏳ Waiting for login to complete (up to 20 seconds)...');
    
    try {
      // Wait for navigation, error, or auth state change
      await Promise.race([
        page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 20000 }).then(() => 'navigation'),
        page.waitForFunction(() => {
          const url = window.location.href;
          return url.includes('index.html') || url.endsWith('/') || url.endsWith('/mobile-debt-tracker.web.app/');
        }, { timeout: 20000 }).then(() => 'url-change'),
        page.waitForFunction(() => {
          return window.auth?.currentUser?.email === 'testuser@bfh.com';
        }, { timeout: 20000 }).then(() => 'auth-state'),
        new Promise(resolve => setTimeout(() => resolve('timeout'), 20000))
      ]);

      // Wait a bit for any async operations
      await page.waitForTimeout(2000);

      // Check current URL
      const currentUrl = page.url();
      console.log(`📍 Current URL: ${currentUrl}\n`);

      // Get detailed page state
      const pageState = await page.evaluate(() => {
        return {
          url: window.location.href,
          pathname: window.location.pathname,
          authUser: window.auth?.currentUser?.email || null,
          authVerified: window.auth?.currentUser?.emailVerified || false,
          errorElements: Array.from(document.querySelectorAll('.error, [class*="error"]')).map(el => ({
            text: el.textContent.trim(),
            visible: el.offsetParent !== null
          })),
          toastElements: Array.from(document.querySelectorAll('.toast')).map(el => ({
            text: el.textContent.trim(),
            visible: el.style.visibility !== 'hidden'
          })),
          loadingVisible: document.getElementById('loading')?.style.display !== 'none'
        };
      });

      console.log('📊 Detailed Page State:');
      console.log(`   URL: ${pageState.url}`);
      console.log(`   Pathname: ${pageState.pathname}`);
      console.log(`   Auth User: ${pageState.authUser || 'null'}`);
      console.log(`   Email Verified: ${pageState.authVerified}`);
      console.log(`   Error Elements: ${pageState.errorElements.length}`);
      pageState.errorElements.forEach((err, i) => {
        console.log(`     Error ${i + 1}: "${err.text}" (visible: ${err.visible})`);
      });
      console.log(`   Toast Elements: ${pageState.toastElements.length}`);
      pageState.toastElements.forEach((toast, i) => {
        console.log(`     Toast ${i + 1}: "${toast.text}" (visible: ${toast.visible})`);
      });
      console.log(`   Loading Visible: ${pageState.loadingVisible}\n`);

      // Check if we're on index.html (successful login)
      if (currentUrl.includes('index.html') || currentUrl.endsWith('/') || pageState.pathname === '/') {
        console.log('✅ SUCCESS: Login appears to be successful!');
        console.log('✅ Redirected to index page\n');

        if (pageState.authUser === TEST_EMAIL.toLowerCase()) {
          console.log('✅ CONFIRMED: User is logged in correctly!');
          return { success: true, message: 'Login successful', logs: consoleLogs };
        } else if (pageState.authUser) {
          console.log(`⚠️  WARNING: Different user logged in: ${pageState.authUser}`);
          return { success: false, message: `Wrong user: ${pageState.authUser}`, logs: consoleLogs };
        } else {
          console.log('⚠️  WARNING: Redirected but user not confirmed logged in');
          return { success: false, message: 'Redirected but auth state unclear', logs: consoleLogs };
        }
      } else {
        console.log('❌ FAILED: Still on login page or error occurred');
        
        // Print relevant console logs
        console.log('\n📝 Relevant Console Logs:');
        consoleLogs.filter(log => 
          log.text.includes('[Auth]') || 
          log.text.includes('[Login]') || 
          log.text.includes('Error') || 
          log.text.includes('failed') ||
          log.text.includes('success')
        ).forEach(log => {
          console.log(`   [${log.timestamp}] ${log.text}`);
        });
        console.log('');

        if (pageState.errorElements.length > 0) {
          const errorText = pageState.errorElements.map(e => e.text).join('; ');
          console.log(`❌ Error Messages: ${errorText}\n`);
          return { success: false, message: errorText, logs: consoleLogs };
        } else if (pageState.authUser) {
          console.log(`⚠️  User appears logged in (${pageState.authUser}) but still on login page\n`);
          return { success: false, message: 'User logged in but not redirected', logs: consoleLogs };
        } else {
          console.log(`❌ No error messages found, but login did not succeed\n`);
          return { success: false, message: 'Login failed with no error message', logs: consoleLogs };
        }
      }
    } catch (error) {
      console.log(`⏱️  Timeout or error: ${error.message}\n`);
      
      // Check current state
      const currentUrl = page.url();
      const pageContent = await page.evaluate(() => {
        return {
          url: window.location.href,
          title: document.title,
          hasError: !!document.querySelector('.error'),
          errorText: document.querySelector('.error')?.textContent || '',
          hasToast: !!document.querySelector('.toast'),
          toastText: document.querySelector('.toast')?.textContent || ''
        };
      });

      console.log('📊 Final Page State:');
      console.log(`   URL: ${pageContent.url}`);
      console.log(`   Title: ${pageContent.title}`);
      console.log(`   Has Error: ${pageContent.hasError}`);
      if (pageContent.hasError) console.log(`   Error: ${pageContent.errorText}`);
      console.log(`   Has Toast: ${pageContent.hasToast}`);
      if (pageContent.hasToast) console.log(`   Toast: ${pageContent.toastText}\n`);

      // Print relevant console logs
      console.log('\n📝 Relevant Console Logs:');
      consoleLogs.filter(log => 
        log.text.includes('[Auth]') || 
        log.text.includes('[Login]') || 
        log.text.includes('Error') || 
        log.text.includes('failed')
      ).forEach(log => {
        console.log(`   [${log.timestamp}] ${log.text}`);
      });
      console.log('');

      return { success: false, message: `Timeout: ${error.message}`, logs: consoleLogs };
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    return { success: false, message: error.message };
  } finally {
    if (browser) {
      console.log('🔒 Closing browser...');
      await browser.close();
    }
  }
}

// Run the test
testLogin()
  .then(result => {
    console.log('\n📋 Test Summary:');
    console.log(`   Success: ${result.success ? '✅ YES' : '❌ NO'}`);
    console.log(`   Message: ${result.message}`);
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });

