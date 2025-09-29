import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3001';

test.describe('Debug Authentication', () => {
  
  test('Check admin page state', async ({ page }) => {
    console.log('🔍 Debugging admin page state...');
    
    // Navigate to admin page
    await page.goto(`${BASE_URL}/admin`);
    console.log('🔗 Navigated to admin page');
    
    // Take screenshot of current state
    await page.screenshot({ path: 'test-results/admin-page-state.png', fullPage: true });
    console.log('📸 Screenshot taken: admin-page-state.png');
    
    // Check what's visible on the page
    const pageTitle = await page.title();
    console.log('📄 Page title:', pageTitle);
    
    // Check for common elements
    const bodyText = await page.locator('body').textContent();
    console.log('📝 Page contains "admin":', bodyText?.toLowerCase().includes('admin'));
    console.log('📝 Page contains "login":', bodyText?.toLowerCase().includes('login'));
    console.log('📝 Page contains "dashboard":', bodyText?.toLowerCase().includes('dashboard'));
    console.log('📝 Page contains "template":', bodyText?.toLowerCase().includes('template'));
    
    // Check for specific elements
    const emailInput = await page.locator('input[type="email"]').count();
    const passwordInput = await page.locator('input[type="password"]').count();
    const templateText = await page.locator('text=Template Management').count();
    const dashboardText = await page.locator('text=Dashboard').count();
    
    console.log('🔍 Found email inputs:', emailInput);
    console.log('🔍 Found password inputs:', passwordInput);
    console.log('🔍 Found "Template Management":', templateText);
    console.log('🔍 Found "Dashboard":', dashboardText);
    
    // Check URL
    const currentUrl = page.url();
    console.log('🌐 Current URL:', currentUrl);
    
    // Wait a moment and take another screenshot
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'test-results/admin-page-after-wait.png', fullPage: true });
    console.log('📸 Second screenshot taken: admin-page-after-wait.png');
    
    console.log('✅ Debug completed - check screenshots and console output');
  });
  
});