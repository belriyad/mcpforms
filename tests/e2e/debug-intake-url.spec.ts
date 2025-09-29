import { test, expect } from '@playwright/test';

test.describe('Debug Intake Page Loading', () => {
  test('Debug specific intake URL loading issue', async ({ page }) => {
    console.log('🔍 DEBUGGING INTAKE PAGE LOADING');
    console.log('================================');
    
    const intakeToken = 'e5e3d925-a050-4e7f-b061-c77eeef66802';
    
    try {
      // Step 1: Test both possible server ports
      console.log('🌐 STEP 1: Testing server connectivity...');
      
      const ports = [3000, 3002];
      let workingPort = null;
      
      for (const port of ports) {
        try {
          console.log(`Testing port ${port}...`);
          await page.goto(`http://localhost:${port}`, { timeout: 5000 });
          console.log(`✅ Port ${port} is accessible`);
          workingPort = port;
          break;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          console.log(`❌ Port ${port} not accessible: ${errorMsg.substring(0, 100)}`);
        }
      }
      
      if (!workingPort) {
        throw new Error('No accessible server found on ports 3000 or 3002');
      }
      
      console.log(`✅ Using server on port ${workingPort}`);
      
      // Step 2: Test the specific intake URL
      console.log('🔗 STEP 2: Testing the specific intake URL...');
      const intakeUrl = `http://localhost:${workingPort}/intake/${intakeToken}`;
      console.log(`Testing URL: ${intakeUrl}`);
      
      // Navigate to the intake URL
      const response = await page.goto(intakeUrl);
      await page.waitForTimeout(3000);
      
      console.log(`📊 Response status: ${response?.status()}`);
      console.log(`📊 Response URL: ${response?.url()}`);
      
      await page.screenshot({ path: 'intake-debug-initial.png', fullPage: true });
      
      // Step 3: Analyze the page content
      console.log('📝 STEP 3: Analyzing page content...');
      
      const pageTitle = await page.title();
      const pageUrl = page.url();
      const pageContent = await page.textContent('body');
      
      console.log(`📄 Page Title: ${pageTitle}`);
      console.log(`🔗 Final URL: ${pageUrl}`);
      console.log(`📏 Content Length: ${pageContent?.length} characters`);
      console.log(`📋 Content Preview: ${pageContent?.substring(0, 300)}...`);
      
      // Step 4: Check for specific elements and errors
      console.log('🔍 STEP 4: Checking for page elements and errors...');
      
      const hasForm = await page.locator('form').count() > 0;
      const hasInputs = await page.locator('input').count() > 0;
      const hasErrors = await page.locator('text=/error|404|not found|500/i').count() > 0;
      const hasLoading = await page.locator('text=/loading|spinner/i').count() > 0;
      
      console.log(`📝 Has Forms: ${hasForm}`);
      console.log(`✏️  Has Inputs: ${hasInputs}`);
      console.log(`❌ Has Errors: ${hasErrors}`);
      console.log(`⏳ Has Loading: ${hasLoading}`);
      
      // Check for specific error messages
      const errorElements = await page.locator('*').filter({ hasText: /error|404|not found|500|invalid|expired/i }).all();
      if (errorElements.length > 0) {
        console.log(`🚨 Found ${errorElements.length} error elements:`);
        for (let i = 0; i < Math.min(errorElements.length, 5); i++) {
          const errorText = await errorElements[i].textContent();
          console.log(`   Error ${i + 1}: ${errorText?.trim()}`);
        }
      }
      
      // Step 5: Check network tab for any failed requests
      console.log('🌐 STEP 5: Checking for network issues...');
      
      // Listen to network events
      const failedRequests: string[] = [];
      const responses: any[] = [];
      
      page.on('requestfailed', request => {
        failedRequests.push(`${request.method()} ${request.url()} - ${request.failure()?.errorText}`);
      });
      
      page.on('response', response => {
        if (response.status() >= 400) {
          responses.push({
            url: response.url(),
            status: response.status(),
            statusText: response.statusText()
          });
        }
      });
      
      // Reload the page to capture network events
      console.log('🔄 Reloading page to capture network events...');
      await page.reload();
      await page.waitForTimeout(3000);
      
      if (failedRequests.length > 0) {
        console.log(`🚨 Found ${failedRequests.length} failed requests:`);
        failedRequests.forEach((req, i) => {
          console.log(`   Failed ${i + 1}: ${req}`);
        });
      }
      
      if (responses.length > 0) {
        console.log(`🚨 Found ${responses.length} HTTP error responses:`);
        responses.forEach((res, i) => {
          console.log(`   Error ${i + 1}: ${res.status} ${res.statusText} - ${res.url}`);
        });
      }
      
      // Step 6: Try to interact with the page if it loaded
      console.log('🔄 STEP 6: Testing page interaction...');
      
      if (hasForm && hasInputs) {
        console.log('✅ Page has form elements, testing interaction...');
        
        const firstInput = await page.locator('input[type="text"], input[type="email"]').first();
        if (await firstInput.count() > 0) {
          console.log('Testing input field...');
          await firstInput.fill('Debug Test');
          const value = await firstInput.inputValue();
          console.log(`✅ Input interaction works: "${value}"`);
        }
        
        const submitButton = await page.locator('button[type="submit"], input[type="submit"]').first();
        if (await submitButton.count() > 0) {
          console.log('✅ Submit button found');
        }
        
        await page.screenshot({ path: 'intake-debug-interaction.png', fullPage: true });
        
      } else if (hasErrors) {
        console.log('❌ Page has errors, cannot test interaction');
      } else {
        console.log('⚠️ Page loaded but no form elements found');
      }
      
      // Step 7: Check browser console for JavaScript errors
      console.log('🐛 STEP 7: Checking browser console for errors...');
      
      const consoleMessages: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleMessages.push(`Console Error: ${msg.text()}`);
        }
      });
      
      // Trigger any JavaScript that might cause errors
      await page.reload();
      await page.waitForTimeout(2000);
      
      if (consoleMessages.length > 0) {
        console.log(`🚨 Found ${consoleMessages.length} console errors:`);
        consoleMessages.forEach((msg, i) => {
          console.log(`   Console ${i + 1}: ${msg}`);
        });
      } else {
        console.log('✅ No console errors detected');
      }
      
      // Step 8: Final analysis and recommendations
      console.log('');
      console.log('📊 FINAL ANALYSIS');
      console.log('==================');
      
      if (response?.status() === 200 && hasForm && hasInputs && !hasErrors) {
        console.log('🎉 SUCCESS: Intake page is working correctly!');
        console.log(`   ✅ HTTP Status: ${response.status()}`);
        console.log(`   ✅ Forms present: ${hasForm}`);
        console.log(`   ✅ Input fields: ${hasInputs}`);
        console.log(`   ✅ No errors detected`);
      } else {
        console.log('⚠️ ISSUES DETECTED:');
        
        if (response?.status() !== 200) {
          console.log(`   ❌ HTTP Status: ${response?.status()} (expected 200)`);
        }
        
        if (!hasForm) {
          console.log('   ❌ No form elements found');
        }
        
        if (!hasInputs) {
          console.log('   ❌ No input fields found');  
        }
        
        if (hasErrors) {
          console.log('   ❌ Error messages detected on page');
        }
        
        console.log('');
        console.log('💡 DEBUGGING SUGGESTIONS:');
        console.log('   1. Check if the intake token is valid');
        console.log('   2. Verify Firebase Functions are deployed');
        console.log('   3. Check Firebase Functions logs');
        console.log('   4. Verify intake generation created the record');
        console.log('   5. Check database for the intake token');
      }
      
      await page.screenshot({ path: 'intake-debug-final.png', fullPage: true });
      
    } catch (error) {
      console.error('❌ Debug Test Error:', error);
      await page.screenshot({ path: 'intake-debug-error.png', fullPage: true });
      
      console.log('');
      console.log('🔧 ERROR DEBUGGING INFO:');
      const errorName = error instanceof Error ? error.constructor.name : 'Unknown';
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.log(`   Error Type: ${errorName}`);
      console.log(`   Error Message: ${errorMsg}`);
      
      // Try basic connectivity test
      try {
        console.log('🔄 Trying basic connectivity test...');
        await page.goto('http://localhost:3000');
        const homeTitle = await page.title();
        console.log(`✅ Home page accessible, title: ${homeTitle}`);
      } catch (homeError) {
        console.log('❌ Even home page is not accessible');
      }
      
      throw error;
    }
  });
});