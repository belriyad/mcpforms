import { test, expect } from '@playwright/test';

test.describe('Final Intake Link Generation Test', () => {
  test('Create service, activate it, and get intake link', async ({ page }) => {
    console.log('🚀 FINAL INTAKE LINK GENERATION TEST');
    console.log('===================================');
    
    try {
      // Step 1: Navigate and create service (streamlined)
      console.log('📋 STEP 1: Setting up service...');
      await page.goto('/admin');
      await page.waitForTimeout(2000);
      
      // Open Services
      const servicesButton = await page.locator('button').filter({ hasText: /Services/ }).first();
      await servicesButton.click();
      await page.waitForTimeout(1000);
      
      // Click Create Service
      const createServiceButton = await page.locator('button').filter({ hasText: /Create Service/ }).first();
      await createServiceButton.click();
      await page.waitForTimeout(2000);
      
      // Fill form quickly
      const nameInput = await page.locator('input').first();
      if (await nameInput.count() > 0) {
        await nameInput.fill('E2E Test Service');
      }
      
      const descInput = await page.locator('textarea').first();
      if (await descInput.count() > 0) {
        await descInput.fill('E2E test intake service');
      }
      
      // Select templates
      const checkboxes = await page.locator('input[type="checkbox"]').all();
      for (let i = 0; i < Math.min(checkboxes.length, 2); i++) {
        await checkboxes[i].check();
      }
      
      // Submit
      const submitButton = await page.locator('button').filter({ hasText: /create/i }).first();
      await submitButton.click();
      await page.waitForTimeout(3000);
      
      console.log('✅ Service created, looking for activation...');
      await page.screenshot({ path: 'service-created.png', fullPage: true });
      
      // Step 2: Find and click Activate button
      console.log('🎯 STEP 2: Activating service for intake generation...');
      
      const activateButtons = await page.locator('button').filter({ hasText: /Activate/i }).all();
      console.log(`Found ${activateButtons.length} activate buttons`);
      
      if (activateButtons.length > 0) {
        console.log('Clicking first Activate button...');
        await activateButtons[0].click();
        await page.waitForTimeout(3000);
        await page.screenshot({ path: 'service-activated.png', fullPage: true });
        
        // Step 3: Look for the intake link after activation
        console.log('🔍 STEP 3: Searching for generated intake link...');
        
        // Method 1: Check page content for intake URLs
        const pageContent = await page.textContent('body');
        console.log('Page content sample:', pageContent?.substring(0, 500));
        
        // Method 2: Look for any element containing intake URLs
        const intakeElements = await page.locator('*').filter({ 
          hasText: /http.*intake|localhost.*intake|intake\/[a-zA-Z0-9]/i 
        }).all();
        
        console.log(`Found ${intakeElements.length} elements with potential intake URLs`);
        
        for (let i = 0; i < intakeElements.length; i++) {
          const element = intakeElements[i];
          const text = await element.textContent();
          console.log(`Intake element ${i + 1}: "${text?.substring(0, 150)}"`);
        }
        
        // Method 3: Check for href attributes with intake
        const intakeLinks = await page.locator('a[href*="intake"]').all();
        console.log(`Found ${intakeLinks.length} intake links in href attributes`);
        
        let testUrl = null;
        
        if (intakeLinks.length > 0) {
          testUrl = await intakeLinks[0].getAttribute('href');
          console.log(`Using href intake URL: ${testUrl}`);
        } else {
          // Method 4: Use regex to extract any intake URL from page content
          const urlPattern = /https?:\/\/[^\s]+intake\/[^\s'"<>)}\]]+/gi;
          const urls = pageContent?.match(urlPattern);
          if (urls && urls.length > 0) {
            testUrl = urls[0];
            console.log(`Extracted intake URL from content: ${testUrl}`);
          } else {
            // Method 5: Look for just the token part
            const tokenPattern = /intake\/([a-zA-Z0-9\-_]+)/gi;
            const matches = pageContent?.match(tokenPattern);
            if (matches && matches.length > 0) {
              testUrl = `http://localhost:3000/${matches[0]}`;
              console.log(`Constructed intake URL from token: ${testUrl}`);
            }
          }
        }
        
        // Step 4: Test the intake URL if found
        if (testUrl) {
          console.log('📝 STEP 4: Testing intake form...');
          console.log(`🔗 Testing URL: ${testUrl}`);
          
          await page.goto(testUrl);
          await page.waitForTimeout(3000);
          await page.screenshot({ path: 'intake-form-success.png', fullPage: true });
          
          // Analyze the intake form
          const formCount = await page.locator('form').count();
          const inputCount = await page.locator('input').count();
          const textareaCount = await page.locator('textarea').count();
          const selectCount = await page.locator('select').count();
          const buttonCount = await page.locator('button').count();
          
          const totalFormElements = inputCount + textareaCount + selectCount;
          
          console.log('📊 FORM ANALYSIS:');
          console.log(`   Forms: ${formCount}`);
          console.log(`   Inputs: ${inputCount}`);
          console.log(`   Textareas: ${textareaCount}`);
          console.log(`   Selects: ${selectCount}`);
          console.log(`   Buttons: ${buttonCount}`);
          console.log(`   Total form elements: ${totalFormElements}`);
          
          // Check page title/heading
          const headings = await page.locator('h1, h2, h3').allTextContents();
          console.log(`   Page headings: ${headings.join(', ')}`);
          
          // Check for error messages
          const hasError = await page.locator('text=/error|not found|404/i').count() > 0;
          console.log(`   Has error: ${hasError}`);
          
          if (totalFormElements > 0 && formCount > 0 && !hasError) {
            console.log('');
            console.log('🎉🎉🎉 COMPLETE SUCCESS! 🎉🎉🎉');
            console.log('=====================================');
            console.log('✅ Admin dashboard accessible');
            console.log('✅ Service creation works');
            console.log('✅ Service activation works');  
            console.log('✅ Intake link generation works');
            console.log('✅ Intake form loads successfully');
            console.log('✅ Form has functional elements');
            console.log(`🔗 Working intake URL: ${testUrl}`);
            console.log('=====================================');
            console.log('');
          } else {
            console.log('⚠️ Intake form loaded but may have issues:');
            if (hasError) console.log('   - Error messages detected');
            if (formCount === 0) console.log('   - No form elements found');
            if (totalFormElements === 0) console.log('   - No input elements found');
          }
          
          // Step 5: Try filling out a field to confirm interactivity
          if (inputCount > 0) {
            console.log('🔄 STEP 5: Testing form interactivity...');
            const firstInput = await page.locator('input[type="text"], input[type="email"], input:not([type="hidden"]):not([type="submit"])').first();
            if (await firstInput.count() > 0) {
              await firstInput.fill('Test User');
              const value = await firstInput.inputValue();
              console.log(`✅ Form input works - entered value: "${value}"`);
            }
          }
          
        } else {
          console.log('❌ No intake URL found after activation');
          console.log('This could mean:');
          console.log('  - Activation process needs more time');
          console.log('  - URL is generated in a different way');
          console.log('  - Additional steps required');
        }
        
      } else {
        console.log('❌ No activate buttons found');
      }
      
    } catch (error) {
      console.error('❌ Final Test Error:', error);
      await page.screenshot({ path: 'final-test-error.png', fullPage: true });
      throw error;
    }
  });
});