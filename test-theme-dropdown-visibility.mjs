/**
 * Test theme dropdown visibility on live app
 * Checks if all theme options are visible when dropdown is opened
 */

import puppeteer from 'puppeteer';

const TEST_EMAIL = 'testuser@bfh.com';
const TEST_PASSWORD = 'test1234';
const LIVE_URL = 'https://mobile-debt-tracker.web.app';

class DropdownVisibilityTester {
  constructor() {
    this.browser = null;
    this.page = null;
  }

  async setup() {
    this.browser = await puppeteer.launch({ headless: false });
    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1280, height: 720 });
    
    // Capture all console logs
    this.page.on('console', msg => {
      const text = msg.text();
      console.log(`[${msg.type().toUpperCase()}] ${text}`);
    });
  }

  async teardown() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async login() {
    console.log('\n🔐 Logging in...');
    await this.page.goto(`${LIVE_URL}/login.html`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await this.page.type('#email', TEST_EMAIL, { delay: 50 });
    await this.page.type('#password', TEST_PASSWORD, { delay: 50 });
    await this.page.click('#loginBtn');
    
    await Promise.race([
      this.page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 20000 }),
      this.page.waitForFunction(() => window.location.href.includes('index.html') || window.location.href.endsWith('/'), { timeout: 20000 })
    ]);
    
    console.log('✅ Logged in\n');
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  async testDropdown() {
    console.log('📱 Opening Profile Settings...');
    
    // Open profile modal
    await this.page.evaluate(() => {
      const profileBtn = document.querySelector('#profileButton') || 
                        document.querySelector('button[onclick*="openProfileModal"]');
      if (profileBtn) profileBtn.click();
      else if (typeof openProfileModal === 'function') openProfileModal();
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check dropdown state before clicking
    const beforeClick = await this.page.evaluate(() => {
      const btn = document.getElementById('themeDropdownBtn');
      const menu = document.getElementById('themeDropdownMenu');
      const text = document.getElementById('themeDropdownText');
      
      return {
        buttonExists: !!btn,
        menuExists: !!menu,
        textExists: !!text,
        buttonText: text?.textContent || '',
        menuDisplay: menu ? window.getComputedStyle(menu).display : 'none',
        menuChildren: menu ? menu.children.length : 0,
        menuVisible: menu ? window.getComputedStyle(menu).visibility : 'hidden',
        menuOpacity: menu ? window.getComputedStyle(menu).opacity : '0',
        menuZIndex: menu ? window.getComputedStyle(menu).zIndex : 'auto'
      };
    });
    
    console.log('\n📊 Before Clicking Dropdown:');
    console.log('   Button exists:', beforeClick.buttonExists);
    console.log('   Menu exists:', beforeClick.menuExists);
    console.log('   Button text:', beforeClick.buttonText);
    console.log('   Menu display:', beforeClick.menuDisplay);
    console.log('   Menu children:', beforeClick.menuChildren);
    console.log('   Menu visibility:', beforeClick.menuVisible);
    console.log('   Menu opacity:', beforeClick.menuOpacity);
    console.log('   Menu z-index:', beforeClick.menuZIndex);
    
    // Click dropdown button
    console.log('\n🖱️  Clicking dropdown button...');
    await this.page.click('#themeDropdownBtn');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check dropdown state after clicking
    const afterClick = await this.page.evaluate(() => {
      const menu = document.getElementById('themeDropdownMenu');
      const items = menu ? Array.from(menu.children) : [];
      
      return {
        menuDisplay: menu ? window.getComputedStyle(menu).display : 'none',
        menuVisible: menu ? window.getComputedStyle(menu).visibility : 'hidden',
        menuOpacity: menu ? window.getComputedStyle(menu).opacity : '0',
        menuZIndex: menu ? window.getComputedStyle(menu).zIndex : 'auto',
        menuHeight: menu ? menu.offsetHeight : 0,
        menuWidth: menu ? menu.offsetWidth : 0,
        menuTop: menu ? menu.offsetTop : 0,
        menuLeft: menu ? menu.offsetLeft : 0,
        itemCount: items.length,
        items: items.map((item, i) => ({
          index: i,
          text: item.textContent.trim(),
          display: window.getComputedStyle(item).display,
          visibility: window.getComputedStyle(item).visibility,
          opacity: window.getComputedStyle(item).opacity,
          height: item.offsetHeight,
          width: item.offsetWidth,
          visible: item.offsetParent !== null,
          zIndex: window.getComputedStyle(item).zIndex
        }))
      };
    });
    
    console.log('\n📊 After Clicking Dropdown:');
    console.log('   Menu display:', afterClick.menuDisplay);
    console.log('   Menu visibility:', afterClick.menuVisible);
    console.log('   Menu opacity:', afterClick.menuOpacity);
    console.log('   Menu z-index:', afterClick.menuZIndex);
    console.log('   Menu dimensions:', `${afterClick.menuWidth}x${afterClick.menuHeight}`);
    console.log('   Menu position:', `top: ${afterClick.menuTop}, left: ${afterClick.menuLeft}`);
    console.log('   Item count:', afterClick.itemCount);
    
    console.log('\n📋 Menu Items:');
    afterClick.items.forEach((item, i) => {
      console.log(`   ${i + 1}. "${item.text}"`);
      console.log(`      Display: ${item.display}, Visibility: ${item.visibility}, Opacity: ${item.opacity}`);
      console.log(`      Dimensions: ${item.width}x${item.height}, Visible: ${item.visible}`);
      console.log(`      Z-index: ${item.zIndex}`);
    });
    
    // Take a screenshot
    await this.page.screenshot({ path: 'dropdown-test.png', fullPage: false });
    console.log('\n📸 Screenshot saved: dropdown-test.png');
    
    // Check if menu is actually visible
    const isMenuVisible = afterClick.menuDisplay === 'block' && 
                         afterClick.menuVisible !== 'hidden' && 
                         parseFloat(afterClick.menuOpacity) > 0 &&
                         afterClick.itemCount > 0;
    
    const visibleItems = afterClick.items.filter(item => item.visible).length;
    
    console.log('\n✅ Test Results:');
    console.log(`   Menu is visible: ${isMenuVisible ? 'YES' : 'NO'}`);
    console.log(`   Items created: ${afterClick.itemCount}/8`);
    console.log(`   Items visible: ${visibleItems}/8`);
    
    if (isMenuVisible && visibleItems === 8) {
      console.log('\n✅ SUCCESS: All theme options are visible!');
      return { success: true, visibleItems, totalItems: afterClick.itemCount };
    } else {
      console.log('\n❌ FAILED: Not all options are visible');
      console.log(`   Expected: 8 items, Got: ${afterClick.itemCount} items`);
      console.log(`   Visible: ${visibleItems} items`);
      return { success: false, visibleItems, totalItems: afterClick.itemCount, details: afterClick };
    }
  }

  async run() {
    console.log('🚀 Starting Dropdown Visibility Test...');
    console.log(`🌐 Live URL: ${LIVE_URL}\n`);
    
    await this.setup();
    
    try {
      await this.login();
      const result = await this.testDropdown();
      
      console.log('\n═══════════════════════════════════════════════════════════');
      console.log('FINAL RESULT');
      console.log('═══════════════════════════════════════════════════════════\n');
      console.log(`Success: ${result.success ? '✅ YES' : '❌ NO'}`);
      console.log(`Visible Items: ${result.visibleItems}/8`);
      console.log(`Total Items: ${result.totalItems}/8\n`);
      
      return result;
    } catch (error) {
      console.error('❌ Test error:', error);
      return { success: false, error: error.message };
    } finally {
      await this.teardown();
    }
  }
}

const tester = new DropdownVisibilityTester();
tester.run().then(result => {
  process.exit(result.success ? 0 : 1);
}).catch(error => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});

