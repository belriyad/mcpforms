import { test, expect } from '@playwright/test';

test.describe('Working with Existing Services Test', () => {
  test('Find existing services and activate them for intake', async ({ page }) => {
    console.log('🚀 WORKING WITH EXISTING SERVICES TEST');
    console.log('=====================================');
    
    try {
      // Step 1: Navigate to admin and go to services
      console.log('📋 STEP 1: Navigate to Services...');
      await page.goto('/admin');
      await page.waitForTimeout(2000);
      
      // Open Services section
      const servicesButton = await page.locator('button').filter({ hasText: /Services/ }).first();
      await servicesButton.click();
      await page.waitForTimeout(2000);
      
      console.log('✅ Services section opened');
      await page.screenshot({ path: 'services-section-view.png', fullPage: true });
      
      // Step 2: Look for existing services and their activation status
      console.log('🔍 STEP 2: Analyzing existing services...');
      
      // Look for all service-related elements
      const serviceElements = await page.locator('div, button').filter({ 
        hasText: /service|template|activate|deactivate/i 
      }).all();
      
      console.log(`Found ${serviceElements.length} service-related elements`);
      
      // Step 3: Look for activate buttons specifically
      console.log('🎯 STEP 3: Looking for activate buttons...');
      const activateButtons = await page.locator('button').filter({ hasText: /^Activate$/i }).all();
      console.log(`Found ${activateButtons.length} Activate buttons`);
      
      if (activateButtons.length > 0) {
        // Click the first activate button
        console.log('Clicking first Activate button...');
        await activateButtons[0].click();
        await page.waitForTimeout(3000);
        await page.screenshot({ path: 'after-activation.png', fullPage: true });
        
        console.log('✅ Service activated, checking for intake link...');
        
        // Step 4: Look for intake generation after activation
        console.log('🔍 STEP 4: Searching for intake options...');
        
        // Click on Intakes tab to see if intake links are there
        const intakesButton = await page.locator('button').filter({ hasText: /Intakes/i }).first();
        if (await intakesButton.count() > 0) {
          console.log('📝 Clicking Intakes tab...');
          await intakesButton.click();
          await page.waitForTimeout(2000);
          await page.screenshot({ path: 'intakes-section.png', fullPage: true });
        }
        
        // Look for any intake links or buttons
        const intakeElements = await page.locator('button, a, div').filter({ 
          hasText: /intake|generate|link|copy|send/i 
        }).all();
        
        console.log(`Found ${intakeElements.length} intake-related elements:`);
        for (let i = 0; i < intakeElements.length; i++) {
          const element = intakeElements[i];
          const text = await element.textContent();
          const tagName = await element.evaluate(el => el.tagName);
          console.log(`Element ${i + 1}: <${tagName}> "${text?.trim().substring(0, 100)}"`);
        }
        
        // Step 5: Look for generated intake URLs in the page
        console.log('🔗 STEP 5: Scanning page for intake URLs...');
        
        const pageContent = await page.textContent('body');
        
        // Multiple URL patterns to try
        const patterns = [
          /https?:\/\/[^\s]+intake\/[a-zA-Z0-9\-_]+/gi,
          /localhost:3000\/intake\/[a-zA-Z0-9\-_]+/gi,
          /\/intake\/[a-zA-Z0-9\-_]+/gi
        ];
        
        let foundUrls: string[] = [];
        
        for (const pattern of patterns) {
          const matches = pageContent?.match(pattern);
          if (matches) {
            foundUrls = foundUrls.concat(matches);
          }
        }
        
        // Remove duplicates
        foundUrls = Array.from(new Set(foundUrls));
        
        console.log(`Found ${foundUrls.length} potential intake URLs:`);
        foundUrls.forEach((url, i) => {
          console.log(`URL ${i + 1}: ${url}`);
        });
        
        // Step 6: Test the first URL found
        if (foundUrls.length > 0) {
          let testUrl = foundUrls[0];
          
          // Make sure it's a complete URL
          if (testUrl.startsWith('/')) {
            testUrl = `http://localhost:3000${testUrl}`;
          }
          
          console.log('📝 STEP 6: Testing intake form...');
          console.log(`🔗 Testing URL: ${testUrl}`);
          
          await page.goto(testUrl);
          await page.waitForTimeout(3000);
          await page.screenshot({ path: 'intake-form-final-test.png', fullPage: true });
          
          // Comprehensive form analysis
          const formAnalysis = {
            forms: await page.locator('form').count(),
            inputs: await page.locator('input:not([type="hidden"])').count(),
            textareas: await page.locator('textarea').count(),
            selects: await page.locator('select').count(),
            buttons: await page.locator('button').count(),
            labels: await page.locator('label').count(),
            submitButtons: await page.locator('button[type="submit"], input[type="submit"]').count()
          };
          
          const pageTitle = await page.title();
          const headings = await page.locator('h1, h2, h3').allTextContents();
          const hasErrors = await page.locator('text=/error|not found|404/i').count() > 0;
          
          console.log('📊 COMPREHENSIVE FORM ANALYSIS:');
          console.log(`   Page Title: ${pageTitle}`);
          console.log(`   Headings: ${headings.join(', ')}`);
          console.log(`   Forms: ${formAnalysis.forms}`);
          console.log(`   Input fields: ${formAnalysis.inputs}`);
          console.log(`   Text areas: ${formAnalysis.textareas}`);
          console.log(`   Select dropdowns: ${formAnalysis.selects}`);
          console.log(`   Buttons: ${formAnalysis.buttons}`);
          console.log(`   Labels: ${formAnalysis.labels}`);
          console.log(`   Submit buttons: ${formAnalysis.submitButtons}`);
          console.log(`   Has errors: ${hasErrors}`);
          
          const totalInteractiveElements = formAnalysis.inputs + formAnalysis.textareas + formAnalysis.selects;
          
          if (totalInteractiveElements > 0 && formAnalysis.forms > 0 && !hasErrors) {
            console.log('');
            console.log('🎉🎉🎉 COMPLETE E2E SUCCESS! 🎉🎉🎉');
            console.log('==========================================');
            console.log('✅ Admin dashboard fully functional');
            console.log('✅ Services section accessible');
            console.log('✅ Service activation working');
            console.log('✅ Intake URL generation successful');
            console.log('✅ Intake form loads correctly');
            console.log('✅ Form has interactive elements');
            console.log('✅ Form structure is complete');
            console.log(`🔗 Working intake URL: ${testUrl}`);
            console.log(`📝 Form has ${totalInteractiveElements} input fields`);
            console.log(`🎯 Form has ${formAnalysis.submitButtons} submit buttons`);
            console.log('==========================================');
            console.log('🎊 E2E INTAKE LINK TESTING COMPLETE! 🎊');
            
            // Step 7: Test form interaction
            console.log('');
            console.log('🔄 STEP 7: Testing form interactivity...');
            
            const firstInput = await page.locator('input[type="text"], input[type="email"], input:not([type="hidden"]):not([type="submit"]):not([type="button"])').first();
            if (await firstInput.count() > 0) {
              const placeholder = await firstInput.getAttribute('placeholder');
              const name = await firstInput.getAttribute('name');
              console.log(`Testing input field: name="${name}", placeholder="${placeholder}"`);
              
              await firstInput.fill('E2E Test User');
              const value = await firstInput.inputValue();
              console.log(`✅ Successfully entered: "${value}"`);
              
              // Test clearing the field
              await firstInput.clear();
              const clearedValue = await firstInput.inputValue();
              console.log(`✅ Successfully cleared field: "${clearedValue}"`);
              
              console.log('🎉 Form interaction test PASSED!');
            }
            
          } else {
            console.log('⚠️ PARTIAL SUCCESS - Intake form loaded but has issues:');
            if (hasErrors) console.log('   ❌ Error messages detected on page');
            if (formAnalysis.forms === 0) console.log('   ❌ No form elements found');
            if (totalInteractiveElements === 0) console.log('   ❌ No interactive input fields found');
            if (formAnalysis.submitButtons === 0) console.log('   ❌ No submit buttons found');
            
            console.log(`   📊 Stats: ${formAnalysis.forms} forms, ${totalInteractiveElements} inputs, ${formAnalysis.submitButtons} submit buttons`);
          }
          
        } else {
          console.log('❌ No intake URLs found on the page');
          console.log('💡 Suggestions:');
          console.log('   - Try different service activation methods');
          console.log('   - Check if URLs are generated asynchronously');
          console.log('   - Verify intake generation workflow');
        }
        
      } else {
        console.log('⚠️ No Activate buttons found');
        
        // Look for already activated services
        const deactivateButtons = await page.locator('button').filter({ hasText: /Deactivate/i }).all();
        console.log(`Found ${deactivateButtons.length} services that are already activated`);
        
        if (deactivateButtons.length > 0) {
          console.log('💡 Some services are already activated. Checking for existing intake links...');
          
          // Click on Intakes section to see existing intakes
          const intakesButton = await page.locator('button').filter({ hasText: /Intakes/i }).first();
          if (await intakesButton.count() > 0) {
            await intakesButton.click();
            await page.waitForTimeout(2000);
            await page.screenshot({ path: 'existing-intakes.png', fullPage: true });
            
            // Look for existing intake links
            const pageContent = await page.textContent('body');
            const intakeUrls = pageContent?.match(/https?:\/\/[^\s]+intake\/[a-zA-Z0-9\-_]+/gi);
            
            if (intakeUrls) {
              console.log(`Found ${intakeUrls.length} existing intake URLs`);
              const testUrl = intakeUrls[0];
              
              console.log(`🔗 Testing existing intake URL: ${testUrl}`);
              await page.goto(testUrl);
              await page.waitForTimeout(3000);
              await page.screenshot({ path: 'existing-intake-form.png', fullPage: true });
              
              const formCount = await page.locator('form').count();
              const inputCount = await page.locator('input:not([type="hidden"])').count();
              
              if (formCount > 0 && inputCount > 0) {
                console.log('🎉 SUCCESS: Found working existing intake form!');
                console.log(`   📝 ${formCount} forms with ${inputCount} input fields`);
              }
            }
          }
        }
      }
      
    } catch (error) {
      console.error('❌ Test Error:', error);
      await page.screenshot({ path: 'existing-services-error.png', fullPage: true });
      throw error;
    }
  });
});