import { test } from '@playwright/test';

test.describe('Create Test Account', () => {
  
  test('Create a new test account via signup', async ({ page }) => {
    console.log('\n🔧 Creating a new test account...\n');
    
    // Navigate to signup page
    await page.goto('https://formgenai-4545.web.app/signup');
    console.log('✅ Navigated to signup page');
    
    await page.screenshot({ path: 'test-results/signup-01-initial.png', fullPage: true });
    
    // Generate unique email with timestamp
    const timestamp = Date.now();
    const testEmail = `test${timestamp}@mcpforms.test`;
    const testPassword = 'TestPassword123!';
    const testName = 'Automated Test User';
    
    console.log(`📧 Creating account with email: ${testEmail}`);
    console.log(`🔑 Password: ${testPassword}`);
    console.log(`👤 Name: ${testName}`);
    
    // Fill in signup form
    await page.locator('input[type="text"]').first().fill(testName);
    console.log('✅ Filled name');
    
    await page.locator('input[type="email"]').fill(testEmail);
    console.log('✅ Filled email');
    
    await page.locator('input[type="password"]').first().fill(testPassword);
    console.log('✅ Filled password');
    
    await page.screenshot({ path: 'test-results/signup-02-form-filled.png', fullPage: true });
    
    // Check terms checkbox - try multiple strategies
    const checkboxStrategies = [
      async () => {
        const checkbox = page.locator('input[type="checkbox"]').first();
        if (await checkbox.isVisible({ timeout: 2000 })) {
          await checkbox.check();
          return true;
        }
        return false;
      },
      async () => {
        const label = page.getByText(/terms|agree|accept/i).first();
        if (await label.isVisible({ timeout: 2000 })) {
          await label.click();
          return true;
        }
        return false;
      }
    ];
    
    let termsChecked = false;
    for (const strategy of checkboxStrategies) {
      try {
        if (await strategy()) {
          console.log('✅ Checked terms checkbox');
          termsChecked = true;
          break;
        }
      } catch (e) {
        // Try next strategy
      }
    }
    
    if (!termsChecked) {
      console.log('⚠️ Could not check terms checkbox - will try to submit anyway');
    }
    
    await page.screenshot({ path: 'test-results/signup-03-before-submit.png', fullPage: true });
    
    // Set up console listener
    page.on('console', msg => {
      if (msg.text().includes('error') || msg.text().includes('Error')) {
        console.log(`[BROWSER ERROR] ${msg.text()}`);
      }
    });
    
    // Submit form
    const submitButton = page.getByRole('button', { name: /sign up|create account/i });
    await submitButton.click();
    console.log('✅ Clicked submit button');
    
    // Wait for navigation or error
    await page.waitForTimeout(5000);
    
    const currentUrl = page.url();
    console.log(`📍 Current URL after signup: ${currentUrl}`);
    
    await page.screenshot({ path: 'test-results/signup-04-after-submit.png', fullPage: true });
    
    // Check for success or error
    if (currentUrl.includes('/admin')) {
      console.log('\n✅ SUCCESS! Account created and logged in!');
      console.log('\n📋 USE THESE CREDENTIALS IN .env.test:');
      console.log(`TEST_USER_EMAIL=${testEmail}`);
      console.log(`TEST_USER_PASSWORD=${testPassword}`);
      console.log('\n');
    } else {
      const errorMsg = await page.locator('text=/error|failed|invalid/i').first().textContent().catch(() => null);
      if (errorMsg) {
        console.log(`\n❌ Signup failed with error: ${errorMsg}`);
      } else {
        console.log('\n⚠️ Signup result unclear - check screenshots');
      }
    }
  });
  
  test('Try existing known account', async ({ page }) => {
    console.log('\n🔍 Testing if there are any existing working accounts...\n');
    
    // Try some common test accounts
    const accountsToTry = [
      { email: 'admin@mcpforms.com', password: 'adminpassword123' },
      { email: 'test@mcpforms.com', password: 'password123' },
      { email: 'rubazayed@gmail.com', password: 'rubazayed' },
    ];
    
    for (const account of accountsToTry) {
      console.log(`\n🔑 Trying: ${account.email}`);
      
      await page.goto('https://formgenai-4545.web.app/login');
      
      await page.locator('input[type="email"]').fill(account.email);
      await page.locator('input[type="password"]').fill(account.password);
      await page.getByRole('button', { name: /sign in/i }).click();
      
      await page.waitForTimeout(3000);
      
      const url = page.url();
      if (url.includes('/admin')) {
        console.log(`✅ SUCCESS! ${account.email} works!`);
        console.log('\n📋 USE THESE CREDENTIALS IN .env.test:');
        console.log(`TEST_USER_EMAIL=${account.email}`);
        console.log(`TEST_USER_PASSWORD=${account.password}`);
        return;
      } else {
        console.log(`❌ ${account.email} doesn't work`);
      }
    }
    
    console.log('\n❌ None of the common accounts work - you need to create a new one');
  });
});
