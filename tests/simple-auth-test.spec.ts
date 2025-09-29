import { test, expect } from '@playwright/test';

test('Simple authentication test', async ({ page }) => {
  console.log('🔐 Testing authentication only...');
  
  test.setTimeout(30000);
  
  try {
    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    // Take a screenshot of initial state
    await page.screenshot({ path: 'auth-test-1-initial.png' });
    
    // Check page content
    const bodyText = await page.locator('body').textContent();
    console.log('📄 Page content preview:', bodyText?.substring(0, 200));
    
    // Look for login elements
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitButton = page.locator('button[type="submit"]');
    
    console.log('🔍 Email input visible:', await emailInput.isVisible());
    console.log('🔍 Password input visible:', await passwordInput.isVisible());
    console.log('🔍 Submit button visible:', await submitButton.isVisible());
    
    if (await emailInput.isVisible()) {
      console.log('✏️ Filling in credentials...');
      await emailInput.fill('test@example.com');
      await passwordInput.fill('password123');
      
      await page.screenshot({ path: 'auth-test-2-filled.png' });
      
      // Check if submit button is enabled
      const isEnabled = await submitButton.isEnabled();
      console.log('🔘 Submit button enabled:', isEnabled);
      
      if (isEnabled) {
        console.log('🖱️ Clicking submit...');
        await submitButton.click();
        await page.waitForTimeout(5000);
        
        await page.screenshot({ path: 'auth-test-3-submitted.png' });
        
        // Check if we're still on login page or if we moved forward
        const stillOnLogin = await emailInput.isVisible();
        console.log('📍 Still on login page:', stillOnLogin);
        
        if (stillOnLogin) {
          console.log('🔄 First login failed, trying alternative...');
          await emailInput.fill('briyad@gmail.com');
          await passwordInput.fill('testpassword123');
          await submitButton.click();
          await page.waitForTimeout(5000);
          
          await page.screenshot({ path: 'auth-test-4-alternative.png' });
          
          const stillOnLoginAfterSecond = await emailInput.isVisible();
          console.log('📍 Still on login after second attempt:', stillOnLoginAfterSecond);
        }
        
        // Check what's visible after authentication
        const templateText = page.locator('text=Template');
        const servicesText = page.locator('text=Services');
        const uploadButton = page.locator('button:has-text("Upload")');
        
        console.log('🔍 Template text visible:', await templateText.isVisible());
        console.log('🔍 Services text visible:', await servicesText.isVisible());
        console.log('🔍 Upload button visible:', await uploadButton.isVisible());
        
      } else {
        console.log('❌ Submit button is disabled');
      }
    } else {
      console.log('❌ No login form found - may already be authenticated or different issue');
      
      // Check for error messages
      const errorText = page.locator('text=error, text=Error, text=failed, text=Failed');
      if (await errorText.isVisible()) {
        const errorContent = await errorText.textContent();
        console.log('⚠️ Error message found:', errorContent);
      }
    }
    
    console.log('✅ Authentication test completed');
    
  } catch (error) {
    console.error('❌ Authentication test error:', error);
    await page.screenshot({ path: 'auth-test-error.png' });
  }
});