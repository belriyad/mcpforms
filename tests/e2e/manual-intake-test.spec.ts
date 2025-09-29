import { test, expect } from '@playwright/test';

test.describe('Manual Intake Link Testing', () => {
  test('should test a manually constructed intake link', async ({ page }) => {
    console.log('🔗 MANUAL INTAKE LINK TEST');
    console.log('=========================');

    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'log' || msg.type() === 'error') {
        console.log(`🌐 Browser ${msg.type()}: ${msg.text()}`);
      }
    });

    // Step 1: Get existing intake from database
    console.log('\n📋 STEP 1: Access Admin Dashboard to Check Intakes');
    
    try {
      await page.goto('http://localhost:3002');
      await page.click('a:has-text("Admin Dashboard")');
      await page.waitForTimeout(3000);

      // Navigate to Intakes tab to see existing intakes
      await page.click('text=Intakes');
      await page.waitForTimeout(3000);
      console.log('✅ Navigated to Intakes tab');

      // Try to generate a new intake first
      console.log('\n📋 STEP 1.1: Generate New Intake');
      const generateButton = page.locator('button:has-text("Generate Intake Link")').first();
      
      if (await generateButton.isVisible()) {
        await generateButton.click();
        await page.waitForTimeout(2000);
        console.log('✅ Clicked Generate Intake Link button');

        // Select service
        const serviceSelect = page.locator('select').first();
        if (await serviceSelect.isVisible()) {
          const options = serviceSelect.locator('option');
          const optionCount = await options.count();
          console.log(`📋 Found ${optionCount} service options`);

          if (optionCount > 1) {
            await serviceSelect.selectOption({ index: 1 });
            const selectedOption = await options.nth(1).textContent();
            console.log(`✅ Selected service: "${selectedOption}"`);

            // Fill client email
            const emailInput = page.locator('input[type="email"]').first();
            if (await emailInput.isVisible()) {
              await emailInput.fill('test-manual@example.com');
              console.log('✅ Filled client email');

              // Try to submit and capture any response
              const submitButton = page.locator('button:has-text("Generate Link")').first();
              if (await submitButton.isVisible()) {
                console.log('📤 Attempting to generate intake link...');
                
                // Set up response capture
                let apiResponse: any = null;
                
                page.on('response', async response => {
                  if (response.url().includes('generateIntakeLink')) {
                    try {
                      const responseData = await response.json();
                      console.log('🔗 API Response captured:', responseData);
                      apiResponse = responseData;
                    } catch (e) {
                      console.log('⚠️ Could not parse response:', e);
                    }
                  }
                });

                await submitButton.click();
                await page.waitForTimeout(8000);

                if (apiResponse && apiResponse.success && apiResponse.data && apiResponse.data.intakeUrl) {
                  const intakeUrl = apiResponse.data.intakeUrl;
                  console.log(`✅ Generated intake URL from API: ${intakeUrl}`);
                  
                  // Step 2: Test the intake URL directly
                  console.log('\n📝 STEP 2: Test Generated Intake URL');
                  await testIntakeUrl(page, intakeUrl);
                } else {
                  console.log('⚠️ No valid intake URL in API response');
                  // Try to extract from page content
                  await extractIntakeFromPage(page);
                }
              }
            }
          }
        }
      }

      // Step 3: Also test a hardcoded pattern
      console.log('\n📝 STEP 3: Test Hardcoded Intake Pattern');
      // Try some common intake patterns based on our configuration
      const testUrls = [
        'http://localhost:3002/intake/test-token-123',
        'http://localhost:3002/intake/sample-intake-token',
        'https://us-central1-formgenai-4545.cloudfunctions.net/intakeFormAPI/intake/test-token'
      ];

      for (const testUrl of testUrls) {
        console.log(`\n🔗 Testing URL pattern: ${testUrl}`);
        await testIntakeUrl(page, testUrl);
      }

    } catch (error) {
      console.error('❌ Test error:', error);
    }

    console.log('\n🏁 MANUAL INTAKE LINK TEST COMPLETE');
    console.log('===================================');
  });
});

