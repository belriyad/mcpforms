import { test, expect } from '@playwright/test';

test.describe('Focused Intake Generation Test', () => {
  test('Navigate to Services and generate intake link', async ({ page }) => {
    console.log('🚀 FOCUSED INTAKE GENERATION TEST');
    console.log('==================================');
    
    try {
      // Step 1: Navigate to admin page
      console.log('📋 STEP 1: Navigate to Admin Page');
      await page.goto('/admin');
      await page.waitForTimeout(3000);
      console.log('✅ Admin page loaded');
      
      // Step 2: Click on Services section
      console.log('⚙️ STEP 2: Clicking on Services section...');
      const servicesButton = await page.locator('button').filter({ hasText: /Services/ }).first();
      await servicesButton.click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'services-section.png', fullPage: true });
      console.log('✅ Services section opened');
      
      // Step 3: Look for service creation or intake generation options
      console.log('🔍 STEP 3: Looking for service/intake options...');
      
      // Check for any new buttons or elements that appeared
      const serviceElements = await page.locator('button, a').filter({ 
        hasText: /create|generate|new|add|intake|service/i 
      }).all();
      
      console.log(`Found ${serviceElements.length} service-related elements:`);
      for (let i = 0; i < serviceElements.length; i++) {
        const element = serviceElements[i];
        const text = await element.textContent();
        console.log(`Service Element ${i + 1}: "${text?.trim()}"`);
      }
      
      // Step 4: Try to create a service or find existing services
      if (serviceElements.length > 0) {
        console.log('🎯 STEP 4: Attempting to create/select a service...');
        const firstServiceElement = serviceElements[0];
        const text = await firstServiceElement.textContent();
        console.log(`Clicking: "${text?.trim()}"`);
        
        await firstServiceElement.click();
        await page.waitForTimeout(3000);
        await page.screenshot({ path: 'after-service-action.png', fullPage: true });
        
        // Step 5: Look for intake generation after service action
        console.log('🔗 STEP 5: Looking for intake generation options...');
        
        // Look for intake-related buttons that might have appeared
        const intakeButtons = await page.locator('button, a').filter({ 
          hasText: /intake|generate|link|send|create/i 
        }).all();
        
        console.log(`Found ${intakeButtons.length} intake-related buttons:`);
        for (let i = 0; i < intakeButtons.length; i++) {
          const button = intakeButtons[i];
          const text = await button.textContent();
          console.log(`Intake Button ${i + 1}: "${text?.trim()}"`);
        }
        
        // Try clicking on an intake generation button
        if (intakeButtons.length > 0) {
          const intakeButton = intakeButtons.find(async (btn) => {
            const text = await btn.textContent();
            return text?.toLowerCase().includes('generate') || 
                   text?.toLowerCase().includes('intake') ||
                   text?.toLowerCase().includes('link');
          });
          
          if (intakeButton || intakeButtons.length > 0) {
            const buttonToClick = intakeButton || intakeButtons[0];
            const buttonText = await buttonToClick.textContent();
            console.log(`🎯 Clicking intake button: "${buttonText?.trim()}"`);
            
            await buttonToClick.click();
            await page.waitForTimeout(3000);
            await page.screenshot({ path: 'after-intake-generation.png', fullPage: true });
            
            // Step 6: Check for generated links or modals
            console.log('🔍 STEP 6: Checking for generated intake links...');
            
            // Look for any URLs, modals, or text that contains intake links
            const allText = await page.textContent('body');
            const intakeUrlPattern = /http[s]?:\/\/[^\s]+intake[^\s]*/gi;
            const foundUrls = allText?.match(intakeUrlPattern);
            
            if (foundUrls) {
              console.log(`🎉 Found ${foundUrls.length} intake URLs:`);
              foundUrls.forEach((url, i) => {
                console.log(`URL ${i + 1}: ${url}`);
              });
              
              // Step 7: Test the first intake URL
              const intakeUrl = foundUrls[0];
              console.log(`🔗 STEP 7: Testing intake URL: ${intakeUrl}`);
              
              await page.goto(intakeUrl);
              await page.waitForTimeout(3000);
              await page.screenshot({ path: 'intake-form-final.png', fullPage: true });
              
              // Check if the intake form loads properly
              const formElements = await page.locator('form, input, textarea, select').count();
              const pageTitle = await page.textContent('h1, h2, title');
              
              console.log(`✅ Intake form has ${formElements} form elements`);
              console.log(`Page title/heading: "${pageTitle?.substring(0, 100)}"`);
              
              if (formElements > 0) {
                console.log('🎉 SUCCESS: Intake link generated and form is working!');
              } else {
                console.log('⚠️ Intake page loaded but no form elements found');
              }
            } else {
              // Look for intake links in href attributes
              const linkElements = await page.locator('a[href*="intake"]').all();
              if (linkElements.length > 0) {
                console.log(`Found ${linkElements.length} intake link elements`);
                const firstLink = await linkElements[0].getAttribute('href');
                console.log(`Testing link element: ${firstLink}`);
                
                if (firstLink) {
                  await page.goto(firstLink);
                  await page.waitForTimeout(3000);
                  await page.screenshot({ path: 'intake-form-from-link.png', fullPage: true });
                  
                  const formElements = await page.locator('form, input, textarea, select').count();
                  console.log(`✅ Intake form has ${formElements} form elements`);
                  
                  if (formElements > 0) {
                    console.log('🎉 SUCCESS: Intake link from href attribute works!');
                  }
                }
              } else {
                console.log('⚠️ No intake URLs found in page content or links');
              }
            }
          }
        } else {
          console.log('⚠️ No intake generation buttons found');
        }
      } else {
        console.log('⚠️ No service creation options found');
      }
      
      console.log('✅ Focused intake test completed');
      
    } catch (error) {
      console.error('❌ Test Error:', error);
      await page.screenshot({ path: 'focused-test-error.png', fullPage: true });
      throw error;
    }
  });
});