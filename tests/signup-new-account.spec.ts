import { test, expect } from '@playwright/test';

test('Create new test account through signup', async ({ page }) => {
  console.log('\n🎯 Creating a fresh test account for E2E testing...\n');
  
  // Generate unique credentials
  const timestamp = Date.now();
  const email = `autotest${timestamp}@test.com`;
  const password = 'AutoTest123!';
  const name = 'Auto Test User';
  
  console.log('📋 New Account Credentials:');
  console.log(`   Email: ${email}`);
  console.log(`   Password: ${password}`);
  console.log(`   Name: ${name}\n`);
  
  // Navigate to signup
  await page.goto('https://formgenai-4545.web.app/signup', { 
    waitUntil: 'domcontentloaded',
    timeout: 30000 
  });
  console.log('✅ Loaded signup page');
  
  await page.screenshot({ path: 'test-results/signup-step1-page-loaded.png', fullPage: true });
  
  // Fill in the form
  console.log('📝 Filling signup form...');
  
  // Name field
  const nameInput = page.locator('input[type="text"]').first();
  await nameInput.waitFor({ state: 'visible', timeout: 10000 });
  await nameInput.fill(name);
  console.log('   ✓ Name field filled');
  
  // Email field
  const emailInput = page.locator('input[type="email"]');
  await emailInput.waitFor({ state: 'visible', timeout: 10000 });
  await emailInput.fill(email);
  console.log('   ✓ Email field filled');
  
  // Password field
  const passwordInput = page.locator('input[type="password"]').first();
  await passwordInput.waitFor({ state: 'visible', timeout: 10000 });
  await passwordInput.fill(password);
  console.log('   ✓ Password field filled');
  
  await page.screenshot({ path: 'test-results/signup-step2-form-filled.png', fullPage: true });
  
  // Handle terms checkbox
  console.log('📋 Checking terms and conditions...');
  
  // Try to find and click the checkbox or its label
  try {
    // Strategy 1: Direct checkbox
    const checkbox = page.locator('input[type="checkbox"]').first();
    if (await checkbox.isVisible({ timeout: 2000 })) {
      await checkbox.check({ force: true });
      console.log('   ✓ Checkbox checked (direct)');
    } else {
      throw new Error('Checkbox not visible');
    }
  } catch (e) {
    // Strategy 2: Click the label text
    try {
      const label = page.getByText(/I agree to the/i);
      await label.click();
      console.log('   ✓ Checkbox checked (via label)');
    } catch (e2) {
      console.log('   ⚠ Could not check terms - will attempt submission anyway');
    }
  }
  
  await page.screenshot({ path: 'test-results/signup-step3-ready-to-submit.png', fullPage: true });
  
  // Set up listeners before submitting
  console.log('\n🔄 Submitting signup form...');
  
  let authError = '';
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('error') || text.includes('Error')) {
      authError = text;
      console.log(`   [Browser Error] ${text}`);
    }
  });
  
  // Click submit button
  const submitButton = page.getByRole('button', { name: /sign up|create account/i });
  await submitButton.click();
  console.log('   ✓ Submit button clicked');
  
  // Wait for response (either success redirect or error message)
  await page.waitForTimeout(5000);
  
  await page.screenshot({ path: 'test-results/signup-step4-after-submit.png', fullPage: true });
  
  const currentUrl = page.url();
  console.log(`\n📍 Current URL: ${currentUrl}`);
  
  // Check for errors on page
  const errorOnPage = await page.locator('.text-red-700, .text-red-600, [class*="error"]').first().textContent().catch(() => null);
  
  if (currentUrl.includes('/admin')) {
    // SUCCESS!
    console.log('\n✅ ✅ ✅ SUCCESS! Account created and automatically logged in! ✅ ✅ ✅\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 ADD THESE CREDENTIALS TO .env.test:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`TEST_USER_EMAIL=${email}`);
    console.log(`TEST_USER_PASSWORD=${password}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    await page.screenshot({ path: 'test-results/signup-step5-success-admin-page.png', fullPage: true });
    
    // Verify we can see admin content
    const dashboardText = await page.locator('body').textContent();
    if (dashboardText?.includes('Dashboard') || dashboardText?.includes('Templates') || dashboardText?.includes('Services')) {
      console.log('✅ Confirmed: Admin dashboard is visible and working!\n');
    }
    
  } else if (errorOnPage) {
    console.log(`\n❌ Signup failed with error: ${errorOnPage}\n`);
  } else if (authError) {
    console.log(`\n❌ Signup failed with auth error: ${authError}\n`);
  } else {
    console.log('\n⚠️  Signup status unclear - staying on signup page');
    console.log('Check the screenshots in test-results/ folder\n');
  }
  
  // Take final screenshot
  await page.screenshot({ path: 'test-results/signup-final.png', fullPage: true });
});
