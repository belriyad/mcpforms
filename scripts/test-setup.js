#!/usr/bin/env node

/**
 * Simple test script to verify email and document generation setup
 * Run with: node scripts/test-setup.js
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Load .env.local if it exists
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = require('dotenv').config({ path: envPath });
  if (envConfig.error) {
    console.log('⚠️  Warning: Could not load .env.local');
  }
}

console.log('🧪 MCPForms Setup Test\n');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkEnvVar(varName, required = false) {
  const value = process.env[varName];
  if (value) {
    log(`✅ ${varName}: Configured`, 'green');
    return true;
  } else if (required) {
    log(`❌ ${varName}: MISSING (Required)`, 'red');
    return false;
  } else {
    log(`⚠️  ${varName}: Not set (Optional)`, 'yellow');
    return true;
  }
}

// Check environment variables
log('\n📋 Checking Environment Variables:', 'cyan');
log('─'.repeat(50), 'cyan');

log('\n🔥 Firebase Configuration (Public):', 'blue');
const firebasePublic = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID'
];
let allPublicConfigured = true;
firebasePublic.forEach(varName => {
  if (!checkEnvVar(varName, true)) allPublicConfigured = false;
});

log('\n🔒 Server-Side Keys (Private):', 'blue');
const openaiConfigured = checkEnvVar('OPENAI_API_KEY', false);
const resendConfigured = checkEnvVar('RESEND_API_KEY', false);
const fromEmailConfigured = checkEnvVar('FROM_EMAIL', false);
const fromNameConfigured = checkEnvVar('FROM_NAME', false);

log('\n🔧 Firebase Admin SDK:', 'blue');
const adminProjectId = checkEnvVar('FIREBASE_PROJECT_ID', false);
const adminClientEmail = checkEnvVar('FIREBASE_CLIENT_EMAIL', false);
const adminPrivateKey = checkEnvVar('FIREBASE_PRIVATE_KEY', false);

// Summary
log('\n📊 Configuration Summary:', 'cyan');
log('─'.repeat(50), 'cyan');

const emailReady = resendConfigured;
const documentGenReady = adminProjectId && adminClientEmail && adminPrivateKey;
const aiReady = openaiConfigured;

log(`\n✉️  Email Notifications: ${emailReady ? '✅ Ready' : '❌ Not Configured'}`, emailReady ? 'green' : 'yellow');
log(`📄 Document Generation: ${documentGenReady ? '✅ Ready' : '❌ Not Configured'}`, documentGenReady ? 'green' : 'yellow');
log(`🤖 AI Field Generator: ${aiReady ? '✅ Ready' : '❌ Not Configured'}`, aiReady ? 'green' : 'yellow');

// Recommendations
log('\n💡 Next Steps:', 'cyan');
log('─'.repeat(50), 'cyan');

if (!allPublicConfigured) {
  log('\n❌ CRITICAL: Firebase public configuration incomplete!', 'red');
  log('   Fix: Check your .env.local file', 'yellow');
}

if (!emailReady) {
  log('\n⚠️  Email notifications will be logged to console only', 'yellow');
  log('   To enable: Add RESEND_API_KEY to .env.local', 'cyan');
  log('   See: EMAIL_DOCUMENT_SETUP_GUIDE.md', 'cyan');
}

if (!documentGenReady) {
  log('\n⚠️  Document generation will not work', 'yellow');
  log('   To enable: Add Firebase Admin SDK credentials', 'cyan');
  log('   See: EMAIL_DOCUMENT_SETUP_GUIDE.md', 'cyan');
}

if (!aiReady) {
  log('\n⚠️  AI Field Generator will not work', 'yellow');
  log('   To enable: Add OPENAI_API_KEY to .env.local', 'cyan');
  log('   See: API_KEY_SECURITY_GUIDE.md', 'cyan');
}

if (emailReady && documentGenReady && aiReady && allPublicConfigured) {
  log('\n🎉 All systems configured! You\'re ready to go!', 'green');
  log('   Run: npm run dev', 'cyan');
  log('   Then: http://localhost:3000/admin', 'cyan');
}

log('\n📚 Documentation:', 'cyan');
log('   - EMAIL_DOCUMENT_SETUP_GUIDE.md', 'blue');
log('   - API_KEY_SECURITY_GUIDE.md', 'blue');
log('   - PRODUCTION_READINESS_CHECKLIST.md', 'blue');

log('\n✨ Test complete!\n');

process.exit(emailReady && documentGenReady && aiReady && allPublicConfigured ? 0 : 1);
