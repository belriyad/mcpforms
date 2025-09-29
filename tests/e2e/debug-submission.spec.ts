import { test, expect } from '@playwright/test';

test.describe('Fix Intake Form Submission', () => {
  test('Test intake form submission with debugging', async ({ page }) => {
    console.log('🧪 Starting intake form submission test...');

    // Navigate to intake form
    console.log('📱 Navigating to intake form...');
    await page.goto('http://localhost:3000/intake/e5e3d925-a050-4e7f-b061-c77eeef66802');
    
    // Wait for form to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Check if form loads properly
    const formExists = await page.locator('form').count();
    console.log(`📋 Forms found: ${formExists}`);
    
    if (formExists === 0) {
      console.log('❌ No form found on page');
      await page.screenshot({ path: 'tests/screenshots/no-form-found.png', fullPage: true });
      
      // Check for error messages
      const errorMessages = await page.locator('text=/error|Error|not found|expired/').count();
      console.log(`🚨 Error messages found: ${errorMessages}`);
      
      if (errorMessages > 0) {
        for (let i = 0; i < errorMessages; i++) {
          const errorText = await page.locator('text=/error|Error|not found|expired/').nth(i).textContent();
          console.log(`   Error ${i + 1}: ${errorText}`);
        }
      }
      
      // Check console errors
      page.on('console', msg => {
        if (msg.type() === 'error') {
          console.log(`Browser console error: ${msg.text()}`);
        }
      });
      
      return;
    }
    
    console.log('✅ Form found! Testing submission...');
    
    // Fill out minimal required fields
    const testData = {
      clientName: 'Test Client',
      clientEmail: 'test@example.com',
      caseTitle: 'Test Case',
      caseType: 'Contract Dispute',
      caseDescription: 'This is a test case submission.'
    };
    
    // Fill form fields
    console.log('📝 Filling form fields...');
    
    for (const [fieldName, fieldValue] of Object.entries(testData)) {
      try {
        if (fieldName === 'caseType') {
          const selectElement = page.locator(`select[name="${fieldName}"]`);
          if (await selectElement.count() > 0) {
            await selectElement.selectOption(fieldValue);
            console.log(`   ✅ Selected ${fieldName}: ${fieldValue}`);
          }
        } else if (fieldName === 'caseDescription') {
          const textareaElement = page.locator(`textarea[name="${fieldName}"]`);
          if (await textareaElement.count() > 0) {
            await textareaElement.fill(fieldValue);
            console.log(`   ✅ Filled ${fieldName}: ${fieldValue}`);
          }
        } else {
          const inputElement = page.locator(`input[name="${fieldName}"]`);
          if (await inputElement.count() > 0) {
            await inputElement.fill(fieldValue);
            console.log(`   ✅ Filled ${fieldName}: ${fieldValue}`);
          }
        }
        
        await page.waitForTimeout(500);
      } catch (fillError) {
        console.log(`   ⚠️ Could not fill ${fieldName}: ${fillError.message}`);
      }
    }
    
    // Take screenshot of filled form
    await page.screenshot({ path: 'tests/screenshots/filled-form-debug.png', fullPage: true });
    console.log('📸 Screenshot saved: filled-form-debug.png');
    
    // Find and click submit button
    console.log('📤 Looking for submit button...');
    
    const submitButton = page.locator('button[type="submit"]');
    const submitCount = await submitButton.count();
    
    if (submitCount === 0) {
      console.log('❌ No submit button found');
      return;
    }
    
    console.log(`✅ Found ${submitCount} submit button(s)`);
    
    // Listen for network requests
    let submissionAttempted = false;
    let submissionResponse = null;
    
    page.on('response', response => {
      const url = response.url();
      if (url.includes('/api/intake') && response.request().method() === 'POST') {
        submissionAttempted = true;
        submissionResponse = response;
        console.log(`📡 Submission response: ${response.status()} ${url}`);
      }
    });
    
    // Submit the form
    console.log('🔄 Submitting form...');
    await submitButton.first().click();
    
    // Wait for submission to complete
    await page.waitForTimeout(5000);
    
    if (submissionAttempted && submissionResponse) {
      console.log(`📊 Submission status: ${submissionResponse.status()}`);
      
      try {
        const responseText = await submissionResponse.text();
        console.log('📨 Response body:', responseText.substring(0, 500));
      } catch (e) {
        console.log('ℹ️ Could not read response body');
      }
      
      if (submissionResponse.ok()) {
        console.log('✅ Form submitted successfully!');
      } else {
        console.log('❌ Form submission failed');
      }
    } else {
      console.log('⚠️ No submission attempt detected');
    }
    
    // Check for success/error messages
    await page.waitForTimeout(2000);
    
    const successMessages = page.locator('text=/success|Success|submitted|Submitted/');
    const successCount = await successMessages.count();
    
    const errorMessages = page.locator('text=/error|Error|failed|Failed/');
    const errorCount = await errorMessages.count();
    
    console.log(`📊 Success messages: ${successCount}`);
    console.log(`📊 Error messages: ${errorCount}`);
    
    if (successCount > 0) {
      for (let i = 0; i < successCount; i++) {
        const successText = await successMessages.nth(i).textContent();
        console.log(`   ✅ Success: ${successText}`);
      }
    }
    
    if (errorCount > 0) {
      for (let i = 0; i < errorCount; i++) {
        const errorText = await errorMessages.nth(i).textContent();
        console.log(`   ❌ Error: ${errorText}`);
      }
    }
    
    // Final screenshot
    await page.screenshot({ path: 'tests/screenshots/submission-result.png', fullPage: true });
    console.log('📸 Final screenshot saved: submission-result.png');
    
    console.log('🎯 Intake form submission test completed!');
  });
});