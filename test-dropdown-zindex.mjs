/**
 * Test dropdown z-index to ensure it appears in front of modal
 */

import puppeteer from 'puppeteer';

const TEST_EMAIL = 'testuser@bfh.com';
const TEST_PASSWORD = 'test1234';
const LIVE_URL = 'https://mobile-debt-tracker.web.app';

async function testDropdownZIndex() {
  console.log('🚀 Testing Dropdown Z-Index...\n');
  
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });
  
  try {
    // Login
    console.log('🔐 Logging in...');
    await page.goto(`${LIVE_URL}/login.html`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await page.type('#email', TEST_EMAIL, { delay: 50 });
    await page.type('#password', TEST_PASSWORD, { delay: 50 });
    await page.click('#loginBtn');
    
    await Promise.race([
      page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 20000 }),
      page.waitForFunction(() => window.location.href.includes('index.html') || window.location.href.endsWith('/'), { timeout: 20000 })
    ]);
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('✅ Logged in\n');
    
    // Open profile modal
    console.log('📱 Opening Profile Settings...');
    await page.evaluate(() => {
      const profileBtn = document.querySelector('#profileButton') || 
                        document.querySelector('button[onclick*="openProfileModal"]');
      if (profileBtn) profileBtn.click();
      else if (typeof openProfileModal === 'function') openProfileModal();
    });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check z-index values before opening dropdown
    const beforeZIndex = await page.evaluate(() => {
      const modal = document.querySelector('.profile-modal');
      const modalContent = document.querySelector('.profile-modal-content');
      const dropdown = document.getElementById('themeDropdownMenu');
      const button = document.getElementById('themeDropdownBtn');
      
      return {
        modalZIndex: modal ? window.getComputedStyle(modal).zIndex : 'auto',
        modalContentZIndex: modalContent ? window.getComputedStyle(modalContent).zIndex : 'auto',
        dropdownZIndex: dropdown ? window.getComputedStyle(dropdown).zIndex : 'auto',
        buttonZIndex: button ? window.getComputedStyle(button).zIndex : 'auto',
        modalDisplay: modal ? window.getComputedStyle(modal).display : 'none',
        modalPosition: modal ? window.getComputedStyle(modal).position : 'none',
      };
    });
    
    console.log('📊 Z-Index Before Opening Dropdown:');
    console.log('   Modal z-index:', beforeZIndex.modalZIndex);
    console.log('   Modal Content z-index:', beforeZIndex.modalContentZIndex);
    console.log('   Dropdown z-index:', beforeZIndex.dropdownZIndex);
    console.log('   Button z-index:', beforeZIndex.buttonZIndex);
    console.log('   Modal display:', beforeZIndex.modalDisplay);
    console.log('   Modal position:', beforeZIndex.modalPosition);
    
    // Click dropdown button
    console.log('\n🖱️  Clicking dropdown button...');
    await page.click('#themeDropdownBtn');
    // Wait for requestAnimationFrame to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    await page.waitForFunction(() => {
      const menu = document.getElementById('themeDropdownMenu');
      return menu && window.getComputedStyle(menu).display === 'block';
    }, { timeout: 2000 }).catch(() => console.log('⚠️  Menu not visible after timeout'));
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Check z-index values after opening dropdown
    const afterZIndex = await page.evaluate(() => {
      const modal = document.querySelector('.profile-modal');
      const modalContent = document.querySelector('.profile-modal-content');
      const dropdown = document.getElementById('themeDropdownMenu');
      const button = document.getElementById('themeDropdownBtn');
      
      // Get all elements and their z-index
      const allElements = document.elementsFromPoint(
        button.getBoundingClientRect().left + button.offsetWidth / 2,
        button.getBoundingClientRect().bottom + 50
      );
      
      const elementZIndexes = allElements.map(el => ({
        tag: el.tagName,
        className: el.className,
        zIndex: window.getComputedStyle(el).zIndex,
        position: window.getComputedStyle(el).position,
        visible: el.offsetParent !== null
      }));
      
      return {
        modalZIndex: modal ? window.getComputedStyle(modal).zIndex : 'auto',
        modalContentZIndex: modalContent ? window.getComputedStyle(modalContent).zIndex : 'auto',
        dropdownZIndex: dropdown ? window.getComputedStyle(dropdown).zIndex : 'auto',
        dropdownPosition: dropdown ? window.getComputedStyle(dropdown).position : 'none',
        dropdownDisplay: dropdown ? window.getComputedStyle(dropdown).display : 'none',
        dropdownTop: dropdown ? dropdown.style.top : '',
        dropdownLeft: dropdown ? dropdown.style.left : '',
        dropdownVisible: dropdown ? dropdown.offsetParent !== null : false,
        buttonRect: button ? button.getBoundingClientRect() : null,
        dropdownRect: dropdown ? dropdown.getBoundingClientRect() : null,
        elementsAtPoint: elementZIndexes.slice(0, 10) // Top 10 elements
      };
    });
    
    console.log('\n📊 Z-Index After Opening Dropdown:');
    console.log('   Modal z-index:', afterZIndex.modalZIndex);
    console.log('   Modal Content z-index:', afterZIndex.modalContentZIndex);
    console.log('   Dropdown z-index:', afterZIndex.dropdownZIndex);
    console.log('   Dropdown position:', afterZIndex.dropdownPosition);
    console.log('   Dropdown display:', afterZIndex.dropdownDisplay);
    console.log('   Dropdown top:', afterZIndex.dropdownTop);
    console.log('   Dropdown left:', afterZIndex.dropdownLeft);
    console.log('   Dropdown visible:', afterZIndex.dropdownVisible);
    console.log('   Button rect:', afterZIndex.buttonRect);
    console.log('   Dropdown rect:', afterZIndex.dropdownRect);
    
    console.log('\n📋 Elements at Dropdown Position (top 10):');
    afterZIndex.elementsAtPoint.forEach((el, i) => {
      console.log(`   ${i + 1}. ${el.tag}.${el.className.split(' ')[0]} - z-index: ${el.zIndex}, position: ${el.position}`);
    });
    
    // Check if dropdown is on top
    const dropdownIsOnTop = afterZIndex.elementsAtPoint[0]?.className?.includes('theme-dropdown-menu') ||
                            afterZIndex.elementsAtPoint[0]?.className?.includes('theme-dropdown-item');
    
    console.log('\n✅ Test Results:');
    console.log(`   Dropdown z-index: ${afterZIndex.dropdownZIndex}`);
    console.log(`   Modal z-index: ${afterZIndex.modalZIndex}`);
    console.log(`   Dropdown is on top: ${dropdownIsOnTop ? 'YES ✅' : 'NO ❌'}`);
    console.log(`   Dropdown visible: ${afterZIndex.dropdownVisible ? 'YES ✅' : 'NO ❌'}`);
    
    // Take screenshot
    await page.screenshot({ path: 'dropdown-zindex-test.png', fullPage: false });
    console.log('\n📸 Screenshot saved: dropdown-zindex-test.png');
    
    return {
      success: dropdownIsOnTop && afterZIndex.dropdownVisible,
      dropdownZIndex: afterZIndex.dropdownZIndex,
      modalZIndex: afterZIndex.modalZIndex,
      dropdownVisible: afterZIndex.dropdownVisible,
      details: afterZIndex
    };
    
  } catch (error) {
    console.error('❌ Test error:', error);
    return { success: false, error: error.message };
  } finally {
    await browser.close();
  }
}

testDropdownZIndex().then(result => {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('FINAL RESULT');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log(`Success: ${result.success ? '✅ YES' : '❌ NO'}`);
  if (result.dropdownZIndex) console.log(`Dropdown z-index: ${result.dropdownZIndex}`);
  if (result.modalZIndex) console.log(`Modal z-index: ${result.modalZIndex}`);
  process.exit(result.success ? 0 : 1);
}).catch(error => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});

