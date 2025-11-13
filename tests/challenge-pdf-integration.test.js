/**
 * Integration Tests for PDF File Existence
 * Tests that all PDF files referenced in challenge_library.html actually exist
 */

import fs from 'fs';
import path from 'path';
import http from 'http';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_DIR = path.join(__dirname, '..');
const LIVE_URL = 'https://mobile-debt-tracker.web.app';
const LOCAL_URL = 'http://localhost:5500';

// Note: This test file uses CommonJS-style requires which need to be converted
// For now, we'll skip this test in Jest and run it separately if needed

class PDFIntegrationTests {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
    this.pdfs = [
      'pdfs/5000_biweekly.pdf',
      'pdfs/52_week_1378.pdf',
      'pdfs/emergency_fund.pdf',
      'pdfs/no_spend_30day.pdf',
      'pdfs/vacation_12month.pdf',
      'pdfs/holiday_12week.pdf',
      'pdfs/weekly_10up.pdf',
      'pdfs/random_dice.pdf'
    ];
  }

  log(message, type = 'INFO') {
    const icon = type === 'PASS' ? '✅' : type === 'FAIL' ? '❌' : 'ℹ️';
    console.log(`${icon} ${message}`);
  }

  async test(name, fn) {
    try {
      await fn();
      this.passed++;
      this.tests.push({ name, passed: true });
      this.log(name, 'PASS');
    } catch (error) {
      this.failed++;
      this.tests.push({ name, passed: false, error: error.message });
      this.log(`${name} - ${error.message}`, 'FAIL');
    }
  }

  // Check if file exists locally
  checkLocalFile(filePath) {
    const fullPath = path.join(BASE_DIR, filePath);
    return fs.existsSync(fullPath);
  }

  // Check if file exists on server (HTTP HEAD request)
  async checkRemoteFile(url) {
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https') ? https : http;
      const req = client.request(url, { method: 'HEAD' }, (res) => {
        resolve(res.statusCode === 200);
      });

      req.on('error', () => resolve(false));
      req.setTimeout(5000, () => {
        req.destroy();
        resolve(false);
      });

      req.end();
    });
  }

  // Get file size if exists
  getFileSize(filePath) {
    const fullPath = path.join(BASE_DIR, filePath);
    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath);
      return stats.size;
    }
    return 0;
  }

  // ===== TEST 1: Local File Existence =====
  async testLocalFileExistence() {
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('TEST 1: LOCAL FILE EXISTENCE');
    console.log('═══════════════════════════════════════════════════════════\n');

    for (const pdf of this.pdfs) {
      await this.test(`Local File - ${pdf} exists`, () => {
        if (!this.checkLocalFile(pdf)) {
          throw new Error(`File not found: ${pdf}`);
        }
      });

      await this.test(`Local File - ${pdf} has content (size > 0)`, () => {
        const size = this.getFileSize(pdf);
        if (size === 0) {
          throw new Error(`File is empty: ${pdf}`);
        }
      });
    }
  }

  // ===== TEST 2: Remote File Existence (Live Site) =====
  async testRemoteFileExistence() {
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('TEST 2: REMOTE FILE EXISTENCE (LIVE SITE)');
    console.log('═══════════════════════════════════════════════════════════\n');

    for (const pdf of this.pdfs) {
      const remoteUrl = `${LIVE_URL}/${pdf}`;
      await this.test(`Remote File - ${pdf} accessible on live site`, async () => {
        const exists = await this.checkRemoteFile(remoteUrl);
        if (!exists) {
          throw new Error(`File not accessible: ${remoteUrl}`);
        }
      });
    }
  }

  // ===== TEST 3: PDF Directory Structure =====
  async testDirectoryStructure() {
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('TEST 3: DIRECTORY STRUCTURE');
    console.log('═══════════════════════════════════════════════════════════\n');

    await this.test('Directory Structure - pdfs/ directory exists', () => {
      const pdfsDir = path.join(BASE_DIR, 'pdfs');
      if (!fs.existsSync(pdfsDir)) {
        throw new Error('pdfs/ directory does not exist');
      }
    });

    await this.test('Directory Structure - pdfs/ is a directory', () => {
      const pdfsDir = path.join(BASE_DIR, 'pdfs');
      const stats = fs.statSync(pdfsDir);
      if (!stats.isDirectory()) {
        throw new Error('pdfs/ is not a directory');
      }
    });
  }

  // ===== TEST 4: File Naming Consistency =====
  async testFileNamingConsistency() {
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('TEST 4: FILE NAMING CONSISTENCY');
    console.log('═══════════════════════════════════════════════════════════\n');

    await this.test('File Naming - All files use .pdf extension', () => {
      const invalidFiles = this.pdfs.filter(pdf => !pdf.endsWith('.pdf'));
      if (invalidFiles.length > 0) {
        throw new Error(`Files without .pdf extension: ${invalidFiles.join(', ')}`);
      }
    });

    await this.test('File Naming - All files are in pdfs/ directory', () => {
      const invalidFiles = this.pdfs.filter(pdf => !pdf.startsWith('pdfs/'));
      if (invalidFiles.length > 0) {
        throw new Error(`Files not in pdfs/ directory: ${invalidFiles.join(', ')}`);
      }
    });
  }

  // ===== TEST 5: File Size Validation =====
  async testFileSizeValidation() {
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('TEST 5: FILE SIZE VALIDATION');
    console.log('═══════════════════════════════════════════════════════════\n');

    for (const pdf of this.pdfs) {
      if (this.checkLocalFile(pdf)) {
        const size = this.getFileSize(pdf);
        await this.test(`File Size - ${pdf} has reasonable size (${(size / 1024).toFixed(2)} KB)`, () => {
          // PDFs should be at least 100 bytes (for minimal valid PDFs) and not more than 10MB
          // Allow small placeholder PDFs (100-1024 bytes) but warn if they're placeholders
          if (size < 100) {
            throw new Error(`File too small: ${size} bytes (invalid PDF)`);
          }
          if (size < 1024) {
            // This is a placeholder PDF - acceptable but note it
            this.log(`Note: ${pdf} is a placeholder PDF (${size} bytes). Replace with full content when available.`, 'INFO');
          }
          if (size > 10 * 1024 * 1024) {
            throw new Error(`File too large: ${(size / 1024 / 1024).toFixed(2)} MB (may be corrupted)`);
          }
        });
      }
    }
  }

  // ===== TEST 6: Challenge Library HTML References =====
  async testHTMLReferences() {
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('TEST 6: HTML REFERENCES');
    console.log('═══════════════════════════════════════════════════════════\n');

    const challengeLibraryPath = path.join(BASE_DIR, 'challenge_library.html');
    
    await this.test('HTML References - challenge_library.html exists', () => {
      if (!fs.existsSync(challengeLibraryPath)) {
        throw new Error('challenge_library.html not found');
      }
    });

    await this.test('HTML References - All PDFs are referenced in HTML', () => {
      const htmlContent = fs.readFileSync(challengeLibraryPath, 'utf8');
      const missingRefs = this.pdfs.filter(pdf => !htmlContent.includes(pdf));
      if (missingRefs.length > 0) {
        throw new Error(`PDFs not referenced in HTML: ${missingRefs.join(', ')}`);
      }
    });
  }

  // ===== TEST 7: Create Missing PDFs Directory =====
  async testCreatePDFsDirectory() {
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('TEST 7: CREATE MISSING PDFS DIRECTORY');
    console.log('═══════════════════════════════════════════════════════════\n');

    await this.test('Create Directory - pdfs/ directory can be created if missing', () => {
      const pdfsDir = path.join(BASE_DIR, 'pdfs');
      if (!fs.existsSync(pdfsDir)) {
        try {
          fs.mkdirSync(pdfsDir, { recursive: true });
          this.log('Created pdfs/ directory', 'INFO');
        } catch (error) {
          throw new Error(`Failed to create pdfs/ directory: ${error.message}`);
        }
      }
    });
  }

  // Run all tests
  async runAll() {
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('PDF INTEGRATION TESTS');
    console.log('═══════════════════════════════════════════════════════════\n');

    await this.testDirectoryStructure();
    await this.testCreatePDFsDirectory();
    await this.testFileNamingConsistency();
    await this.testLocalFileExistence();
    await this.testFileSizeValidation();
    await this.testHTMLReferences();
    
    // Only test remote files if we're in a CI/CD environment or explicitly requested
    if (process.env.TEST_REMOTE_FILES === 'true') {
      await this.testRemoteFileExistence();
    } else {
      this.log('Skipping remote file tests (set TEST_REMOTE_FILES=true to enable)', 'INFO');
    }

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('TEST SUMMARY');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log(`Total Tests: ${this.tests.length}`);
    console.log(`Passed: ${this.passed} ✅`);
    console.log(`Failed: ${this.failed} ${this.failed > 0 ? '❌' : ''}`);
    console.log(`Pass Rate: ${((this.passed / this.tests.length) * 100).toFixed(1)}%\n`);

    if (this.failed > 0) {
      console.log('Failed Tests:');
      this.tests.filter(t => !t.passed).forEach(test => {
        console.log(`  ❌ ${test.name}`);
        if (test.error) console.log(`     ${test.error}`);
      });
    }

    // List missing PDFs
    const missingPDFs = this.pdfs.filter(pdf => !this.checkLocalFile(pdf));
    if (missingPDFs.length > 0) {
      console.log('\n⚠️  Missing PDF Files:');
      missingPDFs.forEach(pdf => {
        console.log(`   - ${pdf}`);
      });
      console.log('\n💡 Tip: Create placeholder PDFs or update challenge_library.html to remove references.');
    }

    return {
      total: this.tests.length,
      passed: this.passed,
      failed: this.failed,
      passRate: (this.passed / this.tests.length) * 100,
      missingPDFs
    };
  }
}

// Run tests if executed directly
if (require.main === module) {
  const testSuite = new PDFIntegrationTests();
  testSuite.runAll().then(result => {
    process.exit(result.failed > 0 ? 1 : 0);
  }).catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = PDFIntegrationTests;

