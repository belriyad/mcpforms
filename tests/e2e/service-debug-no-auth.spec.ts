import { test, expect } from '@playwright/test';

test.describe('Service Creation Debug (No Auth)', () => {
  test('should navigate to services and test creation', async ({ page }) => {
    console.log('🚀 Starting service creation debug test (auth disabled)');

    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'log' || msg.type() === 'error') {
        console.log(`🌐 Browser ${msg.type()}: ${msg.text()}`);
      }
    });

    // Go to app
    await page.goto('http://localhost:3002');
    console.log('📱 Navigated to app');

    // Should now go directly to admin dashboard since auth is disabled
    await page.click('a:has-text("Admin Dashboard")');
    
    // Wait for any dashboard element to appear
    await page.waitForTimeout(3000);
    
    // Check what's on the page
    const pageTitle = await page.title();
    console.log(`📄 Page title: ${pageTitle}`);
    
    const pageContent = await page.locator('body').textContent();
    console.log(`📝 Page contains "Admin Dashboard": ${pageContent?.includes('Admin Dashboard')}`);
    console.log(`📝 Page contains "Templates": ${pageContent?.includes('Templates')}`);
    console.log(`📝 Page contains "Services": ${pageContent?.includes('Services')}`);
    
    // Try to navigate to services
    const servicesLink = page.locator('text=Services');
    if (await servicesLink.isVisible()) {
      console.log('🔗 Services link found, clicking');
      await servicesLink.click();
      
      await page.waitForTimeout(2000);
      
      // Check if we can see service management
      const serviceManagement = page.locator('text=Service Management');
      console.log(`📋 Service Management visible: ${await serviceManagement.isVisible()}`);
      
      // Check for create service button (use first one to avoid strict mode violation)
      const createButton = page.locator('button:has-text("Create Service")').first();
      console.log(`➕ Create Service button visible: ${await createButton.isVisible()}`);
      
      if (await createButton.isVisible()) {
        await createButton.click();
        console.log('✅ Clicked Create Service button');
        
        // Check modal appearance with multiple selectors
        await page.waitForTimeout(2000);
        const modal = page.locator('[role="dialog"]');
        const modalAlt = page.locator('.modal');
        const createServiceForm = page.locator('form');
        
        console.log(`📦 Modal [role="dialog"] visible: ${await modal.isVisible()}`);
        console.log(`📦 Modal .modal visible: ${await modalAlt.isVisible()}`);
        console.log(`📝 Form visible: ${await createServiceForm.isVisible()}`);
        
        // Check what's actually on the page after clicking
        const pageContent = await page.locator('body').textContent();
        console.log(`📄 Page contains "Service Name": ${pageContent?.includes('Service Name')}`);
        console.log(`📄 Page contains "Description": ${pageContent?.includes('Description')}`);
        console.log(`📄 Page contains "Templates": ${pageContent?.includes('Templates')}`);
        
        // Try to find any form inputs
        const allInputs = page.locator('input');
        const inputCount = await allInputs.count();
        console.log(`📝 Total inputs found: ${inputCount}`);
        
        // Fill the modal form using ID selectors (not name attributes)
        const nameInput = page.locator('#serviceName');
        console.log(`📝 Name input visible: ${await nameInput.isVisible()}`);
        
        if (await nameInput.isVisible()) {
          await nameInput.fill('Test Service Debug');
          console.log('✏️ Filled service name');
          
          const descInput = page.locator('#serviceDescription');
          console.log(`📝 Description input visible: ${await descInput.isVisible()}`);
          
          if (await descInput.isVisible()) {
            await descInput.fill('Debug test service without authentication');
            console.log('✏️ Filled service description');
            
            // Check for template checkboxes (they don't have name attributes either)
            const checkboxes = page.locator('input[type="checkbox"]');
            const checkboxCount = await checkboxes.count();
            console.log(`☑️ Found ${checkboxCount} template checkboxes`);
            
            if (checkboxCount === 0) {
              console.log('❌ No template checkboxes available');
              
              // Check for any checkboxes at all
              const allCheckboxes = page.locator('input[type="checkbox"]');
              const allCount = await allCheckboxes.count();
              console.log(`☑️ Found ${allCount} total checkboxes`);
              
              // List all checkbox names/ids
              for (let i = 0; i < allCount; i++) {
                const checkbox = allCheckboxes.nth(i);
                const name = await checkbox.getAttribute('name');
                const id = await checkbox.getAttribute('id');
                const value = await checkbox.getAttribute('value');
                console.log(`☑️ Checkbox ${i}: name="${name}", id="${id}", value="${value}"`);
              }
            } else {
              // Select first template checkbox
              await checkboxes.first().check();
              console.log('☑️ Selected first template');
              
              // Try to submit - button is outside form with onClick, not type="submit"
              const submitButton = page.locator('button:has-text("Create Service")').last(); // The actual submit button
              console.log(`📤 Submit button visible: ${await submitButton.isVisible()}`);
              console.log(`📤 Submit button enabled: ${await submitButton.isEnabled()}`);
              
              if (await submitButton.isVisible() && await submitButton.isEnabled()) {
                console.log('📤 Submitting service creation...');
                await submitButton.click();
                
                // Wait for response and log any console messages
                await page.waitForTimeout(8000);
                
                // Check for success message (look for toast or any success text)
                const successSelectors = [
                  'text=success',
                  'text=Success', 
                  'text=created',
                  'text=Created',
                  '.toast',
                  '[role="alert"]'
                ];
                
                let successFound = false;
                for (const selector of successSelectors) {
                  const element = page.locator(selector);
                  if (await element.isVisible()) {
                    const text = await element.textContent();
                    console.log(`✅ Success indicator found: "${text}"`);
                    successFound = true;
                    break;
                  }
                }
                
                if (!successFound) {
                  console.log('❌ No success message found');
                }
                
                // Check if service appears in list
                await page.waitForTimeout(3000);
                const testServiceRow = page.locator('text=Test Service Debug');
                console.log(`📋 Service appears in list: ${await testServiceRow.isVisible()}`);
                
                // Count services after creation
                const serviceRows = page.locator('tbody tr');
                const finalServiceCount = await serviceRows.count();
                console.log(`📊 Final service count: ${finalServiceCount}`);
              }
            }
          }
        } else {
          console.log('❌ Name input not found');
        }
      }
    } else {
      console.log('❌ Services link not found');
      // Take screenshot for debugging
      await page.screenshot({ path: 'debug-no-services-link.png' });
    }
  });
});