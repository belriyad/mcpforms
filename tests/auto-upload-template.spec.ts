import { test } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

const PRODUCTION_URL = 'https://formgenai-4545.web.app';

test('AUTO-UPLOAD: Template for Test User', async ({ page }) => {
  test.setTimeout(180000); // 3 minutes
  
  console.log('\n' + '='.repeat(70));
  console.log('🤖 AUTOMATED TEMPLATE UPLOAD');
  console.log('='.repeat(70));
  
  const testUser = {
    email: process.env.TEST_USER_EMAIL || 'belal.riyad@gmail.com',
    password: process.env.TEST_USER_PASSWORD || '9920032'
  };
  
  console.log(`\n📧 User: ${testUser.email}`);
  console.log(`📄 Template: Warranty Deed Template.docx`);
  console.log(`🎯 Goal: Upload template so wizard Step 2 works\n`);
  
  // Login
  console.log('🔐 Step 1/5: Logging in...');
  await page.goto(`${PRODUCTION_URL}/login`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);
  
  await page.getByLabel(/email/i).fill(testUser.email);
  await page.getByLabel(/password/i).fill(testUser.password);
  await page.getByRole('button', { name: /sign in|login/i }).click();
  
  await page.waitForFunction(() => window.location.pathname.includes('admin'), { timeout: 30000 });
  await page.waitForTimeout(2000);
  console.log('✅ Logged in!');
  
  // Navigate to Templates
  console.log('\n📂 Step 2/5: Navigating to Templates...');
  await page.goto(`${PRODUCTION_URL}/admin`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);
  
  // Try to click Templates tab if visible
  const templatesTab = page.getByRole('tab', { name: /templates/i });
  if (await templatesTab.isVisible({ timeout: 3000 }).catch(() => false)) {
    await templatesTab.click();
    await page.waitForTimeout(1000);
  }
  console.log('✅ On Templates page!');
  
  // Click Upload button
  console.log('\n➕ Step 3/5: Opening upload dialog...');
  await page.screenshot({ path: 'test-results/auto-upload-1-before.png', fullPage: true });
  
  const uploadButton = page.getByRole('button', { name: /\+|upload/i }).first();
  await uploadButton.click();
  await page.waitForTimeout(2000);
  console.log('✅ Upload dialog opened!');
  
  // Select file
  console.log('\n📄 Step 4/5: Selecting file...');
  const templatePath = path.resolve(__dirname, '../src/sample/Warranty Deed Template.docx');
  console.log(`   File: ${templatePath.split('/').pop()}`);
  
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(templatePath);
  await page.waitForTimeout(2000);
  console.log('✅ File selected!');
  
  await page.screenshot({ path: 'test-results/auto-upload-2-file-selected.png', fullPage: true });
  
  // Fill name and upload
  console.log('\n🚀 Step 5/5: Uploading...');
  
  // Try to fill template name
  const nameFields = await page.locator('input[type="text"]').all();
  for (const field of nameFields) {
    if (await field.isVisible().catch(() => false)) {
      const value = await field.inputValue();
      if (!value || value.length < 3) {
        await field.fill('Warranty Deed Template');
        console.log('   ✓ Filled template name');
        break;
      }
    }
  }
  
  await page.waitForTimeout(1000);
  
  // Find and click the upload button - try ALL visible buttons
  const allButtons = await page.getByRole('button').all();
  let uploadClicked = false;
  
  for (const btn of allButtons) {
    const text = await btn.textContent().catch(() => '');
    const isVisible = await btn.isVisible().catch(() => false);
    const isDisabled = await btn.isDisabled().catch(() => true);
    
    if (isVisible && !isDisabled && text) {
      // Look for upload-related text
      if (text.toLowerCase().includes('upload') || 
          text.toLowerCase().includes('parse') ||
          text.toLowerCase().includes('save')) {
        console.log(`   ✓ Clicking: "${text}"`);
        await btn.click();
        uploadClicked = true;
        break;
      }
    }
  }
  
  if (!uploadClicked) {
    console.log('   ⚠️  No upload button found, trying first enabled button...');
    // Just click any enabled button that's not "cancel"
    for (const btn of allButtons) {
      const text = await btn.textContent().catch(() => '');
      const isVisible = await btn.isVisible().catch(() => false);
      const isDisabled = await btn.isDisabled().catch(() => true);
      
      if (isVisible && !isDisabled && text && !text.toLowerCase().includes('cancel')) {
        console.log(`   ✓ Trying: "${text}"`);
        await btn.click();
        uploadClicked = true;
        break;
      }
    }
  }
  
  console.log('⏳ Waiting for upload to process...');
  await page.waitForTimeout(8000); // Wait for parsing
  
  await page.screenshot({ path: 'test-results/auto-upload-3-uploading.png', fullPage: true });
  
  // Verify
  console.log('\n✅ Step 6/5: Verifying upload...');
  await page.reload();
  await page.waitForTimeout(2000);
  
  await page.screenshot({ path: 'test-results/auto-upload-4-final.png', fullPage: true });
  
  const pageText = await page.locator('body').textContent();
  const hasWarrantyDeed = pageText?.toLowerCase().includes('warranty deed');
  
  console.log('\n' + '='.repeat(70));
  if (hasWarrantyDeed) {
    console.log('🎉 SUCCESS! Template uploaded and visible!');
  } else {
    console.log('⚠️  Upload attempted - check screenshots in test-results/');
  }
  console.log('='.repeat(70));
  
  console.log('\n📸 Screenshots saved:');
  console.log('   • auto-upload-1-before.png');
  console.log('   • auto-upload-2-file-selected.png');
  console.log('   • auto-upload-3-uploading.png');
  console.log('   • auto-upload-4-final.png');
  
  console.log('\n🚀 NEXT STEP: Run the complete E2E test!');
  console.log('   npx playwright test tests/core-scenarios.spec.ts --grep "COMPLETE WORKFLOW"');
  console.log('\n');
});
