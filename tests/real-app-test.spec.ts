import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3002';

test.describe('MCPForms - Real Application Testing', () => {

  test('Explore home page and navigation', async ({ page }) => {
    console.log('🏠 Testing home page...');
    
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
    
    // Check main page elements
    const title = await page.title();
    console.log(`📄 Page title: ${title}`);
    
    // Look for main navigation elements
    const heroSection = page.locator('[data-testid="hero-section"]');
    await expect(heroSection).toBeVisible();
    
    const adminLink = page.locator('a[href="/admin"]');
    const demoLink = page.locator('a[href="/demo"]');
    
    if (await adminLink.isVisible()) {
      console.log('✅ Found Admin Dashboard link');
    }
    
    if (await demoLink.isVisible()) {
      console.log('✅ Found Demo link');
    }
    
    // Take a screenshot of the home page
    await page.screenshot({ path: 'test-results/homepage.png', fullPage: true });
    
    console.log('✅ Home page exploration completed');
  });

  test('Access admin dashboard and explore features', async ({ page }) => {
    console.log('🔐 Testing admin dashboard access...');
    
    await page.goto(`${BASE_URL}/admin`);
    await page.waitForLoadState('networkidle');
    
    // Check what we see on admin page
    const pageContent = await page.content();
    console.log(`📝 Page content length: ${pageContent.length} characters`);
    
    // Look for authentication elements
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const loginButton = page.locator('button[type="submit"]');
    
    // Check if login form is present
    if (await emailInput.isVisible({ timeout: 5000 })) {
      console.log('🔑 Login form found');
      
      // Take screenshot of login form
      await page.screenshot({ path: 'test-results/login-form.png', fullPage: true });
      
      // Try to log in (this may fail without proper credentials)
      await emailInput.fill('test@mcpforms.com');
      await passwordInput.fill('testpassword');
      
      console.log('📝 Filled login form (testing purposes)');
      
      // Don't actually submit - just testing form filling
      // await loginButton.click();
      
    } else {
      // Check if we're already on dashboard or see loading/error states
      const loadingSpinner = page.locator('text=Connecting to Firebase');
      const authError = page.locator('text=Authentication Error');
      const dashboardTitle = page.locator('text=Smart Forms AI Admin');
      
      if (await loadingSpinner.isVisible({ timeout: 3000 })) {
        console.log('⏳ Firebase connecting...');
        await page.waitForTimeout(5000); // Wait for Firebase
      }
      
      if (await authError.isVisible({ timeout: 3000 })) {
        console.log('❌ Firebase authentication error detected');
        await page.screenshot({ path: 'test-results/auth-error.png', fullPage: true });
      }
      
      if (await dashboardTitle.isVisible({ timeout: 3000 })) {
        console.log('✅ Already on admin dashboard');
        await page.screenshot({ path: 'test-results/admin-dashboard.png', fullPage: true });
      }
    }
    
    console.log('✅ Admin dashboard exploration completed');
  });

  test('Test intake form structure (without valid token)', async ({ page }) => {
    console.log('📝 Testing intake form structure...');
    
    // Test intake URL structure
    const testToken = 'test-token-123';
    await page.goto(`${BASE_URL}/intake/${testToken}`);
    await page.waitForLoadState('networkidle');
    
    // Check what we get - likely an error but let's see the structure
    const title = await page.title();
    console.log(`📄 Intake page title: ${title}`);
    
    const content = await page.content();
    console.log(`📝 Content length: ${content.length} characters`);
    
    // Look for form elements or error messages
    const formElements = await page.locator('input, select, textarea').count();
    console.log(`📋 Found ${formElements} form elements`);
    
    // Look for error messages
    const errorMessages = page.locator('text=Error, text=404, text=Not found');
    if (await errorMessages.count() > 0) {
      console.log('❌ Error page detected (expected without valid token)');
    }
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/intake-form-test.png', fullPage: true });
    
    console.log('✅ Intake form structure test completed');
  });

  test('Form filling demonstration with sample data', async ({ page }) => {
    console.log('📝 Demonstrating form filling capabilities...');
    
    // Go to admin page and look for any forms
    await page.goto(`${BASE_URL}/admin`);
    await page.waitForLoadState('networkidle');
    
    // Sample form data to demonstrate capabilities
    const sampleData = {
      email: 'demo@mcpforms.com',
      password: 'demopassword123',
      firstName: 'John',
      lastName: 'Doe',
      company: 'Demo Company LLC',
      phone: '555-123-4567',
      address: '123 Demo Street',
      city: 'Demo City',
      state: 'CA',
      zipCode: '90210'
    };
    
    // Look for any input fields and demonstrate filling
    const inputs = page.locator('input[type="email"], input[type="text"], input[type="password"]');
    const inputCount = await inputs.count();
    
    console.log(`🔍 Found ${inputCount} fillable input fields`);
    
    if (inputCount > 0) {
      // Fill email field if present
      const emailField = page.locator('input[type="email"]');
      if (await emailField.isVisible({ timeout: 2000 })) {
        await emailField.fill(sampleData.email);
        console.log('✅ Filled email field');
      }
      
      // Fill password field if present
      const passwordField = page.locator('input[type="password"]');
      if (await passwordField.isVisible({ timeout: 2000 })) {
        await passwordField.fill(sampleData.password);
        console.log('✅ Filled password field');
      }
      
      // Fill any text fields
      const textFields = page.locator('input[type="text"]');
      const textCount = await textFields.count();
      
      if (textCount > 0) {
        const sampleValues = [sampleData.firstName, sampleData.lastName, sampleData.company, sampleData.phone];
        
        for (let i = 0; i < Math.min(textCount, sampleValues.length); i++) {
          await textFields.nth(i).fill(sampleValues[i]);
          console.log(`✅ Filled text field ${i + 1}: ${sampleValues[i]}`);
        }
      }
    }
    
    // Look for select dropdowns
    const selects = page.locator('select');
    const selectCount = await selects.count();
    
    if (selectCount > 0) {
      console.log(`🔽 Found ${selectCount} dropdown fields`);
      
      // Try to select options in dropdowns
      for (let i = 0; i < selectCount; i++) {
        const options = await selects.nth(i).locator('option').count();
        if (options > 1) {
          await selects.nth(i).selectOption({ index: 1 }); // Select second option
          console.log(`✅ Selected option in dropdown ${i + 1}`);
        }
      }
    }
    
    // Look for textareas
    const textareas = page.locator('textarea');
    const textareaCount = await textareas.count();
    
    if (textareaCount > 0) {
      console.log(`📝 Found ${textareaCount} textarea fields`);
      
      const sampleText = 'This is a demonstration of automated form filling using Playwright. The system can handle various form field types including text inputs, email fields, passwords, dropdowns, and text areas.';
      
      for (let i = 0; i < textareaCount; i++) {
        await textareas.nth(i).fill(sampleText);
        console.log(`✅ Filled textarea ${i + 1}`);
      }
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'test-results/form-filling-demo.png', fullPage: true });
    
    console.log('✅ Form filling demonstration completed');
    console.log('📊 Summary:');
    console.log(`   - Total input fields found: ${inputCount}`);
    console.log(`   - Text inputs filled: ${Math.min(inputCount, 4)}`); 
    console.log(`   - Dropdowns filled: ${selectCount}`);
    console.log(`   - Text areas filled: ${textareaCount}`);
  });

  test('Document generation exploration', async ({ page }) => {
    console.log('📄 Exploring document generation capabilities...');
    
    await page.goto(`${BASE_URL}/admin`);
    await page.waitForLoadState('networkidle');
    
    // Look for template-related functionality
    const templateElements = [
      'text=Template',
      'text=Upload',
      'text=Document',
      'text=Generate',
      'input[type="file"]',
      'button:has-text("Upload")',
      'a[href*=".pdf"]',
      'a[href*=".docx"]',
      'a[download]'
    ];
    
    let foundElements = [];
    
    for (const selector of templateElements) {
      const isVisible = await page.locator(selector).isVisible({ timeout: 2000 }).catch(() => false);
      if (isVisible) {
        foundElements.push(selector);
        console.log(`✅ Found: ${selector}`);
      }
    }
    
    if (foundElements.length === 0) {
      console.log('⚠️ No template/document generation elements found on current page');
    } else {
      console.log(`📊 Found ${foundElements.length} document-related elements`);
    }
    
    // Check for file upload capabilities
    const fileInputs = page.locator('input[type="file"]');
    const fileInputCount = await fileInputs.count();
    
    if (fileInputCount > 0) {
      console.log(`📁 Found ${fileInputCount} file upload fields`);
      
      // We could upload a sample template here if we had one
      console.log('💡 File upload capability detected - ready for template upload');
    }
    
    await page.screenshot({ path: 'test-results/document-generation-exploration.png', fullPage: true });
    
    console.log('✅ Document generation exploration completed');
  });

});