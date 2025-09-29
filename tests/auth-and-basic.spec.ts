import { test, expect } from '@playwright/test';
import * as path from 'path';

test.describe('MCPForms Authentication and Basic Flow', () => {
  test('Login and access admin dashboard', async ({ page }) => {
    console.log('🔐 Testing admin authentication...');
    
    // Navigate to admin page
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    // Check if we need to login
    const emailInput = page.locator('input[type="email"]');
    
    if (await emailInput.isVisible()) {
      console.log('Login form detected, authenticating...');
      
      // Try test credentials
      await emailInput.fill('test@example.com');
      await page.locator('input[type="password"]').fill('password123');
      
      const loginButton = page.locator('button[type="submit"], button:has-text("Sign In")');
      await loginButton.click();
      
      // Wait for either success or error
      await page.waitForTimeout(3000);
      
      // Check if still on login page (failed login)
      if (await page.locator('input[type="email"]').isVisible()) {
        console.log('Test user failed, trying briyad@gmail.com...');
        
        await page.locator('input[type="email"]').fill('briyad@gmail.com');
        await page.locator('input[type="password"]').fill('testpassword123');
        await loginButton.click();
        await page.waitForTimeout(3000);
      }
    }
    
    // Verify we're in the admin dashboard
    await expect(page.locator('text=Admin Dashboard, text=Templates, text=Upload Template')).toBeVisible({ timeout: 10000 });
    
    console.log('✅ Successfully accessed admin dashboard');
  });
  
  test('Upload single template file', async ({ page }) => {
    console.log('📤 Testing template upload...');
    
    // Navigate and authenticate
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    // Handle login if needed
    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.isVisible()) {
      await emailInput.fill('test@example.com');
      await page.locator('input[type="password"]').fill('password123');
      await page.locator('button[type="submit"], button:has-text("Sign In")').click();
      await page.waitForTimeout(3000);
      
      if (await page.locator('input[type="email"]').isVisible()) {
        await page.locator('input[type="email"]').fill('briyad@gmail.com');
        await page.locator('input[type="password"]').fill('testpassword123');
        await page.locator('button[type="submit"], button:has-text("Sign In")').click();
        await page.waitForTimeout(3000);
      }
    }
    
    // Look for file upload input
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeVisible({ timeout: 10000 });
    
    // Upload test file
    const filePath = path.join(process.cwd(), 'test-data', 'sample-template.txt');
    await fileInput.setInputFiles(filePath);
    
    // Find and click upload button
    const uploadButton = page.locator('button:has-text("Upload Template"), button:has-text("Upload")');
    await uploadButton.click();
    
    // Wait for upload success (this might take time due to processing)
    await expect(page.locator('text=uploaded, text=processing, text=success')).toBeVisible({ 
      timeout: 30000 
    });
    
    console.log('✅ Template uploaded successfully');
  });
  
  test('Navigate between admin sections', async ({ page }) => {
    console.log('🧭 Testing navigation between admin sections...');
    
    // Navigate and authenticate
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    // Handle login if needed  
    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.isVisible()) {
      await emailInput.fill('test@example.com');
      await page.locator('input[type="password"]').fill('password123');
      await page.locator('button[type="submit"], button:has-text("Sign In")').click();
      await page.waitForTimeout(3000);
      
      if (await page.locator('input[type="email"]').isVisible()) {
        await page.locator('input[type="email"]').fill('briyad@gmail.com');
        await page.locator('input[type="password"]').fill('testpassword123');
        await page.locator('button[type="submit"], button:has-text("Sign In")').click();
        await page.waitForTimeout(3000);
      }
    }
    
    // Check navigation tabs/links exist
    const templatesTab = page.locator('text=Templates, button:has-text("Templates"), [role="tab"]:has-text("Templates")');
    const servicesTab = page.locator('text=Services, button:has-text("Services"), [role="tab"]:has-text("Services")');
    const intakesTab = page.locator('text=Intakes, button:has-text("Intakes"), [role="tab"]:has-text("Intakes")');
    
    // Test navigation
    if (await templatesTab.isVisible()) {
      await templatesTab.click();
      await page.waitForTimeout(1000);
      console.log('✅ Templates section accessible');
    }
    
    if (await servicesTab.isVisible()) {
      await servicesTab.click();
      await page.waitForTimeout(1000);
      console.log('✅ Services section accessible');
    }
    
    if (await intakesTab.isVisible()) {
      await intakesTab.click();
      await page.waitForTimeout(1000);
      console.log('✅ Intakes section accessible');
    }
    
    console.log('🎉 Navigation test completed');    
  });
});