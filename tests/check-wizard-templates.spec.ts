import { test } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

const PRODUCTION_URL = 'https://formgenai-4545.web.app';

test('Check Template Data in Wizard', async ({ page }) => {
  console.log('\n🔍 CHECKING WIZARD TEMPLATE LOADING');
  console.log('='.repeat(60));
  
  const testUser = {
    email: process.env.TEST_USER_EMAIL || 'belal.riyad@gmail.com',
    password: process.env.TEST_USER_PASSWORD || '9920032'
  };
  
  // Login
  console.log('\n📍 Step 1: Login...');
  await page.goto(`${PRODUCTION_URL}/login`);
  await page.waitForLoadState('domcontentloaded');
  await page.getByLabel(/email/i).fill(testUser.email);
  await page.getByLabel(/password/i).fill(testUser.password);
  await page.getByRole('button', { name: /sign in|login/i }).click();
  await page.waitForFunction(() => window.location.pathname.includes('admin'), { timeout: 30000 });
  console.log('✅ Logged in');
  
  // Navigate to wizard
  console.log('\n📍 Step 2: Navigate to wizard Step 2...');
  await page.goto(`${PRODUCTION_URL}/admin/services/create`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);
  
  // Fill Step 1
  await page.getByPlaceholder(/will preparation|business contract|service/i).first().fill('Debug Test');
  await page.getByPlaceholder(/john doe|client name/i).first().fill('Debug Client');
  await page.getByPlaceholder(/client@example|email/i).first().fill('debug@test.com');
  await page.getByRole('button', { name: /next/i }).click();
  await page.waitForTimeout(3000); // Give extra time for templates to load
  console.log('✅ On Step 2');
  
  // Inject script to check what data is actually loaded
  console.log('\n📊 Checking template data in browser...');
  
  const templateData = await page.evaluate(() => {
    // Access React component state if possible
    const pageText = document.body.innerText;
    
    // Check what's displayed
    const hasLoading = pageText.includes('Loading templates');
    const hasNoTemplates = pageText.includes('No templates available');
    const hasTemplateCount = pageText.match(/(\d+) template/);
    
    // Try to find template divs
    const templateDivs = document.querySelectorAll('[class*="border-2"][class*="cursor-pointer"]');
    const clickableDivs = document.querySelectorAll('[class*="cursor-pointer"]');
    const allDivs = document.querySelectorAll('div');
    
    // Look for specific text patterns
    const hasFields = Array.from(allDivs).some(div => 
      div.textContent?.includes('fields') && div.textContent?.includes('Last updated')
    );
    
    return {
      hasLoading,
      hasNoTemplates,
      templateCount: hasTemplateCount ? hasTemplateCount[1] : '0',
      templateDivCount: templateDivs.length,
      clickableDivCount: clickableDivs.length,
      hasFields,
      pageLength: pageText.length
    };
  });
  
  console.log('\n📋 Template Data Results:');
  console.log(`  Loading state: ${templateData.hasLoading}`);
  console.log(`  "No templates" message: ${templateData.hasNoTemplates}`);
  console.log(`  Template count from text: ${templateData.templateCount}`);
  console.log(`  Template card divs: ${templateData.templateDivCount}`);
  console.log(`  Clickable divs: ${templateData.clickableDivCount}`);
  console.log(`  Has "fields" text: ${templateData.hasFields}`);
  
  // Check console for errors
  const consoleLogs: string[] = [];
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('template') || text.includes('Template') || text.includes('error') || text.includes('Error')) {
      consoleLogs.push(`[${msg.type()}] ${text}`);
    }
  });
  
  await page.waitForTimeout(2000);
  
  if (consoleLogs.length > 0) {
    console.log('\n📝 Relevant console messages:');
    consoleLogs.forEach(log => console.log(`  ${log}`));
  }
  
  // Take screenshot
  await page.screenshot({ path: 'test-results/template-loading-check.png', fullPage: true });
  console.log('\n📸 Screenshot: test-results/template-loading-check.png');
  
  // Check network requests
  console.log('\n🌐 Checking if Firestore query happened...');
  const requests: string[] = [];
  page.on('request', request => {
    const url = request.url();
    if (url.includes('firestore') || url.includes('firebase')) {
      requests.push(url);
    }
  });
  
  await page.reload();
  await page.waitForTimeout(3000);
  
  console.log(`\n📡 Firebase requests: ${requests.length}`);
  if (requests.length > 0) {
    console.log('  Sample requests:');
    requests.slice(0, 3).forEach(req => console.log(`    - ${req.substring(0, 100)}...`));
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Analysis complete!');
  console.log('='.repeat(60) + '\n');
});
