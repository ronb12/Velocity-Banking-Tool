/**
 * E2E Test Runner
 * Runs all end-to-end tests
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { readdir } from 'fs/promises';
import { join } from 'path';

const execAsync = promisify(exec);

async function runAllE2ETests() {
  console.log('🚀 Running all E2E tests...\n');

  const testsDir = join(process.cwd(), 'tests', 'e2e');
  const files = await readdir(testsDir);
  const testFiles = files.filter(f => f.endsWith('.mjs') || f.endsWith('.js'));

  const results = [];

  for (const testFile of testFiles) {
    console.log(`\n📋 Running: ${testFile}`);
    try {
      const { stdout, stderr } = await execAsync(`node ${join(testsDir, testFile)}`);
      console.log(stdout);
      if (stderr) console.error(stderr);
      results.push({ file: testFile, success: true });
    } catch (error) {
      console.error(`❌ Failed: ${testFile}`);
      console.error(error.message);
      results.push({ file: testFile, success: false, error: error.message });
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('E2E Test Summary');
  console.log('═══════════════════════════════════════════════════════════\n');

  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`✅ Passed: ${passed}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}\n`);

  if (failed > 0) {
    console.log('Failed Tests:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  ❌ ${r.file}`);
    });
    process.exit(1);
  }

  console.log('✅ All E2E tests passed!');
}

runAllE2ETests().catch(error => {
  console.error('❌ Test runner error:', error);
  process.exit(1);
});

