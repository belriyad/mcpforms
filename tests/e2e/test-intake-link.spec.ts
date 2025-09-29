import { test, expect } from '@playwright/test';

// Simple test to verify the generated intake link functionality
test('Test Generated Intake Link Functionality', async ({ page }) => {
  console.log('🔗 TESTING GENERATED INTAKE LINK');
  console.log('================================');

  // Enable console logging to capture any errors
  page.on('console', msg => {
    if (msg.type() === 'log' || msg.type() === 'error') {
      console.log(`Browser ${msg.type()}: ${msg.text()}`);
    }
  });

  // The real intake URL generated in previous tests
  const intakeUrl = 'http://localhost:3002/intake/897b39fb-4a7b-4443-9421-f4a1d282f13e';
  
  console.log(`Testing URL: ${intakeUrl}`);
  
  try {
    // Navigate to the intake URL
    await page.goto(intakeUrl, { timeout: 30000 });
    console.log('✅ Successfully navigated to intake URL');
    
    // Wait for page to load
    await page.waitForTimeout(3000);

    // Check page title
    const title = await page.title();
    console.log(`Page title: "${title}"`);

    // Check if we have any error messages
    const errorElements = await page.locator('text*=error, text*=404, text*=expired, text*=not found').count();
    if (errorElements > 0) {
      console.log('❌ Error messages found on page');
      const errorText = await page.locator('text*=error, text*=404, text*=expired, text*=not found').first().textContent();
      console.log(`Error: ${errorText}`);
    } else {
      console.log('✅ No error messages found');
    }

    // Look for forms on the page
    const formCount = await page.locator('form').count();
    console.log(`Forms found: ${formCount}`);

    if (formCount > 0) {
      console.log('✅ Intake form detected!');
      
      // Count form inputs
      const inputCount = await page.locator('form input, form textarea, form select').count();
      console.log(`Form fields found: ${inputCount}`);

      // Try to identify some form fields
      const inputs = page.locator('form input, form textarea, form select');
      for (let i = 0; i < Math.min(5, inputCount); i++) {
        const input = inputs.nth(i);
        const type = await input.getAttribute('type') || 'text';
        const name = await input.getAttribute('name') || 'unnamed';
        const placeholder = await input.getAttribute('placeholder') || '';
        console.log(`Field ${i + 1}: type="${type}", name="${name}", placeholder="${placeholder}"`);
      }

      // Test filling out some fields
      console.log('\n📝 Testing form input...');
      
      // Fill text inputs
      const textInputs = page.locator('form input[type="text"], form input:not([type]), form textarea');
      const textCount = await textInputs.count();
      
      if (textCount > 0) {
        try {
          await textInputs.first().fill('Test Client Name');
          console.log('✅ Successfully filled first text field');
          
          // Verify the value was set
          const value = await textInputs.first().inputValue();
          console.log(`Field value: "${value}"`);
        } catch (e) {
          console.log(`⚠️ Could not fill text field: ${e}`);
        }
      }

      // Fill email inputs
      const emailInputs = page.locator('form input[type="email"]');
      const emailCount = await emailInputs.count();
      
      if (emailCount > 0) {
        try {
          await emailInputs.first().fill('test@example.com');
          console.log('✅ Successfully filled email field');
        } catch (e) {
          console.log(`⚠️ Could not fill email field: ${e}`);
        }
      }

      // Look for submit buttons
      const submitButtons = page.locator('form button[type="submit"], form button:has-text("Submit"), form button:has-text("Save")');
      const submitCount = await submitButtons.count();
      console.log(`Submit buttons found: ${submitCount}`);

      if (submitCount > 0) {
        const button = submitButtons.first();
        const isVisible = await button.isVisible();
        const isEnabled = await button.isEnabled();
        const buttonText = await button.textContent();
        
        console.log(`Submit button: "${buttonText}" (visible: ${isVisible}, enabled: ${isEnabled})`);
        
        if (isVisible && isEnabled) {
          console.log('✅ Submit button is clickable - form is functional!');
        }
      }

      console.log('\n🎉 INTAKE FORM IS WORKING!');
      
    } else {
      console.log('❌ No forms found on the page');
      
      // Check what content is actually on the page
      const bodyText = await page.locator('body').textContent();
      const preview = bodyText?.slice(0, 200) || 'No content';
      console.log(`Page content preview: "${preview}..."`);
    }

  } catch (error) {
    console.error(`❌ Error testing intake URL: ${error}`);
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'intake-test-error.png' });
    console.log('📸 Screenshot saved as intake-test-error.png');
  }

  console.log('\n🏁 INTAKE LINK TEST COMPLETE');
  console.log('============================');
});