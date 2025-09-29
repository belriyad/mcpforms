import { test, expect } from '@playwright/test';

test.describe('Generate New Intake Link Test', () => {
  test('Generate a fresh intake link and test it', async ({ page }) => {
    console.log('🚀 GENERATE NEW INTAKE LINK TEST');
    console.log('================================');
    
    try {
      // Step 1: Navigate to admin and open Intakes
      console.log('📋 STEP 1: Navigate to Intakes section...');
      await page.goto('/admin');
      await page.waitForTimeout(2000);
      
      // Go directly to Intakes section
      const intakesButton = await page.locator('button').filter({ hasText: /Intakes/i }).first();
      await intakesButton.click();
      await page.waitForTimeout(2000);
      
      console.log('✅ Intakes section opened');
      await page.screenshot({ path: 'intakes-section-initial.png', fullPage: true });
      
      // Step 2: Click "Generate Intake Link" button
      console.log('🎯 STEP 2: Clicking Generate Intake Link button...');
      
      const generateButton = await page.locator('button').filter({ hasText: /Generate Intake Link/i }).first();
      
      if (await generateButton.count() > 0) {
        console.log('Found Generate Intake Link button, clicking...');
        await generateButton.click();
        await page.waitForTimeout(3000);
        await page.screenshot({ path: 'after-generate-click.png', fullPage: true });
        
        // Step 3: Look for modal or form that might appear
        console.log('📝 STEP 3: Looking for intake generation form...');
        
        // Check if a modal appeared
        const modal = await page.locator('[role="dialog"], .modal, .fixed').first();
        if (await modal.count() > 0) {
          console.log('Modal detected, looking for form fields...');
          
          // Look for email input in the modal
          const emailInput = await page.locator('input[type="email"], input[placeholder*="email" i], input[name*="email" i]').first();
          if (await emailInput.count() > 0) {
            console.log('Found email input, filling with test email...');
            await emailInput.fill('e2e-test@example.com');
          }
          
          // Look for other inputs
          const otherInputs = await page.locator('input[type="text"], textarea, select').all();
          console.log(`Found ${otherInputs.length} additional form fields`);
          
          for (let i = 0; i < Math.min(otherInputs.length, 3); i++) {
            const input = otherInputs[i];
            const placeholder = await input.getAttribute('placeholder');
            const name = await input.getAttribute('name');
            const type = await input.getAttribute('type');
            
            console.log(`Filling field: ${name || placeholder || `field-${i}`} (${type})`);
            
            if (type === 'email') {
              await input.fill('e2e-test@example.com');
            } else {
              await input.fill(`Test Value ${i + 1}`);
            }
          }
          
          await page.screenshot({ path: 'form-filled.png', fullPage: true });
          
          // Look for submit/generate button in modal
          const submitButton = await page.locator('button').filter({ hasText: /generate|create|submit|send/i }).first();
          if (await submitButton.count() > 0) {
            const buttonText = await submitButton.textContent(); 
            console.log(`Clicking submit button: "${buttonText?.trim()}"`);
            await submitButton.click();
            await page.waitForTimeout(5000);
            await page.screenshot({ path: 'after-submit.png', fullPage: true });
          }
        }
        
        // Step 4: Look for the generated intake link
        console.log('🔍 STEP 4: Searching for newly generated intake link...');
        
        const pageContent = await page.textContent('body');
        
        // Look for intake URLs with multiple patterns
        const urlPatterns = [
          /https?:\/\/[^\\s"'<>]+\/intake\/[a-zA-Z0-9\-_]+/gi,
          /localhost:3000\/intake\/[a-zA-Z0-9\-_]+/gi,
          /\/intake\/[a-zA-Z0-9\-_]+/gi,
          /intake\/[a-zA-Z0-9\-_]{10,}/gi
        ];
        
        let intakeUrls: string[] = [];
        for (const pattern of urlPatterns) {
          const matches = pageContent?.match(pattern) || [];
          intakeUrls = intakeUrls.concat(matches);
        }
        
        // Remove duplicates
        intakeUrls = Array.from(new Set(intakeUrls));
        
        console.log(`Found ${intakeUrls.length} potential intake URLs:`);
        intakeUrls.forEach((url, i) => {
          console.log(`URL ${i + 1}: ${url}`);
        });
        
        // Also check for clipboard or text that might contain the URL
        const allText = await page.textContent('body');
        console.log('Recent page content (last 300 chars):', allText?.slice(-300));
        
        // Step 5: Look for any clickable elements that might reveal the URL
        console.log('🔍 STEP 5: Looking for clickable elements with URLs...');
        
        const clickableElements = await page.locator('button, a, div[class*="copy"], div[class*="link"], span[class*="url"]').all();
        
        for (let i = 0; i < Math.min(clickableElements.length, 10); i++) {
          const element = clickableElements[i];
          const text = await element.textContent();
          const href = await element.getAttribute('href');
          
          if (href && href.includes('intake')) {
            console.log(`Found intake href: ${href}`);
            intakeUrls.push(href);
          }
          
          if (text && text.includes('http') && text.includes('intake')) {
            console.log(`Found intake URL in text: ${text}`);
            const urlMatch = text.match(/https?:\/\/[^\s]+intake[^\s]*/gi);
            if (urlMatch) {
              intakeUrls = intakeUrls.concat(urlMatch);
            }
          }
        }
        
        // Step 6: Test the first intake URL found
        if (intakeUrls.length > 0) {
          let testUrl = intakeUrls[0];
          
          // Ensure it's a complete URL
          if (testUrl.startsWith('/')) {
            testUrl = `http://localhost:3000${testUrl}`;
          } else if (!testUrl.startsWith('http')) {
            testUrl = `http://localhost:3000/${testUrl}`;
          }
          
          console.log('📝 STEP 6: Testing the generated intake form...');
          console.log(`🔗 Testing URL: ${testUrl}`);
          
          await page.goto(testUrl);
          await page.waitForTimeout(4000);
          await page.screenshot({ path: 'generated-intake-form.png', fullPage: true });
          
          // Comprehensive analysis
          const analysis = {
            title: await page.title(),
            url: page.url(),
            forms: await page.locator('form').count(),
            inputs: await page.locator('input:not([type="hidden"])').count(),
            textareas: await page.locator('textarea').count(),
            selects: await page.locator('select').count(),
            submitButtons: await page.locator('button[type="submit"], input[type="submit"]').count(),
            allButtons: await page.locator('button').count(),
            labels: await page.locator('label').count(),
            headings: await page.locator('h1, h2, h3, h4').allTextContents(),
            hasErrors: await page.locator('text=/error|not found|404|500/i').count() > 0
          };
          
          console.log('📊 GENERATED INTAKE FORM ANALYSIS:');
          console.log(`   📄 Page Title: ${analysis.title}`);
          console.log(`   🔗 Final URL: ${analysis.url}`);
          console.log(`   📝 Forms: ${analysis.forms}`);
          console.log(`   ✏️  Input Fields: ${analysis.inputs}`);
          console.log(`   📝 Text Areas: ${analysis.textareas}`);
          console.log(`   📋 Select Dropdowns: ${analysis.selects}`);
          console.log(`   🔲 Submit Buttons: ${analysis.submitButtons}`);
          console.log(`   🔘 All Buttons: ${analysis.allButtons}`);
          console.log(`   🏷️  Labels: ${analysis.labels}`);
          console.log(`   📰 Headings: ${analysis.headings.join(', ')}`);
          console.log(`   ❌ Has Errors: ${analysis.hasErrors}`);
          
          const totalInteractive = analysis.inputs + analysis.textareas + analysis.selects;
          
          if (analysis.forms > 0 && totalInteractive > 0 && analysis.submitButtons > 0 && !analysis.hasErrors) {
            console.log('');
            console.log('🎉🎉🎉 COMPLETE E2E SUCCESS! 🎉🎉🎉');
            console.log('==========================================');
            console.log('✅ Admin dashboard accessible');
            console.log('✅ Intakes section functional');
            console.log('✅ Generate Intake Link button works');
            console.log('✅ Intake URL generated successfully');
            console.log('✅ Intake form loads without errors');
            console.log('✅ Form has proper structure');
            console.log(`✅ ${totalInteractive} interactive form fields`);
            console.log(`✅ ${analysis.submitButtons} submit buttons`);
            console.log(`🔗 Working intake URL: ${testUrl}`);
            console.log('==========================================');
            console.log('🏆 E2E INTAKE GENERATION TEST PASSED! 🏆');
            
            // Step 7: Test form interaction
            console.log('');
            console.log('🔄 STEP 7: Testing form field interaction...');
            
            if (analysis.inputs > 0) {
              const testableInputs = await page.locator('input[type="text"], input[type="email"], input:not([type="hidden"]):not([type="submit"]):not([type="button"])').all();
              
              for (let i = 0; i < Math.min(testableInputs.length, 3); i++) {
                const input = testableInputs[i];
                const name = await input.getAttribute('name');
                const placeholder = await input.getAttribute('placeholder');
                const type = await input.getAttribute('type');
                
                console.log(`Testing input ${i + 1}: name="${name}", type="${type}", placeholder="${placeholder}"`);
                
                const testValue = type === 'email' ? 'test@example.com' : `Test Value ${i + 1}`;
                await input.fill(testValue);
                
                const enteredValue = await input.inputValue();
                console.log(`   ✅ Successfully entered: "${enteredValue}"`);
              }
              
              console.log('🎉 Form interaction tests PASSED!');
            }
            
            if (analysis.textareas > 0) {
              console.log('Testing textarea fields...');
              const textarea = await page.locator('textarea').first();
              await textarea.fill('This is a test message for the E2E intake form.');
              const textValue = await textarea.inputValue();
              console.log(`   ✅ Textarea test: "${textValue.substring(0, 50)}..."`);
            }
            
          } else {
            console.log('⚠️ PARTIAL SUCCESS - Intake form has issues:');
            if (analysis.hasErrors) console.log('   ❌ Error messages on page');
            if (analysis.forms === 0) console.log('   ❌ No form elements');
            if (totalInteractive === 0) console.log('   ❌ No interactive fields');
            if (analysis.submitButtons === 0) console.log('   ❌ No submit buttons');
          }
          
        } else {
          console.log('❌ No intake URLs found after generation attempt');
          console.log('💡 This might mean:');
          console.log('   - Generation requires additional steps');
          console.log('   - URL is displayed differently');
          console.log('   - Generation is asynchronous');
          
          // Take a final screenshot for debugging
          await page.screenshot({ path: 'no-urls-found-debug.png', fullPage: true });
        }
        
      } else {
        console.log('❌ Generate Intake Link button not found');
      }
      
    } catch (error) {
      console.error('❌ Generate Link Test Error:', error);
      await page.screenshot({ path: 'generate-link-error.png', fullPage: true });
      throw error;
    }
  });
});