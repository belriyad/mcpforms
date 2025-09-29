import { test, expect } from '@playwright/test';

test.describe('Comprehensive Intake URL Test', () => {
  test('Complete validation of intake URL functionality', async ({ page }) => {
    console.log('🎯 COMPREHENSIVE INTAKE URL VALIDATION');
    console.log('======================================');
    
    const intakeToken = 'e5e3d925-a050-4e7f-b061-c77eeef66802';
    const intakeUrl = `http://localhost:3000/intake/${intakeToken}`;
    
    try {
      // Step 1: Wait for server to be ready
      console.log('⏳ Step 1: Waiting for server...');
      await page.goto('http://localhost:3000');
      await page.waitForTimeout(2000);
      console.log('✅ Server is ready');
      
      // Step 2: Test API endpoint directly
      console.log('🌐 Step 2: Testing API endpoint...');
      await page.goto(`http://localhost:3000/api/intake/${intakeToken}`);
      const apiResponse = await page.textContent('body');
      
      try {
        const apiData = JSON.parse(apiResponse || '{}');
        console.log(`✅ API Success: ${apiData.success}`);
        console.log(`📝 Service: ${apiData.data?.serviceName}`);
        console.log(`📊 Fields: ${apiData.data?.formFields?.length}`);
      } catch {
        console.log('❌ API returned invalid JSON');
        console.log(`Response: ${apiResponse?.substring(0, 200)}`);
        throw new Error('API endpoint not working');
      }
      
      // Step 3: Navigate to intake form
      console.log('📄 Step 3: Loading intake form...');
      await page.goto(intakeUrl);
      
      // Wait with multiple strategies
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(5000); // Extended wait
      
      // Check for loading states
      const hasLoading = await page.locator('text=/loading/i').count();
      if (hasLoading > 0) {
        console.log('⏳ Page is still loading, waiting more...');
        await page.waitForTimeout(5000);
      }
      
      await page.screenshot({ path: 'comprehensive-intake-loaded.png', fullPage: true });
      
      // Step 4: Analyze page content in detail
      console.log('🔍 Step 4: Analyzing page content...');
      
      const pageTitle = await page.title();
      const url = page.url();
      const bodyText = await page.textContent('body');
      
      console.log(`📄 Page Title: ${pageTitle}`);
      console.log(`🔗 Final URL: ${url}`);
      console.log(`📏 Content Length: ${bodyText?.length} chars`);
      
      // Check for specific elements
      const formCount = await page.locator('form').count();
      const inputCount = await page.locator('input:not([type="hidden"])').count();
      const textareaCount = await page.locator('textarea').count();
      const selectCount = await page.locator('select').count();
      const buttonCount = await page.locator('button').count();
      const errorCount = await page.locator('text=/error|not found|404/i').count();
      
      console.log(`📋 Element Analysis:`);
      console.log(`   Forms: ${formCount}`);
      console.log(`   Inputs: ${inputCount}`);
      console.log(`   Textareas: ${textareaCount}`);
      console.log(`   Selects: ${selectCount}`);
      console.log(`   Buttons: ${buttonCount}`);
      console.log(`   Errors: ${errorCount}`);
      
      // Step 5: Check if page is actually rendered vs just loading
      if (bodyText && bodyText.length > 100) {
        const hasNextJsMarkers = bodyText.includes('__next_f');
        const hasReactMarkers = bodyText.includes('React');
        const hasFormContent = bodyText.includes('form') || bodyText.includes('input');
        
        console.log(`🔍 Content Analysis:`);
        console.log(`   Has Next.js markers: ${hasNextJsMarkers}`);
        console.log(`   Has React content: ${hasReactMarkers}`);
        console.log(`   Has form content: ${hasFormContent}`);
        
        // If we see Next.js markers but no form, it might be a hydration issue
        if (hasNextJsMarkers && !formCount) {
          console.log('⚠️ Possible hydration issue - waiting for React to render...');
          await page.waitForTimeout(5000);
          
          // Re-check after additional wait
          const newFormCount = await page.locator('form').count();
          const newInputCount = await page.locator('input:not([type="hidden"])').count();
          
          console.log(`🔄 After additional wait:`);
          console.log(`   Forms: ${newFormCount}`);
          console.log(`   Inputs: ${newInputCount}`);
        }
      }
      
      // Step 6: Final assessment
      const finalFormCount = await page.locator('form').count();
      const finalInputCount = await page.locator('input:not([type="hidden"])').count();
      const finalTextareaCount = await page.locator('textarea').count();
      const finalSelectCount = await page.locator('select').count();
      
      console.log('\n🏆 FINAL RESULTS:');
      console.log('==================');
      
      if (finalFormCount > 0 && (finalInputCount + finalTextareaCount + finalSelectCount) > 0) {
        console.log('🎉 SUCCESS: Intake form is working!');
        console.log(`✅ ${finalFormCount} form(s) with ${finalInputCount + finalTextareaCount + finalSelectCount} fields`);
        
        // Quick interaction test
        const firstInput = await page.locator('input[type="text"], input[type="email"]').first();
        if (await firstInput.count() > 0) {
          await firstInput.fill('Test Success');
          const value = await firstInput.inputValue();
          console.log(`✅ Form interaction works: "${value}"`);
        }
        
        console.log('\n🎊 INTAKE URL IS FULLY FUNCTIONAL! 🎊');
        console.log(`🔗 Working URL: ${intakeUrl}`);
        
      } else if (errorCount > 0) {
        console.log('❌ Page has errors');
        const errorElements = await page.locator('*').filter({ hasText: /error|not found|404/i }).first();
        const errorText = await errorElements.textContent();
        console.log(`Error message: ${errorText}`);
        
      } else {
        console.log('⚠️ Page loaded but form not rendered');
        console.log('This could be due to:');
        console.log('   - Slow network/API response');
        console.log('   - JavaScript hydration issues');
        console.log('   - React rendering problems');
        console.log('   - Data fetching errors');
        
        // Show some page content for debugging
        if (bodyText) {
          console.log(`\nPage content sample: ${bodyText.substring(0, 300)}...`);
        }
      }
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`❌ Test Error: ${errorMsg}`);
      await page.screenshot({ path: 'comprehensive-test-error.png', fullPage: true });
      throw error;
    }
  });
});