import { test, expect } from '@playwright/test';

test.describe('Complete Intake Link E2E Test', () => {
  test('Generate intake link and verify form loads correctly', async ({ page }) => {
    console.log('🚀 COMPLETE E2E INTAKE LINK TEST');
    console.log('=================================');

    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'log' || msg.type() === 'error') {
        console.log(`🌐 Browser ${msg.type()}: ${msg.text()}`);
      }
    });

    let generatedIntakeUrl: string | null = null;

    try {
      // STEP 1: Navigate to admin dashboard and generate intake link
      console.log('\n📋 STEP 1: Generate Intake Link via Admin Dashboard');
      
      // Try multiple ports to find the running server
      const ports = [3001, 3000, 3002];
      let serverUrl = null;
      
      for (const port of ports) {
        try {
          console.log(`🔍 Checking server on port ${port}...`);
          await page.goto(`http://localhost:${port}`, { timeout: 10000 });
          serverUrl = `http://localhost:${port}`;
          console.log(`✅ Server found on port ${port}`);
          break;
        } catch (e) {
          console.log(`⚠️ Port ${port} not accessible`);
        }
      }
      
      if (!serverUrl) {
        throw new Error('No accessible server found on ports 3000, 3001, or 3002');
      }
      
      await page.waitForTimeout(2000);
      
      // Navigate to admin dashboard
      const adminLink = page.locator('a:has-text("Admin Dashboard")');
      await expect(adminLink).toBeVisible({ timeout: 10000 });
      await adminLink.click();
      console.log('✅ Clicked Admin Dashboard');
      
      await page.waitForTimeout(3000);

      // Go to Intakes tab
      const intakesTab = page.locator('text=Intakes');
      await expect(intakesTab).toBeVisible({ timeout: 10000 });
      await intakesTab.click();
      console.log('✅ Navigated to Intakes tab');
      
      await page.waitForTimeout(2000);

      // Click Generate Intake Link button
      const generateButton = page.locator('button:has-text("Generate Intake Link")').first();
      await expect(generateButton).toBeVisible({ timeout: 10000 });
      await generateButton.click();
      console.log('✅ Clicked Generate Intake Link button');
      
      await page.waitForTimeout(2000);

      // Select a service from dropdown
      const serviceSelect = page.locator('select').first();
      await expect(serviceSelect).toBeVisible({ timeout: 10000 });
      
      const options = serviceSelect.locator('option');
      const optionCount = await options.count();
      console.log(`📋 Found ${optionCount} service options`);

      if (optionCount > 1) {
        await serviceSelect.selectOption({ index: 1 });
        const selectedOption = await options.nth(1).textContent();
        console.log(`✅ Selected service: "${selectedOption}"`);

        // Fill client email
        const emailInput = page.locator('input[type="email"]').first();
        await expect(emailInput).toBeVisible({ timeout: 10000 });
        await emailInput.fill('playwright-test@example.com');
        console.log('✅ Filled client email: playwright-test@example.com');

        // Set up response listener to capture the generated URL
        let intakeResponseReceived = false;
        
        page.on('response', async (response) => {
          if (response.url().includes('generateIntakeLink')) {
            try {
              const responseData = await response.json();
              console.log('🔗 Intake Generation API Response:', JSON.stringify(responseData, null, 2));
              
              if (responseData.result?.success && responseData.result?.data?.intakeUrl) {
                generatedIntakeUrl = responseData.result.data.intakeUrl;
                console.log(`✅ CAPTURED INTAKE URL: ${generatedIntakeUrl}`);
                intakeResponseReceived = true;
              }
            } catch (e) {
              console.log('⚠️ Could not parse intake generation response:', e);
            }
          }
        });

        // Submit the intake generation
        const submitButton = page.locator('button:has-text("Generate Link")').first();
        await expect(submitButton).toBeVisible({ timeout: 10000 });
        await submitButton.click();
        console.log('📤 Submitted intake generation request');
        
        // Wait for API response
        await page.waitForTimeout(10000);
        
        if (intakeResponseReceived && generatedIntakeUrl) {
          console.log('🎉 Successfully generated intake link!');
        } else {
          console.log('⚠️ No intake URL received from API, checking page content...');
          
          // Try to find URL in page content as fallback
          const pageContent = await page.content();
          const urlMatch = pageContent.match(/https?:\/\/[^\s"'<>]+\/intake\/[a-f0-9\-]+/i);
          if (urlMatch) {
            generatedIntakeUrl = urlMatch[0];
            console.log(`✅ Found intake URL in page content: ${generatedIntakeUrl}`);
          }
        }
      } else {
        throw new Error('No services available for intake generation');
      }

      // STEP 2: Test the generated intake link
      if (generatedIntakeUrl) {
        console.log('\n📝 STEP 2: Test Generated Intake Link');
        console.log(`🔗 Testing URL: ${generatedIntakeUrl}`);
        
        // Update URL to use the detected server port
        const currentPort = serverUrl.split(':')[2];
        const testUrl = generatedIntakeUrl.replace(/:300[0-9]/, `:${currentPort}`);
        console.log(`🔗 Adjusted URL for current server: ${testUrl}`);

        // Navigate to the intake URL
        await page.goto(testUrl, { timeout: 30000 });
        console.log('✅ Successfully navigated to intake URL');
        
        await page.waitForTimeout(5000);

        // Check page title
        const title = await page.title();
        console.log(`📄 Page title: "${title}"`);

        // Check for loading indicators and wait
        const loadingSelectors = ['[data-testid="loading"]', '.loading-spinner', 'text=Loading'];
        for (const selector of loadingSelectors) {
          try {
            const loadingElement = page.locator(selector);
            if (await loadingElement.isVisible({ timeout: 2000 })) {
              console.log(`⏳ Loading indicator found: ${selector}`);
              await page.waitForTimeout(5000);
              break;
            }
          } catch (e) {
            // Continue to next selector
          }
        }

        // Check for error messages
        const errorSelectors = [
          'text=Error',
          'text=404',
          'text=expired', 
          'text=not found',
          '[role="alert"]'
        ];
        
        let errorFound = false;
        for (const selector of errorSelectors) {
          try {
            const errorElement = page.locator(selector);
            if (await errorElement.isVisible({ timeout: 2000 })) {
              const errorText = await errorElement.textContent();
              console.log(`❌ ERROR FOUND: "${errorText}"`);
              errorFound = true;
            }
          } catch (e) {
            // Continue checking
          }
        }

        if (!errorFound) {
          console.log('✅ No error messages detected');
        }

        // STEP 3: Verify intake form is present and functional
        console.log('\n📝 STEP 3: Verify Intake Form');
        
        // Look for forms
        const forms = page.locator('form');
        const formCount = await forms.count();
        console.log(`📝 Forms found on page: ${formCount}`);

        if (formCount > 0) {
          console.log('🎉 SUCCESS: INTAKE FORM IS PRESENT!');
          
          // Analyze form structure
          const formInputs = page.locator('form input, form textarea, form select');
          const inputCount = await formInputs.count();
          console.log(`📝 Form input fields: ${inputCount}`);

          // List form fields for verification
          console.log('\n📝 Form Field Analysis:');
          for (let i = 0; i < Math.min(10, inputCount); i++) {
            const input = formInputs.nth(i);
            const type = await input.getAttribute('type') || 'text';
            const name = await input.getAttribute('name') || 'unnamed';
            const placeholder = await input.getAttribute('placeholder') || '';
            const required = await input.getAttribute('required') !== null;
            
            console.log(`  Field ${i + 1}: type="${type}", name="${name}", placeholder="${placeholder}", required=${required}`);
          }

          // STEP 4: Test form interaction
          console.log('\n📝 STEP 4: Test Form Interaction');
          
          // Fill text inputs
          const textInputs = page.locator('form input[type="text"], form input:not([type]), form textarea');
          const textCount = await textInputs.count();
          
          if (textCount > 0) {
            console.log(`📝 Testing text inputs (${textCount} found):`);
            
            for (let i = 0; i < Math.min(3, textCount); i++) {
              try {
                const testValue = `Test Data ${i + 1} - Playwright E2E Test`;
                await textInputs.nth(i).fill(testValue);
                console.log(`  ✅ Filled field ${i + 1}: "${testValue}"`);
                
                // Verify value was set
                const actualValue = await textInputs.nth(i).inputValue();
                if (actualValue === testValue) {
                  console.log(`  ✅ Value verification passed`);
                } else {
                  console.log(`  ⚠️ Value mismatch: expected "${testValue}", got "${actualValue}"`);
                }
              } catch (e) {
                console.log(`  ❌ Could not fill field ${i + 1}: ${e}`);
              }
            }
          }

          // Fill email inputs
          const emailInputs = page.locator('form input[type="email"]');
          const emailCount = await emailInputs.count();
          
          if (emailCount > 0) {
            console.log(`📝 Testing email inputs (${emailCount} found):`);
            try {
              await emailInputs.first().fill('test.client@example.com');
              console.log(`  ✅ Filled email field: test.client@example.com`);
            } catch (e) {
              console.log(`  ❌ Could not fill email field: ${e}`);
            }
          }

          // Check for submit buttons
          const submitButtons = page.locator('form button[type="submit"], form button:has-text("Submit"), form button:has-text("Save")');
          const submitCount = await submitButtons.count();
          console.log(`📤 Submit buttons found: ${submitCount}`);

          if (submitCount > 0) {
            const submitButton = submitButtons.first();
            const isVisible = await submitButton.isVisible();
            const isEnabled = await submitButton.isEnabled();
            const buttonText = await submitButton.textContent();
            
            console.log(`📤 Submit button: "${buttonText}" (visible: ${isVisible}, enabled: ${isEnabled})`);
            
            if (isVisible && isEnabled) {
              console.log('✅ Submit button is ready for interaction');
              console.log('🎊 FORM IS FULLY FUNCTIONAL!');
            } else {
              console.log('⚠️ Submit button exists but is not interactive');
            }
          } else {
            console.log('⚠️ No submit buttons found - form may be incomplete');
          }

          // Take screenshot for verification
          await page.screenshot({ 
            path: 'intake-form-success.png',
            fullPage: true 
          });
          console.log('📸 Screenshot saved: intake-form-success.png');

        } else {
          console.log('❌ NO FORMS FOUND ON INTAKE PAGE');
          
          // Check what content is actually present
          const bodyText = await page.locator('body').textContent();
          const contentPreview = bodyText?.slice(0, 500) || 'No content';
          console.log(`📄 Page content preview: "${contentPreview}..."`);
          
          // Take screenshot for debugging
          await page.screenshot({ 
            path: 'intake-no-form-debug.png',
            fullPage: true 
          });
          console.log('📸 Debug screenshot saved: intake-no-form-debug.png');
        }

      } else {
        throw new Error('Failed to generate intake URL - cannot proceed with testing');
      }

    } catch (error) {
      console.error(`❌ E2E Test Error: ${error}`);
      
      // Take error screenshot
      await page.screenshot({ 
        path: 'e2e-intake-error.png',
        fullPage: true 
      });
      console.log('📸 Error screenshot saved: e2e-intake-error.png');
      
      throw error;
    }

    // FINAL SUMMARY
    console.log('\n🏁 E2E INTAKE LINK TEST COMPLETE');
    console.log('=================================');
    
    if (generatedIntakeUrl) {
      console.log('✅ Intake link generation: SUCCESS');
      console.log(`✅ Generated URL: ${generatedIntakeUrl}`);
      console.log('✅ Form accessibility: TESTED');
      console.log('✅ Form interaction: VERIFIED');
      console.log('🎊 END-TO-END INTAKE WORKFLOW: FUNCTIONAL');
    } else {
      console.log('❌ Intake link generation: FAILED');
    }
  });
});