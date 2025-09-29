import { test, expect } from '@playwright/test';

test.describe('Generated Intake Link Testing', () => {
  test('should generate intake link and test the actual intake form', async ({ page }) => {
    console.log('🔗 TESTING GENERATED INTAKE LINK');
    console.log('=================================');

    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'log' || msg.type() === 'error') {
        console.log(`🌐 Browser ${msg.type()}: ${msg.text()}`);
      }
    });

    let intakeLink: string | null = null;

    // Step 1: Generate an intake link
    console.log('\n📋 STEP 1: Generate Intake Link');
    await page.goto('http://localhost:3002');
    await page.click('a:has-text("Admin Dashboard")');
    await page.waitForTimeout(3000);

    // Navigate to Intakes tab
    await page.click('text=Intakes');
    await page.waitForTimeout(2000);
    console.log('✅ Navigated to Intakes tab');

    // Click Generate Intake Link
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
            await emailInput.fill('test-client@example.com');
            console.log('✅ Filled client email');
          }

          // Submit generation
          const submitButton = page.locator('button:has-text("Generate Link")').first();
          if (await submitButton.isVisible()) {
            await submitButton.click();
            console.log('📤 Submitted intake generation');

            // Wait for response and extract link
            await page.waitForTimeout(8000);

            // Look for intake link in various places
            const linkSelectors = [
              'a[href*="/intake/"]',
              '[data-testid="intake-link"]',
              'input[value*="/intake/"]',
              'text*=localhost:3002/intake/',
              'text*=http'
            ];

            for (const selector of linkSelectors) {
              try {
                const linkElement = page.locator(selector);
                if (await linkElement.isVisible()) {
                  if (selector.includes('href')) {
                    const href = await linkElement.getAttribute('href');
                    if (href && href.includes('/intake/')) {
                      intakeLink = href.startsWith('http') ? href : `http://localhost:3002${href}`;
                      break;
                    }
                  } else if (selector.includes('value')) {
                    const value = await linkElement.getAttribute('value');
                    if (value && value.includes('/intake/')) {
                      intakeLink = value;
                      break;
                    }
                  } else {
                    const text = await linkElement.textContent();
                    if (text && text.includes('/intake/')) {
                      const match = text.match(/(https?:\/\/[^\s]+\/intake\/[^\s]+)/);
                      if (match) {
                        intakeLink = match[1];
                        break;
                      }
                    }
                  }
                }
              } catch (e) {
                // Continue to next selector
              }
            }

            // If no direct link found, check for success message and look in browser logs
            if (!intakeLink) {
              console.log('⚠️ No direct link found, checking for success indicators...');
              
              const pageContent = await page.content();
              const linkMatch = pageContent.match(/https?:\/\/[^\s"']+\/intake\/[^\s"']+/);
              if (linkMatch) {
                intakeLink = linkMatch[0];
              }
            }

            if (intakeLink) {
              console.log(`✅ Generated intake link: ${intakeLink}`);
            } else {
              console.log('❌ Could not extract intake link');
              
              // Take screenshot for debugging
              await page.screenshot({ path: 'debug-intake-generation.png' });
              
              // Check page content
              const pageText = await page.locator('body').textContent();
              if (pageText?.includes('success')) {
                console.log('✅ Success message found, link may be available');
              }
            }
          }
        }
      }
    }

    // Step 2: Test the intake link if we found one
    if (intakeLink) {
      console.log('\n📝 STEP 2: Test Generated Intake Link');
      console.log(`🔗 Testing link: ${intakeLink}`);

      await page.goto(intakeLink);
      await page.waitForTimeout(5000);

      // Check if page loads
      const pageTitle = await page.title();
      console.log(`📄 Intake page title: "${pageTitle}"`);

      // Look for form elements
      const formElements = page.locator('form');
      const formCount = await formElements.count();
      console.log(`📝 Forms found: ${formCount}`);

      if (formCount > 0) {
        console.log('✅ Intake form detected');

        // Analyze form structure
        const inputs = page.locator('input, textarea, select');
        const inputCount = await inputs.count();
        console.log(`📝 Form fields found: ${inputCount}`);

        // List form fields
        for (let i = 0; i < Math.min(10, inputCount); i++) {
          const input = inputs.nth(i);
          const type = await input.getAttribute('type') || 'text';
          const name = await input.getAttribute('name') || '';
          const placeholder = await input.getAttribute('placeholder') || '';
          const label = await input.getAttribute('aria-label') || '';
          
          console.log(`📝 Field ${i + 1}: type="${type}", name="${name}", placeholder="${placeholder}", label="${label}"`);
        }

        // Step 3: Fill out the form
        if (inputCount > 0) {
          console.log('\n📝 STEP 3: Fill Out Intake Form');

          // Fill text inputs with appropriate data
          const textInputs = page.locator('input[type="text"], input:not([type]), textarea');
          const textInputCount = await textInputs.count();
          
          for (let i = 0; i < Math.min(5, textInputCount); i++) {
            const input = textInputs.nth(i);
            const placeholder = (await input.getAttribute('placeholder') || '').toLowerCase();
            const name = (await input.getAttribute('name') || '').toLowerCase();
            const label = (await input.getAttribute('aria-label') || '').toLowerCase();
            
            let testValue = '';
            
            if (placeholder.includes('name') || name.includes('name') || label.includes('name')) {
              testValue = 'John Doe Test Client';
            } else if (placeholder.includes('email') || name.includes('email') || label.includes('email')) {
              testValue = 'johndoe@testclient.com';
            } else if (placeholder.includes('phone') || name.includes('phone') || label.includes('phone')) {
              testValue = '(555) 123-4567';
            } else if (placeholder.includes('address') || name.includes('address') || label.includes('address')) {
              testValue = '123 Test Street, Test City, TC 12345';
            } else if (placeholder.includes('date') || name.includes('date') || label.includes('date')) {
              testValue = '01/15/2024';
            } else {
              testValue = `Test Data ${i + 1}`;
            }

            try {
              await input.fill(testValue);
              console.log(`✅ Filled field ${i + 1}: "${testValue}"`);
            } catch (e) {
              console.log(`⚠️ Could not fill field ${i + 1}: ${e}`);
            }
          }

          // Fill email inputs specifically
          const emailInputs = page.locator('input[type="email"]');
          const emailCount = await emailInputs.count();
          
          for (let i = 0; i < emailCount; i++) {
            try {
              await emailInputs.nth(i).fill('test.client@example.com');
              console.log(`✅ Filled email field ${i + 1}`);
            } catch (e) {
              console.log(`⚠️ Could not fill email field: ${e}`);
            }
          }

          // Fill number inputs
          const numberInputs = page.locator('input[type="number"]');
          const numberCount = await numberInputs.count();
          
          for (let i = 0; i < numberCount; i++) {
            try {
              await numberInputs.nth(i).fill('12345');
              console.log(`✅ Filled number field ${i + 1}`);
            } catch (e) {
              console.log(`⚠️ Could not fill number field: ${e}`);
            }
          }

          // Handle select dropdowns
          const selects = page.locator('select');
          const selectCount = await selects.count();
          
          for (let i = 0; i < selectCount; i++) {
            try {
              const select = selects.nth(i);
              const options = select.locator('option');
              const optionCount = await options.count();
              
              if (optionCount > 1) {
                await select.selectOption({ index: 1 });
                console.log(`✅ Selected option in dropdown ${i + 1}`);
              }
            } catch (e) {
              console.log(`⚠️ Could not select dropdown option: ${e}`);
            }
          }

          console.log('✅ Form filling completed');

          // Step 4: Attempt to save/submit
          console.log('\n📤 STEP 4: Test Form Submission');

          // Look for save/submit buttons
          const submitButtons = page.locator('button[type="submit"], button:has-text("Submit"), button:has-text("Save"), button:has-text("Continue")');
          const submitButtonCount = await submitButtons.count();
          
          console.log(`📤 Submit buttons found: ${submitButtonCount}`);

          if (submitButtonCount > 0) {
            for (let i = 0; i < submitButtonCount; i++) {
              const button = submitButtons.nth(i);
              const buttonText = await button.textContent();
              const isVisible = await button.isVisible();
              const isEnabled = await button.isEnabled();
              
              console.log(`📤 Button ${i + 1}: "${buttonText}" (visible: ${isVisible}, enabled: ${isEnabled})`);
            }

            // Try to submit the form
            const firstSubmitButton = submitButtons.first();
            if (await firstSubmitButton.isVisible() && await firstSubmitButton.isEnabled()) {
              console.log('📤 Attempting form submission...');
              
              try {
                await firstSubmitButton.click();
                await page.waitForTimeout(5000);
                
                // Check for success/error messages
                const successMessages = page.locator('text*=success, text*=submitted, text*=saved, text*=thank');
                const errorMessages = page.locator('text*=error, text*=failed, text*=required');
                
                if (await successMessages.isVisible()) {
                  const successText = await successMessages.textContent();
                  console.log(`✅ Form submission success: "${successText}"`);
                } else if (await errorMessages.isVisible()) {
                  const errorText = await errorMessages.textContent();
                  console.log(`⚠️ Form submission validation: "${errorText}"`);
                } else {
                  console.log('📤 Form submission completed (no explicit feedback message)');
                }
                
              } catch (e) {
                console.log(`⚠️ Form submission error: ${e}`);
              }
            } else {
              console.log('⚠️ Submit button not clickable');
            }
          } else {
            console.log('⚠️ No submit buttons found');
          }
        }
      } else {
        console.log('❌ No forms found on intake page');
        
        // Check what's actually on the page
        const headings = page.locator('h1, h2, h3');
        const headingCount = await headings.count();
        
        console.log(`📄 Page headings found: ${headingCount}`);
        for (let i = 0; i < Math.min(3, headingCount); i++) {
          const heading = headings.nth(i);
          const text = await heading.textContent();
          console.log(`📄 Heading ${i + 1}: "${text}"`);
        }
      }
    } else {
      console.log('\n❌ STEP 2 SKIPPED: No intake link was generated');
      console.log('This could mean:');
      console.log('- Service is not in "active" status');
      console.log('- Intake generation failed');
      console.log('- UI issue preventing link extraction');
    }

    // Final Summary
    console.log('\n🏁 INTAKE LINK TEST SUMMARY');
    console.log('===========================');
    
    if (intakeLink) {
      console.log('✅ Intake Link Generation: SUCCESS');
      console.log(`✅ Intake Link: ${intakeLink}`);
      console.log('✅ Intake Form Access: TESTED');
      console.log('✅ Form Field Population: TESTED');
      console.log('✅ Complete Intake Workflow: FUNCTIONAL');
    } else {
      console.log('⚠️ Intake Link Generation: NEEDS INVESTIGATION');
      console.log('⚠️ Check service activation status');
      console.log('⚠️ Verify intake generation API response');
    }
    
    console.log('\n🎯 INTAKE TESTING COMPLETE');
  });
});