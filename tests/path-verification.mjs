/**
 * Path Verification Test
 * Tests that all HTML files have correct relative paths
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Files that should exist at root
const rootFiles = [
  'index.html',
  'auth.js',
  'config.js',
  'sync.js',
  'theme.css',
  'icons',
  'utils',
  'src/styles/theme.css',
  'src/styles/index-inline.css',
  'src/scripts/pages/index-inline.js',
];

// Files that should exist in specific locations
const expectedFiles = {
  'src/styles/auth/login.css': true,
  'src/pages/auth/login.html': true,
  'src/pages/auth/register.html': true,
  'src/pages/auth/reset.html': true,
};

function checkFileExists(filePath) {
  try {
    const fullPath = join(rootDir, filePath);
    const stats = statSync(fullPath);
    return stats.isFile() || stats.isDirectory();
  } catch {
    return false;
  }
}

function getRelativePath(fromFile, toFile) {
  const fromDir = dirname(join(rootDir, fromFile));
  const toPath = join(rootDir, toFile);
  return relative(fromDir, toPath).replace(/\\/g, '/');
}

function findHtmlFiles(dir = 'src/pages') {
  const files = [];
  const fullPath = join(rootDir, dir);
  
  try {
    const entries = readdirSync(fullPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullEntryPath = join(fullPath, entry.name);
      if (entry.isDirectory()) {
        files.push(...findHtmlFiles(join(dir, entry.name)));
      } else if (entry.isFile() && entry.name.endsWith('.html')) {
        files.push(join(dir, entry.name));
      }
    }
  } catch (error) {
    console.error(`Error reading ${dir}:`, error.message);
  }
  
  return files;
}

function verifyPaths(htmlFile) {
  const content = readFileSync(join(rootDir, htmlFile), 'utf-8');
  const issues = [];
  
  // Check for common path patterns
  const pathPatterns = [
    { pattern: /href=["']([^"']+\.css)/g, type: 'CSS' },
    { pattern: /src=["']([^"']+\.js)/g, type: 'JavaScript' },
    { pattern: /href=["']([^"']+\.html)/g, type: 'HTML' },
    { pattern: /(href|src)=["'](icons\/[^"']+)/g, type: 'Icon' },
  ];
  
  for (const { pattern, type } of pathPatterns) {
    const matches = [...content.matchAll(pattern)];
    for (const match of matches) {
      const path = match[1] || match[2];
      
      // Skip external URLs
      if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('//')) {
        continue;
      }
      
      // Skip data URIs
      if (path.startsWith('data:')) {
        continue;
      }
      
      // Check if path exists
      const fullPath = join(rootDir, dirname(htmlFile), path);
      const normalizedPath = fullPath.replace(/\\/g, '/');
      
      try {
        statSync(normalizedPath);
      } catch {
        // Path doesn't exist - check if it should be relative to root
        const rootPath = join(rootDir, path);
        try {
          statSync(rootPath);
          issues.push({
            type,
            path,
            issue: `Should use absolute path from root: ${path}`,
            suggestion: getRelativePath(htmlFile, path),
          });
        } catch {
          issues.push({
            type,
            path,
            issue: `Path not found: ${path}`,
            file: htmlFile,
          });
        }
      }
    }
  }
  
  return issues;
}

async function runTests() {
  console.log('🔍 Starting Path Verification Tests...\n');
  
  // Check root files exist
  console.log('Checking root files...');
  const rootIssues = [];
  for (const file of rootFiles) {
    if (!checkFileExists(file)) {
      rootIssues.push(file);
    }
  }
  
  if (rootIssues.length > 0) {
    console.log(`❌ Missing root files: ${rootIssues.join(', ')}\n`);
  } else {
    console.log('✅ All root files exist\n');
  }
  
  // Find all HTML files
  console.log('Finding HTML files...');
  const htmlFiles = findHtmlFiles();
  console.log(`Found ${htmlFiles.length} HTML files\n`);
  
  // Verify paths in each HTML file
  console.log('Verifying paths in HTML files...\n');
  let totalIssues = 0;
  const fileIssues = {};
  
  for (const htmlFile of htmlFiles) {
    const issues = verifyPaths(htmlFile);
    if (issues.length > 0) {
      fileIssues[htmlFile] = issues;
      totalIssues += issues.length;
    }
  }
  
  // Report results
  if (totalIssues === 0) {
    console.log('✅ All paths verified successfully!\n');
    console.log(`✅ Tested ${htmlFiles.length} HTML files`);
    console.log('✅ No path issues found\n');
    return { success: true, filesTested: htmlFiles.length, issues: 0 };
  } else {
    console.log(`❌ Found ${totalIssues} path issue(s) in ${Object.keys(fileIssues).length} file(s)\n`);
    
    for (const [file, issues] of Object.entries(fileIssues)) {
      console.log(`\n📄 ${file}:`);
      for (const issue of issues) {
        console.log(`   ❌ ${issue.type}: ${issue.path}`);
        console.log(`      Issue: ${issue.issue}`);
        if (issue.suggestion) {
          console.log(`      Suggestion: ${issue.suggestion}`);
        }
      }
    }
    
    return { success: false, filesTested: htmlFiles.length, issues: totalIssues, fileIssues };
  }
}

runTests().then(result => {
  if (result.success) {
    console.log('✅ PATH VERIFICATION PASSED');
    process.exit(0);
  } else {
    console.log('❌ PATH VERIFICATION FAILED');
    process.exit(1);
  }
}).catch(error => {
  console.error('❌ Test error:', error);
  process.exit(1);
});

