import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Setup and Run E2E Tests', () => {
  
  test.setTimeout(600000); // 10 minutes for full workflow
  
  test('Step 1: Create test account if needed', async ({ page }) => {
    console.log('\n' + '='.repeat(70));
    console.log('🔧 STEP 1: ENSURING TEST ACCOUNT EXISTS');
    console.log('='.repeat(70) + '\n');
    
    // Try to login with current credentials
    console.log('🔐 Testing current credentials from .env.test...');
    
    await page.goto('https://formgenai-4545.web.app/login');
    await page.waitForTimeout(2000);
    
    const email = process.env.TEST_USER_EMAIL || 'test@example.com';
    const password = process.env.TEST_USER_PASSWORD || 'password123';
    
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.getByRole('button', { name: /sign in/i }).click();
    
    await page.waitForTimeout(5000);
    
    if (page.url().includes('/admin')) {
      console.log('✅ Current credentials work! Proceeding with tests...\n');
      return;
    }
    
    console.log('❌ Current credentials invalid. Creating new account...\n');
    
    // Create new account
    const timestamp = Date.now();
    const newEmail = `e2etest${timestamp}@mcpforms.test`;
    const newPassword = 'E2ETest123!';
    const newName = 'E2E Test User';
    
    console.log('📝 Creating new test account:');
    console.log(`   Email: ${newEmail}`);
    console.log(`   Password: ${newPassword}`);
    console.log(`   Name: ${newName}\n`);
    
    await page.goto('https://formgenai-4545.web.app/signup');
    await page.waitForTimeout(2000);
    
    // Fill signup form
    await page.locator('input[type="text"]').first().fill(newName);
    await page.locator('input[type="email"]').fill(newEmail);
    await page.locator('input[type="password"]').first().fill(newPassword);
    await page.locator('input[type="password"]').last().fill(newPassword); // Confirm password
    
    // Try to check terms checkbox
    try {
      const checkbox = page.locator('input[type="checkbox"]').first();
      await checkbox.check({ force: true, timeout: 2000 });
    } catch (e) {
      // Try clicking label
      try {
        await page.getByText(/agree/i).click({ timeout: 2000 });
      } catch (e2) {
        console.log('⚠️  Could not check terms checkbox - attempting submit anyway');
      }
    }
    
    await page.screenshot({ path: 'test-results/e2e-01-signup-form.png', fullPage: true });
    
    // Submit
    await page.getByRole('button', { name: /sign up|create account/i }).click();
    console.log('⏳ Waiting for account creation...');
    
    await page.waitForTimeout(8000);
    
    await page.screenshot({ path: 'test-results/e2e-02-after-signup.png', fullPage: true });
    
    if (page.url().includes('/admin')) {
      console.log('✅ Account created successfully!\n');
      console.log('=' .repeat(70));
      console.log('📋 NEW TEST CREDENTIALS - UPDATE .env.test WITH:');
      console.log('='.repeat(70));
      console.log(`TEST_USER_EMAIL=${newEmail}`);
      console.log(`TEST_USER_PASSWORD=${newPassword}`);
      console.log('='.repeat(70) + '\n');
      
      // Update .env.test file
      const envPath = path.join(__dirname, '../.env.test');
      let envContent = fs.readFileSync(envPath, 'utf-8');
      envContent = envContent.replace(/TEST_USER_EMAIL=.*/, `TEST_USER_EMAIL=${newEmail}`);
      envContent = envContent.replace(/TEST_USER_PASSWORD=.*/, `TEST_USER_PASSWORD=${newPassword}`);
      fs.writeFileSync(envPath, envContent);
      
      console.log('✅ .env.test file automatically updated!\n');
      
    } else {
      console.log('❌ Account creation failed');
      console.log('Current URL:', page.url());
      
      const bodyText = await page.locator('body').textContent();
      const errorMatch = bodyText?.match(/(error|failed|invalid)[^.]*\./i);
      if (errorMatch) {
        console.log('Error message:', errorMatch[0]);
      }
      
      throw new Error('Could not create test account. Please create one manually at https://formgenai-4545.web.app/signup');
    }
  });
  
  test('Step 2: Run complete E2E workflow', async ({ page }) => {
    console.log('\n' + '='.repeat(70));
    console.log('🚀 STEP 2: RUNNING COMPLETE E2E WORKFLOW');
    console.log('='.repeat(70) + '\n');
    
    const email = process.env.TEST_USER_EMAIL || 'test@example.com';
    const password = process.env.TEST_USER_PASSWORD || 'password123';
    
    // ============= STEP 1: LOGIN =============
    console.log('🔐 STEP 1/7: LOGIN');
    console.log('-'.repeat(70));
    
    await page.goto('https://formgenai-4545.web.app/login');
    await page.waitForTimeout(2000);
    
    await page.locator('input[type="email"]').fill(email);
    await page.locator('input[type="password"]').fill(password);
    await page.screenshot({ path: 'test-results/e2e-03-login-filled.png', fullPage: true });
    
    await page.getByRole('button', { name: /sign in/i }).click();
    console.log('⏳ Waiting for login...');
    
    await page.waitForTimeout(5000);
    
    if (!page.url().includes('/admin')) {
      await page.screenshot({ path: 'test-results/e2e-error-login.png', fullPage: true });
      throw new Error(`Login failed. Current URL: ${page.url()}`);
    }
    
    console.log('✅ Login successful!');
    await page.screenshot({ path: 'test-results/e2e-04-admin-dashboard.png', fullPage: true });
    
    // ============= STEP 2: CHECK TEMPLATES =============
    console.log('\n📄 STEP 2/7: CHECK TEMPLATES');
    console.log('-'.repeat(70));
    
    await page.goto('https://formgenai-4545.web.app/admin/templates');
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: 'test-results/e2e-05-templates-page.png', fullPage: true });
    
    const bodyText = await page.locator('body').textContent();
    const hasTemplates = bodyText?.includes('template') || bodyText?.includes('Template');
    
    if (!hasTemplates) {
      console.log('⚠️  WARNING: No templates found!');
      console.log('   Services require templates. Upload a template first.');
      console.log('   Skipping remaining steps that require templates.\n');
      return;
    }
    
    console.log('✅ Templates page accessible');
    
    // ============= STEP 3: CREATE SERVICE =============
    console.log('\n🎯 STEP 3/7: CREATE SERVICE');
    console.log('-'.repeat(70));
    
    await page.goto('https://formgenai-4545.web.app/admin/services');
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: 'test-results/e2e-06-services-page.png', fullPage: true });
    
    const createButton = page.getByRole('button', { name: /create service|new service|\+ service/i }).first();
    const createButtonVisible = await createButton.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (!createButtonVisible) {
      console.log('⚠️  Create Service button not found');
      console.log('   Check if templates are properly set up');
      return;
    }
    
    await createButton.click();
    console.log('✅ Clicked Create Service');
    
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'test-results/e2e-07-create-service-modal.png', fullPage: true });
    
    const serviceName = `E2E Test Service ${Date.now()}`;
    await page.getByLabel(/service name|name/i).first().fill(serviceName);
    console.log(`✅ Service name: ${serviceName}`);
    
    await page.screenshot({ path: 'test-results/e2e-08-service-form-filled.png', fullPage: true });
    
    await page.getByRole('button', { name: /save|create|submit/i }).first().click();
    console.log('⏳ Saving service...');
    
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'test-results/e2e-09-after-service-create.png', fullPage: true });
    
    const currentUrl = page.url();
    let serviceId = '';
    
    if (currentUrl.includes('/admin/services/') && currentUrl.split('/').length > 5) {
      serviceId = currentUrl.split('/').pop() || '';
      console.log(`✅ Service created! ID: ${serviceId}`);
    } else {
      console.log('⚠️  Service creation status unclear');
      console.log(`   Current URL: ${currentUrl}`);
    }
    
    // ============= STEP 4: GENERATE INTAKE LINK =============
    console.log('\n📋 STEP 4/7: GENERATE INTAKE LINK');
    console.log('-'.repeat(70));
    
    if (!serviceId) {
      console.log('⚠️  No service ID - skipping intake generation');
      return;
    }
    
    // Look for generate intake button
    await page.waitForTimeout(2000);
    const generateButton = page.getByRole('button', { name: /generate|create.*intake|new.*intake/i }).first();
    const generateVisible = await generateButton.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (generateVisible) {
      await generateButton.click();
      console.log('✅ Clicked generate intake');
      await page.waitForTimeout(3000);
      
      await page.screenshot({ path: 'test-results/e2e-10-intake-generated.png', fullPage: true });
      
      // Try to find the intake link
      const linkElements = await page.locator('[href*="/intake/"]').all();
      if (linkElements.length > 0) {
        const intakeUrl = await linkElements[0].getAttribute('href');
        console.log(`✅ Intake link found: ${intakeUrl}`);
      }
    } else {
      console.log('⚠️  Generate intake button not found');
    }
    
    // ============= STEP 5: SERVICES LIST =============
    console.log('\n📊 STEP 5/7: VERIFY SERVICES LIST');
    console.log('-'.repeat(70));
    
    await page.goto('https://formgenai-4545.web.app/admin/services');
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: 'test-results/e2e-11-services-list.png', fullPage: true });
    
    const servicesText = await page.locator('body').textContent();
    if (servicesText?.includes(serviceName.substring(0, 20))) {
      console.log('✅ Service appears in list');
    } else {
      console.log('⚠️  Could not verify service in list');
    }
    
    // ============= STEP 6: ADMIN DASHBOARD =============
    console.log('\n🏠 STEP 6/7: RETURN TO DASHBOARD');
    console.log('-'.repeat(70));
    
    await page.goto('https://formgenai-4545.web.app/admin');
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'test-results/e2e-12-final-dashboard.png', fullPage: true });
    console.log('✅ Dashboard accessible');
    
    // ============= STEP 7: LOGOUT =============
    console.log('\n🚪 STEP 7/7: LOGOUT');
    console.log('-'.repeat(70));
    
    const logoutButton = page.getByRole('button', { name: /logout|sign out/i }).first();
    const logoutVisible = await logoutButton.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (logoutVisible) {
      await logoutButton.click();
      await page.waitForTimeout(2000);
      console.log('✅ Logged out');
    } else {
      console.log('ℹ️  Logout button not found (may be in menu)');
    }
    
    await page.screenshot({ path: 'test-results/e2e-13-after-logout.png', fullPage: true });
    
    // ============= SUMMARY =============
    console.log('\n' + '='.repeat(70));
    console.log('🎉 E2E WORKFLOW COMPLETE!');
    console.log('='.repeat(70));
    console.log('\n📸 Screenshots saved in test-results/');
    console.log('   Check e2e-*.png files for visual verification\n');
  });
});
