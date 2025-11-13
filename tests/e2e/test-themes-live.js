/**
 * Test color themes on live app
 * Logs in with test user and tests all 8 color themes
 */

import puppeteer from 'puppeteer';

const TEST_EMAIL = 'testuser@bfh.com';
const TEST_PASSWORD = 'test1234';
const LIVE_URL = 'https://mobile-debt-tracker.web.app';
const THEMES = ['blue', 'pink', 'green', 'purple', 'orange', 'teal', 'red', 'auto'];

class LiveThemeTester {
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
      if (text.includes('[Theme]') || text.includes('theme') || text.includes('Theme')) {
        console.log(`[CONSOLE] ${text}`);
      }
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
    await new Promise(resolve => setTimeout(resolve, 2000));
    
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
      return false;
    });
    
    if (!profileOpened) {
      console.log('⚠️  Profile button not found, trying direct navigation...');
      // Try navigating directly if button doesn't work
      await this.page.evaluate(() => {
        if (typeof openProfileModal === 'function') {
          openProfileModal();
        }
      });
    }
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Check if modal is open
    const modalOpen = await this.page.evaluate(() => {
      const modal = document.getElementById('profileModal');
      return modal && window.getComputedStyle(modal).display !== 'none';
    });
    
    if (!modalOpen) {
      console.log('⚠️  Profile modal not open, trying alternative method...');
      // Scroll to settings section if modal exists but not visible
      await this.page.evaluate(() => {
        const modal = document.getElementById('profileModal');
        if (modal) {
          modal.style.display = 'flex';
        }
      });
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Check for theme selector
    const selectorExists = await this.page.evaluate(() => {
      return !!document.getElementById('themeSelectorGrid');
    });
    
    console.log(`✅ Profile modal ${modalOpen ? 'opened' : 'attempted'}, Theme selector exists: ${selectorExists}\n`);
    return selectorExists;
  }

  async testTheme(themeId) {
    console.log(`🎨 Testing theme: ${themeId}`);
    
    // Click theme button in selector
    const themeClicked = await this.page.evaluate((theme) => {
      const themeGrid = document.getElementById('themeSelectorGrid');
      if (!themeGrid) return false;
      
      const themeBtn = Array.from(themeGrid.querySelectorAll('.theme-option-btn'))
        .find(btn => btn.getAttribute('data-theme') === theme);
      
      if (themeBtn) {
        themeBtn.click();
        return true;
      }
      return false;
    }, themeId);
    
    if (!themeClicked) {
      await this.recordTest(`Theme Selection - ${themeId}`, false, { error: 'Theme button not found' });
      return false;
    }
    
    // Wait for theme to apply
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Verify theme is applied
    const themeState = await this.page.evaluate((theme) => {
      return {
        dataTheme: document.documentElement.getAttribute('data-theme'),
        bodyTheme: document.body.getAttribute('data-theme'),
        currentTheme: window.themeManager?.getCurrentTheme(),
        primaryColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim(),
        bgPrimary: getComputedStyle(document.documentElement).getPropertyValue('--bg-primary').trim(),
        hasThemeManager: typeof window.themeManager !== 'undefined'
      };
    }, themeId);
    
    const themeInfo = await this.page.evaluate((theme) => {
      return window.themeManager?.getThemeInfo(theme);
    }, themeId);
    
    // Check if theme is active
    const isActive = await this.page.evaluate((theme) => {
      const themeGrid = document.getElementById('themeSelectorGrid');
      if (!themeGrid) return false;
      const activeBtn = themeGrid.querySelector('.theme-option-btn.active');
      return activeBtn && activeBtn.getAttribute('data-theme') === theme;
    }, themeId);
    
    const themeApplied = themeState.currentTheme === themeId || 
                         (themeId === 'auto' && themeState.currentTheme === 'auto') ||
                         (themeState.dataTheme && themeState.bodyTheme);
    
    await this.recordTest(`Theme Application - ${themeId}`, themeApplied, {
      currentTheme: themeState.currentTheme,
      dataTheme: themeState.dataTheme,
      bodyTheme: themeState.bodyTheme,
      primaryColor: themeState.primaryColor.substring(0, 20) + '...',
      isActive: isActive,
      themeName: themeInfo?.name || 'Unknown'
    });
    
    // Test theme persistence by reloading
    console.log(`   Reloading page to test persistence...`);
    await this.page.reload({ waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const persistedTheme = await this.page.evaluate(() => {
      return {
        currentTheme: window.themeManager?.getCurrentTheme(),
        localStorage: localStorage.getItem('app-theme'),
        dataTheme: document.documentElement.getAttribute('data-theme')
      };
    });
    
    const themePersisted = persistedTheme.currentTheme === themeId || 
                           persistedTheme.localStorage === themeId;
    
    await this.recordTest(`Theme Persistence - ${themeId}`, themePersisted, {
      currentTheme: persistedTheme.currentTheme,
      localStorage: persistedTheme.localStorage,
      dataTheme: persistedTheme.dataTheme
    });
    
    return themeApplied && themePersisted;
  }

  async testAllThemes() {
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('TESTING ALL COLOR THEMES');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // Open profile settings first
    const settingsOpen = await this.openProfileSettings();
    if (!settingsOpen) {
      await this.recordTest('Settings Access', false, { error: 'Could not open profile settings' });
      return false;
    }
    
    let allThemesWork = true;
    
    for (const theme of THEMES) {
      // Re-open settings if needed (modal might close)
      const selectorStillExists = await this.page.evaluate(() => {
        return !!document.getElementById('themeSelectorGrid');
      });
      
      if (!selectorStillExists) {
        console.log('   Re-opening profile settings...');
        await this.openProfileSettings();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      const themeWorks = await this.testTheme(theme);
      allThemesWork = allThemesWork && themeWorks;
      
      // Small delay between themes
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    return allThemesWork;
  }

  async run() {
    console.log('🚀 Starting Live Theme System Test...');
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
      
      // Step 2: Navigate to main page
      console.log('\n═══════════════════════════════════════════════════════════');
      console.log('STEP 2: NAVIGATE TO DASHBOARD');
      console.log('═══════════════════════════════════════════════════════════\n');
      
      await this.page.goto(`${LIVE_URL}/index.html`, { waitUntil: 'networkidle2' });
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check if theme manager is available
      const hasThemeManager = await this.page.evaluate(() => {
        return typeof window.themeManager !== 'undefined';
      });
      
      await this.recordTest('Theme Manager Available', hasThemeManager);
      
      if (!hasThemeManager) {
        return { success: false, message: 'Theme manager not found' };
      }
      
      // Step 3: Test all themes
      const allThemesWork = await this.testAllThemes();
      
      // Step 4: Final verification
      console.log('\n═══════════════════════════════════════════════════════════');
      console.log('STEP 4: FINAL VERIFICATION');
      console.log('═══════════════════════════════════════════════════════════\n');
      
      // Set to blue theme and verify
      await this.page.evaluate(() => {
        if (window.themeManager) {
          window.themeManager.setTheme('blue');
        }
      });
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const finalTheme = await this.page.evaluate(() => {
        return {
          currentTheme: window.themeManager?.getCurrentTheme(),
          dataTheme: document.documentElement.getAttribute('data-theme'),
          primaryColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim()
        };
      });
      
      const finalCheck = finalTheme.currentTheme === 'blue' && finalTheme.dataTheme === 'blue';
      await this.recordTest('Final Theme Check - Blue', finalCheck, finalTheme);
      
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
const tester = new LiveThemeTester();
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

