import { test } from '@playwright/test';

test.describe('Intake Generation and Form Testing', () => {
  test('should test intake generation workflow with existing services', async ({ page }) => {
    console.log('🔗 INTAKE GENERATION TEST: Using existing services');

    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'log' || msg.type() === 'error' || msg.type() === 'warning') {
        console.log(`🌐 Browser ${msg.type()}: ${msg.text()}`);
      }
    });

    // Navigate to admin dashboard
    await page.goto('http://localhost:3002');
    await page.click('a:has-text("Admin Dashboard")');
    await page.waitForTimeout(3000);
    console.log('📱 Navigated to admin dashboard');

    // Go directly to Intakes tab
    console.log('\n🔗 STEP 1: Navigate to Intakes for Link Generation');
    await page.click('text=Intakes');
    await page.waitForTimeout(3000);
    console.log('📋 Opened Intakes tab');

    // Check current intakes
    const intakeRows = page.locator('tbody tr');
    const intakeCount = await intakeRows.count();
    console.log(`📊 Current intake count: ${intakeCount}`);

    // Look for Generate Intake Link button
    console.log('\n🔗 STEP 2: Attempt Intake Link Generation');
    const generateButtons = [
      page.locator('button:has-text("Generate Intake Link")'),
      page.locator('button:has-text("+ Generate Intake Link")'), 
      page.locator('button:has-text("Generate Intake")'),
      page.locator('button:has-text("Create Intake")')
    ];

    let generateButton = null;
    for (const btn of generateButtons) {
      if (await btn.isVisible()) {
        generateButton = btn;
        const buttonText = await btn.textContent();
        console.log(`🔗 Found generate button: "${buttonText}"`);
        break;
      }
    }

    if (generateButton) {
      await generateButton.click();
      await page.waitForTimeout(2000);
      console.log('✅ Clicked generate intake button');

      // Look for modal or form
      const modalSelectors = [
        '[role="dialog"]',
        '.modal',
        'form:has-text("Generate")',
        '.bg-white.rounded-lg' // More specific modal selector
      ];

      let modalFound = false;
      for (const selector of modalSelectors) {
        const modal = page.locator(selector).first(); // Use first() to avoid strict mode issues
        if (await modal.isVisible()) {
          console.log(`📦 Modal/form found with selector: ${selector}`);
          modalFound = true;
          break;
        }
      }

      if (modalFound) {
        console.log('\n📋 STEP 3: Fill Intake Generation Form');

        // Look for service selection
        const serviceSelectors = [
          'select[name="serviceId"]',
          'select#serviceId', 
          'select:has-text("Select")',
          'select'
        ];

        let serviceSelect = null;
        for (const selector of serviceSelectors) {
          const select = page.locator(selector);
          if (await select.isVisible()) {
            serviceSelect = select;
            console.log(`📋 Service selector found: ${selector}`);
            break;
          }
        }

        if (serviceSelect) {
          // Get available options
          const options = serviceSelect.locator('option');
          const optionCount = await options.count();
          console.log(`📋 Service options available: ${optionCount}`);

          // List all options
          for (let i = 0; i < optionCount; i++) {
            const option = options.nth(i);
            const value = await option.getAttribute('value');
            const text = await option.textContent();
            console.log(`📋 Option ${i}: value="${value}", text="${text}"`);
          }

          if (optionCount > 1) {
            // Select first real service (skip default option)
            let selectedOption = 1;
            
            // Try to find an "active" service
            for (let i = 1; i < optionCount; i++) {
              const option = options.nth(i);
              const text = await option.textContent();
              if (text && (text.toLowerCase().includes('active') || !text.toLowerCase().includes('draft'))) {
                selectedOption = i;
                break;
              }
            }

            await serviceSelect.selectOption({ index: selectedOption });
            const selectedText = await options.nth(selectedOption).textContent();
            console.log(`✅ Selected service: "${selectedText}"`);

            // Fill optional fields
            const emailInput = page.locator('input[type="email"], input[name="clientEmail"], input#clientEmail');
            if (await emailInput.isVisible()) {
              await emailInput.fill('intake-test@example.com');
              console.log('📧 Filled client email');
            }

            const expirationInput = page.locator('input[name="expiresInDays"], select[name="expiresInDays"]');
            if (await expirationInput.isVisible()) {
              await expirationInput.fill('30');
              console.log('📅 Set expiration days');
            }

            // Submit the form
            console.log('\n📤 STEP 4: Submit Intake Generation');
            const submitSelectors = [
              'button[type="submit"]:has-text("Generate")',
              'button:has-text("Generate Link")',
              'button:has-text("Create Link")',
              'button[type="submit"]'
            ];

            let submitButton = null;
            for (const selector of submitSelectors) {
              const btn = page.locator(selector);
              if (await btn.isVisible()) {
                submitButton = btn;
                const buttonText = await btn.textContent();
                console.log(`📤 Found submit button: "${buttonText}"`);
                break;
              }
            }

            if (submitButton) {
              await submitButton.click();
              console.log('📤 Submitted intake generation request');

              // Wait for response
              await page.waitForTimeout(10000);

              // Look for success or error messages
              console.log('\n✅ STEP 5: Check Generation Results');
              
              const successSelectors = [
                'text*=success',
                'text*=generated',
                'text*=created',
                '[data-testid="intake-link"]',
                'a[href*="/intake/"]',
                '.toast'
              ];

              let success = false;
              let intakeLink = null;

              for (const selector of successSelectors) {
                const element = page.locator(selector);
                if (await element.isVisible()) {
                  const text = await element.textContent();
                  console.log(`✅ Success indicator: "${text}"`);
                  success = true;

                  // Try to extract intake link
                  if (text && text.includes('http')) {
                    intakeLink = text.match(/https?:\/\/[^\s]+/)?.[0];
                  } else if (selector.includes('href')) {
                    const href = await element.getAttribute('href');
                    if (href) {
                      intakeLink = href.startsWith('http') ? href : `http://localhost:3002${href}`;
                    }
                  }
                  break;
                }
              }

              // Also check for error messages
              const errorSelectors = [
                'text*=error',
                'text*=failed',
                'text*=not active',
                '.error'
              ];

              for (const selector of errorSelectors) {
                const element = page.locator(selector);
                if (await element.isVisible()) {
                  const text = await element.textContent();
                  console.log(`❌ Error message: "${text}"`);
                }
              }

              // Test intake link if found
              if (intakeLink) {
                console.log(`\n📝 STEP 6: Test Intake Link: ${intakeLink}`);
                
                await page.goto(intakeLink);
                await page.waitForTimeout(5000);

                const pageTitle = await page.title();
                console.log(`📄 Intake page title: ${pageTitle}`);

                // Check for form elements
                const formElements = page.locator('form, input, textarea, select');
                const formElementCount = await formElements.count();
                console.log(`📝 Form elements found: ${formElementCount}`);

                if (formElementCount > 0) {
                  console.log('✅ Intake form is functional and contains form fields');
                  
                  // Look for service name or description
                  const serviceInfo = page.locator('h1, h2, h3, p');
                  const infoCount = await serviceInfo.count();
                  
                  for (let i = 0; i < Math.min(3, infoCount); i++) {
                    const info = serviceInfo.nth(i);
                    const text = await info.textContent();
                    if (text && text.trim().length > 0) {
                      console.log(`📋 Page content: "${text.trim()}"`);
                    }
                  }
                } else {
                  console.log('❌ No form elements found on intake page');
                }
              } else {
                if (success) {
                  console.log('✅ Intake generation appeared successful but no link extracted');
                } else {
                  console.log('❌ No success indicators found');
                }
              }
            } else {
              console.log('❌ No submit button found');
            }
          } else {
            console.log('❌ No services available in dropdown');
          }
        } else {
          console.log('❌ No service selector found in form');
        }
      } else {
        console.log('❌ No modal or form appeared after clicking generate button');
      }
    } else {
      console.log('❌ No generate intake button found');
      
      // Check what's actually on the page
      const pageContent = await page.locator('body').textContent();
      console.log('📄 Page content includes:');
      if (pageContent?.includes('Generate')) console.log('  - Contains "Generate"');
      if (pageContent?.includes('Intake')) console.log('  - Contains "Intake"');
      if (pageContent?.includes('Link')) console.log('  - Contains "Link"');
      if (pageContent?.includes('No intakes')) console.log('  - Contains "No intakes"');
    }

    console.log('\n🏁 INTAKE GENERATION TEST SUMMARY');
    console.log('=================================');
    console.log('The test explored the intake generation workflow');
    console.log('Results logged above show the current state of the system');
  });
});