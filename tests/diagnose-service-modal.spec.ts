import { test } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

test('Diagnose Create Service Modal', async ({ page }) => {
  test.setTimeout(120000);
  
  const email = process.env.TEST_USER_EMAIL!;
  const password = process.env.TEST_USER_PASSWORD!;
  
  console.log('\n🔍 DIAGNOSING CREATE SERVICE MODAL\n');
  
  // Login
  console.log('📧 Logging in as:', email);
  await page.goto('https://formgenai-4545.web.app/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.getByRole('button', { name: /sign in/i }).click();
  
  // Wait for admin area
  await page.waitForFunction(() => window.location.pathname.includes('admin'), { timeout: 30000 });
  await page.waitForTimeout(2000);
  console.log('✅ Logged in successfully');
  
  // Navigate to services
  await page.goto('https://formgenai-4545.web.app/admin/services');
  await page.waitForTimeout(2000);
  console.log('✅ On services page');
  
  // Click create service button
  const createButton = page.getByRole('button', { name: /create service|new service|\+ service/i }).first();
  await createButton.click();
  await page.waitForTimeout(2000);
  console.log('✅ Clicked create service button');
  
  // Take screenshot
  await page.screenshot({ path: 'test-results/service-modal-diagnosis.png', fullPage: true });
  console.log('📸 Screenshot saved');
  
  // Get all input fields
  console.log('\n📝 All input elements:');
  const inputs = await page.locator('input, textarea').all();
  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];
    const id = await input.getAttribute('id').catch(() => 'no-id');
    const name = await input.getAttribute('name').catch(() => 'no-name');
    const placeholder = await input.getAttribute('placeholder').catch(() => 'no-placeholder');
    const type = await input.getAttribute('type').catch(() => 'no-type');
    const ariaLabel = await input.getAttribute('aria-label').catch(() => 'no-aria-label');
    const isVisible = await input.isVisible();
    
    console.log(`\nInput ${i + 1}:`);
    console.log(`  ID: ${id}`);
    console.log(`  Name: ${name}`);
    console.log(`  Type: ${type}`);
    console.log(`  Placeholder: ${placeholder}`);
    console.log(`  Aria-label: ${ariaLabel}`);
    console.log(`  Visible: ${isVisible}`);
  }
  
  // Get all labels
  console.log('\n\n🏷️  All label elements:');
  const labels = await page.locator('label').all();
  for (let i = 0; i < labels.length; i++) {
    const label = labels[i];
    const text = await label.textContent();
    const htmlFor = await label.getAttribute('for').catch(() => 'no-for');
    const isVisible = await label.isVisible();
    
    console.log(`\nLabel ${i + 1}:`);
    console.log(`  Text: ${text}`);
    console.log(`  For: ${htmlFor}`);
    console.log(`  Visible: ${isVisible}`);
  }
  
  // Get all buttons
  console.log('\n\n🔘 All button elements:');
  const buttons = await page.locator('button').all();
  for (let i = 0; i < buttons.length; i++) {
    const button = buttons[i];
    const text = await button.textContent();
    const type = await button.getAttribute('type').catch(() => 'no-type');
    const isVisible = await button.isVisible();
    const isDisabled = await button.isDisabled().catch(() => false);
    
    console.log(`\nButton ${i + 1}:`);
    console.log(`  Text: ${text}`);
    console.log(`  Type: ${type}`);
    console.log(`  Visible: ${isVisible}`);
    console.log(`  Disabled: ${isDisabled}`);
  }
  
  // Get modal content
  console.log('\n\n📄 Modal/Dialog visible text:');
  const modalText = await page.locator('form, [role="dialog"], .modal, [class*="modal"]').first().textContent().catch(() => 'No modal found');
  console.log(modalText);
  
  console.log('\n✅ Diagnosis complete - check test-results/service-modal-diagnosis.png');
});
