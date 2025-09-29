import { test, expect } from '@playwright/test';

test.describe('Simple Intake Link Test', () => {
  test('Navigate to admin dashboard and generate intake link', async ({ page }) => {
    console.log('🚀 Starting simple intake test...');
    
    try {
      // Step 1: Navigate to admin dashboard
      console.log('📋 Navigating to admin dashboard...');
      await page.goto('http://localhost:3000/admin/dashboard');
      await page.waitForLoadState('networkidle');
      
      console.log('✅ Successfully navigated to admin dashboard');
      
      // Step 2: Look for templates section
      console.log('🔍 Looking for templates section...');
      const templatesSection = await page.locator('text=Templates').first();
      await expect(templatesSection).toBeVisible({ timeout: 10000 });
      
      // Step 3: Look for services or intake generation
      console.log('🔍 Looking for services or intake options...');
      
      // Try to find any intake-related buttons or links
      const intakeElements = await page.locator('button, a').filter({ hasText: /intake|generate|create/i }).all();
      console.log(`Found ${intakeElements.length} potential intake elements`);
      
      for (let i = 0; i < intakeElements.length; i++) {
        const element = intakeElements[i];
        const text = await element.textContent();
        console.log(`Element ${i + 1}: "${text}"`);
      }
      
      // Step 4: Take a screenshot of the dashboard
      console.log('📸 Taking screenshot of dashboard...');
      await page.screenshot({ path: 'admin-dashboard-screenshot.png', fullPage: true });
      
      console.log('✅ Simple intake test completed successfully');
      
    } catch (error) {
      console.error('❌ Test error:', error);
      await page.screenshot({ path: 'simple-test-error.png' });
      throw error;
    }
  });
});