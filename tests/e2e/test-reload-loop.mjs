/**
 * Automated test to detect reload loops in the app
 * Run with: node tests/e2e/test-reload-loop.mjs
 */

import puppeteer from 'puppeteer';

const LIVE_URL = 'https://mobile-debt-tracker.web.app/';
const TEST_DURATION = 15000; // 15 seconds
const MAX_RELOADS = 3; // If more than 3 reloads in 15 seconds, it's a loop

let reloadCount = 0;
let navigationEvents = [];
let consoleErrors = [];
let serviceWorkerIssues = [];

async function testReloadLoop() {
  console.log('🚀 Starting reload loop detection test...');
  console.log(`🌐 Testing URL: ${LIVE_URL}`);
  console.log(`⏱️  Test Duration: ${TEST_DURATION / 1000} seconds\n`);

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security'
      ]
    });

    const page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({ width: 1280, height: 720 });

    // Track navigation events (reloads)
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) {
        const timestamp = new Date().toISOString();
        reloadCount++;
        navigationEvents.push({
          count: reloadCount,
          url: frame.url(),
          timestamp
        });
        console.log(`🔄 Navigation #${reloadCount} at ${timestamp}`);
      }
    });

    // Capture console logs
    page.on('console', msg => {
      const text = msg.text();
      const type = msg.type();
      
      // Check for service worker messages
      if (text.includes('[SW Unregister]') || text.includes('service worker') || text.includes('ServiceWorker')) {
        serviceWorkerIssues.push({ type, text, timestamp: new Date().toISOString() });
      }
      
      // Check for reload guard messages
      if (text.includes('[Reload Guard]')) {
        console.log(`⚠️  [Reload Guard] ${text}`);
      }
      
      // Check for auth redirect messages
      if (text.includes('[Auth]') && text.includes('Redirecting')) {
        console.log(`🔄 [Auth Redirect] ${text}`);
      }
      
      // Check for errors
      if (type === 'error') {
        consoleErrors.push({ text, timestamp: new Date().toISOString() });
        console.log(`❌ Console Error: ${text}`);
      }
    });

    // Capture page errors
    page.on('pageerror', error => {
      consoleErrors.push({ 
        text: error.message, 
        stack: error.stack,
        timestamp: new Date().toISOString() 
      });
      console.error('❌ Page Error:', error.message);
    });

    // Capture request failures
    page.on('requestfailed', request => {
      const url = request.url();
      const failure = request.failure();
      if (failure && !url.includes('favicon')) {
        consoleErrors.push({
          text: `Request failed: ${url}`,
          error: failure.errorText,
          timestamp: new Date().toISOString()
        });
        console.error(`❌ Request Failed: ${url} - ${failure.errorText}`);
      }
    });

    // Navigate to the app
    console.log('📄 Navigating to app...');
    const startTime = Date.now();
    
    try {
      await page.goto(LIVE_URL, { 
        waitUntil: 'networkidle0', 
        timeout: 30000 
      });
      console.log('✅ Initial page load complete\n');
    } catch (error) {
      console.error('❌ Failed to load page:', error.message);
    }

    // Wait and monitor for reloads
    console.log(`⏳ Monitoring for reloads for ${TEST_DURATION / 1000} seconds...\n`);
    
    // Monitor for the test duration
    await new Promise(resolve => setTimeout(resolve, TEST_DURATION));

    // Check service worker status
    const swStatus = await page.evaluate(() => {
      return {
        hasServiceWorker: 'serviceWorker' in navigator,
        controller: navigator.serviceWorker?.controller ? {
          scriptURL: navigator.serviceWorker.controller.scriptURL,
          state: navigator.serviceWorker.controller.state
        } : null,
        ready: navigator.serviceWorker?.controller !== null
      };
    });

    // Get final URL
    const finalUrl = page.url();
    const endTime = Date.now();
    const testDuration = endTime - startTime;

    // Analyze results
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('Reload Loop Test Results');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log(`📊 Test Duration: ${(testDuration / 1000).toFixed(2)} seconds`);
    console.log(`🔄 Total Reloads: ${reloadCount}`);
    console.log(`📍 Final URL: ${finalUrl}`);
    console.log(`❌ Console Errors: ${consoleErrors.length}`);
    console.log(`⚠️  Service Worker Issues: ${serviceWorkerIssues.length}\n`);

    // Check for reload loop
    const hasReloadLoop = reloadCount > MAX_RELOADS;
    
    if (hasReloadLoop) {
      console.log('❌ RELOAD LOOP DETECTED!');
      console.log(`   Found ${reloadCount} reloads in ${(testDuration / 1000).toFixed(2)} seconds`);
      console.log(`   Maximum allowed: ${MAX_RELOADS} reloads\n`);
      
      console.log('📋 Navigation Events:');
      navigationEvents.forEach((event, index) => {
        console.log(`   ${index + 1}. ${event.timestamp} - ${event.url}`);
      });
    } else {
      console.log('✅ No reload loop detected');
      console.log(`   Only ${reloadCount} reload(s) detected (within acceptable range)\n`);
      
      if (reloadCount > 0) {
        console.log('📋 Navigation Events:');
        navigationEvents.forEach((event, index) => {
          console.log(`   ${index + 1}. ${event.timestamp} - ${event.url}`);
        });
      }
    }

    // Service worker status
    console.log('\n🔧 Service Worker Status:');
    console.log(`   Has Service Worker API: ${swStatus.hasServiceWorker}`);
    console.log(`   Active Controller: ${swStatus.controller ? 'Yes' : 'No'}`);
    if (swStatus.controller) {
      console.log(`   Controller State: ${swStatus.controller.state}`);
      console.log(`   Controller Script: ${swStatus.controller.scriptURL}`);
    }

    // Console errors
    if (consoleErrors.length > 0) {
      console.log('\n❌ Console Errors Found:');
      consoleErrors.slice(0, 10).forEach((error, index) => {
        console.log(`   ${index + 1}. ${error.text}`);
        if (error.stack) {
          console.log(`      Stack: ${error.stack.split('\n')[0]}`);
        }
      });
      if (consoleErrors.length > 10) {
        console.log(`   ... and ${consoleErrors.length - 10} more errors`);
      }
    }

    // Service worker issues
    if (serviceWorkerIssues.length > 0) {
      console.log('\n⚠️  Service Worker Messages:');
      serviceWorkerIssues.slice(0, 5).forEach((issue, index) => {
        console.log(`   ${index + 1}. [${issue.type}] ${issue.text.substring(0, 100)}`);
      });
    }

    // Recommendations
    console.log('\n💡 Recommendations:');
    if (hasReloadLoop) {
      console.log('   ❌ Fix required: Reload loop detected');
      if (swStatus.controller) {
        console.log('   - Unregister service worker');
        console.log('   - Clear service worker cache');
      }
      if (consoleErrors.length > 0) {
        console.log('   - Fix JavaScript errors that may cause reloads');
      }
      if (serviceWorkerIssues.length > 0) {
        console.log('   - Check service worker registration/unregistration logic');
      }
    } else {
      console.log('   ✅ No immediate action required');
      if (reloadCount > 0) {
        console.log('   ℹ️  Some reloads detected but within acceptable range');
      }
      if (consoleErrors.length > 0) {
        console.log('   ⚠️  Consider fixing console errors');
      }
    }

    console.log('\n═══════════════════════════════════════════════════════════\n');

    await browser.close();

    // Return test result
    return {
      hasReloadLoop,
      reloadCount,
      testDuration,
      consoleErrors: consoleErrors.length,
      serviceWorkerIssues: serviceWorkerIssues.length,
      serviceWorkerActive: swStatus.controller !== null
    };

  } catch (error) {
    console.error('❌ Test Error:', error);
    if (browser) {
      await browser.close();
    }
    throw error;
  }
}

// Run the test
testReloadLoop()
  .then(result => {
    if (result.hasReloadLoop) {
      console.log('❌ Test FAILED: Reload loop detected');
      process.exit(1);
    } else {
      console.log('✅ Test PASSED: No reload loop detected');
      process.exit(0);
    }
  })
  .catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });

