/**
 * Comprehensive Navigation and Redirect Testing Script
 * Tests all navigation links and verifies redirects work correctly
 */

import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
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
    this.isLoggedIn = false;
  }

  async init() {
    console.log('🚀 Starting navigation and redirect testing...\n');
    console.log(`📍 Testing URL: ${BASE_URL}\n`);
    
    this.browser = await puppeteer.launch({
      headless: HEADLESS ? 'new' : false,
      slowMo: HEADLESS ? 0 : 100,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1280, height: 720 }
    });
    
    this.page = await this.browser.newPage();
    
    // Monitor console
    this.page.on('console', (msg) => {
      const type = msg.type();
      const text = msg.text();
      if (type === 'error' && !this.isBenignError(text)) {
        this.errors.push({ page: 'current', message: text, type: 'console.error' });
      }
    });
    
    // Monitor page errors
    this.page.on('pageerror', (error) => {
      if (!this.isBenignError(error.message)) {
        this.errors.push({ page: 'current', message: error.message, type: 'pageerror' });
      }
    });
    
    // Monitor request failures
    this.page.on('requestfailed', (request) => {
      const url = request.url();
      if (!url.includes('favicon') && !url.includes('local-test-data')) {
        this.errors.push({ page: 'current', message: `Request failed: ${url}`, type: 'requestfailed', url });
      }
    });
  }

  isBenignError(text) {
    if (!text) return false;
    const lowered = text.toLowerCase();
    return (
      lowered.includes('permission-denied') ||
      lowered.includes('firebase') && lowered.includes('404') ||
      lowered.includes('manifest')
    );
  }

  async login() {
    console.log('🔐 Logging in...\n');
    
    try {
      await this.page.goto(`${BASE_URL}/src/pages/auth/login.html`, {
        waitUntil: 'networkidle2',
        timeout: TIMEOUT
      });
      
      await this.page.waitForSelector('#email', { timeout: 10000 });
      await this.page.waitForSelector('#password', { timeout: 10000 });
      
      await this.page.type('#email', TEST_EMAIL, { delay: 50 });
      await this.page.type('#password', TEST_PASSWORD, { delay: 50 });
      
      await this.page.click('#loginBtn');
      
      await Promise.race([
        this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }),
        new Promise(resolve => setTimeout(resolve, 5000))
      ]);
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const currentUrl = this.page.url();
      const isLoggedIn = await this.page.evaluate(() => {
        return window.auth && window.auth.currentUser !== null;
      });
      
      if (isLoggedIn) {
        this.isLoggedIn = true;
        console.log('✅ Logged in successfully\n');
        return true;
      }
      
      console.log('⚠️  Login status unclear, continuing...\n');
      return false;
    } catch (error) {
      console.log(`⚠️  Login attempt failed: ${error.message}, continuing anyway...\n`);
      return false;
    }
  }

  async getNavigationLinks() {
    console.log('🔍 Finding navigation links on dashboard...\n');
    
    await this.page.goto(`${BASE_URL}/index.html`, {
      waitUntil: 'networkidle2',
      timeout: TIMEOUT
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const links = await this.page.evaluate(() => {
      const linkElements = [];
      
      // Get tool-card links
      document.querySelectorAll('.tool-card[href]').forEach(card => {
        const href = card.getAttribute('href');
        const text = card.querySelector('h3')?.textContent || card.textContent.trim();
        if (href) {
          linkElements.push({ type: 'tool-card', href, text: text.substring(0, 50) });
        }
      });
      
      // Get recommendation links
      document.querySelectorAll('.recommendation-link[href]').forEach(link => {
        const href = link.getAttribute('href');
        const text = link.textContent.trim();
        if (href) {
          linkElements.push({ type: 'recommendation-link', href, text: text.substring(0, 50) });
        }
      });
      
      return linkElements;
    });
    
    console.log(`   Found ${links.length} navigation links\n`);
    return links;
  }

  async testNavigation(linkInfo, index, total) {
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
      navigationWorked: false,
      redirectCorrect: null,
      finalUrl: null,
      title: null,
      errors: []
    };
    
    try {
      // Navigate back to dashboard first
      await this.page.goto(`${BASE_URL}/index.html`, {
        waitUntil: 'networkidle2',
        timeout: TIMEOUT
      });
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const errorsBefore = this.errors.length;
      
      // Find and click the link
      const linkSelector = type === 'tool-card' 
        ? `.tool-card[href="${href}"]`
        : `.recommendation-link[href="${href}"]`;
      
      const linkExists = await this.page.evaluate((selector) => {
        return document.querySelector(selector) !== null;
      }, linkSelector);
      
      if (!linkExists) {
        result.errors.push({ message: 'Link not found on page' });
        this.results.push(result);
        console.log(`   ❌ FAIL - Link not found`);
        return result;
      }
      
      console.log(`   👆 Clicking link...`);
      
      // Click and wait for navigation
      const [navigation] = await Promise.all([
        this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: TIMEOUT }).catch(() => null),
        this.page.click(linkSelector)
      ]);
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check results
      const currentUrl = this.page.url();
      result.finalUrl = currentUrl;
      result.navigationWorked = !!navigation;
      
      // Check if we're on the correct page - more flexible matching
      const targetUrl = new URL(href, BASE_URL);
      const targetPathname = targetUrl.pathname.replace(/\.html$/, ''); // Remove .html for comparison
      const currentPathname = new URL(currentUrl).pathname.replace(/\.html$/, '');
      
      // Match if paths are the same (with or without .html extension)
      const urlMatches = currentUrl.includes(href) || 
                         currentUrl.includes(targetUrl.pathname) ||
                         currentPathname === targetPathname ||
                         currentPathname.endsWith(targetPathname) ||
                         targetPathname.endsWith(currentPathname) ||
                         (href.startsWith('/') && currentUrl.includes(href.substring(1))) ||
                         currentUrl === targetUrl.href;
      
      // Get page info
      const pageInfo = await this.page.evaluate(() => {
        return {
          title: document.title || 'No title',
          bodyLength: document.body ? document.body.innerHTML.length : 0,
          hasContent: document.body && document.body.innerHTML.length > 100,
          pathname: window.location.pathname
        };
      });
      
      result.title = pageInfo.title;
      result.accessible = pageInfo.hasContent;
      result.loaded = urlMatches && pageInfo.hasContent;
      
      // Check if redirected correctly
      if (urlMatches && pageInfo.hasContent) {
        result.redirectCorrect = true;
        console.log(`   ✅ PASS - Page loaded correctly`);
        console.log(`      Title: ${pageInfo.title}`);
        console.log(`      URL: ${currentUrl}`);
      } else if (currentUrl.includes('login.html')) {
        result.redirectCorrect = 'redirected_to_login';
        result.errors.push({ message: 'Redirected to login (may need authentication)' });
        console.log(`   ⚠️  WARNING - Redirected to login page`);
        console.log(`      Expected: ${href}`);
        console.log(`      Got: ${currentUrl}`);
      } else {
        result.redirectCorrect = false;
        result.errors.push({ message: `Navigation failed - expected ${href}, got ${currentUrl}` });
        console.log(`   ❌ FAIL - Navigation failed`);
        console.log(`      Expected: ${href}`);
        console.log(`      Got: ${currentUrl}`);
      }
      
      // Collect errors
      const newErrors = this.errors.slice(errorsBefore);
      result.errors.push(...newErrors.map(e => ({ message: e.message, type: e.type })));
      
      if (result.errors.length > 0) {
        console.log(`      ⚠️  Errors: ${result.errors.length}`);
      }
      
    } catch (error) {
      result.errors.push({ message: error.message, type: 'test_error' });
      console.log(`   ❌ FAIL - ${error.message}`);
    }
    
    this.results.push(result);
    return result;
  }

  async testRedirects() {
    console.log('\n🔄 Testing redirects...\n');
    
    const redirectTests = [
      {
        name: 'Unauthenticated user accessing protected page',
        from: `${BASE_URL}/src/pages/debt/Debt_Tracker.html`,
        shouldRedirect: true,
        expectedTo: 'login.html'
      },
      {
        name: 'Authenticated user on login page',
        from: `${BASE_URL}/src/pages/auth/login.html`,
        shouldRedirect: false,
        expectedTo: 'index.html'
      },
      {
        name: 'Direct access to dashboard',
        from: `${BASE_URL}/index.html`,
        shouldRedirect: false,
        expectedTo: null
      }
    ];
    
    for (const test of redirectTests) {
      console.log(`\n   Testing: ${test.name}`);
      console.log(`   From: ${test.from}`);
      
      try {
        await this.page.goto(test.from, {
          waitUntil: 'networkidle2',
          timeout: TIMEOUT
        });
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const finalUrl = this.page.url();
        const redirected = !finalUrl.includes(new URL(test.from).pathname);
        
        console.log(`   Final URL: ${finalUrl}`);
        console.log(`   Redirected: ${redirected}`);
        
        if (test.shouldRedirect && redirected && finalUrl.includes(test.expectedTo)) {
          console.log(`   ✅ PASS - Redirected correctly`);
        } else if (!test.shouldRedirect && !redirected) {
          console.log(`   ✅ PASS - No redirect (as expected)`);
        } else {
          console.log(`   ❌ FAIL - Redirect behavior incorrect`);
        }
      } catch (error) {
        console.log(`   ❌ ERROR - ${error.message}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  async runAllTests() {
    await this.init();
    
    await this.login();
    
    const links = await this.getNavigationLinks();
    
    if (links.length === 0) {
      console.log('❌ No navigation links found!\n');
      await this.cleanup();
      process.exit(1);
    }
    
    console.log(`\n📋 Testing ${links.length} navigation links...\n`);
    
    for (let i = 0; i < links.length; i++) {
      await this.testNavigation(links[i], i, links.length);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    await this.testRedirects();
    
    await this.generateReport();
    await this.cleanup();
  }

  async generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(80));
    
    const totalLinks = this.results.length;
    const passedLinks = this.results.filter(r => r.loaded && r.redirectCorrect === true).length;
    const failedLinks = totalLinks - passedLinks;
    const redirectedToLogin = this.results.filter(r => r.redirectCorrect === 'redirected_to_login').length;
    const totalErrors = this.results.reduce((sum, r) => sum + r.errors.length, 0);
    
    console.log(`\n📈 Overall Statistics:`);
    console.log(`   Total Links Tested: ${totalLinks}`);
    console.log(`   ✅ Passed: ${passedLinks}`);
    console.log(`   ❌ Failed: ${failedLinks}`);
    console.log(`   ⚠️  Redirected to Login: ${redirectedToLogin}`);
    console.log(`   ⚠️  Total Errors: ${totalErrors}`);
    console.log(`   Pass Rate: ${((passedLinks / totalLinks) * 100).toFixed(1)}%`);
    
    if (failedLinks > 0) {
      console.log(`\n❌ Failed Navigation:`);
      this.results
        .filter(r => !r.loaded || r.redirectCorrect === false)
        .forEach(r => {
          console.log(`\n   [${r.type}] ${r.text}`);
          console.log(`      Expected URL: ${r.href}`);
          console.log(`      Final URL: ${r.finalUrl || 'N/A'}`);
          if (r.errors.length > 0) {
            r.errors.slice(0, 3).forEach(e => {
              console.log(`        • ${e.message.substring(0, 120)}`);
            });
          }
        });
    }
    
    if (redirectedToLogin > 0) {
      console.log(`\n⚠️  Links Redirected to Login:`);
      this.results
        .filter(r => r.redirectCorrect === 'redirected_to_login')
        .forEach(r => {
          console.log(`   • ${r.text} (${r.href})`);
        });
    }
    
    console.log('\n' + '='.repeat(80));
    
    const report = {
      timestamp: new Date().toISOString(),
      baseUrl: BASE_URL,
      isLoggedIn: this.isLoggedIn,
      summary: {
        totalLinks,
        passedLinks,
        failedLinks,
        redirectedToLogin,
        totalErrors,
        passRate: ((passedLinks / totalLinks) * 100).toFixed(1) + '%'
      },
      results: this.results
    };
    
    const { mkdir } = await import('fs/promises');
    const reportDir = join(__dirname, '../output');
    await mkdir(reportDir, { recursive: true });
    const reportPath = join(reportDir, 'navigation-redirect-test-report.json');
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    
    if (failedLinks > 0 || totalErrors > 0) {
      console.log('\n❌ Tests completed with failures\n');
      process.exit(1);
    } else {
      console.log('\n✅ All tests passed!\n');
      process.exit(0);
    }
  }

  async cleanup() {
    if (this.page) await this.page.close();
    if (this.browser) await this.browser.close();
  }
}

const tester = new NavigationTester();
tester.runAllTests().catch(error => {
  console.error('❌ Test runner error:', error);
  process.exit(1);
});

