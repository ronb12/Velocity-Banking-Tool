/**
 * Comprehensive Navigation Link Testing Script
 * Tests all navigation links from dashboard and verifies click handlers work
 */

import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdir } from 'fs/promises';
import { writeFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const TEST_EMAIL = 'testuser@BFH.com';
const TEST_PASSWORD = 'test1234';
const TIMEOUT = 30000;
const HEADLESS = process.env.HEADLESS !== 'false';

class NavigationTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = [];
    this.errors = [];
    this.warnings = [];
    this.isLoggedIn = false;
  }

  async init() {
    console.log('🚀 Starting navigation link testing...\n');
    console.log(`📍 Testing URL: ${BASE_URL}\n`);
    
    this.browser = await puppeteer.launch({
      headless: HEADLESS ? 'new' : false,
      slowMo: HEADLESS ? 0 : 100,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1280, height: 720 }
    });
    
    this.page = await this.browser.newPage();
    
    // Set up console monitoring
    this.page.on('console', (msg) => {
      const type = msg.type();
      const text = msg.text();
      
      if (type === 'error') {
        // Filter out benign errors
        if (!this.isBenignError(text)) {
          this.errors.push({
            page: 'current',
            message: text,
            type: 'console.error'
          });
        }
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
      if (!this.isBenignError(error.message)) {
        this.errors.push({
          page: 'current',
          message: error.message,
          type: 'pageerror',
          stack: error.stack
        });
      }
    });
    
    // Monitor request failures
    this.page.on('requestfailed', (request) => {
      const url = request.url();
      // Filter out expected 404s for optional resources
      if (!url.includes('favicon') && !url.includes('local-test-data')) {
        this.errors.push({
          page: 'current',
          message: `Request failed: ${url}`,
          type: 'requestfailed',
          url: url
        });
      }
    });
  }

  isBenignError(text) {
    if (!text) return false;
    const lowered = text.toLowerCase();
    return (
      lowered.includes('permission-denied') ||
      lowered.includes('dashboard feature test skipped') ||
      lowered.includes('firebase') && lowered.includes('404')
    );
  }

  async login() {
    console.log('🔐 Logging in...\n');
    
    try {
      // Navigate to login page
      await this.page.goto(`${BASE_URL}/src/pages/auth/login.html`, {
        waitUntil: 'networkidle2',
        timeout: TIMEOUT
      });
      
      // Wait for form to be ready
      await this.page.waitForSelector('#email', { timeout: 10000 });
      await this.page.waitForSelector('#password', { timeout: 10000 });
      
      // Fill in credentials
      await this.page.type('#email', TEST_EMAIL, { delay: 50 });
      await this.page.type('#password', TEST_PASSWORD, { delay: 50 });
      
      // Click login button
      await this.page.click('#loginBtn');
      
      // Wait for navigation to dashboard (or error)
      await Promise.race([
        this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }),
        this.page.waitForSelector('.error-message', { timeout: 5000 }).catch(() => null)
      ]);
      
      // Check if we're on the dashboard
      const currentUrl = this.page.url();
      if (currentUrl.includes('index.html') || currentUrl.endsWith('/') || currentUrl.includes('login.html') === false) {
        // Wait a bit more for auth to settle
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Check if user is logged in
        const isLoggedIn = await this.page.evaluate(() => {
          return window.auth && window.auth.currentUser !== null;
        });
        
        if (isLoggedIn) {
          this.isLoggedIn = true;
          console.log('✅ Logged in successfully\n');
          return true;
        }
      }
      
      // Check for error message
      const errorMsg = await this.page.evaluate(() => {
        const errorEl = document.querySelector('.error-message, .error');
        return errorEl ? errorEl.textContent : null;
      });
      
      if (errorMsg) {
        console.log(`❌ Login failed: ${errorMsg}\n`);
        return false;
      }
      
      console.log('⚠️  Login status unclear, continuing...\n');
      return true;
    } catch (error) {
      console.log(`⚠️  Login attempt failed: ${error.message}, continuing anyway...\n`);
      return false;
    }
  }

  async getNavigationLinks() {
    console.log('🔍 Finding navigation links on dashboard...\n');
    
    // Navigate to dashboard
    await this.page.goto(`${BASE_URL}/index.html`, {
      waitUntil: 'networkidle2',
      timeout: TIMEOUT
    });
    
      // Wait for dashboard to load
      await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Find all navigation links
    const links = await this.page.evaluate(() => {
      const linkElements = [];
      
      // Get tool-card links
      const toolCards = document.querySelectorAll('.tool-card[href]');
      toolCards.forEach(card => {
        const href = card.getAttribute('href');
        const text = card.querySelector('h3')?.textContent || card.textContent.trim();
        if (href) {
          linkElements.push({
            type: 'tool-card',
            href: href,
            text: text.substring(0, 50),
            element: card
          });
        }
      });
      
      // Get recommendation links
      const recLinks = document.querySelectorAll('.recommendation-link[href]');
      recLinks.forEach(link => {
        const href = link.getAttribute('href');
        const text = link.textContent.trim();
        if (href) {
          linkElements.push({
            type: 'recommendation-link',
            href: href,
            text: text.substring(0, 50),
            element: link
          });
        }
      });
      
      // Get quick action links
      const quickActions = document.querySelectorAll('.quick-action-card[onclick]');
      quickActions.forEach(card => {
        const onclick = card.getAttribute('onclick');
        // Extract URL from onclick (e.g., window.location.href='...')
        const urlMatch = onclick.match(/href=['"]([^'"]+)['"]/) || onclick.match(/location\.href\s*=\s*['"]([^'"]+)['"]/);
        if (urlMatch && urlMatch[1]) {
          linkElements.push({
            type: 'quick-action',
            href: urlMatch[1],
            text: card.querySelector('h3')?.textContent || card.textContent.trim().substring(0, 50),
            element: card
          });
        }
      });
      
      return linkElements;
    });
    
    console.log(`   Found ${links.length} navigation links\n`);
    return links;
  }

  async testLink(linkInfo, index, total) {
    const { type, href, text } = linkInfo;
    const linkNumber = `${index + 1}/${total}`;
    
    console.log(`\n🔗 [${linkNumber}] Testing ${type}: "${text}"`);
    console.log(`   URL: ${href}`);
    
    const result = {
      type,
      href,
      text,
      accessible: false,
      loaded: false,
      clickHandlerWorked: false,
      errors: [],
      warnings: [],
      status: null,
      title: null
    };
    
    try {
      // Navigate back to dashboard first
      await this.page.goto(`${BASE_URL}/index.html`, {
        waitUntil: 'networkidle2',
        timeout: TIMEOUT
      });
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Clear errors before testing
      const errorsBefore = this.errors.length;
      
      // Find the link element
      const linkSelector = type === 'tool-card' 
        ? `.tool-card[href="${href}"]`
        : type === 'recommendation-link'
        ? `.recommendation-link[href="${href}"]`
        : `.quick-action-card`;
      
      // Check if link exists
      const linkExists = await this.page.evaluate((selector, linkHref) => {
        const elements = document.querySelectorAll(selector);
        for (const el of elements) {
          const href = el.getAttribute('href') || el.getAttribute('onclick');
          if (href && href.includes(linkHref)) {
            return true;
          }
        }
        return false;
      }, linkSelector, href);
      
      if (!linkExists) {
        result.errors.push({ message: 'Link not found on page' });
        this.results.push(result);
        console.log(`   ❌ FAIL - Link not found`);
        return result;
      }
      
      // Click the link
      console.log(`   👆 Clicking link...`);
      
      const [navigation] = await Promise.all([
        this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: TIMEOUT }).catch(() => null),
        this.page.evaluate((selector, linkHref) => {
          const elements = document.querySelectorAll(selector);
          for (const el of elements) {
            const href = el.getAttribute('href') || el.getAttribute('onclick');
            if (href && href.includes(linkHref)) {
              if (el.getAttribute('onclick')) {
                // Execute onclick for quick actions
                eval(el.getAttribute('onclick'));
              } else {
                // Click the link
                el.click();
              }
              return true;
            }
          }
          return false;
        }, linkSelector, href)
      ]);
      
      // Wait a bit for page to settle
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check if navigation occurred
      const currentUrl = this.page.url();
      const targetUrl = new URL(href, BASE_URL).href;
      const urlMatches = currentUrl.includes(href) || currentUrl === targetUrl || 
                         (href.startsWith('/') && currentUrl.includes(href.substring(1)));
      
      if (navigation || urlMatches) {
        result.clickHandlerWorked = true;
        result.loaded = true;
        
        // Get page status and title
        const pageInfo = await this.page.evaluate(() => {
          return {
            title: document.title || 'No title',
            bodyLength: document.body ? document.body.innerHTML.length : 0,
            hasContent: document.body && document.body.innerHTML.length > 100
          };
        });
        
        result.title = pageInfo.title;
        result.accessible = pageInfo.hasContent;
        
      // Collect errors that occurred during navigation
      const errorsBeforeCount = this.errors.length - errorsBefore;
      const newErrors = this.errors.slice(-errorsBeforeCount);
        result.errors = newErrors.map(e => ({
          message: e.message,
          type: e.type
        }));
        
        console.log(`   ✅ PASS - Page loaded successfully`);
        console.log(`      Title: ${pageInfo.title}`);
        console.log(`      Content: ${pageInfo.bodyLength} characters`);
        
        if (result.errors.length > 0) {
          console.log(`      ⚠️  Errors: ${result.errors.length}`);
          result.errors.slice(0, 2).forEach(e => {
            console.log(`         • ${e.message.substring(0, 80)}`);
          });
        }
      } else {
        result.errors.push({ message: 'Navigation did not occur after click' });
        console.log(`   ❌ FAIL - Navigation did not occur`);
        console.log(`      Expected: ${href}`);
        console.log(`      Current: ${currentUrl}`);
      }
      
    } catch (error) {
      result.errors.push({ 
        message: error.message,
        type: 'test_error'
      });
      console.log(`   ❌ FAIL - ${error.message}`);
    }
    
    this.results.push(result);
    return result;
  }

  async runAllTests() {
    await this.init();
    
    // Try to login first
    await this.login();
    
    // Get all navigation links
    const links = await this.getNavigationLinks();
    
    if (links.length === 0) {
      console.log('❌ No navigation links found!\n');
      await this.cleanup();
      process.exit(1);
    }
    
    console.log(`\n📋 Testing ${links.length} navigation links...\n`);
    
    // Test each link
    for (let i = 0; i < links.length; i++) {
      await this.testLink(links[i], i, links.length);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    await this.generateReport();
    await this.cleanup();
  }

  async generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(80));
    
    const totalLinks = this.results.length;
    const passedLinks = this.results.filter(r => r.clickHandlerWorked && r.loaded && r.accessible).length;
    const failedLinks = totalLinks - passedLinks;
    const totalErrors = this.results.reduce((sum, r) => sum + r.errors.length, 0);
    
    console.log(`\n📈 Overall Statistics:`);
    console.log(`   Total Links Tested: ${totalLinks}`);
    console.log(`   ✅ Passed: ${passedLinks}`);
    console.log(`   ❌ Failed: ${failedLinks}`);
    console.log(`   ⚠️  Total Errors: ${totalErrors}`);
    console.log(`   Pass Rate: ${((passedLinks / totalLinks) * 100).toFixed(1)}%`);
    
    if (failedLinks > 0) {
      console.log(`\n❌ Failed Links:`);
      this.results
        .filter(r => !r.clickHandlerWorked || !r.loaded || !r.accessible)
        .forEach(r => {
          console.log(`\n   [${r.type}] ${r.text}`);
          console.log(`      URL: ${r.href}`);
          if (!r.clickHandlerWorked) {
            console.log(`      Issue: Click handler did not work`);
          }
          if (!r.loaded) {
            console.log(`      Issue: Page did not load`);
          }
          if (!r.accessible) {
            console.log(`      Issue: Page has no content`);
          }
          if (r.errors.length > 0) {
            console.log(`      Errors (${r.errors.length}):`);
            r.errors.slice(0, 3).forEach(e => {
              console.log(`        • ${e.message.substring(0, 120)}`);
            });
          }
        });
    }
    
    // Summary by type
    console.log(`\n📊 Results by Link Type:`);
    const byType = {};
    this.results.forEach(r => {
      if (!byType[r.type]) {
        byType[r.type] = { total: 0, passed: 0 };
      }
      byType[r.type].total++;
      if (r.clickHandlerWorked && r.loaded && r.accessible) {
        byType[r.type].passed++;
      }
    });
    
    Object.entries(byType).forEach(([type, stats]) => {
      const passRate = ((stats.passed / stats.total) * 100).toFixed(1);
      console.log(`   ${type}: ${stats.passed}/${stats.total} passed (${passRate}%)`);
    });
    
    console.log('\n' + '='.repeat(80));
    
    // Save detailed report
    const report = {
      timestamp: new Date().toISOString(),
      baseUrl: BASE_URL,
      isLoggedIn: this.isLoggedIn,
      summary: {
        totalLinks,
        passedLinks,
        failedLinks,
        totalErrors,
        passRate: ((passedLinks / totalLinks) * 100).toFixed(1) + '%'
      },
      results: this.results
    };
    
    const reportDir = join(__dirname, '../output');
    await mkdir(reportDir, { recursive: true });
    const reportPath = join(reportDir, 'navigation-test-report.json');
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    
    // Exit with appropriate code
    if (failedLinks > 0 || totalErrors > 0) {
      console.log('\n❌ Tests completed with failures\n');
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
const tester = new NavigationTester();
tester.runAllTests().catch(error => {
  console.error('❌ Test runner error:', error);
  process.exit(1);
});

