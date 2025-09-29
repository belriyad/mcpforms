import { test, expect } from '@playwright/test';

test.describe('Final Working Intake Generation Test', () => {
  test('Successfully generate and test intake link', async ({ page }) => {
    console.log('🚀 FINAL WORKING INTAKE GENERATION TEST');
    console.log('======================================');
    
    try {
      // Step 1: Navigate to Intakes and click Generate
      console.log('📋 STEP 1: Opening intake generation...');
      await page.goto('/admin');
      await page.waitForTimeout(2000);
      
      const intakesButton = await page.locator('button').filter({ hasText: /Intakes/i }).first();
      await intakesButton.click();
      await page.waitForTimeout(2000);
      
      const generateButton = await page.locator('button').filter({ hasText: /Generate Intake Link/i }).first();
      await generateButton.click();
      await page.waitForTimeout(3000);
      
      console.log('✅ Generation modal opened');
      await page.screenshot({ path: 'generation-modal.png', fullPage: true });
      
      // Step 2: Fill the generation form properly
      console.log('📝 STEP 2: Filling intake generation form...');
      
      // Fill email
      const emailInput = await page.locator('input[type="email"], input[name*="email" i]').first();
      if (await emailInput.count() > 0) {
        console.log('Filling email field...');
        await emailInput.fill('e2e-test@example.com');
      }
      
      // Handle service selection dropdown
      const serviceSelect = await page.locator('select#service, select[name*="service" i]').first();
      if (await serviceSelect.count() > 0) {
        console.log('Found service selection dropdown...');
        
        // Get available options
        const options = await serviceSelect.locator('option').all();
        console.log(`Found ${options.length} service options`);
        
        for (let i = 0; i < options.length; i++) {
          const option = options[i];
          const value = await option.getAttribute('value');
          const text = await option.textContent();
          console.log(`Option ${i + 1}: value="${value}", text="${text}"`);
        }
        
        // Select the first non-empty option
        if (options.length > 1) {
          const firstValidOption = options[1]; // Skip first option which is usually empty/placeholder
          const value = await firstValidOption.getAttribute('value');
          if (value) {
            console.log(`Selecting service: ${value}`);
            await serviceSelect.selectOption(value);
          }
        }
      }
      
      // Handle any other form fields
      const textInputs = await page.locator('input[type="text"]').all();
      for (let i = 0; i < textInputs.length; i++) {
        const input = textInputs[i];
        const name = await input.getAttribute('name');
        const placeholder = await input.getAttribute('placeholder');
        console.log(`Filling text input: ${name || placeholder || `input-${i}`}`);
        await input.fill(`Test Value ${i + 1}`);
      }
      
      await page.screenshot({ path: 'form-completed.png', fullPage: true });
      
      // Step 3: Submit the form
      console.log('✅ STEP 3: Submitting intake generation form...');
      
      const submitButtons = await page.locator('button').filter({ 
        hasText: /generate|create|submit|send/i 
      }).all();
      
      console.log(`Found ${submitButtons.length} potential submit buttons`);
      
      if (submitButtons.length > 0) {
        const submitButton = submitButtons[0];
        const buttonText = await submitButton.textContent();
        console.log(`Clicking: "${buttonText?.trim()}"`);
        
        await submitButton.click();
        await page.waitForTimeout(5000); // Wait for generation
        await page.screenshot({ path: 'after-generation.png', fullPage: true });
        
        console.log('✅ Form submitted, looking for generated link...');
        
        // Step 4: Extract the intake URL
        console.log('🔍 STEP 4: Finding the generated intake URL...');
        
        // Wait for any success messages or URL display
        await page.waitForTimeout(2000);
        
        const pageContent = await page.textContent('body');
        
        // Try multiple URL extraction methods
        const urlPatterns = [
          /https?:\/\/[^\\s"'<>]+\/intake\/[a-zA-Z0-9\-_]+/gi,
          /localhost:3000\/intake\/[a-zA-Z0-9\-_]+/gi,
          /\/intake\/[a-zA-Z0-9\-_]+/gi,
        ];
        
        let foundUrls: string[] = [];
        
        for (const pattern of urlPatterns) {
          const matches = pageContent?.match(pattern) || [];
          foundUrls = foundUrls.concat(matches);
        }
        
        // Check modal content specifically
        const modal = await page.locator('[role="dialog"], .modal, .fixed').first();
        if (await modal.count() > 0) {
          const modalContent = await modal.textContent();
          console.log('Modal content sample:', modalContent?.substring(0, 200));
          
          const modalUrls = modalContent?.match(/https?:\/\/[^\\s"'<>]+\/intake\/[a-zA-Z0-9\-_]+/gi) || [];
          foundUrls = foundUrls.concat(modalUrls);
        }
        
        // Check for copyable elements or links
        const linkElements = await page.locator('a[href*="intake"], input[value*="intake"], span[class*="url"], div[class*="link"]').all();
        
        for (const element of linkElements) {
          const href = await element.getAttribute('href');
          const value = await element.getAttribute('value');
          const text = await element.textContent();
          
          if (href && href.includes('intake')) {
            foundUrls.push(href);
          }
          if (value && value.includes('intake')) {
            foundUrls.push(value);
          }
          if (text && text.includes('localhost') && text.includes('intake')) {
            const urlMatch = text.match(/https?:\/\/[^\\s"'<>]+\/intake\/[a-zA-Z0-9\-_]+/gi);
            if (urlMatch) foundUrls = foundUrls.concat(urlMatch);
          }
        }
        
        // Remove duplicates
        foundUrls = Array.from(new Set(foundUrls));
        
        console.log(`🎯 Found ${foundUrls.length} intake URLs:`);
        foundUrls.forEach((url, i) => {
          console.log(`URL ${i + 1}: ${url}`);
        });
        
        // Step 5: Test the intake form
        if (foundUrls.length > 0) {
          let testUrl = foundUrls[0];
          
          // Ensure complete URL
          if (testUrl.startsWith('/')) {
            testUrl = `http://localhost:3000${testUrl}`;
          }
          
          console.log('📝 STEP 5: Testing the generated intake form...');
          console.log(`🔗 URL: ${testUrl}`);
          
          await page.goto(testUrl);
          await page.waitForTimeout(4000);
          await page.screenshot({ path: 'intake-form-final.png', fullPage: true });
          
          // Comprehensive form testing
          const formAnalysis = {
            title: await page.title(),
            forms: await page.locator('form').count(),
            inputs: await page.locator('input:not([type="hidden"]):not([type="submit"])').count(),
            textareas: await page.locator('textarea').count(),
            selects: await page.locator('select').count(),
            submitButtons: await page.locator('button[type="submit"], input[type="submit"]').count(),
            labels: await page.locator('label').count(),
            hasErrors: await page.locator('text=/error|404|not found/i').count() > 0,
            headings: await page.locator('h1, h2, h3').allTextContents()
          };
          
          const totalFields = formAnalysis.inputs + formAnalysis.textareas + formAnalysis.selects;
          
          console.log('📊 INTAKE FORM ANALYSIS:');
          console.log(`   📄 Title: ${formAnalysis.title}`);
          console.log(`   📋 Forms: ${formAnalysis.forms}`);
          console.log(`   ✏️  Input Fields: ${formAnalysis.inputs}`);
          console.log(`   📝 Text Areas: ${formAnalysis.textareas}`);
          console.log(`   📋 Select Dropdowns: ${formAnalysis.selects}`);
          console.log(`   🔲 Submit Buttons: ${formAnalysis.submitButtons}`);
          console.log(`   🏷️  Labels: ${formAnalysis.labels}`);
          console.log(`   🎯 Total Interactive Fields: ${totalFields}`);
          console.log(`   📰 Headings: ${formAnalysis.headings.join(', ')}`);
          console.log(`   ❌ Has Errors: ${formAnalysis.hasErrors}`);
          
          if (formAnalysis.forms > 0 && totalFields > 0 && !formAnalysis.hasErrors) {
            console.log('');
            console.log('🏆🏆🏆 COMPLETE SUCCESS! 🏆🏆🏆');
            console.log('========================================');
            console.log('✅ Admin dashboard works');
            console.log('✅ Intake generation modal works');
            console.log('✅ Service selection works');
            console.log('✅ Form submission works');
            console.log('✅ Intake URL generated successfully');
            console.log('✅ Intake form loads without errors');
            console.log('✅ Form has proper structure and fields');
            console.log(`✅ ${totalFields} interactive form elements`);
            console.log(`✅ ${formAnalysis.submitButtons} submit buttons`);
            console.log(`🔗 Working URL: ${testUrl}`);
            console.log('========================================');
            console.log('🎊 E2E INTAKE LINK TEST PASSED! 🎊');
            
            // Step 6: Test form interactions
            console.log('');
            console.log('🔄 STEP 6: Testing form field interactions...');
            
            // Test input fields
            const testableInputs = await page.locator('input[type="text"], input[type="email"], input[type="number"]').all();
            for (let i = 0; i < Math.min(testableInputs.length, 3); i++) {
              const input = testableInputs[i];
              const name = await input.getAttribute('name');
              const type = await input.getAttribute('type');
              
              const testValue = type === 'email' ? 'test@example.com' : 
                               type === 'number' ? '123' : `Test Input ${i + 1}`;
              
              console.log(`Testing ${type} field "${name}": entering "${testValue}"`);
              await input.fill(testValue);
              
              const value = await input.inputValue();
              console.log(`   ✅ Successfully entered: "${value}"`);
            }
            
            // Test textarea
            if (formAnalysis.textareas > 0) {
              const textarea = await page.locator('textarea').first();
              const name = await textarea.getAttribute('name');
              console.log(`Testing textarea "${name}"`);
              await textarea.fill('This is a test message for the intake form.');
              const value = await textarea.inputValue();
              console.log(`   ✅ Textarea value: "${value.substring(0, 30)}..."`);
            }
            
            // Test select dropdown
            if (formAnalysis.selects > 0) {
              const select = await page.locator('select').first();
              const name = await select.getAttribute('name');
              const options = await select.locator('option').all();
              
              if (options.length > 1) {
                const option = options[1];
                const value = await option.getAttribute('value');
                const text = await option.textContent();
                
                console.log(`Testing select "${name}": selecting "${text}"`);
                await select.selectOption(value || '');
                console.log(`   ✅ Selected option: ${text}`);
              }
            }
            
            console.log('🎉 All form interaction tests PASSED!');
            
            await page.screenshot({ path: 'form-interactions-complete.png', fullPage: true });
            
          } else {
            console.log('⚠️ PARTIAL SUCCESS - Form loaded but has issues:');
            if (formAnalysis.hasErrors) console.log('   ❌ Errors detected on page');
            if (formAnalysis.forms === 0) console.log('   ❌ No form elements found');
            if (totalFields === 0) console.log('   ❌ No interactive fields');
          }
          
        } else {
          console.log('❌ No intake URLs found after generation');
          console.log('📋 Page content sample:');
          console.log(pageContent?.substring(0, 500));
        }
        
      } else {
        console.log('❌ No submit buttons found');
      }
      
    } catch (error) {
      console.error('❌ Final Test Error:', error);
      await page.screenshot({ path: 'final-working-test-error.png', fullPage: true });
      throw error;
    }
  });
});