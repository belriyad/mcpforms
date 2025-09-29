import { test, expect } from '@playwright/test';
import path from 'path';

const BASE_URL = 'http://localhost:3000';

test.describe('Template Upload Test', () => {
  
  test('Simple template upload test', async ({ page }) => {
    console.log('🚀 Starting simple template upload test...');
    
    // Navigate to admin page
    await page.goto(`${BASE_URL}/admin`);
    console.log('🔗 Navigated to admin page');
    
    // Take a screenshot to see current state
    await page.screenshot({ path: 'test-results/admin-page.png' });
    
    // Check if we see a login form or dashboard
    const isLoginForm = await page.locator('input[type="email"]').isVisible();
    const isDashboard = await page.locator('text=Template Management').isVisible();
    
    console.log('📊 Page state:', { isLoginForm, isDashboard });
    
    if (isLoginForm) {
      console.log('🔐 Login form detected');
      
      // Fill email field
      await page.fill('input[type="email"]', 'briyad@gmail.com');
      await page.screenshot({ path: 'test-results/login-form.png' });
      
      console.log('⚠️ Manual intervention needed: Please enter password and complete login');
      console.log('🔄 Waiting for dashboard to appear...');
      
      // Wait longer for manual login
      try {
        await page.waitForSelector('text=Template Management', { timeout: 120000 }); // 2 minutes
        console.log('✅ Dashboard loaded after login');
      } catch (error) {
        console.log('❌ Dashboard did not load - login may have failed');
        await page.screenshot({ path: 'test-results/login-failed.png' });
        throw error;
      }
    }
    
    if (isDashboard) {
      console.log('✅ Dashboard is already visible');
    }
    
    // Now try to upload a template
    console.log('📤 Attempting to upload template...');
    
    // Look for upload button
    const uploadButton = page.locator('text=Upload Template').or(page.locator('button', { hasText: 'Upload' }));
    
    if (await uploadButton.isVisible()) {
      await uploadButton.click();
      console.log('🔘 Clicked upload button');
      
      // Wait for upload modal
      await page.waitForSelector('text=Template Name', { timeout: 10000 });
      console.log('📝 Upload modal opened');
      
      // Fill template name
      await page.fill('input[placeholder="Enter template name"]', 'Test Certificate');
      
      // Select file
      const filePath = path.join(__dirname, '..', 'src', 'sample', 'Certificate_of_Trust_Fillable Template.docx');
      await page.setInputFiles('input[type="file"]', filePath);
      console.log('📄 File selected');
      
      await page.screenshot({ path: 'test-results/upload-modal.png' });
      
      // Check if direct upload is selected (should be default)
      const uploadMethodText = page.locator('text=Direct upload');
      if (await uploadMethodText.isVisible()) {
        console.log('✅ Direct upload method is active');
      }
      
      // Click upload
      const finalUploadButton = page.locator('text=Upload Template').last();
      await finalUploadButton.click();
      console.log('🚀 Clicked final upload button');
      
      // Wait for success message
      try {
        await expect(page.locator('text=Template uploaded successfully')).toBeVisible({ timeout: 30000 });
        console.log('🎉 Template uploaded successfully!');
        
        await page.screenshot({ path: 'test-results/upload-success.png' });
        
        // Close modal
        await page.click('text=Cancel');
        
      } catch (error) {
        console.log('❌ Upload failed or success message not found');
        await page.screenshot({ path: 'test-results/upload-failed.png' });
        
        // Check for error messages
        const errorMessage = await page.locator('.error, [role="alert"], text*="error"').textContent();
        console.log('Error message:', errorMessage);
        
        throw error;
      }
    } else {
      console.log('❌ Upload button not found');
      await page.screenshot({ path: 'test-results/no-upload-button.png' });
    }
  });
  
});