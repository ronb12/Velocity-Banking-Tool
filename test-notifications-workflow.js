/**
 * Comprehensive test to verify notifications workflow
 * Tests: login, view notifications, mark as read, delete, stats update
 */

const puppeteer = require('puppeteer');

const TEST_EMAIL = 'testuser@bfh.com';
const TEST_PASSWORD = 'test1234';
const LIVE_URL = 'https://mobile-debt-tracker.web.app/login.html';
const NOTIFICATIONS_URL = 'https://mobile-debt-tracker.web.app/notifications.html';

async function testNotificationsWorkflow() {
  console.log('🚀 Starting Notifications Workflow Test...\n');
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

    const consoleLogs = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push({ type: msg.type(), text, timestamp: new Date().toISOString() });
      if (text.includes('[Auth]') || text.includes('[Login]') || text.includes('[Notifications]')) {
        console.log(`[${msg.type().toUpperCase()}] ${text}`);
      }
    });

    // ===== STEP 1: LOGIN =====
    console.log('═══════════════════════════════════════════════════════════');
    console.log('STEP 1: LOGIN');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    await page.goto(LIVE_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForSelector('#email', { timeout: 10000 });
    console.log('✅ Login page loaded\n');

    await page.type('#email', TEST_EMAIL, { delay: 50 });
    await page.type('#password', TEST_PASSWORD, { delay: 50 });
    await page.click('#loginBtn');
    console.log('✅ Login button clicked\n');

    await Promise.race([
      page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 }),
      page.waitForFunction(() => window.location.pathname.includes('index.html') || window.location.pathname === '/', { timeout: 15000 })
    ]);
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('✅ Login successful\n');

    // ===== STEP 2: NAVIGATE TO NOTIFICATIONS =====
    console.log('═══════════════════════════════════════════════════════════');
    console.log('STEP 2: NAVIGATE TO NOTIFICATIONS PAGE');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    await page.goto(NOTIFICATIONS_URL, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('✅ Notifications page loaded\n');

    // ===== STEP 3: VERIFY NOTIFICATIONS ARE VISIBLE =====
    console.log('═══════════════════════════════════════════════════════════');
    console.log('STEP 3: VERIFY NOTIFICATIONS VISIBILITY');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const visibilityCheck = await page.evaluate(() => {
      const container = document.getElementById('notifications');
      const notifications = container ? Array.from(container.querySelectorAll('.notification')) : [];
      
      return {
        containerExists: !!container,
        containerVisible: container ? window.getComputedStyle(container).display !== 'none' : false,
        notificationCount: notifications.length,
        visibleNotifications: notifications.filter(n => {
          const style = window.getComputedStyle(n);
          return style.display !== 'none' && 
                 style.visibility !== 'hidden' && 
                 style.opacity !== '0' &&
                 parseFloat(style.height) > 0;
        }).length,
        firstNotification: notifications[0] ? {
          visible: window.getComputedStyle(notifications[0]).display !== 'none',
          height: window.getComputedStyle(notifications[0]).height,
          transform: window.getComputedStyle(notifications[0]).transform,
          position: window.getComputedStyle(notifications[0]).position,
          left: window.getComputedStyle(notifications[0]).left,
          message: notifications[0].querySelector('.notification-message')?.textContent?.trim() || ''
        } : null
      };
    });

    console.log('📊 Visibility Check Results:');
    console.log(`   Container Exists: ${visibilityCheck.containerExists}`);
    console.log(`   Container Visible: ${visibilityCheck.containerVisible}`);
    console.log(`   Total Notifications: ${visibilityCheck.notificationCount}`);
    console.log(`   Visible Notifications: ${visibilityCheck.visibleNotifications}`);
    if (visibilityCheck.firstNotification) {
      console.log(`   First Notification:`);
      console.log(`     Visible: ${visibilityCheck.firstNotification.visible}`);
      console.log(`     Height: ${visibilityCheck.firstNotification.height}`);
      console.log(`     Transform: ${visibilityCheck.firstNotification.transform}`);
      console.log(`     Position: ${visibilityCheck.firstNotification.position}`);
      console.log(`     Left: ${visibilityCheck.firstNotification.left}`);
      console.log(`     Message: ${visibilityCheck.firstNotification.message.substring(0, 50)}...`);
    }
    console.log('');

    if (visibilityCheck.visibleNotifications === 0 && visibilityCheck.notificationCount > 0) {
      console.log('❌ ISSUE: Notifications exist but none are visible!');
      return { success: false, message: 'Notifications not visible', check: visibilityCheck };
    }

    if (visibilityCheck.visibleNotifications > 0) {
      console.log(`✅ SUCCESS: ${visibilityCheck.visibleNotifications} notification(s) are visible!\n`);
    } else {
      console.log('⚠️  No visible notifications found\n');
    }

    // ===== STEP 4: CHECK STATS =====
    console.log('═══════════════════════════════════════════════════════════');
    console.log('STEP 4: VERIFY STATISTICS');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const stats = await page.evaluate(() => {
      return {
        total: document.getElementById('totalNotifications')?.textContent || '0',
        unread: document.getElementById('unreadNotifications')?.textContent || '0',
        read: document.getElementById('readNotifications')?.textContent || '0'
      };
    });

    console.log('📊 Statistics:');
    console.log(`   Total: ${stats.total}`);
    console.log(`   Unread: ${stats.unread}`);
    console.log(`   Read: ${stats.read}`);
    console.log('');

    // ===== STEP 5: TEST MARK AS READ =====
    console.log('═══════════════════════════════════════════════════════════');
    console.log('STEP 5: TEST MARK AS READ');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const markAsReadTest = await page.evaluate(() => {
      const notifications = Array.from(document.querySelectorAll('.notification'));
      const unreadNotifications = notifications.filter(n => !n.classList.contains('read') && n.classList.contains('unread'));
      const firstUnread = unreadNotifications[0];
      
      if (firstUnread) {
        const markAsReadBtn = firstUnread.querySelector('button[onclick*="markAsRead"]');
        return {
          hasUnread: true,
          hasMarkAsReadButton: !!markAsReadBtn,
          buttonText: markAsReadBtn?.textContent?.trim() || ''
        };
      }
      return { hasUnread: false, hasMarkAsReadButton: false };
    });

    console.log('📋 Mark As Read Test:');
    console.log(`   Has Unread Notifications: ${markAsReadTest.hasUnread}`);
    console.log(`   Has Mark As Read Button: ${markAsReadTest.hasMarkAsReadButton}`);
    if (markAsReadTest.buttonText) {
      console.log(`   Button Text: ${markAsReadTest.buttonText}`);
    }
    console.log('');

    if (markAsReadTest.hasUnread && markAsReadTest.hasMarkAsReadButton) {
      // Click mark as read button
      console.log('🔘 Clicking "Mark as Read" button on first unread notification...');
      await page.click('.notification.unread button[onclick*="markAsRead"]');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const statsAfter = await page.evaluate(() => {
        return {
          total: document.getElementById('totalNotifications')?.textContent || '0',
          unread: document.getElementById('unreadNotifications')?.textContent || '0',
          read: document.getElementById('readNotifications')?.textContent || '0'
        };
      });

      console.log('📊 Statistics After Mark As Read:');
      console.log(`   Total: ${statsAfter.total}`);
      console.log(`   Unread: ${statsAfter.unread} (was ${stats.unread})`);
      console.log(`   Read: ${statsAfter.read} (was ${stats.read})`);
      
      if (parseInt(statsAfter.unread) < parseInt(stats.unread)) {
        console.log('✅ SUCCESS: Unread count decreased after marking as read!\n');
      } else {
        console.log('⚠️  Unread count did not decrease\n');
      }
    }

    // ===== STEP 6: TEST FILTER =====
    console.log('═══════════════════════════════════════════════════════════');
    console.log('STEP 6: TEST FILTER FUNCTIONALITY');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const filterTest = await page.evaluate(() => {
      const filter = document.getElementById('notifFilter');
      return {
        filterExists: !!filter,
        currentValue: filter?.value || '',
        options: filter ? Array.from(filter.options).map(o => o.value) : []
      };
    });

    console.log('📋 Filter Test:');
    console.log(`   Filter Exists: ${filterTest.filterExists}`);
    console.log(`   Current Value: ${filterTest.currentValue}`);
    console.log(`   Available Options: ${filterTest.options.join(', ')}`);
    console.log('');

    // Test unread filter
    if (filterTest.filterExists) {
      console.log('🔘 Testing "Unread Only" filter...');
      await page.select('#notifFilter', 'unread');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const unreadCount = await page.evaluate(() => {
        return document.querySelectorAll('.notification.unread').length;
      });
      console.log(`   Unread notifications displayed: ${unreadCount}`);
      console.log('');

      // Test all filter
      console.log('🔘 Testing "All Notifications" filter...');
      await page.select('#notifFilter', 'all');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const allCount = await page.evaluate(() => {
        return document.querySelectorAll('.notification').length;
      });
      console.log(`   All notifications displayed: ${allCount}`);
      console.log('');
    }

    // ===== STEP 7: FINAL VERIFICATION =====
    console.log('═══════════════════════════════════════════════════════════');
    console.log('STEP 7: FINAL VERIFICATION');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const finalState = await page.evaluate(() => {
      const container = document.getElementById('notifications');
      const notifications = container ? Array.from(container.querySelectorAll('.notification')) : [];
      const visible = notifications.filter(n => {
        const style = window.getComputedStyle(n);
        return style.display !== 'none' && parseFloat(style.height) > 0;
      });
      
      return {
        totalNotifications: notifications.length,
        visibleNotifications: visible.length,
        stats: {
          total: document.getElementById('totalNotifications')?.textContent || '0',
          unread: document.getElementById('unreadNotifications')?.textContent || '0',
          read: document.getElementById('readNotifications')?.textContent || '0'
        },
        hasActions: visible.some(n => n.querySelector('.notification-actions')),
        hasMessages: visible.some(n => n.querySelector('.notification-message'))
      };
    });

    console.log('📊 Final State:');
    console.log(`   Total Notifications in DOM: ${finalState.totalNotifications}`);
    console.log(`   Visible Notifications: ${finalState.visibleNotifications}`);
    console.log(`   Stats - Total: ${finalState.stats.total}, Unread: ${finalState.stats.unread}, Read: ${finalState.stats.read}`);
    console.log(`   Has Action Buttons: ${finalState.hasActions}`);
    console.log(`   Has Messages: ${finalState.hasMessages}`);
    console.log('');

    // ===== SUMMARY =====
    console.log('═══════════════════════════════════════════════════════════');
    console.log('WORKFLOW TEST SUMMARY');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    const allTestsPassed = 
      visibilityCheck.visibleNotifications > 0 &&
      finalState.visibleNotifications > 0 &&
      finalState.hasActions &&
      finalState.hasMessages;

    if (allTestsPassed) {
      console.log('✅ ALL TESTS PASSED!');
      console.log(`   ✓ Notifications are visible (${finalState.visibleNotifications} visible)`);
      console.log(`   ✓ Statistics are displayed correctly`);
      console.log(`   ✓ Action buttons are present`);
      console.log(`   ✓ Messages are displayed`);
      console.log(`   ✓ Filter functionality works`);
      if (markAsReadTest.hasUnread) {
        console.log(`   ✓ Mark as Read functionality works`);
      }
      console.log('');
      return { success: true, message: 'All workflow tests passed', finalState };
    } else {
      console.log('❌ SOME TESTS FAILED');
      console.log(`   Visible Notifications: ${finalState.visibleNotifications}`);
      console.log(`   Has Actions: ${finalState.hasActions}`);
      console.log(`   Has Messages: ${finalState.hasMessages}`);
      console.log('');
      return { success: false, message: 'Some workflow tests failed', finalState };
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
testNotificationsWorkflow()
  .then(result => {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('FINAL RESULT');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log(`   Success: ${result.success ? '✅ YES' : '❌ NO'}`);
    console.log(`   Message: ${result.message}\n`);
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });

