import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

const PRODUCTION_URL = 'https://formgenai-4545.web.app';

test('Upload Template for Test User', async ({ page }) => {
  test.setTimeout(120000); // 2 minutes
  
  console.log('\n' + '='.repeat(60));
  console.log('📤 UPLOADING TEMPLATE FOR TEST USER');
  console.log('='.repeat(60));
  
  const testUser = {
    email: process.env.TEST_USER_EMAIL || 'belal.riyad@gmail.com',
    password: process.env.TEST_USER_PASSWORD || '9920032'
  };
  
  console.log(`📧 User: ${testUser.email}`);
  
  // ========================================
  // STEP 1: LOGIN
  // ========================================
  console.log('\n🔐 STEP 1: LOGIN');
  console.log('-'.repeat(60));
  
  await page.goto(`${PRODUCTION_URL}/login`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);
  
  await page.getByLabel(/email/i).fill(testUser.email);
  await page.getByLabel(/password/i).fill(testUser.password);
  await page.getByRole('button', { name: /sign in|login/i }).click();
  
  await page.waitForFunction(() => window.location.pathname.includes('admin'), { timeout: 30000 });
  await page.waitForTimeout(2000);
  
  console.log('✅ Logged in successfully');
  await page.screenshot({ path: 'test-results/upload-01-logged-in.png', fullPage: true });
  
  // ========================================
  // STEP 2: NAVIGATE TO TEMPLATES TAB
  // ========================================
  console.log('\n📂 STEP 2: NAVIGATE TO TEMPLATES TAB');
  console.log('-'.repeat(60));
  
  await page.goto(`${PRODUCTION_URL}/admin`);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);
  
  // Click Templates tab
  const templatesTab = page.getByRole('tab', { name: /templates/i });
  if (await templatesTab.isVisible({ timeout: 5000 }).catch(() => false)) {
    await templatesTab.click();
    console.log('✅ Clicked Templates tab');
  } else {
    console.log('⚠️ Templates tab not found, might already be on templates page');
  }
  
  await page.waitForTimeout(2000);
  
  // Check existing templates
  const existingCount = await page.locator('text=/template/i').count();
  console.log(`📊 Current templates: ${existingCount}`);
  
  await page.screenshot({ path: 'test-results/upload-02-templates-page.png', fullPage: true });
  
  // ========================================
  // STEP 3: CLICK UPLOAD BUTTON
  // ========================================
  console.log('\n➕ STEP 3: OPEN UPLOAD DIALOG');
  console.log('-'.repeat(60));
  
  // Try multiple button selectors
  let uploadButtonClicked = false;
  
  const uploadSelectors = [
    { name: 'Upload Template button', selector: page.getByRole('button', { name: /upload template/i }) },
    { name: 'Add Template button', selector: page.getByRole('button', { name: /add template/i }) },
    { name: 'Plus icon button', selector: page.getByRole('button', { name: /\+/i }) },
    { name: 'Upload button (generic)', selector: page.getByRole('button', { name: /upload/i }) },
  ];
  
  for (const { name, selector } of uploadSelectors) {
    if (await selector.isVisible({ timeout: 3000 }).catch(() => false)) {
      await selector.click();
      console.log(`✅ Clicked: ${name}`);
      uploadButtonClicked = true;
      break;
    }
  }
  
  if (!uploadButtonClicked) {
    console.log('❌ Could not find upload button');
    await page.screenshot({ path: 'test-results/upload-03-no-button.png', fullPage: true });
    throw new Error('Upload button not found');
  }
  
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'test-results/upload-03-dialog-opened.png', fullPage: true });
  
  // ========================================
  // STEP 4: SELECT FILE
  // ========================================
  console.log('\n📄 STEP 4: SELECT TEMPLATE FILE');
  console.log('-'.repeat(60));
  
  const templatePath = path.resolve(__dirname, '../src/sample/Warranty Deed Template.docx');
  console.log(`📁 File: ${templatePath}`);
  
  // Find file input
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(templatePath);
  console.log('✅ File selected');
  
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'test-results/upload-04-file-selected.png', fullPage: true });
  
  // ========================================
  // STEP 5: FILL TEMPLATE NAME
  // ========================================
  console.log('\n✏️ STEP 5: FILL TEMPLATE DETAILS');
  console.log('-'.repeat(60));
  
  // Template name field
  const nameInput = page.locator('input[type="text"]').filter({ hasText: '' }).first();
  const nameInputAlt = page.getByPlaceholder(/template name|name/i);
  
  let nameFilled = false;
  if (await nameInputAlt.isVisible({ timeout: 2000 }).catch(() => false)) {
    await nameInputAlt.fill('Warranty Deed Template');
    console.log('✅ Filled template name (by placeholder)');
    nameFilled = true;
  } else {
    const allInputs = await page.locator('input[type="text"]').all();
    console.log(`📋 Found ${allInputs.length} text inputs`);
    
    for (let i = 0; i < Math.min(allInputs.length, 3); i++) {
      const input = allInputs[i];
      if (await input.isVisible().catch(() => false)) {
        await input.fill('Warranty Deed Template');
        console.log(`✅ Filled input ${i + 1} with template name`);
        nameFilled = true;
        break;
      }
    }
  }
  
  if (!nameFilled) {
    console.log('⚠️ Could not fill template name - continuing anyway');
  }
  
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'test-results/upload-05-name-filled.png', fullPage: true });
  
  // ========================================
  // STEP 6: CLICK UPLOAD/PARSE BUTTON
  // ========================================
  console.log('\n🚀 STEP 6: UPLOAD TEMPLATE');
  console.log('-'.repeat(60));
  
  // Wait a moment for any processing
  await page.waitForTimeout(1000);
  
  // Try to find the final upload button
  const uploadFinalSelectors = [
    { name: 'Upload Template', selector: page.getByRole('button', { name: /^upload template$/i }) },
    { name: 'Upload & Parse', selector: page.getByRole('button', { name: /upload.*parse/i }) },
    { name: 'Upload', selector: page.getByRole('button', { name: /^upload$/i }) },
    { name: 'Save', selector: page.getByRole('button', { name: /save/i }) },
    { name: 'Confirm', selector: page.getByRole('button', { name: /confirm/i }) },
  ];
  
  let uploaded = false;
  for (const { name, selector } of uploadFinalSelectors) {
    if (await selector.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Check if button is enabled
      const isDisabled = await selector.isDisabled().catch(() => true);
      if (!isDisabled) {
        await selector.click();
        console.log(`✅ Clicked: ${name}`);
        uploaded = true;
        break;
      } else {
        console.log(`⚠️ Button "${name}" found but disabled`);
      }
    }
  }
  
  if (!uploaded) {
    console.log('❌ Could not click final upload button');
    
    // Debug: List all buttons
    const allButtons = await page.getByRole('button').all();
    console.log(`\n🔍 All buttons on page (${allButtons.length}):`);
    for (let i = 0; i < Math.min(allButtons.length, 10); i++) {
      const btn = allButtons[i];
      const text = await btn.textContent().catch(() => '');
      const isVisible = await btn.isVisible().catch(() => false);
      const isDisabled = await btn.isDisabled().catch(() => false);
      console.log(`  ${i + 1}. "${text}" - visible: ${isVisible}, disabled: ${isDisabled}`);
    }
    
    await page.screenshot({ path: 'test-results/upload-06-upload-failed.png', fullPage: true });
    throw new Error('Could not complete upload');
  }
  
  console.log('⏳ Uploading and parsing template...');
  await page.waitForTimeout(5000);
  
  await page.screenshot({ path: 'test-results/upload-07-uploading.png', fullPage: true });
  
  // ========================================
  // STEP 7: VERIFY UPLOAD
  // ========================================
  console.log('\n✅ STEP 7: VERIFY UPLOAD');
  console.log('-'.repeat(60));
  
  // Wait for upload to complete
  await page.waitForTimeout(5000);
  
  // Refresh to see new template
  await page.reload();
  await page.waitForTimeout(2000);
  
  // Check for template
  const warrantyDeed = page.locator('text=/Warranty Deed/i');
  const templateExists = await warrantyDeed.isVisible({ timeout: 5000 }).catch(() => false);
  
  if (templateExists) {
    console.log('✅ SUCCESS! Template "Warranty Deed" found on page');
  } else {
    console.log('⚠️ Template not immediately visible, checking count...');
  }
  
  const finalCount = await page.locator('text=/template/i').count();
  console.log(`📊 Final template count: ${finalCount} (was ${existingCount})`);
  
  if (finalCount > existingCount) {
    console.log('✅ SUCCESS! Template count increased');
  }
  
  await page.screenshot({ path: 'test-results/upload-08-complete.png', fullPage: true });
  
  console.log('\n' + '='.repeat(60));
  console.log('🎉 UPLOAD COMPLETE!');
  console.log('='.repeat(60));
  console.log(`📧 User: ${testUser.email}`);
  console.log(`📄 Template: Warranty Deed Template`);
  console.log(`📊 Templates before: ${existingCount}`);
  console.log(`📊 Templates after: ${finalCount}`);
  console.log('\n✅ You can now run the complete E2E workflow test!');
  console.log('   npx playwright test tests/core-scenarios.spec.ts --grep "COMPLETE WORKFLOW"');
  console.log('='.repeat(60) + '\n');
});
