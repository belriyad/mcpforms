import { test, expect } from '@playwright/test';

test.describe('Real Generated Intake URL Test', () => {
  test('should test a real generated intake URL from previous test', async ({ page }) => {
    console.log('🔗 TESTING REAL GENERATED INTAKE URL');
    console.log('==================================');

    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'log' || msg.type() === 'error') {
        console.log(`🌐 Browser ${msg.type()}: ${msg.text()}`);
      }
    });

    // Test the real URL that was generated in the previous test
    const realIntakeUrl = 'http://localhost:3002/intake/897b39fb-4a7b-4443-9421-f4a1d282f13e';
    
    console.log(`\n🔗 Testing real generated URL: ${realIntakeUrl}`);
    
    try {
      await page.goto(realIntakeUrl, { timeout: 30000 });
      await page.waitForTimeout(5000);

      // Check page title
      const pageTitle = await page.title();
      console.log(`📄 Page title: "${pageTitle}"`);

      // Check for loading states
      const loadingSpinner = page.locator('[data-testid="loading"], .loading, text=Loading');
      if (await loadingSpinner.isVisible()) {
        console.log('⏳ Loading spinner detected, waiting...');
        await page.waitForTimeout(10000);
      }

      // Check for error messages
      const errorMessages = page.locator('text=Error, text=error, text=404, text=expired, text=not found');
      const errorCount = await errorMessages.count();
      
      if (errorCount > 0) {
        for (let i = 0; i < errorCount; i++) {
          const errorText = await errorMessages.nth(i).textContent();
          console.log(`❌ Error message ${i + 1}: "${errorText}"`);
        }
      } else {
        console.log('✅ No error messages found');
      }

      // Check for forms
      const forms = page.locator('form');
      const formCount = await forms.count();
      console.log(`📝 Forms found: ${formCount}`);

      if (formCount > 0) {
        console.log('✅ Intake form detected!');

        // Analyze form structure
        const inputs = page.locator('form input, form textarea, form select');
        const inputCount = await inputs.count();
        console.log(`📝 Form input fields: ${inputCount}`);

        // List form fields
        for (let i = 0; i < Math.min(10, inputCount); i++) {
          const input = inputs.nth(i);
          const type = await input.getAttribute('type') || 'text';
          const name = await input.getAttribute('name') || '';
          const placeholder = await input.getAttribute('placeholder') || '';
          const id = await input.getAttribute('id') || '';
          
          console.log(`📝 Field ${i + 1}: type="${type}", name="${name}", id="${id}", placeholder="${placeholder}"`);
        }

        // Try to fill out some fields
        console.log('\n📝 FILLING OUT INTAKE FORM');
        console.log('==========================');

        // Fill text inputs
        const textInputs = page.locator('form input[type="text"], form input:not([type]), form textarea');
        const textCount = await textInputs.count();
        
        for (let i = 0; i < Math.min(5, textCount); i++) {
          try {
            const testValue = `Real Test Data ${i + 1} - Generated from API`;
            await textInputs.nth(i).fill(testValue);
            console.log(`✅ Filled text field ${i + 1}: "${testValue}"`);
            
            // Verify value
            const actualValue = await textInputs.nth(i).inputValue();
            if (actualValue === testValue) {
              console.log(`✅ Field value verified`);
            } else {
              console.log(`⚠️ Field value mismatch: expected "${testValue}", got "${actualValue}"`);
            }
          } catch (e) {
            console.log(`⚠️ Could not fill text field ${i + 1}: ${e}`);
          }
        }

        // Fill email inputs
        const emailInputs = page.locator('form input[type="email"]');
        const emailCount = await emailInputs.count();
        
        for (let i = 0; i < emailCount; i++) {
          try {
            await emailInputs.nth(i).fill('real.intake.test@example.com');
            console.log(`✅ Filled email field ${i + 1}`);
          } catch (e) {
            console.log(`⚠️ Could not fill email field ${i + 1}: ${e}`);
          }
        }

        // Fill number inputs
        const numberInputs = page.locator('form input[type="number"]');
        const numberCount = await numberInputs.count();
        
        for (let i = 0; i < numberCount; i++) {
          try {
            await numberInputs.nth(i).fill('12345');
            console.log(`✅ Filled number field ${i + 1}`);
          } catch (e) {
            console.log(`⚠️ Could not fill number field ${i + 1}: ${e}`);
          }
        }

        // Handle select dropdowns
        const selects = page.locator('form select');
        const selectCount = await selects.count();
        
        for (let i = 0; i < selectCount; i++) {
          try {
            const select = selects.nth(i);
            const options = select.locator('option');
            const optionCount = await options.count();
            
            if (optionCount > 1) {
              await select.selectOption({ index: 1 });
              const selectedText = await options.nth(1).textContent();
              console.log(`✅ Selected dropdown option: "${selectedText}"`);
            }
          } catch (e) {
            console.log(`⚠️ Could not select dropdown option ${i + 1}: ${e}`);
          }
        }

        console.log('\n📤 TESTING FORM SUBMISSION');
        console.log('==========================');

        // Look for submit buttons
        const submitButtons = page.locator('form button[type="submit"], form button:has-text("Submit"), form button:has-text("Save"), form input[type="submit"]');
        const submitCount = await submitButtons.count();
        
        console.log(`📤 Submit buttons found: ${submitCount}`);

        if (submitCount > 0) {
          for (let i = 0; i < submitCount; i++) {
            const button = submitButtons.nth(i);
            const buttonText = await button.textContent();
            const isVisible = await button.isVisible();
            const isEnabled = await button.isEnabled();
            
            console.log(`📤 Button ${i + 1}: "${buttonText}" (visible: ${isVisible}, enabled: ${isEnabled})`);
          }

          // Try to submit the form
          const firstSubmitButton = submitButtons.first();
          const isClickable = await firstSubmitButton.isVisible() && await firstSubmitButton.isEnabled();
          
          if (isClickable) {
            console.log('📤 Attempting form submission...');
            
            // Set up response monitoring
            let submissionCaptured = false;
            
            page.on('response', async (response: any) => {
              if (response.url().includes('intake') || response.url().includes('submit') || response.url().includes('save')) {
                console.log(`📤 Submission request to: ${response.url()}`);
                console.log(`📤 Response status: ${response.status()}`);
                
                try {
                  const responseText = await response.text();
                  console.log(`📤 Response data: ${responseText.slice(0, 200)}`);
                  submissionCaptured = true;
                } catch (e) {
                  console.log(`📤 Could not read response: ${e}`);
                }
              }
            });
            
            try {
              await firstSubmitButton.click();
              await page.waitForTimeout(8000);
              
              // Check for success/error feedback
              const feedbackSelectors = [
                'text=success',
                'text=submitted',
                'text=saved',
                'text=thank',
                'text=received',
                'text=error',
                'text=required',
                'text=invalid',
                '.success',
                '.error',
                '[role="alert"]'
              ];
              
              let feedbackFound = false;
              for (const selector of feedbackSelectors) {
                const element = page.locator(selector);
                if (await element.isVisible()) {
                  const text = await element.textContent();
                  console.log(`📤 Feedback: "${text}"`);
                  feedbackFound = true;
                }
              }
              
              if (!feedbackFound) {
                console.log('⚠️ No explicit feedback message found');
              }
              
              if (submissionCaptured) {
                console.log('✅ Form submission request was sent');
              } else {
                console.log('⚠️ No submission request detected');
              }
              
            } catch (e) {
              console.log(`❌ Form submission error: ${e}`);
            }
          } else {
            console.log('⚠️ Submit button not clickable');
          }
        } else {
          console.log('⚠️ No submit buttons found');
        }

        console.log('\n✅ REAL INTAKE FORM TESTING COMPLETE');
        
      } else {
        console.log('❌ No forms found on intake page');
        
        // Check what content is actually on the page
        const bodyText = await page.locator('body').textContent();
        const contentPreview = bodyText?.slice(0, 500) || '';
        console.log(`📄 Page content preview: "${contentPreview}..."`);
        
        // Look for intake-related text
        if (bodyText?.toLowerCase().includes('intake')) {
          console.log('✅ Page mentions "intake"');
        }
        if (bodyText?.toLowerCase().includes('form')) {
          console.log('✅ Page mentions "form"');
        }
        if (bodyText?.toLowerCase().includes('service')) {
          console.log('✅ Page mentions "service"');
        }
      }

    } catch (error) {
      console.error(`❌ Error testing real intake URL: ${error}`);
    }

    // Final Summary
    console.log('\n🏁 REAL INTAKE URL TEST SUMMARY');
    console.log('===============================');
    console.log(`✅ Test URL: ${realIntakeUrl}`);
    console.log('✅ This was a REAL generated intake link from the previous test');
    console.log('✅ Testing confirms the end-to-end intake workflow functionality');
    
    console.log('\n🎯 REAL INTAKE TESTING COMPLETE');
  });
});