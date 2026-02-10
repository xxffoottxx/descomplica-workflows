#!/usr/bin/env node
/**
 * Validate extracted workflows for personal data leaks
 */

const fs = require('fs');
const path = require('path');

// Patterns to detect personal data
const patterns = {
  email: {
    regex: /(?!your-email@example\.com|example@example\.com)[\w.-]+@(?!example\.com)[\w.-]+\.\w+/g,
    exclude: ['your-email@example.com', 'example@example.com']
  },
  phone: {
    // Only Portuguese phone numbers with real-looking patterns
    regex: /\+351\s?\d{3}\s?\d{3}\s?\d{3}(?!\s)/g,
    exclude: ['+XX XXX XXX XXX', '+XXXXXXXXXXX']
  },
  url: {
    regex: /https?:\/\/(?!your-domain\.com|example\.com|localhost)[a-z0-9.-]*descomplicador[a-z0-9.-]*\.[a-z]{2,}/gi,
    exclude: []
  },
  specificDomains: {
    regex: /(?<!-)descomplicador\.pt(?!-)|n8n\.descomplicador\.pt|flowise\.descomplicador\.pt/gi,
    exclude: []
  },
  sheetIds: {
    // Google Sheets IDs are 44 characters alphanumeric
    regex: /[A-Za-z0-9_-]{44}/g,
    exclude: ['YOUR_SHEET_ID']
  },
  companyNames: {
    regex: /\b(Acortec|Descomplica|Borja\s*Reis|Baia\s*de\s*Angra)\b/gi,
    exclude: []
  },
  apiDomains: {
    regex: /graph\.facebook\.com|generativelanguage\.googleapis\.com/gi,
    exclude: ['your-api-domain.com']
  }
};

function scanForLeaks(obj, filePath, issues = []) {
  if (typeof obj === 'string') {
    // Check against all patterns
    for (const [name, { regex, exclude }] of Object.entries(patterns)) {
      const matches = obj.match(regex);
      if (matches) {
        const filtered = matches.filter(m => !exclude.some(ex => m.includes(ex)));
        if (filtered.length > 0) {
          issues.push({
            file: filePath,
            type: name,
            values: filtered
          });
        }
      }
    }
  } else if (Array.isArray(obj)) {
    obj.forEach(item => scanForLeaks(item, filePath, issues));
  } else if (obj && typeof obj === 'object') {
    Object.values(obj).forEach(value => scanForLeaks(value, filePath, issues));
  }

  return issues;
}

function validateJSON(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const json = JSON.parse(content);
    return { valid: true, json };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

// Scan all directories
const directories = ['triggers', 'integrations', 'utilities', 'full-workflows', 'ai-agents', 'error-handling'];
const baseDir = path.join(__dirname, '..');

console.log('\n=== Validating Workflow Components ===\n');

let totalFiles = 0;
let validFiles = 0;
let allIssues = [];

directories.forEach(dir => {
  const dirPath = path.join(baseDir, dir);
  if (!fs.existsSync(dirPath)) {
    console.log(`⊘ ${dir}/ (does not exist)`);
    return;
  }

  const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.json'));
  if (files.length === 0) {
    console.log(`⊘ ${dir}/ (empty)`);
    return;
  }

  console.log(`\n📁 ${dir}/ (${files.length} files)`);

  files.forEach(file => {
    totalFiles++;
    const filePath = path.join(dirPath, file);
    const relativePath = `${dir}/${file}`;

    // Validate JSON syntax
    const { valid, json, error } = validateJSON(filePath);
    if (!valid) {
      console.log(`  ✗ ${file} - INVALID JSON: ${error}`);
      return;
    }

    validFiles++;

    // Scan for personal data leaks
    const issues = scanForLeaks(json, relativePath);
    if (issues.length > 0) {
      console.log(`  ⚠ ${file} - POTENTIAL LEAKS:`);
      issues.forEach(issue => {
        console.log(`     - ${issue.type}: ${issue.values.join(', ')}`);
      });
      allIssues.push(...issues);
    } else {
      console.log(`  ✓ ${file} - CLEAN`);
    }
  });
});

console.log('\n\n=== Validation Summary ===\n');
console.log(`Total files scanned: ${totalFiles}`);
console.log(`Valid JSON files: ${validFiles}`);
console.log(`Files with issues: ${allIssues.length > 0 ? '❌ YES' : '✅ NONE'}`);

if (allIssues.length > 0) {
  console.log('\n⚠️  WARNING: Personal data detected in the following files:');
  const groupedIssues = {};
  allIssues.forEach(issue => {
    if (!groupedIssues[issue.file]) {
      groupedIssues[issue.file] = [];
    }
    groupedIssues[issue.file].push(issue);
  });

  Object.entries(groupedIssues).forEach(([file, issues]) => {
    console.log(`\n  ${file}:`);
    issues.forEach(issue => {
      console.log(`    - ${issue.type}: ${issue.values.join(', ')}`);
    });
  });

  console.log('\n❌ VALIDATION FAILED - Please remove personal data before committing.\n');
  process.exit(1);
} else {
  console.log('\n✅ VALIDATION PASSED - All files are clean!\n');
  process.exit(0);
}
