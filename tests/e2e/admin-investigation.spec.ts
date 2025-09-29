import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard Investigation', () => {
  test('Investigate admin dashboard content', async ({ page }) => {
    console.log('🚀 Starting admin dashboard investigation...');
    
    try {
      // Step 1: Navigate to admin page
      console.log('📋 Navigating to admin page...');
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');
      
      console.log('✅ Successfully navigated to admin page');
      
      // Step 2: Take a full page screenshot
      console.log('📸 Taking full page screenshot...');
      await page.screenshot({ path: 'admin-dashboard-full.png', fullPage: true });
      
      // Step 3: Get all text content from the page
      console.log('🔍 Getting all text content...');
      const allText = await page.textContent('body');
      console.log('Page text content:');
      console.log(allText);
      
      // Step 4: Get all buttons and links
      console.log('🔍 Finding all buttons and links...');
      const buttons = await page.locator('button').all();
      console.log(`Found ${buttons.length} buttons:`);
      for (let i = 0; i < buttons.length; i++) {
        const text = await buttons[i].textContent();
        console.log(`Button ${i + 1}: "${text}"`);
      }
      
      const links = await page.locator('a').all();
      console.log(`Found ${links.length} links:`);
      for (let i = 0; i < links.length; i++) {
        const text = await links[i].textContent();
        const href = await links[i].getAttribute('href');
        console.log(`Link ${i + 1}: "${text}" -> ${href}`);
      }
      
      // Step 5: Look for any form-related or template-related elements
      console.log('🔍 Looking for form/template-related elements...');
      const formElements = await page.locator('*').filter({ hasText: /template|form|intake|service|generate|create/i }).all();
      console.log(`Found ${formElements.length} form-related elements:`);
      for (let i = 0; i < formElements.length; i++) {
        const element = formElements[i];
        const text = await element.textContent();
        const tagName = await element.evaluate(el => el.tagName);
        console.log(`Element ${i + 1}: <${tagName}> "${text?.substring(0, 100)}${text && text.length > 100 ? '...' : ''}"`);
      }
      
      console.log('✅ Investigation completed successfully');
      
    } catch (error) {
      console.error('❌ Investigation error:', error);
      await page.screenshot({ path: 'investigation-error.png', fullPage: true });
      throw error;
    }
  });
});