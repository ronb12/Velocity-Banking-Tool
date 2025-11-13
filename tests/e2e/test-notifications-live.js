/**
 * Automated test to login and check notifications on live site
 * Run with: node test-notifications-live.js
 */

const puppeteer = require('puppeteer');

const TEST_EMAIL = 'testuser@bfh.com';
const TEST_PASSWORD = 'test1234';
const LIVE_URL = 'https://mobile-debt-tracker.web.app/login.html';
const NOTIFICATIONS_URL = 'https://mobile-debt-tracker.web.app/notifications.html';

async function testNotifications() {
  console.log('🚀 Starting notifications test...');
  console.log(`📧 Test Email: ${TEST_EMAIL}`);
  console.log(`🌐 Live URL: ${LIVE_URL}\n`);

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });

    // Capture all console logs
    const consoleLogs = [];
    page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      consoleLogs.push({ type, text, timestamp: new Date().toISOString() });
      if (text.includes('[Auth]') || text.includes('[Login]') || text.includes('[Notifications]') || 
          text.includes('Error') || text.includes('success') || text.includes('failed')) {
        console.log(`[${type.toUpperCase()}] ${text}`);
      }
    });

    page.on('pageerror', error => {
      console.error('❌ Page Error:', error.message);
    });

    // Step 1: Navigate to login page
    console.log('📄 Step 1: Navigating to login page...');
    await page.goto(LIVE_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForSelector('#email', { timeout: 10000 });
    console.log('✅ Login page loaded\n');

    // Step 2: Login
    console.log('🔐 Step 2: Logging in...');
    await page.type('#email', TEST_EMAIL, { delay: 50 });
    await page.type('#password', TEST_PASSWORD, { delay: 50 });
    await page.click('#loginBtn');
    console.log('✅ Login button clicked\n');

    // Wait for login to complete and redirect
    console.log('⏳ Waiting for login to complete...');
    try {
      await Promise.race([
        page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 }),
        page.waitForFunction(() => {
          return window.location.pathname.includes('index.html') || 
                 window.location.pathname === '/';
        }, { timeout: 15000 })
      ]);
      console.log('✅ Login successful, redirected\n');
    } catch (error) {
      console.log('⚠️  Navigation timeout, checking current state...');
    }

    // Wait a bit for page to fully load
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Step 3: Navigate to notifications page
    console.log('📬 Step 3: Navigating to notifications page...');
    await page.goto(NOTIFICATIONS_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    console.log('✅ Notifications page loaded\n');

    // Wait for page to initialize
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Step 4: Check if notifications are displayed
    console.log('🔍 Step 4: Checking for notifications...');
    
    const notificationsState = await page.evaluate(() => {
      const container = document.getElementById('notifications');
      const loading = document.getElementById('loading');
      const stats = {
        total: document.getElementById('totalNotifications')?.textContent || '0',
        unread: document.getElementById('unreadNotifications')?.textContent || '0',
        read: document.getElementById('readNotifications')?.textContent || '0'
      };

      return {
        containerExists: !!container,
        containerVisible: container ? window.getComputedStyle(container).display !== 'none' : false,
        containerChildren: container ? container.children.length : 0,
        containerInnerHTML: container ? container.innerHTML.length : 0,
        loadingVisible: loading ? window.getComputedStyle(loading).display !== 'none' : false,
        stats: stats,
        hasEmptyState: container ? container.querySelector('.empty-state') !== null : false,
        hasNotifications: container ? container.querySelectorAll('.notification').length : 0,
        notificationElements: container ? Array.from(container.querySelectorAll('.notification')).map((el, i) => ({
          index: i,
          visible: window.getComputedStyle(el).display !== 'none',
          height: window.getComputedStyle(el).height,
          message: el.querySelector('.notification-message')?.textContent?.trim() || '',
          hasActions: el.querySelector('.notification-actions') !== null
        })) : [],
        authUser: window.auth?.currentUser?.email || null
      };
    });

    console.log('📊 Notifications Page State:');
    console.log(`   Container Exists: ${notificationsState.containerExists}`);
    console.log(`   Container Visible: ${notificationsState.containerVisible}`);
    console.log(`   Container Children: ${notificationsState.containerChildren}`);
    console.log(`   Container InnerHTML Length: ${notificationsState.containerInnerHTML}`);
    console.log(`   Loading Visible: ${notificationsState.loadingVisible}`);
    console.log(`   Stats - Total: ${notificationsState.stats.total}, Unread: ${notificationsState.stats.unread}, Read: ${notificationsState.stats.read}`);
    console.log(`   Has Empty State: ${notificationsState.hasEmptyState}`);
    console.log(`   Notification Elements Found: ${notificationsState.hasNotifications}`);
    console.log(`   Auth User: ${notificationsState.authUser || 'null'}\n`);

    if (notificationsState.hasNotifications > 0) {
      console.log('✅ SUCCESS: Notifications are displayed!');
      console.log(`   Found ${notificationsState.hasNotifications} notification(s)\n`);
      
      console.log('📋 Notification Details:');
      notificationsState.notificationElements.forEach((notif, i) => {
        console.log(`   Notification ${i + 1}:`);
        console.log(`     Visible: ${notif.visible}`);
        console.log(`     Height: ${notif.height}`);
        console.log(`     Message: ${notif.message.substring(0, 60)}...`);
        console.log(`     Has Actions: ${notif.hasActions}`);
      });
      console.log('');

      return { 
        success: true, 
        message: `Found ${notificationsState.hasNotifications} notification(s)`,
        count: notificationsState.hasNotifications,
        stats: notificationsState.stats
      };
    } else if (notificationsState.hasEmptyState) {
      console.log('⚠️  Empty state displayed - no notifications found');
      console.log(`   Stats show: Total=${notificationsState.stats.total}, Unread=${notificationsState.stats.unread}\n`);
      
      // Check if stats show notifications but none are displayed
      if (parseInt(notificationsState.stats.total) > 0) {
        console.log('❌ ISSUE: Stats show notifications exist but none are displayed!');
        return { 
          success: false, 
          message: 'Stats show notifications but none displayed',
          stats: notificationsState.stats
        };
      } else {
        console.log('ℹ️  No notifications in database/storage');
        return { 
          success: true, 
          message: 'No notifications (expected for new user)',
          count: 0
        };
      }
    } else {
      console.log('❌ FAILED: No notifications found and no empty state');
      console.log(`   Container children: ${notificationsState.containerChildren}`);
      console.log(`   Container innerHTML length: ${notificationsState.containerInnerHTML}\n`);

      // Print relevant console logs
      console.log('📝 Relevant Console Logs:');
      consoleLogs.filter(log => 
        log.text.includes('[Notifications]') || 
        log.text.includes('[Auth]') ||
        log.text.includes('Error')
      ).forEach(log => {
        console.log(`   [${log.timestamp}] ${log.text}`);
      });
      console.log('');

      return { 
        success: false, 
        message: 'No notifications displayed and no empty state',
        state: notificationsState
      };
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
testNotifications()
  .then(result => {
    console.log('\n📋 Test Summary:');
    console.log(`   Success: ${result.success ? '✅ YES' : '❌ NO'}`);
    console.log(`   Message: ${result.message}`);
    if (result.count !== undefined) {
      console.log(`   Notifications Found: ${result.count}`);
    }
    if (result.stats) {
      console.log(`   Stats: Total=${result.stats.total}, Unread=${result.stats.unread}, Read=${result.stats.read}`);
    }
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });

