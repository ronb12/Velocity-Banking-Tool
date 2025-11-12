import puppeteer from 'puppeteer';
import { mkdir } from 'fs/promises';
import { dirname } from 'path';

const BASE_URL = 'http://localhost:8000';
const TEST_EMAIL = 'testuser@BFH.com';
const TEST_PASSWORD = 'test1234';
const HEADLESS = process.env.HEADLESS !== 'false';
const KEEP_BROWSER_OPEN = !HEADLESS && process.env.KEEP_OPEN !== 'false';
const FIREBASE_API_KEY = 'AIzaSyDrdga_hOO52nicYN3AwqqDjSbcnre6iM4';

async function runLoginTest() {
  const browser = await puppeteer.launch({
    headless: HEADLESS ? 'new' : false,
    slowMo: HEADLESS ? 0 : 200,
    defaultViewport: HEADLESS ? { width: 1280, height: 720 } : null,
    args: HEADLESS ? [] : ['--start-maximized']
  });

  const page = await browser.newPage();
  const consoleEvents = [];
  const pageErrors = [];

  const isBenignError = (text) => {
    if (!text) return false;
    const lowered = text.toLowerCase();
    return lowered.includes('permission-denied') || lowered.includes('dashboard feature test skipped');
  };

  page.on('console', msg => {
    const entry = `[browser:${msg.type()}] ${msg.text()}`;
    consoleEvents.push(entry);
    console.log(entry);
  });

  page.on('pageerror', error => {
    const entry = `[browser:pageerror] ${error.message}`;
    pageErrors.push(entry);
    console.error(entry);
  });

  try {
    let loginSuccess = false;
    for (let attempt = 1; attempt <= 3 && !loginSuccess; attempt++) {
      console.log(`Navigating to login page (attempt ${attempt})...`);
      const response = await page.goto(`${BASE_URL}/login.html`, {
        waitUntil: 'domcontentloaded',
        timeout: 0
      });

      if (!response || !response.ok()) {
        throw new Error(`Failed to load login page: ${response?.status()} ${response?.statusText()}`);
      }

      console.log('Filling credentials...');
      await page.evaluate((email, password) => {
        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        if (emailInput) {
          emailInput.focus();
          emailInput.value = '';
          emailInput.dispatchEvent(new Event('input', { bubbles: true }));
          emailInput.value = email;
        }
        if (passwordInput) {
          passwordInput.focus();
          passwordInput.value = '';
          passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
          passwordInput.value = password;
        }
      }, TEST_EMAIL, TEST_PASSWORD);

      console.log('Submitting form...');
      await page.click('#loginBtn');
      await new Promise(resolve