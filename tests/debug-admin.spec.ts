import { test, expect } from '@playwright/test';

test('Debug admin page loading', async ({ page }) => {
  console.log('🔍 Debugging admin page loading...');
  
  // Set a longer timeout
  test.setTimeout(60000);
  
  try {
    // Navigate to admin page
    console.log('Navigating to /admin...');
    await page.goto('/admin', { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // Take screenshot immediately
    await page.screenshot({ path: 'debug-admin-1.png' });
    console.log('Screenshot taken: debug-admin-1.png');
    
    // Wait a bit for any async loading
    await page.waitForTimeout(5000);
    
    // Take another screenshot
    await page.screenshot({ path: 'debug-admin-2.png' });
    console.log('Screenshot taken: debug-admin-2.png');
    
    // Log page title and URL
    const title = await page.title();
    const url = page.url();
    console.log('Page title:', title);
    console.log('Page URL:', url);
    
    // Check what's visible on the page
    const bodyText = await page.locator('body').textContent();
    console.log('Page text content:', bodyText?.substring(0, 500));
    
    // Check for common elements
    const hasLoginForm = await page.locator('input[type="email"]').isVisible();
    const hasDashboard = await page.locator('text=Dashboard').isVisible();
    const hasError = await page.locator('text=Error').isVisible();
    
    console.log('Has login form:', hasLoginForm);
    console.log('Has dashboard:', hasDashboard);
    console.log('Has error:', hasError);
    
  } catch (error) {
    console.error('Error during test:', error);
    await page.screenshot({ path: 'debug-admin-error.png' });
  }
});