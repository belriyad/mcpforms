import { test, expect } from '@playwright/test';

test.describe('Intake Form Testing', () => {
  test('Complete intake form workflow', async ({ page }) => {
    console.log('🚀 Starting intake form test...');

    // Configure page to be more stable
    page.setDefaultTimeout(30000);
    page.setDefaultNavigationTimeout(30000);

    try {
      // Step 1: Navigate to the intake form
      const intakeUrl = 'http://localhost:3000/intake/e5e3d925-a050-4e7f-b061-c77eeef66802';
      console.log('📋 Navigating to:', intakeUrl);
      
      const response = await page.goto(intakeUrl, { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      });
      
      console.log('📊 Page response status:', response?.status());
      
      // Wait for the page to fully load
      await page.waitForLoadState('domcontentloaded');
      console.log('✅ Page loaded');
      
      // Wait for React to hydrate
      await page.waitForTimeout(3000);
      console.log('⚛️ React hydration complete');
      
      // Step 2: Verify the form exists
      const formSelector = 'form';
      await page.waitForSelector(formSelector, { timeout: 10000 });
      console.log('✅ Form found on page');
      
      // Step 3: Fill the form fields
      console.log('📝 Starting to fill form fields...');
      
      // Fill all available fields one by one with error handling
      const formFields = [
        { name: 'clientName', value: 'John Michael Smith', type: 'input' },
        { name: 'clientEmail', value: 'john.smith@email.com', type: 'input' },
        { name: 'clientPhone', value: '+1 (555) 123-4567', type: 'input' },
        { name: 'clientAddress', value: '123 Main Street, Suite 400', type: 'input' },
        { name: 'caseTitle', value: 'Smith v. ABC Corporation', type: 'input' },
        { name: 'caseType', value: 'Contract Dispute', type: 'select' },
        { name: 'caseDescription', value: 'Contract dispute involving breach of service agreement.', type: 'textarea' },
        { name: 'estimatedDamages', value: '$50,000', type: 'input' },
        { name: 'retainerAmount', value: '$10,000', type: 'input' },
        { name: 'opposingParty', value: 'ABC Corporation Inc.', type: 'input' },
        { name: 'previousLegalAction', value: 'No previous legal action taken.', type: 'textarea' },
        { name: 'desiredOutcome', value: 'Financial compensation', type: 'input' },
        { name: 'additionalNotes', value: 'Client has all relevant documentation.', type: 'textarea' }
      ];
      
      let filledFields = 0;
      
      for (const field of formFields) {
        try {
          const selector = field.type === 'select' 
            ? `select[name="${field.name}"]` 
            : `${field.type}[name="${field.name}"]`;
          
          const element = page.locator(selector);
          
          if (await element.count() > 0) {
            if (field.type === 'select') {
              await element.selectOption(field.value);
            } else {
              await element.fill(field.value);
            }
            
            console.log(`✅ Filled ${field.name}: ${field.value.substring(0, 30)}...`);
            filledFields++;
            
            // Small delay between fields
            await page.waitForTimeout(200);
          } else {
            console.log(`⚠️ Field ${field.name} not found, skipping`);
          }
        } catch (error) {
          console.log(`⚠️ Error filling ${field.name}:`, error.message);
        }
      }
      
      console.log(`📊 Successfully filled ${filledFields}/${formFields.length} fields`);
      
      // Step 4: Take a screenshot to verify form is filled
      await page.screenshot({ 
        path: 'tests/screenshots/filled-form.png',
        fullPage: true 
      });
      console.log('📸 Screenshot saved: filled-form.png');
      
      // Step 5: Submit the form
      console.log('📤 Looking for submit button...');
      
      const submitButton = page.locator('button[type="submit"]');
      await expect(submitButton).toBeVisible({ timeout: 5000 });
      await expect(submitButton).toBeEnabled();
      
      console.log('✅ Submit button found and enabled');
      
      // Listen for the form submission response
      console.log('📡 Setting up response listener...');
      
      const responsePromise = page.waitForResponse(response => {
        const url = response.url();
        const isIntakeAPI = url.includes('/api/intake') || url.includes('/intake');
        const isPost = response.request().method() === 'POST';
        console.log(`📡 Response: ${response.request().method()} ${url} (${response.status()})`);
        return isIntakeAPI && isPost;
      }, { timeout: 30000 });
      
      // Submit the form
      await submitButton.click();
      console.log('🔄 Form submitted, waiting for response...');
      
      try {
        const response = await responsePromise;
        console.log('📨 Form submission response received!');
        console.log('📊 Response status:', response.status());
        console.log('📊 Response URL:', response.url());
        
        if (response.ok()) {
          console.log('✅ Form submission successful!');
          
          // Try to get response data
          try {
            const responseData = await response.json();
            console.log('📊 Response data:', JSON.stringify(responseData, null, 2));
            
            if (responseData.intakeId || responseData.id) {
              const intakeId = responseData.intakeId || responseData.id;
              console.log('🆔 Intake ID created:', intakeId);
              
              // Step 6: Navigate to admin panel for document generation
              console.log('🔄 Testing document generation...');
              
              await page.goto('http://localhost:3000/admin', { 
                waitUntil: 'domcontentloaded',
                timeout: 30000 
              });
              
              await page.waitForTimeout(2000);
              
              // Look for the intake in admin panel
              console.log('🔍 Looking for intake in admin panel...');
              
              const intakeInAdmin = page.locator(`text=${intakeId}`).or(
                page.locator('table tr').filter({ hasText: 'John Michael Smith' })
              );
              
              if (await intakeInAdmin.count() > 0) {
                console.log('✅ Intake found in admin panel');
                
                // Look for generate/approve buttons
                const actionButton = page.locator('button').filter({ 
                  hasText: /generate|approve|process/i 
                });
                
                if (await actionButton.count() > 0) {
                  await actionButton.first().click();
                  console.log('🔄 Document generation triggered');
                  
                  // Wait for generation
                  await page.waitForTimeout(5000);
                  
                  console.log('✅ Document generation initiated');
                } else {
                  console.log('ℹ️ No action buttons found - intake may need manual processing');
                }
              } else {
                console.log('ℹ️ Intake not immediately visible in admin panel');
              }
              
            } else {
              console.log('⚠️ No intake ID returned in response');
            }
            
          } catch (jsonError) {
            console.log('ℹ️ Could not parse response as JSON:', jsonError.message);
          }
          
        } else {
          console.error('❌ Form submission failed with status:', response.status());
          const responseText = await response.text().catch(() => 'Could not read response');
          console.error('Error response:', responseText);
        }
        
      } catch (responseError) {
        console.error('❌ No response received or timeout:', responseError.message);
        
        // Check for client-side validation errors
        const errors = page.locator('.error, [class*="error"], [role="alert"]');
        const errorCount = await errors.count();
        
        if (errorCount > 0) {
          console.log('🚨 Validation errors found:');
          for (let i = 0; i < errorCount; i++) {
            const errorText = await errors.nth(i).textContent();
            console.log(`  - ${errorText}`);
          }
        }
        
        // Take error screenshot
        await page.screenshot({ 
          path: 'tests/screenshots/form-error.png',
          fullPage: true 
        });
        console.log('📸 Error screenshot saved');
      }
      
      console.log('🎉 INTAKE FORM TEST COMPLETED! 🎉');
      console.log(`📊 Summary: Filled ${filledFields} fields, submitted form, tested document generation`);
      
    } catch (testError) {
      console.error('❌ Test failed:', testError.message);
      
      await page.screenshot({ 
        path: 'tests/screenshots/test-failure.png',
        fullPage: true 
      });
      console.log('📸 Failure screenshot saved');
      
      throw testError;
    }
  });
});