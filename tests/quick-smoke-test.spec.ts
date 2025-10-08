import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

/**
 * Quick Production Smoke Test
 * Fast, essential checks to verify production is working
 * 
 * Run with: npx playwright test tests/quick-smoke-test.spec.ts --project=chromium
 */

const PRODUCTION_URL = 'https://formgenai-4545.web.app';

const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'rubazayed@gmail.com',
  password: process.env.TEST_USER_PASSWORD || 'rubazayed'
};

test.describe('Quick Smoke Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    test.setTimeout(90000); // 90 seconds per test
  });

  test('1. Site is online and accessible', async ({ page }) => {
    const response = await page.goto(PRODUCTION_URL);
    expect(response?.status()).toBe(200);
    console.log('✅ Site is online');
  });

  test('2. Can reach login page', async ({ page }) => {
    await page.goto(`${PRODUCTION_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    // Check if login form is present
    const emailInput = page.getByLabel(/email/i);
    await expect(emailInput).toBeVisible({ timeout: 10000 });
    
    console.log('✅ Login page loads');
  });

  test('3. Can attempt login (see what happens)', async ({ page }) => {
    await page.goto(`${PRODUCTION_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    // Fill credentials
    await page.getByLabel(/email/i).fill(TEST_USER.email);
    await page.getByLabel(/password/i).fill(TEST_USER.password);
    
    console.log('📝 Filled credentials');
    
    // Click sign in
    await page.getByRole('button', { name: /sign in/i }).click();
    
    console.log('🔘 Clicked Sign In button');
    
    // Wait and see what happens
    await page.waitForTimeout(10000);
    
    const currentUrl = page.url();
    console.log('📍 Current URL:', currentUrl);
    
    // Check if we're on admin page
    if (currentUrl.includes('/admin')) {
      console.log('✅ Successfully logged in - redirected to admin');
      expect(currentUrl).toContain('/admin');
    } else {
      console.log('⚠️  Not redirected to admin. Still on:', currentUrl);
      
      // Check for error messages
      const errorText = await page.locator('text=/error|failed|invalid/i').textContent().catch(() => null);
      if (errorText) {
        console.log('❌ Error message found:', errorText);
      }
      
      // Take screenshot for debugging
      await page.screenshot({ path: 'login-issue.png', fullPage: true });
      console.log('📸 Screenshot saved as login-issue.png');
    }
  });

  test('4. Admin page loads (if can login)', async ({ page }) => {
    await page.goto(`${PRODUCTION_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    await page.getByLabel(/email/i).fill(TEST_USER.email);
    await page.getByLabel(/password/i).fill(TEST_USER.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Try to reach admin
    try {
      await page.waitForURL('**/admin', { timeout: 60000 });
      console.log('✅ Reached admin dashboard');
      
      // Wait for content
      await page.waitForTimeout(5000);
      
      // Check for any content
      const bodyText = await page.locator('body').textContent();
      console.log('📄 Page has content:', bodyText?.substring(0, 200));
      
    } catch (error) {
      console.log('❌ Failed to reach admin:', error instanceof Error ? error.message : String(error));
      await page.screenshot({ path: 'admin-timeout.png', fullPage: true });
      console.log('📸 Screenshot saved as admin-timeout.png');
      throw error;
    }
  });

  test('5. Can access services page', async ({ page }) => {
    // Try direct navigation to services
    await page.goto(`${PRODUCTION_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    await page.getByLabel(/email/i).fill(TEST_USER.email);
    await page.getByLabel(/password/i).fill(TEST_USER.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    
    await page.waitForURL('**/admin', { timeout: 60000 });
    
    // Navigate to services
    await page.goto(`${PRODUCTION_URL}/admin/services`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);
    
    const bodyText = await page.locator('body').textContent();
    console.log('📄 Services page content:', bodyText?.substring(0, 200));
    
    // Check for error or permission messages
    const hasError = bodyText?.toLowerCase().includes('error') || bodyText?.toLowerCase().includes('permission');
    if (hasError) {
      console.log('⚠️  Found error/permission text in services page');
      await page.screenshot({ path: 'services-error.png', fullPage: true });
    } else {
      console.log('✅ Services page loads without errors');
    }
  });
});

test.describe('Issue Reproduction Tests', () => {
  
  test('Reproduce intake loading issue', async ({ page }) => {
    const intakeToken = process.env.TEST_INTAKE_TOKEN || 'intake_1759821638675_0fk5ujved';
    const intakeUrl = `${PRODUCTION_URL}/intake/${intakeToken}`;
    
    console.log('🔗 Testing intake URL:', intakeUrl);
    
    await page.goto(intakeUrl);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);
    
    // Check what we see
    const bodyText = await page.locator('body').textContent();
    console.log('📄 Intake page content:', bodyText?.substring(0, 300));
    
    // Check for error
    if (bodyText?.toLowerCase().includes('error')) {
      console.log('❌ Intake form shows error');
      const errorMsg = await page.locator('text=/error/i').textContent();
      console.log('Error message:', errorMsg);
      
      await page.screenshot({ path: 'intake-error.png', fullPage: true });
      console.log('📸 Screenshot saved as intake-error.png');
    } else if (bodyText?.toLowerCase().includes('form')) {
      console.log('✅ Intake form appears to load');
    } else {
      console.log('⚠️  Unexpected content on intake page');
    }
  });

  test('Reproduce service access issue', async ({ page }) => {
    const serviceId = process.env.TEST_SERVICE_ID || 'w9rq4zgEiihA17ZNjhSg';
    
    // Login first
    await page.goto(`${PRODUCTION_URL}/login`);
    await page.waitForLoadState('networkidle');
    
    await page.getByLabel(/email/i).fill(TEST_USER.email);
    await page.getByLabel(/password/i).fill(TEST_USER.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    
    await page.waitForURL('**/admin', { timeout: 60000 });
    
    // Try to access service
    const serviceUrl = `${PRODUCTION_URL}/admin/services/${serviceId}`;
    console.log('🔗 Testing service URL:', serviceUrl);
    
    await page.goto(serviceUrl);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);
    
    const bodyText = await page.locator('body').textContent();
    console.log('📄 Service page content:', bodyText?.substring(0, 300));
    
    // Check for permission error
    if (bodyText?.toLowerCase().includes('permission')) {
      console.log('❌ Permission error found');
      await page.screenshot({ path: 'service-permission-error.png', fullPage: true });
      console.log('📸 Screenshot saved');
    } else {
      console.log('✅ Service page loads without permission error');
    }
  });
});
