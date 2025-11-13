/**
 * Comprehensive test for theme dropdown visibility
 * Tests login, opens profile, clicks dropdown, verifies visibility
 */

import puppeteer from 'puppeteer';

const TEST_EMAIL = 'testuser@bfh.com';
const TEST_PASSWORD = 'test1234';
const LIVE_URL = 'https://mobile-debt-tracker.web.app';

class ThemeDropdownTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.consoleLogs = [];
    this.errors = [];
  }

  async setup() {
    this.browser = await puppeteer.launch({ headless: false });
    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1280, height: 720 });
    
    // Capture all console logs
    this.page.on('console', msg => {
      const text = msg.text();
      const type = msg.type();
      this.consoleLogs.push({ type, text, timestamp: new Date().toISOString() });
      if (text.includes('Dropdown') || text.includes('Menu') || text.includes('Theme') || text.includes('Error')) {
        console.log(`[${type.toUpperCase()}] ${text}`);
      }
    });
    
    this.page.on('pageerror', error => {
      this.errors.push(error.message);
      console.error('❌ Page Error:', error.message);
    });
  }

  async teardown() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async login() {
    console.log('\n🔐 Step 1: Logging in...');
    await this.page.goto(`${LIVE_URL}/login.html`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await this.page.type('#email', TEST_EMAIL, { delay: 50 });
    await this.page.type('#password', TEST_PASSWORD, { delay: 50 });
    await this.page.click('#loginBtn');
    
    await Promise.race([
      this.page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 20000 }),
      this.page.waitForFunction(() => window.location.href.includes('index.html') || window.location.href.endsWith('/'), { timeout: 20000 })
    ]);
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('✅ Logged in\n');
  }

  async openProfile() {
    console.log('📱 Step 2: Opening Profile Settings...');
    await this.page.evaluate(() => {
      const profileBtn = document.querySelector('#profileButton') || 
                        document.querySelector('button[onclick*="openProfileModal"]');
      if (profileBtn) profileBtn.click();
      else if (typeof openProfileModal === 'function') openProfileModal();
    });
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('✅ Profile modal opened\n');
  }

  async testDropdown() {
    console.log('🔍 Step 3: Testing Dropdown...\n');
    
    // Check if dropdown elements exist
    const elementsExist = await this.page.evaluate(() => {
      const btn = document.getElementById('themeDropdownBtn');
      const menu = document.getElementById('themeDropdownMenu');
      const text = document.getElementById('themeDropdownText');
      return {
        buttonExists: !!btn,
        menuExists: !!menu,
        textExists: !!text,
        buttonVisible: btn ? window.getComputedStyle(btn).display !== 'none' : false,
        menuChildren: menu ? menu.children.length : 0
      };
    });
    
    console.log('📊 Elements Check:');
    console.log('   Button exists:', elementsExist.buttonExists);
    console.log('   Menu exists:', elementsExist.menuExists);
    console.log('   Text exists:', elementsExist.textExists);
    console.log('   Button visible:', elementsExist.buttonVisible);
    console.log('   Menu children:', elementsExist.menuChildren);
    
    if (!elementsExist.buttonExists || !elementsExist.menuExists) {
      return { success: false, reason: 'Dropdown elements not found' };
    }
    
    // Click dropdown button - use evaluate to trigger handler directly (only once)
    console.log('\n🖱️  Clicking dropdown button...');
    
    const clickResult = await this.page.evaluate(() => {
      const btn = document.getElementById('themeDropdownBtn');
      if (!btn) return { success: false, reason: 'Button not found' };
      
      // Get the onclick handler and call it directly (only once)
      const handler = btn.onclick;
      if (handler) {
        try {
          handler({ stopPropagation: () => {}, preventDefault: () => {} });
          return { success: true, method: 'onclick' };
        } catch (e) {
          return { success: false, error: e.message };
        }
      }
      return { success: false, reason: 'No onclick handler' };
    });
    
    console.log('Click result:', clickResult);
    
    // Wait for menu to appear and styles to be applied
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Wait for menu to be visible
    await this.page.waitForFunction(() => {
      const menu = document.getElementById('themeDropdownMenu');
      if (!menu) return false;
      const display = window.getComputedStyle(menu).display;
      const styleDisplay = menu.style.display;
      return display === 'block' || styleDisplay === 'block';
    }, { timeout: 3000 }).catch(() => console.log('⚠️  Menu not visible after timeout'));
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Check dropdown state
    const dropdownState = await this.page.evaluate(() => {
      const menu = document.getElementById('themeDropdownMenu');
      const btn = document.getElementById('themeDropdownBtn');
      const items = menu ? Array.from(menu.children) : [];
      
      return {
        menuDisplay: menu ? window.getComputedStyle(menu).display : 'none',
        menuStyleDisplay: menu ? menu.style.display : 'none',
        menuVisibility: menu ? window.getComputedStyle(menu).visibility : 'hidden',
        menuOpacity: menu ? window.getComputedStyle(menu).opacity : '0',
        menuZIndex: menu ? window.getComputedStyle(menu).zIndex : 'auto',
        menuPosition: menu ? window.getComputedStyle(menu).position : 'static',
        menuTop: menu ? menu.style.top : '',
        menuLeft: menu ? menu.style.left : '',
        menuWidth: menu ? menu.style.width : '',
        menuParent: menu ? menu.parentElement.tagName : '',
        menuVisible: menu ? menu.offsetParent !== null : false,
        menuRect: menu ? {
          width: menu.getBoundingClientRect().width,
          height: menu.getBoundingClientRect().height,
          top: menu.getBoundingClientRect().top,
          left: menu.getBoundingClientRect().left
        } : null,
        itemCount: items.length,
        items: items.map((item, i) => ({
          index: i,
          text: item.textContent.trim().substring(0, 30),
          display: window.getComputedStyle(item).display,
          visibility: window.getComputedStyle(item).visibility,
          opacity: window.getComputedStyle(item).opacity,
          visible: item.offsetParent !== null,
          rect: {
            width: item.getBoundingClientRect().width,
            height: item.getBoundingClientRect().height,
            top: item.getBoundingClientRect().top,
            left: item.getBoundingClientRect().left
          }
        }))
      };
    });
    
    console.log('\n📊 Dropdown State After Click:');
    console.log('   Menu display (computed):', dropdownState.menuDisplay);
    console.log('   Menu display (style):', dropdownState.menuStyleDisplay);
    console.log('   Menu visibility:', dropdownState.menuVisibility);
    console.log('   Menu opacity:', dropdownState.menuOpacity);
    console.log('   Menu z-index:', dropdownState.menuZIndex);
    console.log('   Menu position:', dropdownState.menuPosition);
    console.log('   Menu top:', dropdownState.menuTop);
    console.log('   Menu left:', dropdownState.menuLeft);
    console.log('   Menu width:', dropdownState.menuWidth);
    console.log('   Menu parent:', dropdownState.menuParent);
    console.log('   Menu visible (offsetParent):', dropdownState.menuVisible);
    if (dropdownState.menuRect) {
      console.log('   Menu rect:', `${dropdownState.menuRect.width}x${dropdownState.menuRect.height} at (${dropdownState.menuRect.left}, ${dropdownState.menuRect.top})`);
    } else {
      console.log('   Menu rect: null');
    }
    console.log('   Item count:', dropdownState.itemCount);
    
    console.log('\n📋 Menu Items:');
    dropdownState.items.forEach((item, i) => {
      console.log(`   ${i + 1}. "${item.text}"`);
      console.log(`      Display: ${item.display}, Visibility: ${item.visibility}, Opacity: ${item.opacity}`);
      if (item.rect) {
        console.log(`      Visible: ${item.visible}, Rect: ${item.rect.width}x${item.rect.height}`);
      } else {
        console.log(`      Visible: ${item.visible}, Rect: null`);
      }
    });
    
    // Check console logs for dropdown-related messages
    const dropdownLogs = this.consoleLogs.filter(log => 
      log.text.includes('Dropdown') || 
      log.text.includes('Menu') || 
      log.text.includes('Theme selector')
    );
    
    console.log('\n📝 Relevant Console Logs:');
    dropdownLogs.slice(-10).forEach(log => {
      console.log(`   [${log.type}] ${log.text}`);
    });
    
    // Determine success
    const isMenuVisible = dropdownState.menuDisplay === 'block' || dropdownState.menuStyleDisplay === 'block';
    const hasValidRect = dropdownState.menuRect && 
                         dropdownState.menuRect.width > 0 && 
                         dropdownState.menuRect.height > 0 &&
                         dropdownState.menuTop !== '' &&
                         dropdownState.menuLeft !== '';
    const hasItems = dropdownState.itemCount === 8;
    const itemsVisible = dropdownState.items.filter(item => item.visible).length;
    
    const success = isMenuVisible && hasValidRect && hasItems && itemsVisible === 8;
    
    console.log('\n✅ Test Results:');
    console.log(`   Menu visible (display): ${isMenuVisible ? 'YES ✅' : 'NO ❌'}`);
    console.log(`   Menu has valid rect: ${hasValidRect ? 'YES ✅' : 'NO ❌'}`);
    console.log(`   Has 8 items: ${hasItems ? 'YES ✅' : 'NO ❌'}`);
    console.log(`   Items visible: ${itemsVisible}/8 ${itemsVisible === 8 ? '✅' : '❌'}`);
    console.log(`   Overall: ${success ? 'PASS ✅' : 'FAIL ❌'}`);
    
    return {
      success,
      details: {
        isMenuVisible,
        hasValidRect,
        hasItems,
        itemsVisible,
        dropdownState,
        consoleLogs: dropdownLogs
      }
    };
  }

  async run() {
    console.log('🚀 Starting Theme Dropdown Visibility Test...');
    console.log(`🌐 Live URL: ${LIVE_URL}\n`);
    
    await this.setup();
    
    try {
      await this.login();
      await this.openProfile();
      const result = await this.testDropdown();
      
      // Take screenshot
      await this.page.screenshot({ path: 'theme-dropdown-test.png', fullPage: false });
      console.log('\n📸 Screenshot saved: theme-dropdown-test.png');
      
      return result;
    } catch (error) {
      console.error('❌ Test error:', error);
      return { success: false, error: error.message };
    } finally {
      await this.teardown();
    }
  }
}

// Run test
const tester = new ThemeDropdownTester();
tester.run().then(result => {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('FINAL RESULT');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log(`Success: ${result.success ? '✅ YES - 100% PASS' : '❌ NO - NEEDS FIX'}\n`);
  process.exit(result.success ? 0 : 1);
}).catch(error => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});

