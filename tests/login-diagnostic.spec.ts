import { test, expect } from '@playwright/test';

test.describe('Login Diagnostic Tests', () => {
  
  test('Check login flow step by step', async ({ page }) => {
    console.log('\n🔍 DIAGNOSTIC: Testing login flow in detail\n');
    
    // Navigate to login page
    await page.goto('https://formgenai-4545.web.app/login');
    console.log('✅ Step 1: Navigated to login page');
    
    // Take initial screenshot
    await page.screenshot({ path: 'test-results/diagnostic-01-login-page.png', fullPage: true });
    
    // Fill in credentials
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    
    await emailInput.fill('test@example.com');
    console.log('✅ Step 2: Filled email');
    
    await passwordInput.fill('password123');
    console.log('✅ Step 3: Filled password');
    
    await page.screenshot({ path: 'test-results/diagnostic-02-form-filled.png', fullPage: true });
    
    // Set up console log listener
    page.on('console', msg => {
      console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`);
    });
    
    // Set up network request listener
    page.on('request', request => {
      if (request.url().includes('identitytoolkit') || request.url().includes('firestore')) {
        console.log(`[NETWORK REQUEST] ${request.method()} ${request.url()}`);
      }
    });
    
    // Set up network response listener
    page.on('response', response => {
      if (response.url().includes('identitytoolkit') || response.url().includes('firestore')) {
        console.log(`[NETWORK RESPONSE] ${response.status()} ${response.url()}`);
      }
    });
    
    // Click sign in and wait for navigation
    const signInButton = page.getByRole('button', { name: /sign in/i });
    console.log('✅ Step 4: About to click Sign In button');
    
    await signInButton.click();
    console.log('✅ Step 5: Clicked Sign In button');
    
    // Wait a bit for the request to complete
    await page.waitForTimeout(3000);
    
    // Check current URL
    const currentUrl = page.url();
    console.log(`📍 Current URL after 3s: ${currentUrl}`);
    
    await page.screenshot({ path: 'test-results/diagnostic-03-after-signin-3s.png', fullPage: true });
    
    // Check for error messages
    const errorElement = page.locator('text=/invalid|error|failed/i').first();
    const errorVisible = await errorElement.isVisible().catch(() => false);
    
    if (errorVisible) {
      const errorText = await errorElement.textContent();
      console.log(`❌ Error message found: ${errorText}`);
    } else {
      console.log('✅ No error message visible');
    }
    
    // Wait longer and check again
    await page.waitForTimeout(5000);
    const urlAfter8s = page.url();
    console.log(`📍 Current URL after 8s: ${urlAfter8s}`);
    
    await page.screenshot({ path: 'test-results/diagnostic-04-after-signin-8s.png', fullPage: true });
    
    // Check if we're on admin page
    if (urlAfter8s.includes('/admin')) {
      console.log('✅ Successfully navigated to admin page!');
      
      // Check what's on the admin page
      const pageText = await page.locator('body').textContent();
      console.log(`📄 Admin page content preview: ${pageText?.substring(0, 200)}...`);
      
    } else if (urlAfter8s.includes('/login')) {
      console.log('❌ Still on login page - login failed or redirect not working');
      
      // Get page content to see what's happening
      const bodyText = await page.locator('body').textContent();
      console.log(`📄 Page content: ${bodyText?.substring(0, 500)}...`);
      
    } else {
      console.log(`⚠️ Unexpected URL: ${urlAfter8s}`);
    }
    
    // Check localStorage for auth tokens
    const authState = await page.evaluate(() => {
      const keys = Object.keys(localStorage);
      const authKeys = keys.filter(k => k.includes('firebase') || k.includes('auth'));
      return authKeys.map(k => ({ key: k, hasValue: localStorage.getItem(k) !== null }));
    });
    console.log('🔑 Auth state in localStorage:', JSON.stringify(authState, null, 2));
    
    // Try navigating to admin manually
    console.log('\n🔄 Attempting manual navigation to /admin...');
    await page.goto('https://formgenai-4545.web.app/admin');
    await page.waitForTimeout(3000);
    
    const finalUrl = page.url();
    console.log(`📍 Final URL after manual navigation: ${finalUrl}`);
    
    await page.screenshot({ path: 'test-results/diagnostic-05-manual-admin-nav.png', fullPage: true });
    
    // Check if admin content is visible
    const dashboardVisible = await page.locator('text=/dashboard|templates|services/i').first().isVisible({ timeout: 5000 }).catch(() => false);
    
    if (dashboardVisible) {
      console.log('✅ Admin dashboard content is visible!');
    } else {
      console.log('❌ Admin dashboard content not visible');
      const bodyContent = await page.locator('body').textContent();
      console.log(`📄 Body content: ${bodyContent?.substring(0, 300)}...`);
    }
  });
  
  test('Try alternative credentials', async ({ page }) => {
    console.log('\n🔍 DIAGNOSTIC: Testing with briyad@gmail.com credentials\n');
    
    await page.goto('https://formgenai-4545.web.app/login');
    
    await page.locator('input[type="email"]').fill('briyad@gmail.com');
    await page.locator('input[type="password"]').fill('testpassword123');
    
    await page.screenshot({ path: 'test-results/diagnostic-alt-01-form-filled.png', fullPage: true });
    
    await page.getByRole('button', { name: /sign in/i }).click();
    
    await page.waitForTimeout(5000);
    
    const url = page.url();
    console.log(`📍 URL with briyad account: ${url}`);
    
    await page.screenshot({ path: 'test-results/diagnostic-alt-02-after-signin.png', fullPage: true });
    
    if (url.includes('/admin')) {
      console.log('✅ briyad@gmail.com credentials work!');
    } else {
      console.log('❌ briyad@gmail.com credentials also fail');
    }
  });
});
