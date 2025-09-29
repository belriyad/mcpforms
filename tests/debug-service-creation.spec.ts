import { test, expect } from '@playwright/test';

test('Debug service creation issue', async ({ page }) => {
  console.log('🔍 Debugging service creation issue...');
  
  test.setTimeout(60000);
  
  try {
    // Navigate to admin page
    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    
    // Handle authentication if needed
    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.isVisible()) {
      console.log('🔐 Authenticating...');
      await emailInput.fill('test@example.com');
      await page.locator('input[type="password"]').fill('password123');
      await page.locator('button[type="submit"]').click();
      await page.waitForTimeout(3000);
    }
    
    // Navigate to Services tab
    console.log('⚙️ Navigating to services...');
    await page.click('text=Services');
    await page.waitForTimeout(2000);
    
    // Take screenshot of services page
    await page.screenshot({ path: 'debug-services-1.png' });
    console.log('📸 Services page screenshot: debug-services-1.png');
    
    // Check if create service button exists
    const createButton = page.locator('button:has-text("Create Service")');
    const createButtonVisible = await createButton.isVisible();
    console.log('➕ Create Service button visible:', createButtonVisible);
    
    if (createButtonVisible) {
      // Click create service button
      await createButton.click();
      await page.waitForTimeout(2000);
      
      // Take screenshot of create form
      await page.screenshot({ path: 'debug-services-2.png' });
      console.log('📸 Create form screenshot: debug-services-2.png');
      
      // Check form elements
      const nameInput = page.locator('input#serviceName');
      const descriptionInput = page.locator('textarea#serviceDescription');
      const templateSection = page.locator('text=Select Templates');
      
      console.log('📝 Name input visible:', await nameInput.isVisible());
      console.log('📝 Description input visible:', await descriptionInput.isVisible());
      console.log('📋 Template section visible:', await templateSection.isVisible());
      
      // Check for templates
      const templateCheckboxes = page.locator('input[type="checkbox"]');
      const templateCount = await templateCheckboxes.count();
      console.log('📋 Available templates:', templateCount);
      
      if (templateCount === 0) {
        console.log('❌ No templates available - this is the issue!');
        
        // Check for "no templates" message
        const noTemplatesMessage = page.locator('text=No parsed templates available');
        if (await noTemplatesMessage.isVisible()) {
          console.log('💡 Found "No parsed templates" message');
        }
      } else {
        console.log('✅ Templates found, testing form submission...');
        
        // Fill out the form
        await nameInput.fill('Test Service Debug');
        await descriptionInput.fill('Debug test service creation');
        
        // Select first template
        await templateCheckboxes.first().check();
        
        // Try to submit
        const submitButton = page.locator('button:has-text("Create Service")');
        await submitButton.click();
        await page.waitForTimeout(3000);
        
        // Check for success or error
        const successMessage = page.locator('text=Service created successfully');
        const errorMessage = page.locator('text=Failed to create service');
        
        if (await successMessage.isVisible()) {
          console.log('✅ Service creation successful!');
        } else if (await errorMessage.isVisible()) {
          console.log('❌ Service creation failed with error');
        } else {
          console.log('⚠️ No clear success/error message');
        }
      }
    } else {
      console.log('❌ Create Service button not found');
    }
    
    // Check templates tab to see if we have any templates
    console.log('📄 Checking templates tab...');
    await page.click('text=Templates');
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'debug-templates.png' });
    console.log('📸 Templates page screenshot: debug-templates.png');
    
    // Count templates
    const templateItems = page.locator('[data-testid="template-item"], .template-card, .card:has(text="Status")');
    const templateItemCount = await templateItems.count();
    console.log('📄 Templates on page:', templateItemCount);
    
    // Check if upload is available
    const uploadInput = page.locator('input[type="file"]');
    console.log('📤 Upload input available:', await uploadInput.isVisible());
    
  } catch (error) {
    console.error('❌ Error during debug:', error);
    await page.screenshot({ path: 'debug-error.png' });
  }
});