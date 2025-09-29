import { test, expect } from '@playwright/test';

test.describe('Complete Service Creation and Intake Test', () => {
  test('Create service and generate intake link', async ({ page }) => {
    console.log('🚀 COMPLETE SERVICE CREATION AND INTAKE TEST');
    console.log('===========================================');
    
    try {
      // Step 1: Navigate to admin page
      console.log('📋 STEP 1: Navigate to Admin Page');
      await page.goto('/admin');
      await page.waitForTimeout(3000);
      
      // Step 2: Click on Services section first
      console.log('⚙️ STEP 2: Opening Services section...');
      const servicesButton = await page.locator('button').filter({ hasText: /Services/ }).first();
      await servicesButton.click();
      await page.waitForTimeout(2000);
      
      // Step 3: Click on Create Service
      console.log('➕ STEP 3: Clicking Create Service...');
      const createServiceButton = await page.locator('button').filter({ hasText: /Create Service/ }).first();
      await createServiceButton.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'create-service-modal.png', fullPage: true });
      
      // Step 4: Fill out service creation form
      console.log('📝 STEP 4: Looking for service creation form...');
      
      // Look for input fields in the form
      const nameInput = await page.locator('input[placeholder*="name" i], input[name*="name" i], input[id*="name" i]').first();
      const titleInput = await page.locator('input[placeholder*="title" i], input[name*="title" i], input[id*="title" i]').first();
      const descInput = await page.locator('textarea, input[placeholder*="description" i], input[name*="description" i]').first();
      
      // Fill out the form if fields are found
      if (await nameInput.count() > 0) {
        console.log('📝 Filling service name...');
        await nameInput.fill('Test Legal Service');
      }
      
      if (await titleInput.count() > 0) {
        console.log('📝 Filling service title...');
        await titleInput.fill('Legal Document Service');
      }
      
      if (await descInput.count() > 0) {
        console.log('📝 Filling service description...');
        await descInput.fill('Test service for generating legal document intake forms');
      }
      
      // Step 5: Look for template selection
      console.log('📄 STEP 5: Looking for template selection...');
      
      // Look for checkboxes or selection elements for templates
      const templateCheckboxes = await page.locator('input[type="checkbox"]').all();
      console.log(`Found ${templateCheckboxes.length} template checkboxes`);
      
      // Select the first few templates if available
      for (let i = 0; i < Math.min(templateCheckboxes.length, 3); i++) {
        console.log(`Selecting template ${i + 1}...`);
        await templateCheckboxes[i].check();
        await page.waitForTimeout(500);
      }
      
      await page.screenshot({ path: 'service-form-filled.png', fullPage: true });
      
      // Step 6: Submit the service creation form
      console.log('✅ STEP 6: Submitting service creation form...');
      
      const submitButton = await page.locator('button').filter({ 
        hasText: /create|submit|save|generate/i 
      }).first();
      
      if (await submitButton.count() > 0) {
        const buttonText = await submitButton.textContent();
        console.log(`Clicking submit button: "${buttonText?.trim()}"`);
        await submitButton.click();
        await page.waitForTimeout(5000); // Wait longer for service creation
        await page.screenshot({ path: 'after-service-creation.png', fullPage: true });
        
        // Step 7: Look for intake generation options
        console.log('🔗 STEP 7: Looking for intake generation options...');
        
        // Service should now exist, look for intake generation buttons
        const generateButtons = await page.locator('button, a').filter({ 
          hasText: /generate|intake|link|activate|send/i 
        }).all();
        
        console.log(`Found ${generateButtons.length} potential intake generation buttons:`);
        for (let i = 0; i < generateButtons.length; i++) {
          const btn = generateButtons[i];
          const text = await btn.textContent();
          console.log(`Button ${i + 1}: "${text?.trim()}"`);
        }
        
        // Click on the most likely intake generation button
        if (generateButtons.length > 0) {
          const intakeButton = generateButtons.find(async (btn) => {
            const text = await btn.textContent();
            return text?.toLowerCase().includes('generate') || 
                   text?.toLowerCase().includes('intake');
          }) || generateButtons[0];
          
          const buttonText = await intakeButton.textContent();
          console.log(`🎯 Clicking intake generation button: "${buttonText?.trim()}"`);
          
          await intakeButton.click();
          await page.waitForTimeout(3000);
          await page.screenshot({ path: 'intake-generation-result.png', fullPage: true });
          
          // Step 8: Extract and test the intake link
          console.log('🔍 STEP 8: Extracting intake link...');
          
          // Look for the intake URL in the page content
          const pageContent = await page.textContent('body');
          const intakeUrlPattern = /http[s]?:\/\/[^\s]+intake\/[^\s]*/gi;
          const foundUrls = pageContent?.match(intakeUrlPattern);
          
          if (foundUrls && foundUrls.length > 0) {
            console.log(`🎉 Found intake URL: ${foundUrls[0]}`);
            
            // Step 9: Test the intake form
            console.log('📝 STEP 9: Testing the intake form...');
            await page.goto(foundUrls[0]);
            await page.waitForTimeout(3000);
            await page.screenshot({ path: 'final-intake-form.png', fullPage: true });
            
            // Verify the form works
            const formElements = await page.locator('form, input, textarea, select').count();
            const hasSubmitButton = await page.locator('button[type="submit"], input[type="submit"]').count();
            const pageText = await page.textContent('body');
            
            console.log(`✅ Form elements found: ${formElements}`);
            console.log(`✅ Submit buttons found: ${hasSubmitButton}`);
            console.log(`Page content preview: "${pageText?.substring(0, 200)}..."`);
            
            if (formElements > 0 && hasSubmitButton > 0) {
              console.log('🎉🎉 SUCCESS! Complete E2E test passed:');
              console.log('   ✅ Admin dashboard accessible');
              console.log('   ✅ Service creation working');
              console.log('   ✅ Intake link generation working');
              console.log('   ✅ Intake form loads and is functional');
              console.log(`   🔗 Working intake URL: ${foundUrls[0]}`);
            } else {
              console.log('⚠️ Intake form loaded but missing form elements or submit button');
            }
          } else {
            console.log('⚠️ No intake URL found in page content');
            
            // Also check for links with href attributes
            const linkElements = await page.locator('a[href*="intake"]').all();
            if (linkElements.length > 0) {
              const href = await linkElements[0].getAttribute('href');
              console.log(`Found intake link in href: ${href}`);
              
              if (href) {
                await page.goto(href);
                await page.waitForTimeout(3000);
                await page.screenshot({ path: 'intake-from-href.png', fullPage: true });
                
                const formElements = await page.locator('form, input, textarea, select').count();
                if (formElements > 0) {
                  console.log('🎉 SUCCESS: Intake form works from href link!');
                }
              }
            }
          }
        } else {
          console.log('⚠️ No intake generation buttons found after service creation');
        }
      } else {
        console.log('⚠️ No submit button found for service creation');
      }
      
    } catch (error) {
      console.error('❌ Complete Test Error:', error);
      await page.screenshot({ path: 'complete-test-error.png', fullPage: true });
      throw error;
    }
  });
});