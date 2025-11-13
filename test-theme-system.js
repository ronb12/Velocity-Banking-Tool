/**
 * Test script for global theme system
 * Tests all 8 themes and verifies they work across pages
 */

import puppeteer from 'puppeteer';

const BASE_URL = 'http://localhost:5500';
const THEMES = ['blue', 'pink', 'green', 'purple', 'orange', 'teal', 'red', 'auto'];

class ThemeSystemTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = [];
  }

  async setup() {
    this.browser = await puppeteer.launch({ headless: false }); // Set to true for CI
    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1280, height: 720 });
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

  async testThemeApplication(themeId) {
    console.log(`\n🎨 Testing theme: ${themeId}`);
    
    // Navigate to main page
    await this.page.goto(`${BASE_URL}/index.html`, { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if themeManager is available
    const hasThemeManager = await this.page.evaluate(() => {
      return typeof window.themeManager !== 'undefined';
    });
    
    if (!hasThemeManager) {
      await this.recordTest(`Theme Manager - ${themeId}`, false, { error: 'ThemeManager not found' });
      return false;
    }
    
    // Apply theme
    await this.page.evaluate((theme) => {
      if (window.themeManager) {
        window.themeManager.setTheme(theme);
      }
    }, themeId);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Verify theme is applied
    const appliedTheme = await this.page.evaluate(() => {
      return {
        dataTheme: document.documentElement.getAttribute('data-theme'),
        bodyTheme: document.body.getAttribute('data-theme'),
        currentTheme: window.themeManager?.getCurrentTheme(),
        primaryColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim()
      };
    });
    
    const themeInfo = await this.page.evaluate((theme) => {
      return window.themeManager?.getThemeInfo(theme);
    }, themeId);
    
    const expectedColor = themeInfo?.color || '#007bff';
    const colorMatch = appliedTheme.primaryColor.includes(expectedColor.substring(1)) || 
                       appliedTheme.primaryColor === expectedColor;
    
    const themeApplied = appliedTheme.dataTheme && 
                         appliedTheme.bodyTheme && 
                         (appliedTheme.currentTheme === themeId || themeId === 'auto');
    
    await this.recordTest(`Theme Application - ${themeId}`, themeApplied, {
      dataTheme: appliedTheme.dataTheme,
      bodyTheme: appliedTheme.bodyTheme,
      currentTheme: appliedTheme.currentTheme,
      primaryColor: appliedTheme.primaryColor,
      expectedColor: expectedColor
    });
    
    // Test theme persistence
    await this.page.reload({ waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const persistedTheme = await this.page.evaluate(() => {
      return {
        currentTheme: window.themeManager?.getCurrentTheme(),
        localStorage: localStorage.getItem('app-theme')
      };
    });
    
    const themePersisted = persistedTheme.currentTheme === themeId || 
                           persistedTheme.localStorage === themeId;
    
    await this.recordTest(`Theme Persistence - ${themeId}`, themePersisted, {
      currentTheme: persistedTheme.currentTheme,
      localStorage: persistedTheme.localStorage
    });
    
    return themeApplied && themePersisted;
  }

  async testThemeSelector() {
    console.log('\n🎨 Testing Theme Selector in Settings');
    
    await this.page.goto(`${BASE_URL}/index.html`, { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Open profile modal
    await this.page.evaluate(() => {
      const profileBtn = document.querySelector('#profileButton, button[onclick*="openProfileModal"]');
      if (profileBtn) profileBtn.click();
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if theme selector exists
    const selectorExists = await this.page.evaluate(() => {
      return !!document.getElementById('themeSelectorGrid');
    });
    
    await this.recordTest('Theme Selector - Exists in Settings', selectorExists);
    
    if (selectorExists) {
      // Count theme options
      const themeCount = await this.page.evaluate(() => {
        return document.querySelectorAll('#themeSelectorGrid .theme-option-btn').length;
      });
      
      await this.recordTest('Theme Selector - All themes displayed', themeCount === 8, {
        count: themeCount,
        expected: 8
      });
      
      // Test clicking a theme
      await this.page.evaluate(() => {
        const pinkBtn = Array.from(document.querySelectorAll('#themeSelectorGrid .theme-option-btn'))
          .find(btn => btn.getAttribute('data-theme') === 'pink');
        if (pinkBtn) pinkBtn.click();
      });
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const themeChanged = await this.page.evaluate(() => {
        return window.themeManager?.getCurrentTheme() === 'pink';
      });
      
      await this.recordTest('Theme Selector - Click changes theme', themeChanged);
    }
  }

  async testCrossPageTheme() {
    console.log('\n🎨 Testing Theme Across Pages');
    
    const pages = ['index.html', 'Debt_Tracker.html', 'savings_goal_tracker.html'];
    let allPagesWork = true;
    
    for (const page of pages) {
      try {
        await this.page.goto(`${BASE_URL}/${page}`, { waitUntil: 'networkidle2', timeout: 10000 });
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const themeApplied = await this.page.evaluate(() => {
          return {
            hasThemeManager: typeof window.themeManager !== 'undefined',
            dataTheme: document.documentElement.getAttribute('data-theme'),
            primaryColor: getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim()
          };
        });
        
        const pageWorks = themeApplied.hasThemeManager && themeApplied.dataTheme;
        allPagesWork = allPagesWork && pageWorks;
        
        await this.recordTest(`Cross-Page Theme - ${page}`, pageWorks, themeApplied);
      } catch (error) {
        await this.recordTest(`Cross-Page Theme - ${page}`, false, { error: error.message });
        allPagesWork = false;
      }
    }
    
    return allPagesWork;
  }

  async run() {
    console.log('🚀 Starting Theme System Tests...\n');
    await this.setup();
    
    try {
      // Test 1: Theme Manager Initialization
      console.log('═══════════════════════════════════════════════════════════');
      console.log('TEST 1: THEME MANAGER INITIALIZATION');
      console.log('═══════════════════════════════════════════════════════════\n');
      
      await this.page.goto(`${BASE_URL}/index.html`, { waitUntil: 'networkidle2' });
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const initCheck = await this.page.evaluate(() => {
        return {
          hasThemeManager: typeof window.themeManager !== 'undefined',
          availableThemes: window.themeManager?.getAvailableThemes() || [],
          currentTheme: window.themeManager?.getCurrentTheme() || null
        };
      });
      
      await this.recordTest('Theme Manager - Initialized', initCheck.hasThemeManager, initCheck);
      await this.recordTest('Theme Manager - Has 8 themes', initCheck.availableThemes.length === 8, {
        count: initCheck.availableThemes.length,
        themes: initCheck.availableThemes
      });
      
      // Test 2: Apply Each Theme
      console.log('\n═══════════════════════════════════════════════════════════');
      console.log('TEST 2: THEME APPLICATION');
      console.log('═══════════════════════════════════════════════════════════\n');
      
      for (const theme of THEMES) {
        await this.testThemeApplication(theme);
      }
      
      // Test 3: Theme Selector
      console.log('\n═══════════════════════════════════════════════════════════');
      console.log('TEST 3: THEME SELECTOR IN SETTINGS');
      console.log('═══════════════════════════════════════════════════════════\n');
      
      await this.testThemeSelector();
      
      // Test 4: Cross-Page Theme
      console.log('\n═══════════════════════════════════════════════════════════');
      console.log('TEST 4: CROSS-PAGE THEME CONSISTENCY');
      console.log('═══════════════════════════════════════════════════════════\n');
      
      await this.testCrossPageTheme();
      
    } catch (error) {
      console.error('❌ Test error:', error);
      this.testResults.push({ name: 'Overall Test', passed: false, details: { error: error.message } });
    } finally {
      console.log('\n═══════════════════════════════════════════════════════════');
      console.log('TEST SUMMARY');
      console.log('═══════════════════════════════════════════════════════════\n');
      
      const passed = this.testResults.filter(r => r.passed).length;
      const total = this.testResults.length;
      const passRate = ((passed / total) * 100).toFixed(1);
      
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
const tester = new ThemeSystemTester();
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

