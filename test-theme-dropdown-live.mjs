/**
 * Test color theme dropdown selector on live app
 * Logs in with test user and tests the dropdown in settings
 */

import puppeteer from 'puppeteer';

const TEST_EMAIL = 'testuser@bfh.com';
const TEST_PASSWORD = 'test1234';
const LIVE_URL = 'https://mobile-debt-tracker.web.app';
const THEMES = ['blue', 'pink', 'green', 'purple', 'orange', 'teal', 'red', 'auto'];

class ThemeDropdownTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = [];
  }

  async setup() {
    this.browser = await puppeteer.launch({ headless: false }); // Set to true for CI
    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1280, height: 720 });
    
    // Capture console logs
    this.page.on('console', msg => {
      const text = msg.text();
      if (text.includes('[Theme]') || text.includes('theme') || text.includes('Theme') || text.includes('dropdown') || text.includes('handleThemeChange')) {
        console.log(`[CONSOLE] ${text}`);
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
    const icon = passed ? '✅' : '❌';
    console.log(`${icon} ${name}`);
    if (!passed && Object.keys(details).length > 0) {
      console.log('   Details:', details);
    }
  }

  async login() {
    console.log('\n🔐 Logging in with test user...');
    console.log(`📧 Email: ${TEST_EMAIL}`);
    
    await this.page.goto(`${LIVE_URL}/login.html`, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Fill in credentials
    await this.page.type('#email', TEST_EMAIL, { delay: 50 });
    await this.page.type('#password', TEST_PASSWORD, { delay: 50 });
    await this.page.click('#loginBtn');
    
    console.log('✅ Login button clicked, waiting for redirect...');
    
    // Wait for login to complete
    try {
      await Promise.race([
        this.page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 20000 }),
        this.page.waitForFunction(() => 
          window.location.href.includes('index.html') || 
          window.location.href.endsWith('/') ||
          window.location.pathname === '/'
        , { timeout: 20000 })
      ]);
      console.log('✅ Login successful, redirected to dashboard\n');
      return true;
    } catch (error) {
      console.error(`❌ Login failed: ${error.message}`);
      return false;
    }
  }

  async openProfileSettings() {
    console.log('📱 Opening Profile Settings...');
    
    // Wait for page to be fully loaded
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Try to open profile modal
    const profileOpened = await this.page.evaluate(() => {
      // Try multiple ways to open profile
      const profileBtn = document.querySelector('#profileButton') || 
                        document.querySelector('button[onclick*="openProfileModal"]') ||
                        document.querySelector('.user-menu');
      
      if (profileBtn) {
        profileBtn.click();
        return true;
      }
      
      // Try direct function call
      if (typeof openProfileModal === 'function') {
        openProfileModal();
        return true;
      }
      
      return false;
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if modal is open and dropdown exists
    const settingsState = await this.page.evaluate(() => {
      const modal = document.getElementById('profileModal');
      const dropdown = document.getElementById('themeSelector');
      return {
        modalOpen: modal && window.getComputedStyle(modal).display !== 'none',
        dropdownExists: !!dropdown,
        dropdownVisible: dropdown ? window.getComputedStyle(dropdown).display !== 'none' : false,
        hasOptions: dropdown ? dropdown.options.length > 0 : false
      };
    });
    
    console.log(`✅ Profile modal ${settingsState.modalOpen ? 'opened' : 'attempted'}`);
    console.log(`   Dropdown exists: ${settingsState.dropdownExists}`);
    console.log(`   Dropdown visible: ${settingsState.dropdownVisible}`);
    console.log(`   Has options: ${settingsState.hasOptions} (${settingsState.hasOptions ? 'count: ' + (await this.page.evaluate(() => document.getElementById('themeSelector')?.options.length || 0)) : '0'})\n`);
    
    return settingsState.dropdownExists && settingsState.hasOptions;
  }

  async testDropdownFunctionality() {
    console.log('🎨 Testing Dropdown Functionality...\n');
    
    // Get initial theme
    const initialTheme = await this.page.evaluate(() => {
      return {
        currentTheme: window.themeManager?.getCurrentTheme(),
        dropdownValue: document.getElementById('themeSelector')?.value,
        dataTheme: document.documentElement.getAttribute('data-theme')
      };
    });
    
    console.log('📊 Initial State:');
    console.log(`   Current Theme: ${initialTheme.currentTheme}`);
    console.log(`   Dropdown Value: ${initialTheme.dropdownValue}`);
    console.log(`   Data Theme: ${initialTheme.dataTheme}\n`);
    
    // Test selecting a different theme (pink if not already selected)
    const testTheme = initialTheme.currentTheme === 'pink' ? 'green' : 'pink';
    
    console.log(`🔄 Testing theme change to: ${testTheme}`);
    
    // Select the theme from dropdown
    const selectionWorked = await this.page.evaluate((theme) => {
      const dropdown = document.getElementById('themeSelector');
      if (!dropdown) return false;
      
      dropdown.value = theme;
      const changeEvent = new Event('change', { bubbles: true });
      dropdown.dispatchEvent(changeEvent);
      return true;
    }, testTheme);
    
    await this.recordTest('Dropdown Selection - Change event triggered', selectionWorked);
    
    // Wait for theme to apply
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Check if theme changed
    const afterChange = await this.page.evaluate((expectedTheme) => {
      return {
        currentTheme: window.themeManager?.getCurrentTheme(),
        dropdownValue: document.getElementById('themeSelector')?.value,
        dataTheme: document.documentElement.getAttribute('data-theme'),
        bodyTheme: document.body.getAttribute('data-theme'),
        primaryColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim()
      };
    }, testTheme);
    
    console.log('📊 After Change:');
    console.log(`   Current Theme: ${afterChange.currentTheme}`);
    console.log(`   Dropdown Value: ${afterChange.dropdownValue}`);
    console.log(`   Data Theme: ${afterChange.dataTheme}`);
    console.log(`   Body Theme: ${afterChange.bodyTheme}`);
    console.log(`   Primary Color: ${afterChange.primaryColor.substring(0, 20)}...\n`);
    
    const themeChanged = afterChange.currentTheme === testTheme && 
                         afterChange.dropdownValue === testTheme &&
                         afterChange.dataTheme === testTheme;
    
    await this.recordTest('Theme Application - Theme changed correctly', themeChanged, {
      expected: testTheme,
      actual: afterChange.currentTheme,
      dropdownValue: afterChange.dropdownValue,
      dataTheme: afterChange.dataTheme
    });
    
    // Test all themes
    console.log('🔄 Testing all themes...\n');
    let allThemesWork = true;
    
    for (const theme of THEMES) {
      console.log(`   Testing ${theme}...`);
      
      // Select theme
      await this.page.evaluate((theme) => {
        const dropdown = document.getElementById('themeSelector');
        if (dropdown) {
          dropdown.value = theme;
          const changeEvent = new Event('change', { bubbles: true });
          dropdown.dispatchEvent(changeEvent);
        }
      }, theme);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verify theme applied
      const themeState = await this.page.evaluate((theme) => {
        return {
          currentTheme: window.themeManager?.getCurrentTheme(),
          dropdownValue: document.getElementById('themeSelector')?.value,
          dataTheme: document.documentElement.getAttribute('data-theme')
        };
      }, theme);
      
      const themeWorks = themeState.currentTheme === theme && 
                        themeState.dropdownValue === theme;
      
      if (!themeWorks) {
        allThemesWork = false;
        console.log(`     ❌ ${theme} failed`);
      } else {
        console.log(`     ✅ ${theme} works`);
      }
    }
    
    await this.recordTest('All Themes - All themes work correctly', allThemesWork);
    
    return themeChanged && allThemesWork;
  }

  async testDropdownOptions() {
    console.log('📋 Testing Dropdown Options...\n');
    
    const options = await this.page.evaluate(() => {
      const dropdown = document.getElementById('themeSelector');
      if (!dropdown) return null;
      
      return Array.from(dropdown.options).map(opt => ({
        value: opt.value,
        text: opt.textContent,
        selected: opt.selected
      }));
    });
    
    if (!options) {
      await this.recordTest('Dropdown Options - Options exist', false, { error: 'Dropdown not found' });
      return false;
    }
    
    console.log(`Found ${options.length} options:`);
    options.forEach((opt, i) => {
      console.log(`   ${i + 1}. ${opt.text} (${opt.value}) ${opt.selected ? '✓ selected' : ''}`);
    });
    console.log('');
    
    const hasAllThemes = options.length === THEMES.length;
    await this.recordTest('Dropdown Options - All themes present', hasAllThemes, {
      expected: THEMES.length,
      actual: options.length,
      options: options.map(o => o.value)
    });
    
    return hasAllThemes;
  }

  async run() {
    console.log('🚀 Starting Theme Dropdown Test on Live App...');
    console.log(`🌐 Live URL: ${LIVE_URL}\n`);
    
    await this.setup();
    
    try {
      // Step 1: Login
      console.log('═══════════════════════════════════════════════════════════');
      console.log('STEP 1: LOGIN');
      console.log('═══════════════════════════════════════════════════════════\n');
      
      const loginSuccess = await this.login();
      if (!loginSuccess) {
        await this.recordTest('Login', false, { error: 'Failed to log in' });
        return { success: false, message: 'Login failed' };
      }
      
      await this.recordTest('Login', true);
      
      // Step 2: Open Profile Settings
      console.log('\n═══════════════════════════════════════════════════════════');
      console.log('STEP 2: OPEN PROFILE SETTINGS');
      console.log('═══════════════════════════════════════════════════════════\n');
      
      const settingsOpen = await this.openProfileSettings();
      if (!settingsOpen) {
        await this.recordTest('Settings Access', false, { error: 'Could not open settings or dropdown not found' });
        return { success: false, message: 'Settings access failed' };
      }
      
      await this.recordTest('Settings Access', true);
      
      // Step 3: Test Dropdown Options
      console.log('\n═══════════════════════════════════════════════════════════');
      console.log('STEP 3: TEST DROPDOWN OPTIONS');
      console.log('═══════════════════════════════════════════════════════════\n');
      
      await this.testDropdownOptions();
      
      // Step 4: Test Dropdown Functionality
      console.log('\n═══════════════════════════════════════════════════════════');
      console.log('STEP 4: TEST DROPDOWN FUNCTIONALITY');
      console.log('═══════════════════════════════════════════════════════════\n');
      
      const functionalityWorks = await this.testDropdownFunctionality();
      
    } catch (error) {
      console.error('❌ Test error:', error);
      this.testResults.push({ name: 'Overall Test', passed: false, details: { error: error.message } });
    } finally {
      console.log('\n═══════════════════════════════════════════════════════════');
      console.log('TEST SUMMARY');
      console.log('═══════════════════════════════════════════════════════════\n');
      
      const passed = this.testResults.filter(r => r.passed).length;
      const total = this.testResults.length;
      const passRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;
      
      console.log(`Passed: ${passed}/${total} (${passRate}%)`);
      console.log('\nDetailed Results:');
      this.testResults.forEach(result => {
        const icon = result.passed ? '✅' : '❌';
        console.log(`  ${icon} ${result.name}`);
      });
      
      await this.teardown();
      
      return {
        success: passed === total,
        passRate: parseFloat(passRate),
        results: this.testResults
      };
    }
  }
}

// Run tests
const tester = new ThemeDropdownTester();
tester.run().then(result => {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('FINAL RESULT');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log(`Success: ${result.success ? '✅ YES' : '❌ NO'}`);
  console.log(`Pass Rate: ${result.passRate}%\n`);
  process.exit(result.success ? 0 : 1);
}).catch(error => {
  console.error('❌ Unhandled test error:', error);
  process.exit(1);
});

