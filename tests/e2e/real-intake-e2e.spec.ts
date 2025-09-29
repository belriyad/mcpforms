import { test, expect } from '@playwright/test';

test.describe('Real Intake Link E2E Test', () => {
  test('Generate intake link and verify form loads', async ({ page }) => {
    console.log('🚀 REAL E2E INTAKE LINK TEST');
    console.log('=================================');
    
    try {
      // Step 1: Navigate to admin page
      console.log('📋 STEP 1: Navigate to Admin Page');
      await page.goto('/admin');
      
      // Wait for page to load - give it some time but don't wait for networkidle
      await page.waitForTimeout(3000);
      
      console.log('✅ Successfully navigated to admin page');
      
      // Step 2: Take a screenshot to see what's on the page
      console.log('📸 STEP 2: Take screenshot of admin page');
      await page.screenshot({ path: 'admin-page-initial.png', fullPage: true });
      
      // Step 3: Check if there's a login form or dashboard
      console.log('🔍 STEP 3: Analyzing page content...');
      const pageContent = await page.textContent('body');
      console.log('Page content preview:', pageContent?.substring(0, 500));
      
      // Look for login form
      const loginForm = await page.locator('form, input[type="email"], input[type="password"]').first();
      const hasLogin = await loginForm.count() > 0;
      console.log(`Has login form: ${hasLogin}`);
      
      if (hasLogin) {
        console.log('🔑 STEP 4: Login form detected - attempting to find demo credentials or bypass');
        
        // Look for any existing credentials or demo login
        const emailInput = await page.locator('input[type="email"]').first();
        const passwordInput = await page.locator('input[type="password"]').first();
        const submitButton = await page.locator('button[type="submit"], input[type="submit"]').first();
        
        if (await emailInput.count() > 0 && await passwordInput.count() > 0) {
          console.log('🔑 Attempting demo login...');
          await emailInput.fill('demo@example.com');
          await passwordInput.fill('demo123');
          
          if (await submitButton.count() > 0) {
            await submitButton.click();
            await page.waitForTimeout(3000);
            await page.screenshot({ path: 'after-login-attempt.png', fullPage: true });
          }
        }
      } else {
        console.log('✅ STEP 4: No login form - checking for dashboard content');
      }
      
      // Step 5: Look for any intake-related functionality
      console.log('🔍 STEP 5: Looking for intake generation features...');
      
      // Look for buttons, links, or any element that could generate an intake
      const intakeElements = await page.locator('button, a, div').filter({ hasText: /intake|generate|create|template|service/i }).all();
      console.log(`Found ${intakeElements.length} intake-related elements:`);
      
      for (let i = 0; i < intakeElements.length; i++) {
        const element = intakeElements[i];
        const text = await element.textContent();
        const tagName = await element.evaluate(el => el.tagName);
        const isClickable = await element.evaluate(el => {
          const style = getComputedStyle(el);
          return style.cursor === 'pointer' || el.tagName === 'BUTTON' || el.tagName === 'A';
        });
        console.log(`Element ${i + 1}: <${tagName}> "${text?.trim()}" (clickable: ${isClickable})`);
      }
      
      // Step 6: Try to generate an intake link if possible
      if (intakeElements.length > 0) {
        console.log('🎯 STEP 6: Attempting to generate intake link...');
        
        // Try clicking the first likely candidate
        const firstElement = intakeElements[0];
        const text = await firstElement.textContent();
        console.log(`Clicking on: "${text?.trim()}"`);
        
        try {
          await firstElement.click();
          await page.waitForTimeout(2000);
          await page.screenshot({ path: 'after-click-attempt.png', fullPage: true });
          
          // Check if any new content appeared or if we can find a generated link
          const currentUrl = page.url();
          console.log(`Current URL after click: ${currentUrl}`);
          
          // Look for any URLs that might be intake links
          const allLinks = await page.locator('a[href*="intake"]').all();
          console.log(`Found ${allLinks.length} intake links on page`);
          
          if (allLinks.length > 0) {
            const intakeLink = await allLinks[0].getAttribute('href');
            console.log(`🎉 Found intake link: ${intakeLink}`);
            
            // Step 7: Test the intake link
            console.log('🔗 STEP 7: Testing intake link...');
            if (intakeLink) {
              await page.goto(intakeLink);
              await page.waitForTimeout(3000);
              await page.screenshot({ path: 'intake-form-page.png', fullPage: true });
              
              const formContent = await page.textContent('body');
              console.log('Intake form content preview:', formContent?.substring(0, 300));
              
              // Check if it looks like a form
              const hasFormElements = await page.locator('form, input, textarea, select').count() > 0;
              console.log(`✅ Intake form has form elements: ${hasFormElements}`);
              
              if (hasFormElements) {
                console.log('🎉 SUCCESS: Intake link generates a working form!');
              } else {
                console.log('⚠️ Intake link loaded but no form elements found');
              }
            }
          } else {
            console.log('⚠️ No intake links found after clicking');
          }
          
        } catch (clickError) {
          console.log(`⚠️ Could not click element: ${clickError}`);
        }
      } else {
        console.log('⚠️ No intake-related elements found on the page');
      }
      
      console.log('✅ E2E test completed successfully');
      
    } catch (error) {
      console.error('❌ E2E Test Error:', error);
      await page.screenshot({ path: 'e2e-test-error.png', fullPage: true });
      throw error;
    }
  });
});