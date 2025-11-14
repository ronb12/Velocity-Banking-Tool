/**
 * Comprehensive Page Testing Script
 * Tests all pages of the app and monitors console for errors
 */

import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const TIMEOUT = 30000;

// All pages to test
const PAGES = [
  { name: 'Home/Dashboard', path: '/', route: '/' },
  { name: 'Login', path: '/src/pages/auth/login.html', route: '/login.html' },
  { name: 'Register', path: '/src/pages/auth/register.html', route: '/register.html' },
  { name: 'Reset Password', path: '/src/pages/auth/reset.html', route: '/reset.html' },
  { name: 'Debt Tracker', path: '/src/pages/debt/Debt_Tracker.html', route: '/Debt_Tracker.html' },
  { name: 'Debt Crusher', path: '/src/pages/debt/debt-crusher.html', route: '/debt-crusher.html' },
  { name: 'Savings Goal Tracker', path: '/src/pages/savings/savings_goal_tracker.html', route: '/savings_goal_tracker.html' },
  { name: 'Challenge Library', path: '/src/pages/savings/challenge_library.html', route: '/challenge_library.html' },
  { name: 'Velocity Calculator', path: '/src/pages/calculators/Velocity_Calculator.html', route: '/Velocity_Calculator.html' },
  { name: '1099 Calculator', path: '/src/pages/calculators/1099_calculator.html', route: '/1099_calculator.html' },
  { name: 'Credit Score Estimator', path: '/src/pages/calculators/Credit_Score_Estimator.html', route: '/Credit_Score_Estimator.html' },
  { name: 'Budget Tracker', path: '/src/pages/other/budget.html', route: '/budget.html' },
  { name: 'Income Tracker', path: '/src/pages/other/income.html', route: '/income.html' },
  { name: 'Calendar', path: '/src/pages/other/calendar.html', route: '/calendar.html' },
  { name: 'Net Worth Tracker', path: '/src/pages/other/net_worth_tracker.html', route: '/net_worth_tracker.html' },
  { name: 'Activity Feed', path: '/src/pages/other/activity_feed.html', route: '/activity_feed.html' },
  { name: 'Notifications', path: '/src/pages/other/notifications.html', route: '/notifications.html' },
  { name: 'Mobile Tracker', path: '/src/pages/other/Mobile_Tracker.html', route: '/Mobile_Tracker.html' },
];

class PageTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = [];
    this.errors = [];
    this.warnings = [];
  }

  async init() {
    console.log('🚀 Starting automated page testing...\n');
    console.log(`📍 Testing URL: ${BASE_URL}\n`);
    
    this.browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    
    this.page = await this.browser.newPage();
    
    // Set up console monitoring
    this.page.on('console', (msg) => {
      const type = msg.type();
      const text = msg.text();
      
      if (type === 'error') {
        this.errors.push({
          page: 'current',
          message: text,
          type: 'console.error'
        });
      } else if (type === 'warning') {
        this.warnings.push({
          page: 'current',
          message: text,
          type: 'console.warn'
        });
      }
    });
    
    // Monitor page errors
    this.page.on('pageerror', (error) => {
      this.errors.push({
        page: 'current',
        message: error.message,
        type: 'pageerror',
        stack: error.stack
      });
    });
    
    // Monitor request failures
    this.page.on('requestfailed', (request) => {
      this.errors.push({
        page: 'current',
        message: `Request failed: ${request.url()}`,
        type: 'requestfailed',
        url: request.url()
      });
    });
  }

  async testPage(pageInfo) {
    const { name, route } = pageInfo;
    const url = `${BASE_URL}${route}`;
    
    console.log(`\n📄 Testing: ${name}`);
    console.log(`   URL: ${url}`);
    
    const pageErrors = [];
    const pageWarnings = [];
    
    // Track errors for this specific page
    const errorHandler = (error) => {
      pageErrors.push({
        message: error.message || error,
        type: error.type || 'unknown'
      });
    };
    
    const warningHandler = (warning) => {
      pageWarnings.push({
        message: warning.message || warning,
        type: warning.type || 'unknown'
      });
    };
    
    try {
      // Clear previous errors
      this.errors = this.errors.filter(e => e.page !== name);
      this.warnings = this.warnings.filter(w => w.page !== name);
      
      // Navigate to page
      const response = await this.page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: TIMEOUT
      });
      
      // Wait for page to be interactive
      await this.page.waitForTimeout(2000);
      
      // Check page status
      const status = response?.status() || 0;
      const title = await this.page.title().catch(() => 'No title');
      
      // Collect errors and warnings for this page
      const currentErrors = this.errors.filter(e => e.page === 'current');
      const currentWarnings = this.warnings.filter(w => w.page === 'current');
      
      // Update page references
      currentErrors.forEach(e => e.page = name);
      currentWarnings.forEach(w => w.page = name);
      
      pageErrors.push(...currentErrors);
      pageWarnings.push(...currentWarnings);
      
      // Check for critical elements
      const hasContent = await this.page.evaluate(() => {
        return document.body && document.body.innerHTML.length > 100;
      });
      
      // Check for JavaScript errors in console
      const consoleErrors = await this.page.evaluate(() => {
        return window.consoleErrors || [];
      });
      
      if (consoleErrors.length > 0) {
        pageErrors.push(...consoleErrors.map(e => ({
          message: e.message || e,
          type: 'javascript_error'
        })));
      }
      
      const result = {
        name,
        url,
        status,
        title,
        loaded: status >= 200 && status < 400,
        hasContent,
        errors: pageErrors,
        warnings: pageWarnings,
        errorCount: pageErrors.length,
        warningCount: pageWarnings.length
      };
      
      if (result.loaded && result.hasContent && result.errorCount === 0) {
        console.log(`   ✅ PASS - Loaded successfully`);
      } else {
        console.log(`   ⚠️  ISSUES FOUND:`);
        if (!result.loaded) {
          console.log(`      - HTTP Status: ${status}`);
        }
        if (!result.hasContent) {
          console.log(`      - Page content too small`);
        }
        if (result.errorCount > 0) {
          console.log(`      - Errors: ${result.errorCount}`);
          pageErrors.forEach(e => {
            console.log(`        • ${e.message.substring(0, 100)}`);
          });
        }
        if (result.warningCount > 0) {
          console.log(`      - Warnings: ${result.warningCount}`);
        }
      }
      
      this.results.push(result);
      
    } catch (error) {
      console.log(`   ❌ FAIL - ${error.message}`);
      this.results.push({
        name,
        url,
        status: 0,
        loaded: false,
        hasContent: false,
        errors: [{ message: error.message, type: 'navigation_error' }],
        warnings: [],
        errorCount: 1,
        warningCount: 0
      });
    }
  }

  async runAllTests() {
    await this.init();
    
    console.log(`\n📋 Testing ${PAGES.length} pages...\n`);
    
    for (const pageInfo of PAGES) {
      await this.testPage(pageInfo);
      // Small delay between pages
      await this.page.waitForTimeout(500);
    }
    
    await this.generateReport();
    await this.cleanup();
  }

  generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(80));
    
    const totalPages = this.results.length;
    const passedPages = this.results.filter(r => r.loaded && r.hasContent && r.errorCount === 0).length;
    const failedPages = totalPages - passedPages;
    const totalErrors = this.results.reduce((sum, r) => sum + r.errorCount, 0);
    const totalWarnings = this.results.reduce((sum, r) => sum + r.warningCount, 0);
    
    console.log(`\n📈 Overall Statistics:`);
    console.log(`   Total Pages Tested: ${totalPages}`);
    console.log(`   ✅ Passed: ${passedPages}`);
    console.log(`   ❌ Failed: ${failedPages}`);
    console.log(`   ⚠️  Total Errors: ${totalErrors}`);
    console.log(`   ⚠️  Total Warnings: ${totalWarnings}`);
    console.log(`   Pass Rate: ${((passedPages / totalPages) * 100).toFixed(1)}%`);
    
    if (failedPages > 0) {
      console.log(`\n❌ Failed Pages:`);
      this.results
        .filter(r => !r.loaded || !r.hasContent || r.errorCount > 0)
        .forEach(r => {
          console.log(`\n   ${r.name} (${r.url})`);
          if (!r.loaded) {
            console.log(`      Status: ${r.status}`);
          }
          if (r.errorCount > 0) {
            console.log(`      Errors (${r.errorCount}):`);
            r.errors.slice(0, 5).forEach(e => {
              console.log(`        • ${e.message.substring(0, 150)}`);
            });
            if (r.errors.length > 5) {
              console.log(`        ... and ${r.errors.length - 5} more`);
            }
          }
        });
    }
    
    if (totalErrors > 0) {
      console.log(`\n🔍 All Errors:`);
      this.results
        .filter(r => r.errorCount > 0)
        .forEach(r => {
          r.errors.forEach(e => {
            console.log(`\n   [${r.name}] ${e.type}:`);
            console.log(`      ${e.message.substring(0, 200)}`);
          });
        });
    }
    
    if (totalWarnings > 0 && totalWarnings < 20) {
      console.log(`\n⚠️  Warnings:`);
      this.results
        .filter(r => r.warningCount > 0)
        .forEach(r => {
          r.warnings.slice(0, 3).forEach(w => {
            console.log(`   [${r.name}] ${w.message.substring(0, 150)}`);
          });
        });
    }
    
    console.log('\n' + '='.repeat(80));
    
    // Save detailed report
    const report = {
      timestamp: new Date().toISOString(),
      baseUrl: BASE_URL,
      summary: {
        totalPages,
        passedPages,
        failedPages,
        totalErrors,
        totalWarnings,
        passRate: ((passedPages / totalPages) * 100).toFixed(1) + '%'
      },
      results: this.results
    };
    
    const fs = await import('fs');
    const reportPath = join(__dirname, '../../test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailed report saved to: test-report.json`);
    
    // Exit with appropriate code
    if (failedPages > 0 || totalErrors > 0) {
      console.log('\n❌ Tests completed with errors\n');
      process.exit(1);
    } else {
      console.log('\n✅ All tests passed!\n');
      process.exit(0);
    }
  }

  async cleanup() {
    if (this.page) {
      await this.page.close();
    }
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// Run tests
const tester = new PageTester();
tester.runAllTests().catch(error => {
  console.error('❌ Test runner error:', error);
  process.exit(1);
});