async function extractIntakeFromPage(page: any) {
  console.log('🔍 Attempting to extract intake link from page...');
  
  // Look for any URLs on the page that might be intake links
  const pageContent = await page.content();
  const urlMatches = pageContent.match(/https?:\/\/[^\s"'<>]+intake[^\s"'<>]*/g);
  
  if (urlMatches && urlMatches.length > 0) {
    console.log(`✅ Found potential intake URLs: ${urlMatches.join(', ')}`);
    
    for (const url of urlMatches) {
      await testIntakeUrl(page, url);
    }
  } else {
    console.log('⚠️ No intake URLs found in page content');
  }
}

async function testIntakeUrl(page: any, intakeUrl: string) {
  try {
    console.log(`\n🔗 Testing intake URL: ${intakeUrl}`);
    
    await page.goto(intakeUrl, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(3000);

    // Check page title and content
    const pageTitle = await page.title();
    console.log(`📄 Page title: "${pageTitle}"`);

    // Check for error messages first
    const errorSelectors = [
      'text*=error',
      'text*=not found',
      'text*=expired',
      'text*=404',
      'text*=invalid',
      '.error',
      '[role="alert"]'
    ];

    let hasError = false;
    for (const selector of errorSelectors) {
      const errorElement = page.locator(selector);
      if (await errorElement.isVisible()) {
        const errorText = await errorElement.textContent();
        console.log(`❌ Error found: "${errorText}"`);
        hasError = true;
      }
    }

    if (!hasError) {
      console.log('✅ No error messages found');

      // Check for form elements
      const forms = page.locator('form');
      const formCount = await forms.count();
      console.log(`📝 Forms found: ${formCount}`);

      if (formCount > 0) {
        console.log('✅ Form detected - this appears to be a working intake page');

        // Analyze form structure
        const inputs = page.locator('form input, form textarea, form select');
        const inputCount = await inputs.count();
        console.log(`📝 Form fields: ${inputCount}`);

        // List some form fields
        for (let i = 0; i < Math.min(5, inputCount); i++) {
          const input = inputs.nth(i);
          const type = await input.getAttribute('type') || 'text';
          const name = await input.getAttribute('name') || '';
          const placeholder = await input.getAttribute('placeholder') || '';
          const label = await input.getAttribute('aria-label') || '';
          
          console.log(`📝 Field ${i + 1}: type="${type}", name="${name}", placeholder="${placeholder}"`);
        }

        // Try to fill out a few fields
        console.log('\n📝 Testing Form Field Input');

        // Fill text inputs
        const textInputs = page.locator('form input[type="text"], form input:not([type]), form textarea');
        const textCount = await textInputs.count();
        
        for (let i = 0; i < Math.min(3, textCount); i++) {
          try {
            const testValue = `Test Input ${i + 1} - Manual Testing`;
            await textInputs.nth(i).fill(testValue);
            console.log(`✅ Filled text field ${i + 1}: "${testValue}"`);
            
            // Verify the value was set
            const actualValue = await textInputs.nth(i).inputValue();
            if (actualValue === testValue) {
              console.log(`✅ Value verification passed`);
            } else {
              console.log(`⚠️ Value verification failed: expected "${testValue}", got "${actualValue}"`);
            }
          } catch (e) {
            console.log(`⚠️ Could not fill text field ${i + 1}: ${e}`);
          }
        }

        // Fill email inputs
        const emailInputs = page.locator('form input[type="email"]');
        const emailCount = await emailInputs.count();
        
        if (emailCount > 0) {
          try {
            await emailInputs.first().fill('manual.test@example.com');
            console.log('✅ Filled email field');
          } catch (e) {
            console.log(`⚠️ Could not fill email field: ${e}`);
          }
        }

        // Test form submission
        console.log('\n📤 Testing Form Submission');
        
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
            console.log('📤 Attempting form submission...');
            
            // Capture any network requests
            let submissionResponse: any = null;
            
            page.on('response', async (response: any) => {
              if (response.url().includes('intake') || response.url().includes('submit')) {
                try {
                  const responseData = await response.text();
                  console.log(`📤 Submission response from ${response.url()}: ${responseData.slice(0, 200)}`);
                  submissionResponse = responseData;
                } catch (e) {
                  console.log(`📤 Response captured but couldn't parse: ${e}`);
                }
              }
            });
            
            await submitButton.click();
            await page.waitForTimeout(5000);
            
            // Check for success/error feedback
            const feedbackSelectors = [
              'text*=success',
              'text*=submitted',
              'text*=saved',
              'text*=thank you',
              'text*=received',
              'text*=error',
              'text*=required',
              'text*=invalid'
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
              console.log('⚠️ No explicit feedback message found after submission');
            }
            
            if (submissionResponse) {
              console.log('✅ Form submission request was made');
            } else {
              console.log('⚠️ No submission request detected');
            }
          }
        } else {
          console.log('⚠️ No submit buttons found in form');
        }

        console.log('✅ INTAKE FORM TESTING COMPLETED');
        
      } else {
        console.log('⚠️ No forms found - checking page content');
        
        const bodyText = await page.locator('body').textContent();
        const preview = bodyText?.slice(0, 300) || '';
        console.log(`📄 Page content preview: "${preview}..."`);
        
        // Look for intake-related content
        if (bodyText?.toLowerCase().includes('intake')) {
          console.log('✅ Page contains "intake" content');
        } else {
          console.log('⚠️ Page does not appear to be intake-related');
        }
      }
    }

  } catch (error) {
    console.log(`❌ Error testing URL ${intakeUrl}: ${error}`);
  }
}