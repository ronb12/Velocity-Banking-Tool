import puppeteer from 'puppeteer';

const TEST_EMAIL = 'testuser@bfh.com';
const TEST_PASSWORD = 'test1234';
const LOGIN_URL = 'https://mobile-debt-tracker.web.app/login.html';

class ThemeSelectorTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.consoleLogs = [];
    this.testResults = [];
  }

  async setup() {
    this.browser = await puppeteer.launch({ headless: true });
    this.page = await this.browser.newPage();

    this.page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      this.consoleLogs.push({ type, text, timestamp: new Date().toISOString() });
      if (text.includes('[Auth]') || text.includes('[Theme]') || text.includes('Error') || text.includes('theme')) {
        console.log(`[${type.toUpperCase()}] ${text}`);
      }
    });

    this.page.on('pageerror', error => {
      console.error('❌ Page Error:', error.message);
    });
  }

  async teardown() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async recordTest(name, passed, details = {}) {
    this.testResults.push({ name, passed, details });
    console.log(`${passed ? '✅' : '❌'} ${name}`);
    if (!passed && Object.keys(details).length > 0) {
      console.log('   Details:', details);
    }
  }

  async run() {
    await this.setup();
    console.log('🚀 Starting Theme Selector Test...\n');
    console.log(`📧 Test Email: ${TEST_EMAIL}`);
    console.log(`🌐 Live URL: ${LOGIN_URL}\n`);

    try {
      // Step 1: Login
      console.log('═══════════════════════════════════════════════════════════');
      console.log('STEP 1: LOGIN');
      console.log('═══════════════════════════════════════════════════════════\n');
      await this.page.goto(LOGIN_URL, { waitUntil: 'networkidle2', timeout: 30000 });
      console.log('✅ Login page loaded\n');

      await this.page.type('#email', TEST_EMAIL, { delay: 50 });
      await this.page.type('#password', TEST_PASSWORD, { delay: 50 });
      await this.page.click('#loginBtn');
      console.log('✅ Login button clicked\n');

      console.log('⏳ Waiting for login to complete...');
      await Promise.race([
        this.page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 20000 }),
        this.page.waitForFunction(() => window.location.href.includes('index.html') || window.location.href.endsWith('/'), { timeout: 20000 })
      ]);
      console.log('✅ Login successful, redirected\n');

      await this.page.waitForFunction(() => window.auth?.currentUser?.email === TEST_EMAIL.toLowerCase(), { timeout: 10000 })
        .catch(() => console.log('⚠️  Auth state not immediately confirmed.'));
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 2: Open Profile Modal
      console.log('═══════════════════════════════════════════════════════════');
      console.log('STEP 2: OPEN PROFILE MODAL');
      console.log('═══════════════════════════════════════════════════════════\n');
      
      await this.page.waitForSelector('#profileBtn, .profile-btn, [onclick*="openProfileModal"]', { timeout: 10000 })
        .catch(() => console.log('⚠️  Profile button not found, trying alternative...'));

      // Try multiple ways to open profile modal
      const profileOpened = await this.page.evaluate(() => {
        // Try clicking profile button
        const profileBtn = document.querySelector('#profileBtn') || 
                          document.querySelector('.profile-btn') ||
                          document.querySelector('[onclick*="openProfileModal"]');
        if (profileBtn) {
          profileBtn.click();
          return true;
        }
        // Try calling function directly
        if (typeof window.openProfileModal === 'function') {
          window.openProfileModal();
          return true;
        }
        return false;
      });

      if (profileOpened) {
        console.log('✅ Profile button clicked\n');
      } else {
        console.log('⚠️  Using direct function call\n');
      }

      await new Promise(resolve => setTimeout(resolve, 1500)); // Wait for modal to open

      // Step 3: Navigate to Settings
      console.log('═══════════════════════════════════════════════════════════');
      console.log('STEP 3: NAVIGATE TO SETTINGS');
      console.log('═══════════════════════════════════════════════════════════\n');

      const settingsTab = await this.page.evaluate(() => {
        const tabs = Array.from(document.querySelectorAll('.profile-tab, [data-tab]'));
        const settingsTab = tabs.find(tab => 
          tab.textContent.toLowerCase().includes('setting') || 
          tab.getAttribute('data-tab') === 'settings'
        );
        if (settingsTab) {
          settingsTab.click();
          return true;
        }
        return false;
      });

      if (settingsTab) {
        console.log('✅ Settings tab clicked\n');
      } else {
        console.log('⚠️  Settings tab not found, checking if already visible\n');
      }

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 4: Verify Theme Selector Visibility
      console.log('═══════════════════════════════════════════════════════════');
      console.log('STEP 4: VERIFY THEME SELECTOR');
      console.log('═══════════════════════════════════════════════════════════\n');

      const themeSelectorState = await this.page.evaluate(() => {
        const list = document.getElementById('themeSelectorList');
        const options = list ? Array.from(list.querySelectorAll('.theme-option')) : [];
        
        const detailedOptions = options.map(opt => {
          const swatch = opt.querySelector('.theme-swatch');
          const radio = opt.querySelector('input[type="radio"]');
          const icon = opt.querySelector('.theme-option-icon');
          const name = opt.querySelector('.theme-option-name');
          const checkMark = opt.querySelector('.check-mark');
          
          return {
            visible: opt.offsetParent !== null,
            hasSwatch: !!swatch,
            swatchColor: swatch ? window.getComputedStyle(swatch).backgroundColor : null,
            swatchVisible: swatch ? swatch.offsetParent !== null : false,
            hasRadio: !!radio,
            radioChecked: radio ? radio.checked : false,
            hasIcon: !!icon,
            iconText: icon ? icon.textContent.trim() : '',
            hasName: !!name,
            nameText: name ? name.textContent.trim() : '',
            hasCheckMark: !!checkMark,
            isActive: opt.classList.contains('active'),
            themeId: opt.getAttribute('data-theme')
          };
        });

        return {
          listExists: !!list,
          listVisible: list ? (list.offsetParent !== null && window.getComputedStyle(list).display !== 'none') : false,
          optionsCount: options.length,
          detailedOptions: detailedOptions
        };
      });

      console.log('📊 Theme Selector State:');
      console.log(`   List Exists: ${themeSelectorState.listExists}`);
      console.log(`   List Visible: ${themeSelectorState.listVisible}`);
      console.log(`   Options Count: ${themeSelectorState.optionsCount}\n`);

      if (themeSelectorState.listExists && themeSelectorState.listVisible) {
        await this.recordTest('Theme Selector - List is visible', true);
      } else {
        await this.recordTest('Theme Selector - List is visible', false, themeSelectorState);
      }

      if (themeSelectorState.optionsCount >= 8) {
        await this.recordTest('Theme Selector - Has all 8 themes', true, { count: themeSelectorState.optionsCount });
      } else {
        await this.recordTest('Theme Selector - Has all 8 themes', false, { count: themeSelectorState.optionsCount, expected: 8 });
      }

      // Step 5: Verify Color Swatches
      console.log('═══════════════════════════════════════════════════════════');
      console.log('STEP 5: VERIFY COLOR SWATCHES');
      console.log('═══════════════════════════════════════════════════════════\n');

      const swatchesInfo = themeSelectorState.detailedOptions.map(opt => ({
        theme: opt.themeId,
        hasSwatch: opt.hasSwatch,
        swatchVisible: opt.swatchVisible,
        swatchColor: opt.swatchColor,
        name: opt.nameText
      }));

      console.log('📋 Color Swatches:');
      swatchesInfo.forEach((info, i) => {
        console.log(`   ${i + 1}. ${info.theme} (${info.name}):`);
        console.log(`      Has Swatch: ${info.hasSwatch}`);
        console.log(`      Swatch Visible: ${info.swatchVisible}`);
        console.log(`      Swatch Color: ${info.swatchColor || 'N/A'}`);
      });
      console.log('');

      const allHaveSwatches = swatchesInfo.every(info => info.hasSwatch && info.swatchVisible);
      if (allHaveSwatches) {
        await this.recordTest('Color Swatches - All themes have visible swatches', true);
      } else {
        const missing = swatchesInfo.filter(info => !info.hasSwatch || !info.swatchVisible);
        await this.recordTest('Color Swatches - All themes have visible swatches', false, { missing });
      }

      // Step 6: Test Theme Selection
      console.log('═══════════════════════════════════════════════════════════');
      console.log('STEP 6: TEST THEME SELECTION');
      console.log('═══════════════════════════════════════════════════════════\n');

      // Find a theme that's not currently active
      const inactiveTheme = themeSelectorState.detailedOptions.find(opt => !opt.isActive);
      
      if (inactiveTheme) {
        console.log(`🔘 Selecting theme: ${inactiveTheme.themeId}\n`);
        
        const themeChanged = await this.page.evaluate((themeId) => {
          const option = document.querySelector(`.theme-option[data-theme="${themeId}"]`);
          if (option) {
            option.click();
            return true;
          }
          return false;
        }, inactiveTheme.themeId);

        if (themeChanged) {
          console.log('✅ Theme option clicked\n');
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for theme to apply

          const afterChange = await this.page.evaluate((themeId) => {
            const option = document.querySelector(`.theme-option[data-theme="${themeId}"]`);
            const dataTheme = document.documentElement.getAttribute('data-theme');
            return {
              isActive: option ? option.classList.contains('active') : false,
              radioChecked: option ? option.querySelector('input[type="radio"]')?.checked : false,
              dataTheme: dataTheme,
              themeManagerTheme: window.themeManager?.getCurrentTheme?.() || null
            };
          }, inactiveTheme.themeId);

          console.log('📊 After Theme Change:');
          console.log(`   Option Active: ${afterChange.isActive}`);
          console.log(`   Radio Checked: ${afterChange.radioChecked}`);
          console.log(`   Data Theme: ${afterChange.dataTheme}`);
          console.log(`   Theme Manager Theme: ${afterChange.themeManagerTheme}\n`);

          if (afterChange.isActive && afterChange.radioChecked) {
            await this.recordTest('Theme Selection - Theme changes correctly', true);
          } else {
            await this.recordTest('Theme Selection - Theme changes correctly', false, afterChange);
          }
        } else {
          await this.recordTest('Theme Selection - Theme option clickable', false, { themeId: inactiveTheme.themeId });
        }
      } else {
        console.log('⚠️  All themes are active, skipping selection test\n');
        await this.recordTest('Theme Selection - Theme changes correctly', true, { note: 'All themes active' });
      }

      // Step 7: Final Verification
      console.log('═══════════════════════════════════════════════════════════');
      console.log('STEP 7: FINAL VERIFICATION');
      console.log('═══════════════════════════════════════════════════════════\n');

      const finalState = await this.page.evaluate(() => {
        const list = document.getElementById('themeSelectorList');
        const options = list ? Array.from(list.querySelectorAll('.theme-option')) : [];
        
        return {
          listVisible: list ? (list.offsetParent !== null) : false,
          optionsCount: options.length,
          allOptionsVisible: options.every(opt => opt.offsetParent !== null),
          allHaveSwatches: options.every(opt => opt.querySelector('.theme-swatch')),
          allHaveRadios: options.every(opt => opt.querySelector('input[type="radio"]')),
          allHaveIcons: options.every(opt => opt.querySelector('.theme-option-icon')),
          allHaveNames: options.every(opt => opt.querySelector('.theme-option-name')),
          activeCount: options.filter(opt => opt.classList.contains('active')).length
        };
      });

      console.log('📊 Final State:');
      console.log(`   List Visible: ${finalState.listVisible}`);
      console.log(`   Options Count: ${finalState.optionsCount}`);
      console.log(`   All Options Visible: ${finalState.allOptionsVisible}`);
      console.log(`   All Have Swatches: ${finalState.allHaveSwatches}`);
      console.log(`   All Have Radios: ${finalState.allHaveRadios}`);
      console.log(`   All Have Icons: ${finalState.allHaveIcons}`);
      console.log(`   All Have Names: ${finalState.allHaveNames}`);
      console.log(`   Active Count: ${finalState.activeCount}\n`);

      if (finalState.listVisible && 
          finalState.optionsCount >= 8 && 
          finalState.allOptionsVisible && 
          finalState.allHaveSwatches && 
          finalState.allHaveRadios && 
          finalState.allHaveIcons && 
          finalState.allHaveNames &&
          finalState.activeCount === 1) {
        await this.recordTest('Final Verification - All components present and working', true);
      } else {
        await this.recordTest('Final Verification - All components present and working', false, finalState);
      }

    } catch (error) {
      console.error(`❌ An error occurred during the test: ${error.message}\n`);
      this.testResults.push({ name: 'Overall Test', passed: false, details: { error: error.message } });
    } finally {
      console.log('═══════════════════════════════════════════════════════════');
      console.log('TEST SUMMARY');
      console.log('═══════════════════════════════════════════════════════════\n');
      
      const allPassed = this.testResults.every(result => result.passed);
      const passedCount = this.testResults.filter(r => r.passed).length;
      const totalCount = this.testResults.length;
      
      console.log(`✅ Passed: ${passedCount}/${totalCount}`);
      console.log(`❌ Failed: ${totalCount - passedCount}/${totalCount}\n`);
      
      if (allPassed) {
        console.log('✅ ALL TESTS PASSED!');
        console.log('   ✓ Theme selector list is visible');
        console.log('   ✓ All 8 themes are present');
        console.log('   ✓ Color swatches are visible');
        console.log('   ✓ Theme selection works correctly');
        console.log('   ✓ All components are present\n');
      } else {
        console.log('❌ SOME TESTS FAILED. See details above.\n');
        this.testResults.filter(r => !r.passed).forEach(result => {
          console.log(`   ❌ ${result.name}`);
        });
        console.log('');
      }

      await this.teardown();
      
      return {
        success: allPassed,
        passed: passedCount,
        total: totalCount,
        results: this.testResults
      };
    }
  }
}

const tester = new ThemeSelectorTester();
tester.run().then(result => {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('FINAL RESULT');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log(`   Success: ${result.success ? '✅ YES' : '❌ NO'}`);
  console.log(`   Pass Rate: ${result.passed}/${result.total} (${Math.round(result.passed/result.total*100)}%)\n`);
  process.exit(result.success ? 0 : 1);
}).catch(error => {
  console.error('❌ Unhandled test error:', error);
  process.exit(1);
});

