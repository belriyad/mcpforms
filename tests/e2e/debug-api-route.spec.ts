import { test, expect } from '@playwright/test';

test.describe('Debug API Route', () => {
  test('Test intake API route directly', async ({ page }) => {
    console.log('🔍 DEBUGGING API ROUTE');
    console.log('======================');
    
    const intakeToken = 'e5e3d925-a050-4e7f-b061-c77eeef66802';
    const apiUrl = `http://localhost:3000/api/intake/${intakeToken}`;
    
    try {
      console.log(`🌐 Testing API URL: ${apiUrl}`);
      
      // Navigate to the API endpoint directly
      const response = await page.goto(apiUrl);
      const status = response?.status() || 0;
      const statusText = response?.statusText() || '';
      
      console.log(`📊 API Response Status: ${status} ${statusText}`);
      
      // Get the response body
      const responseBody = await page.textContent('body');
      console.log(`📋 Response Body: ${responseBody}`);
      
      // Try to parse as JSON
      try {
        const jsonData = JSON.parse(responseBody || '{}');
        console.log('✅ Response is valid JSON:');
        console.log(`   Success: ${jsonData.success}`);
        console.log(`   Error: ${jsonData.error || 'none'}`);
        if (jsonData.data) {
          console.log(`   Service Name: ${jsonData.data.serviceName}`);
          console.log(`   Form Fields: ${jsonData.data.formFields?.length || 0}`);
          console.log(`   Intake ID: ${jsonData.data.intakeId}`);
        }
      } catch (jsonError) {
        console.log('❌ Response is not valid JSON');
      }
      
      await page.screenshot({ path: 'api-response-debug.png' });
      
      // Now test the actual intake page to see what errors occur
      console.log('\n🔍 Testing intake page with network monitoring...');
      
      // Set up network monitoring
      const networkErrors: string[] = [];
      const apiRequests: any[] = [];
      
      page.on('requestfailed', request => {
        if (request.url().includes('/api/intake/')) {
          networkErrors.push(`Failed: ${request.method()} ${request.url()} - ${request.failure()?.errorText}`);
        }
      });
      
      page.on('response', response => {
        if (response.url().includes('/api/intake/')) {
          apiRequests.push({
            url: response.url(),
            status: response.status(),
            statusText: response.statusText()
          });
        }
      });
      
      // Navigate to intake page
      const intakePageUrl = `http://localhost:3000/intake/${intakeToken}`;
      console.log(`📍 Navigating to intake page: ${intakePageUrl}`);
      
      await page.goto(intakePageUrl);
      await page.waitForTimeout(5000); // Wait for API calls
      
      // Check what happened
      console.log(`\n📊 Network Analysis:`);
      console.log(`   Failed Requests: ${networkErrors.length}`);
      console.log(`   API Requests: ${apiRequests.length}`);
      
      if (networkErrors.length > 0) {
        console.log('🚨 Failed Requests:');
        networkErrors.forEach((error, i) => {
          console.log(`   ${i + 1}. ${error}`);
        });
      }
      
      if (apiRequests.length > 0) {
        console.log('📡 API Requests:');
        apiRequests.forEach((req, i) => {
          console.log(`   ${i + 1}. ${req.status} ${req.statusText} - ${req.url}`);
        });
      }
      
      // Check page state
      const hasForm = await page.locator('form').count() > 0;
      const hasInputs = await page.locator('input').count() > 0;
      const hasLoading = await page.locator('text=/loading/i').count() > 0;
      const hasError = await page.locator('text=/error/i').count() > 0;
      
      console.log(`\n📋 Page State:`);
      console.log(`   Has Form: ${hasForm}`);
      console.log(`   Has Inputs: ${hasInputs}`);
      console.log(`   Has Loading: ${hasLoading}`);
      console.log(`   Has Error: ${hasError}`);
      
      await page.screenshot({ path: 'intake-page-with-monitoring.png', fullPage: true });
      
      // Check browser console for errors
      const consoleErrors: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });
      
      // Reload to capture console errors
      await page.reload();
      await page.waitForTimeout(3000);
      
      if (consoleErrors.length > 0) {
        console.log(`\n🚨 Console Errors:`);
        consoleErrors.forEach((error, i) => {
          console.log(`   ${i + 1}. ${error}`);
        });
      }
      
      console.log('\n💡 DIAGNOSIS:');
      if (status === 200 && hasForm && hasInputs) {
        console.log('✅ Everything is working correctly!');
      } else if (status !== 200) {
        console.log(`❌ API endpoint returning ${status} - check Cloud Function deployment`);
      } else if (!hasForm || !hasInputs) {
        console.log('❌ API works but form not rendering - check frontend code');
        console.log('   - Check useEffect dependencies');
        console.log('   - Check error handling in fetchIntakeData');
        console.log('   - Check if data structure matches expected format');
      }
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`❌ Debug Error: ${errorMsg}`);
      await page.screenshot({ path: 'api-debug-error.png', fullPage: true });
      throw error;
    }
  });
});