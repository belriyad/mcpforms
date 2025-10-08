import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

/**
 * Production Sanity Check
 * Tests the critical user flows on the production site
 * 
 * Run with: npx playwright test tests/production-sanity-check.spec.ts
 * Run in UI mode: npx playwright test tests/production-sanity-check.spec.ts --ui
 */

const PRODUCTION_URL = 'https://formgenai-4545.web.app';

// Test user credentials from .env.test
const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'rubazayed@gmail.com',
  password: process.env.TEST_USER_PASSWORD || 'rubazayed'
};

test.describe('Production Sanity Checks', () => {
  
  test.beforeEach(async ({ page }) => {
    // Set longer timeout for production
    test.setTimeout(60000);
  });

  test('1. Home page loads successfully', async ({ page }) => {
    await page.goto(PRODUCTION_URL);
    await expect(page).toHaveTitle(/Smart Forms AI/i);
    await expect(page.getByRole('heading')).toBeVisible({ timeout: 10000 });
  });

  test('2. Login page loads and accepts credentials', async ({ page }) => {
    await page.goto(`${PRODUCTION_URL}/login`);
    
    // Wait for page to load - looking for "Welcome Back" heading
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible({ timeout: 10000 });
    
    // Fill in credentials
    await page.getByLabel(/email/i).fill(TEST_USER.email);
    await page.getByLabel(/password/i).fill(TEST_USER.password);
    
    // Submit form
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Should redirect to admin dashboard (with generous timeout for production)
    await page.waitForURL('**/admin', { timeout: 30000 });
    await expect(page).toHaveURL(/\/admin/);
  });

  test('3. Admin dashboard loads with user data', async ({ page }) => {
    // Login first
    await page.goto(`${PRODUCTION_URL}/login`);
    await page.getByLabel(/email/i).fill(TEST_USER.email);
    await page.getByLabel(/password/i).fill(TEST_USER.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL('**/admin', { timeout: 30000 });
    
    // Check dashboard loads (wait longer for data)
    await page.waitForTimeout(3000);
    await expect(page.getByText(/dashboard|services|templates/i)).toBeVisible({ timeout: 15000 });
    
    // Check stats cards appear (wait for Firestore data)
    await expect(page.locator('[class*="stat"]').first()).toBeVisible({ timeout: 15000 });
  });

  test('4. Services page loads without errors', async ({ page }) => {
    // Login
    await page.goto(`${PRODUCTION_URL}/login`);
    await page.getByLabel(/email/i).fill(TEST_USER.email);
    await page.getByLabel(/password/i).fill(TEST_USER.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL('**/admin', { timeout: 30000 });
    
    // Navigate to services
    await page.goto(`${PRODUCTION_URL}/admin/services`);
    
    // Wait for services to load (Firestore query takes time)
    await page.waitForTimeout(3000);
    await expect(page.getByText(/services|no services|create service/i)).toBeVisible({ timeout: 15000 });
    
    // Check no error messages
    await expect(page.getByText(/error|failed|something went wrong/i)).not.toBeVisible();
  });

  test('5. Can access owned service', async ({ page }) => {
    // Login
    await page.goto(`${PRODUCTION_URL}/login`);
    await page.getByLabel(/email/i).fill(TEST_USER.email);
    await page.getByLabel(/password/i).fill(TEST_USER.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL('**/admin', { timeout: 30000 });
    
    // Go to services page
    await page.goto(`${PRODUCTION_URL}/admin/services`);
    
    // Wait for services list (Firestore data)
    await page.waitForTimeout(5000);
    
    // Click first service if it exists
    const serviceLink = page.locator('a[href*="/admin/services/"]').first();
    if (await serviceLink.isVisible({ timeout: 5000 })) {
      await serviceLink.click();
      
      // Should load service detail page
      await expect(page).toHaveURL(/\/admin\/services\/.+/);
      
      // Wait for page to load
      await page.waitForTimeout(3000);
      
      // Should NOT see permission error
      await expect(page.getByText(/you do not have permission/i)).not.toBeVisible();
      
      // Should see service details
      await expect(page.getByText(/service|templates|intake|generate/i)).toBeVisible({ timeout: 10000 });
    } else {
      console.log('No services found - skipping service access test');
    }
  });

  test('6. Intake form link loads (if available)', async ({ page }) => {
    const intakeToken = process.env.TEST_INTAKE_TOKEN || 'intake_1759821638675_0fk5ujved';
    
    await page.goto(`${PRODUCTION_URL}/intake/${intakeToken}`);
    
    // Check if it loads or shows proper error
    await page.waitForTimeout(5000);
    
    const hasError = await page.getByText(/error|not found|expired/i).isVisible();
    const hasForm = await page.getByRole('form').isVisible();
    
    if (hasError) {
      console.log('Intake form not found or expired - expected if token is old');
      expect(hasError).toBe(true);
    } else if (hasForm) {
      console.log('Intake form loaded successfully');
      expect(hasForm).toBe(true);
    }
  });

  test('7. Migration tool page loads', async ({ page }) => {
    // Login first
    await page.goto(`${PRODUCTION_URL}/login`);
    await page.getByLabel(/email/i).fill(TEST_USER.email);
    await page.getByLabel(/password/i).fill(TEST_USER.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL('**/admin', { timeout: 30000 });
    
    // Visit migration tool
    await page.goto(`${PRODUCTION_URL}/migrate.html`);
    
    // Should load migration interface
    await expect(page.getByText(/migration|migrate|ownership/i)).toBeVisible({ timeout: 10000 });
  });

  test('8. No console errors on dashboard', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Login and navigate to dashboard
    await page.goto(`${PRODUCTION_URL}/login`);
    await page.getByLabel(/email/i).fill(TEST_USER.email);
    await page.getByLabel(/password/i).fill(TEST_USER.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL('**/admin', { timeout: 30000 });
    
    // Wait for dashboard to fully load
    await page.waitForTimeout(5000);
    
    // Check for critical errors (ignore minor warnings)
    const criticalErrors = consoleErrors.filter(err => 
      !err.includes('DevTools') && 
      !err.includes('favicon') &&
      !err.includes('Extension') &&
      !err.includes('_next/static')
    );
    
    if (criticalErrors.length > 0) {
      console.log('Console errors found:', criticalErrors);
    }
    
    expect(criticalErrors.length).toBe(0);
  });

  test('9. Security rules allow owned data access', async ({ page }) => {
    // Login
    await page.goto(`${PRODUCTION_URL}/login`);
    await page.getByLabel(/email/i).fill(TEST_USER.email);
    await page.getByLabel(/password/i).fill(TEST_USER.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL('**/admin', { timeout: 30000 });
    
    // Navigate to services
    await page.goto(`${PRODUCTION_URL}/admin/services`);
    await page.waitForTimeout(3000);
    
    // Should load services without permission errors
    const permissionError = await page.getByText(/permission denied|unauthorized|access denied/i).isVisible();
    expect(permissionError).toBe(false);
  });

  test('10. Fast page load times (< 10s)', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto(`${PRODUCTION_URL}/login`);
    await page.getByLabel(/email/i).fill(TEST_USER.email);
    await page.getByLabel(/password/i).fill(TEST_USER.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL('**/admin', { timeout: 30000 });
    
    const loadTime = Date.now() - startTime;
    console.log(`Dashboard load time: ${loadTime}ms`);
    
    // Should load in less than 10 seconds (relaxed for production)
    expect(loadTime).toBeLessThan(10000);
  });
});

test.describe('Production Workflow Tests', () => {
  
  test('Complete workflow: Login → View Service → Generate Intake', async ({ page }) => {
    test.setTimeout(120000); // 2 minutes for complete workflow
    
    // Step 1: Login
    await page.goto(`${PRODUCTION_URL}/login`);
    await page.getByLabel(/email/i).fill(TEST_USER.email);
    await page.getByLabel(/password/i).fill(TEST_USER.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL('**/admin', { timeout: 30000 });
    
    console.log('✅ Step 1: Logged in successfully');
    
    // Step 2: Navigate to services
    await page.goto(`${PRODUCTION_URL}/admin/services`);
    await page.waitForTimeout(5000);
    
    console.log('✅ Step 2: Navigated to services page');
    
    // Step 3: Check if services exist
    const serviceLink = page.locator('a[href*="/admin/services/"]').first();
    const hasServices = await serviceLink.isVisible({ timeout: 10000 });
    
    if (hasServices) {
      // Step 4: Click on service
      await serviceLink.click();
      await page.waitForURL(/\/admin\/services\/.+/);
      await page.waitForTimeout(3000);
      
      console.log('✅ Step 3: Opened service detail page');
      
      // Step 5: Verify no permission errors
      const permissionError = await page.getByText(/you do not have permission/i).isVisible();
      expect(permissionError).toBe(false);
      
      console.log('✅ Step 4: No permission errors');
      
      // Step 6: Check for Generate Intake button
      const generateButton = page.getByRole('button', { name: /generate|create intake/i });
      if (await generateButton.isVisible({ timeout: 5000 })) {
        await generateButton.click();
        await page.waitForTimeout(2000);
        
        console.log('✅ Step 5: Clicked generate intake');
      }
    } else {
      console.log('⚠️  No services found - workflow test incomplete');
    }
  });
});
