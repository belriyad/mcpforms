import { test } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

const PRODUCTION_URL = 'https://formgenai-4545.web.app';

test('Debug Wizard Step 2 - Template Selection', async ({ page }) => {
  console.log('\n🔍 DEBUGGING WIZARD STEP 2');
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
  console.log('\n📍 Step 2: Navigate to wizard...');
  await page.goto(`${PRODUCTION_URL}/admin/services/create`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);
  console.log('✅ On wizard Step 1');
  
  // Fill Step 1
  console.log('\n📍 Step 3: Fill Step 1...');
  await page.getByPlaceholder(/will preparation|business contract|service/i).first().fill('Debug Test Service');
  await page.getByPlaceholder(/john doe|client name/i).first().fill('Debug Client');
  await page.getByPlaceholder(/client@example|email/i).first().fill('debug@test.com');
  await page.getByRole('button', { name: /next/i }).click();
  await page.waitForTimeout(2000);
  console.log('✅ Clicked Next, now on Step 2');
  
  // Debug Step 2
  console.log('\n📍 Step 4: Debug Step 2 content...');
  await page.waitForTimeout(2000);
  
  // Get all text content
  const bodyText = await page.locator('body').textContent();
  console.log('\n📄 Page contains these keywords:');
  if (bodyText?.includes('Loading templates')) console.log('  ✅ "Loading templates" found');
  if (bodyText?.includes('No templates available')) console.log('  ⚠️  "No templates available" found');
  if (bodyText?.includes('Select Templates')) console.log('  ✅ "Select Templates" heading found');
  if (bodyText?.includes('fields')) console.log('  ✅ "fields" text found');
  if (bodyText?.includes('Last updated')) console.log('  ✅ "Last updated" text found');
  
  // Count different types of elements
  const allDivs = await page.locator('div').count();
  const clickableDivs = await page.locator('div[class*="cursor-pointer"]').count();
  const borderedDivs = await page.locator('div[class*="border"]').count();
  const roundedDivs = await page.locator('div[class*="rounded"]').count();
  
  console.log(`\n📊 Element counts:`);
  console.log(`  Total divs: ${allDivs}`);
  console.log(`  Clickable divs: ${clickableDivs}`);
  console.log(`  Bordered divs: ${borderedDivs}`);
  console.log(`  Rounded divs: ${roundedDivs}`);
  
  // Look for template names
  const hasWarrantyDeed = await page.locator('text=/Warranty Deed/i').count();
  const hasTrust = await page.locator('text=/Trust/i').count();
  const hasCertificate = await page.locator('text=/Certificate/i').count();
  
  console.log(`\n📋 Template name matches:`);
  console.log(`  "Warranty Deed": ${hasWarrantyDeed}`);
  console.log(`  "Trust": ${hasTrust}`);
  console.log(`  "Certificate": ${hasCertificate}`);
  
  // Try to find any element with "fields" text
  const fieldsElements = await page.locator('text=/\\d+ fields/i').count();
  console.log(`  Elements with "X fields": ${fieldsElements}`);
  
  // Get all visible text on page
  console.log('\n📝 First 1000 chars of visible text:');
  const visibleText = await page.locator('body').innerText();
  console.log(visibleText.substring(0, 1000));
  
  // Take screenshot
  await page.screenshot({ path: 'test-results/debug-wizard-step2.png', fullPage: true });
  console.log('\n📸 Screenshot saved: test-results/debug-wizard-step2.png');
  
  // Try clicking anything that might be a template
  console.log('\n🖱️  Attempting to find clickable templates...');
  const strategies = [
    { name: 'Div with cursor-pointer', selector: 'div[class*="cursor-pointer"]' },
    { name: 'Div containing "fields"', selector: 'div:has-text("fields")' },
    { name: 'Div with border-2', selector: 'div[class*="border-2"]' },
    { name: 'Any text with "Warranty"', selector: 'text=/Warranty/i' },
  ];
  
  for (const strategy of strategies) {
    const elements = page.locator(strategy.selector);
    const count = await elements.count();
    console.log(`  ${strategy.name}: ${count} found`);
    if (count > 0) {
      const firstElement = elements.first();
      const isVisible = await firstElement.isVisible({ timeout: 1000 }).catch(() => false);
      console.log(`    First element visible: ${isVisible}`);
      if (isVisible) {
        const text = await firstElement.textContent().catch(() => '');
        console.log(`    First element text: "${text?.substring(0, 100)}"`);
      }
    }
  }
  
  console.log('\n✅ Debug complete!');
});
