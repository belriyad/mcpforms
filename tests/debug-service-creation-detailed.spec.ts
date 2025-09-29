import { test, expect } from '@playwright/test';

test('Debug service creation process', async ({ page }) => {
  console.log('🔍 Debugging service creation process...');
  
  test.setTimeout(60000);
  
  try {
    // Navigate and login
    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    
    // Login (assuming user has been created)
    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.isVisible()) {
      await emailInput.fill('test@example.com');
      await page.locator('input[type="password"]').fill('password123');
      await page.locator('button[type="submit"]').click();
      await page.waitForTimeout(5000);
    }
    
    // Navigate to Services tab
    console.log('⚙️ Navigating to Services tab...');
    const servicesTab = page.locator('button:has-text("Services")');
    if (await servicesTab.isVisible()) {
      await servicesTab.click();
      await page.waitForTimeout(3000);
      
      await page.screenshot({ path: 'debug-services-before.png' });
      
      // Check current services count
      const existingServices = page.locator('.card:has-text("Service"), [data-testid="service-item"]');
      const currentCount = await existingServices.count();
      console.log(`📊 Current services count: ${currentCount}`);
      
      // Click Create Service
      const createButton = page.locator('button:has-text("Create Service")');
      if (await createButton.isVisible()) {
        await createButton.click();
        await page.waitForTimeout(2000);
        
        await page.screenshot({ path: 'debug-create-modal.png' });
        
        // Fill form
        await page.locator('input#serviceName').fill('Debug Test Service');
        await page.locator('textarea#serviceDescription').fill('Testing service creation debug');
        
        // Check templates
        const templateCheckboxes = page.locator('input[type="checkbox"]');
        const templateCount = await templateCheckboxes.count();
        console.log(`📋 Templates available: ${templateCount}`);
        
        if (templateCount > 0) {
          await templateCheckboxes.first().check();
          console.log('✅ Selected first template');
          
          // Submit form and monitor network
          page.on('response', response => {
            if (response.url().includes('createServiceRequest')) {
              console.log('🌐 Service creation response:', response.status());
              response.json().then(data => {
                console.log('📦 Response data:', JSON.stringify(data, null, 2));
              }).catch(err => {
                console.log('❌ Could not parse response JSON:', err.message);
              });
            }
          });
          
          // Monitor console logs
          page.on('console', msg => {
            if (msg.text().includes('Service') || msg.text().includes('service')) {
              console.log('🖥️ Browser console:', msg.text());
            }
          });
          
          const submitButton = page.locator('button:has-text("Create Service"):not(:has-text("Create Service Request"))');
          await submitButton.click();
          
          console.log('📤 Form submitted, waiting for response...');
          await page.waitForTimeout(10000);
          
          await page.screenshot({ path: 'debug-after-submit.png' });
          
          // Check if modal closed
          const modal = page.locator('.fixed.inset-0, [role="dialog"]');
          const modalVisible = await modal.isVisible();
          console.log('🖼️ Modal still visible:', modalVisible);
          
          // Check services count after creation
          await page.waitForTimeout(2000);
          const newCount = await existingServices.count();
          console.log(`📊 Services count after creation: ${newCount}`);
          
          if (newCount > currentCount) {
            console.log('✅ Service appears to have been created successfully!');
          } else {
            console.log('❌ Service count did not increase');
            
            // Try refreshing the page
            await page.reload();
            await page.waitForTimeout(3000);
            
            if (await servicesTab.isVisible()) {
              await servicesTab.click();
              await page.waitForTimeout(2000);
            }
            
            const countAfterRefresh = await existingServices.count();
            console.log(`📊 Services count after refresh: ${countAfterRefresh}`);
            
            await page.screenshot({ path: 'debug-after-refresh.png' });
          }
          
        } else {
          console.log('❌ No templates available for service creation');
          const noTemplatesMsg = page.locator('text=No parsed templates available');
          const hasMessage = await noTemplatesMsg.isVisible();
          console.log('💡 "No templates" message visible:', hasMessage);
        }
        
      } else {
        console.log('❌ Create Service button not found');
      }
    } else {
      console.log('❌ Services tab not found');
    }
    
  } catch (error) {
    console.error('❌ Debug test error:', error);
    await page.screenshot({ path: 'debug-error.png' });
  }
});