#!/usr/bin/env node

/**
 * Production Site Verification Script
 * Tests the deployed MCPForms application
 */

const https = require('https');

const COLORS = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(color, symbol, message) {
  console.log(`${color}${symbol}${COLORS.reset} ${message}`);
}

function checkUrl(url, expectedStatus = 200) {
  return new Promise((resolve) => {
    https.get(url, {
      headers: {
        'User-Agent': 'MCPForms-Verification/1.0'
      }
    }, (res) => {
      const success = res.statusCode === expectedStatus || (res.statusCode >= 200 && res.statusCode < 400);
      resolve({
        url,
        status: res.statusCode,
        success,
        message: res.statusMessage
      });
    }).on('error', (err) => {
      resolve({
        url,
        status: 0,
        success: false,
        message: err.message
      });
    });
  });
}

async function verifyDeployment() {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 MCPForms Production Verification');
  console.log('='.repeat(60) + '\n');

  const checks = [
    { name: 'Homepage', url: 'https://formgenai-4545.web.app/' },
    { name: 'Login Page', url: 'https://formgenai-4545.web.app/login' },
    { name: 'Signup Page', url: 'https://formgenai-4545.web.app/signup' },
    { name: 'Admin Dashboard', url: 'https://formgenai-4545.web.app/admin' },
    { name: 'Services Page', url: 'https://formgenai-4545.web.app/admin/services' },
    { name: 'SSR Function', url: 'https://ssrformgenai4545-cgwsbbjpzq-uc.a.run.app/' },
  ];

  console.log(COLORS.blue + '📡 Testing endpoints...' + COLORS.reset + '\n');

  let passed = 0;
  let failed = 0;

  for (const check of checks) {
    const result = await checkUrl(check.url);
    
    if (result.success) {
      log(COLORS.green, '✅', `${check.name.padEnd(20)} - ${result.status} ${result.message}`);
      passed++;
    } else {
      log(COLORS.red, '❌', `${check.name.padEnd(20)} - ${result.status} ${result.message}`);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);

  if (failed === 0) {
    log(COLORS.green, '🎉', 'All checks passed! Your site is live and healthy!');
    console.log('\n🔗 Production URL: https://formgenai-4545.web.app/login\n');
  } else {
    log(COLORS.yellow, '⚠️', `${failed} checks failed. Review errors above.`);
  }

  console.log('='.repeat(60) + '\n');

  // Additional info
  console.log(COLORS.blue + '📋 Quick Reference:' + COLORS.reset);
  console.log('  • Login: https://formgenai-4545.web.app/login');
  console.log('  • Signup: https://formgenai-4545.web.app/signup');
  console.log('  • Admin: https://formgenai-4545.web.app/admin');
  console.log('  • Console: https://console.firebase.google.com/project/formgenai-4545\n');

  console.log(COLORS.blue + '🐛 Debugging:' + COLORS.reset);
  console.log('  1. Open browser DevTools (F12)');
  console.log('  2. Go to Console tab');
  console.log('  3. Try to login');
  console.log('  4. Check for error codes\n');
}

// Run verification
verifyDeployment().catch(console.error);
