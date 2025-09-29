import { test, expect } from '@playwright/test';

test.describe('Simple Intake URL Debug', () => {
  test('Direct test of intake URL', async ({ page }) => {
    console.log('🔍 DIRECT INTAKE URL DEBUG TEST');
    console.log('===============================');
    
    const intakeToken = 'e5e3d925-a050-4e7f-b061-c77eeef66802';
    
    try {
      // Test both port configurations you mentioned
      const urlsToTest = [
        `http://localhost:3000/intake/${intakeToken}`,
        `http://localhost:3002/intake/${intakeToken}`
      ];
      
      for (const testUrl of urlsToTest) {
        console.log(`\n🔗 Testing URL: ${testUrl}`);
        console.log('=' .repeat(50));
        
        try {
          // Navigate to the intake URL
          console.log('📍 Navigating to URL...');
          const response = await page.goto(testUrl, { 
            waitUntil: 'networkidle',
            timeout: 10000 
          });
          
          const status = response?.status() || 0;
          const statusText = response?.statusText() || 'Unknown';
          
          console.log(`📊 HTTP Response: ${status} ${statusText}`);
          console.log(`📍 Final URL: ${page.url()}`);
          
          await page.screenshot({ 
            path: `intake-debug-${testUrl.includes('3000') ? '3000' : '3002'}.png`, 
            fullPage: true 
          });
          
          // Analyze page content
          const pageTitle = await page.title();
          const bodyText = await page.textContent('body');
          const hasForm = await page.locator('form').count() > 0;
          const inputCount = await page.locator('input').count();
          const errorCount = await page.locator('text=/error|404|not found|invalid|expired/i').count();
          
          console.log(`📄 Page Title: "${pageTitle}"`);
          console.log(`📝 Has Form: ${hasForm}`);
          console.log(`✏️  Input Count: ${inputCount}`);
          console.log(`❌ Error Count: ${errorCount}`);
          console.log(`📏 Body Length: ${bodyText?.length || 0} characters`);
          
          if (bodyText && bodyText.length > 0) {
            console.log(`📋 Content Preview: "${bodyText.substring(0, 200)}..."`);
          }
          
          // Check for specific error messages
          if (errorCount > 0) {
            console.log('🚨 ERROR MESSAGES FOUND:');
            const errorElements = await page.locator('*').filter({ 
              hasText: /error|404|not found|invalid|expired/i 
            }).all();
            
            for (let i = 0; i < Math.min(errorElements.length, 3); i++) {
              const errorText = await errorElements[i].textContent();
              console.log(`   Error ${i + 1}: "${errorText?.trim()}"`);
            }
          }
          
          // If we got here successfully, test form interaction
          if (status === 200 && hasForm && inputCount > 0 && errorCount === 0) {
            console.log('✅ SUCCESS: Page loaded correctly with form!');
            
            // Test form interaction
            console.log('🔄 Testing form interaction...');
            const firstInput = await page.locator('input[type="text"], input[type="email"], input:not([type="hidden"]):not([type="submit"])').first();
            
            if (await firstInput.count() > 0) {
              const inputName = await firstInput.getAttribute('name');
              const placeholder = await firstInput.getAttribute('placeholder');
              console.log(`   Testing input: name="${inputName}", placeholder="${placeholder}"`);
              
              await firstInput.fill('Debug Test Value');
              const enteredValue = await firstInput.inputValue();
              console.log(`   ✅ Successfully entered: "${enteredValue}"`);
            }
            
            const submitButton = await page.locator('button[type="submit"], input[type="submit"]').first();
            if (await submitButton.count() > 0) {
              console.log('   ✅ Submit button found and accessible');
            }
            
            console.log('\n🎉 INTAKE PAGE IS WORKING CORRECTLY!');
            console.log('=====================================');
            return; // Success, exit the test
            
          } else {
            console.log('⚠️ ISSUES DETECTED:');
            if (status !== 200) console.log(`   ❌ HTTP Status: ${status} (expected 200)`);
            if (!hasForm) console.log('   ❌ No form element found');
            if (inputCount === 0) console.log('   ❌ No input fields found');
            if (errorCount > 0) console.log(`   ❌ ${errorCount} error messages found`);
          }
          
        } catch (urlError) {
          const errorMsg = urlError instanceof Error ? urlError.message : String(urlError);
          console.log(`❌ Failed to load ${testUrl}:`);
          console.log(`   Error: ${errorMsg.substring(0, 150)}`);
        }
      }
      
      // If we reach here, both URLs failed
      console.log('\n❌ BOTH URLS FAILED');
      console.log('===================');
      console.log('💡 Possible issues:');
      console.log('   1. Intake token is invalid or expired');
      console.log('   2. Server is not running on expected ports');
      console.log('   3. Intake route is not properly configured'); 
      console.log('   4. Database/Firebase connection issues');
      
      // Try to access the admin dashboard as a baseline
      console.log('\n🔄 Testing admin dashboard as baseline...');
      try {
        await page.goto('http://localhost:3000/admin');
        await page.waitForTimeout(2000);
        const adminTitle = await page.title();
        console.log(`✅ Admin page accessible: "${adminTitle}"`);
        
        // Check if we can see any intakes in the admin panel
        const intakesButton = await page.locator('button').filter({ hasText: /Intakes/i }).first();
        if (await intakesButton.count() > 0) {
          await intakesButton.click();
          await page.waitForTimeout(2000);
          
          const pageContent = await page.textContent('body');
          const hasOurToken = pageContent?.includes(intakeToken) || false;
          
          console.log(`📋 Our token (${intakeToken}) found in admin: ${hasOurToken}`);
          
          if (!hasOurToken) {
            console.log('💡 Token not found in admin - it may be invalid or expired');
          }
        }
        
      } catch (adminError) {
        console.log('❌ Admin dashboard also not accessible');
      }
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`❌ Test Error: ${errorMsg}`);
      await page.screenshot({ path: 'intake-debug-error.png', fullPage: true });
      throw error;
    }
  });
});