import { test, expect } from '@playwright/test';
import * as path from 'path';

test.describe('MCPForms E2E Workflow', () => {
  let templateIds: string[] = [];
  let serviceId: string = '';
  let intakeLink: string = '';

  test.beforeEach(async ({ page }) => {
    // Navigate to admin page
    await page.goto('/admin');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check if login is required
    const loginForm = page.locator('form:has(input[type="email"])');
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    
    if (await emailInput.isVisible()) {
      console.log('🔐 Login required, authenticating...');
      
      // Fill login credentials (try test user first, then known working user)
      await emailInput.fill('test@example.com');
      await passwordInput.fill('password123');
      
      // Submit login form
      const loginButton = page.locator('button[type="submit"], button:has-text("Sign In")');
      await loginButton.click();
      
      // Wait for successful login and dashboard to load
      await page.waitForURL('/admin', { timeout: 15000 });
      await page.waitForLoadState('networkidle');
      
      console.log('✅ Successfully authenticated');
    }
  });

  test('Complete E2E workflow: Upload templates → Create service → Generate intake → Test intake', async ({ page }) => {
    console.log('🚀 Starting complete E2E workflow test...');

    // Step 1: Upload template files
    console.log('📤 Step 1: Uploading template files...');
    
    const templateFiles = [
      'sample-template.txt',
      'template1.txt', 
      'template2.txt'
    ];

    for (const filename of templateFiles) {
      console.log(`📁 Uploading ${filename}...`);
      
      // Find and fill the file input
      const fileInput = page.locator('input[type="file"]');
      const filePath = path.join(process.cwd(), 'test-data', filename);
      
      await fileInput.setInputFiles(filePath);
      
      // Wait for upload button and click
      const uploadButton = page.locator('button:has-text("Upload Template")');
      await uploadButton.click();
      
      // Wait for success message or processing indication
      await expect(page.locator('text=uploaded successfully')).toBeVisible({ timeout: 10000 });
      
      console.log(`✅ ${filename} uploaded successfully`);
      
      // Wait a moment between uploads
      await page.waitForTimeout(2000);
    }

    // Step 2: Navigate to services and create "Test 101" service
    console.log('🛠️ Step 2: Creating Test 101 service...');
    
    // Look for Services link/tab/button
    await page.click('text=Services');
    
    // Click create service button
    await page.click('button:has-text("Create Service")');
    
    // Fill service name
    await page.fill('input[name="serviceName"], input[placeholder*="service"], input[placeholder*="name"]', 'Test 101');
    
    // Select templates (assuming checkboxes or select elements)
    const templateCheckboxes = page.locator('input[type="checkbox"]');
    const templateCount = await templateCheckboxes.count();
    
    // Select all available templates
    for (let i = 0; i < templateCount; i++) {
      await templateCheckboxes.nth(i).check();
    }
    
    // Submit service creation
    await page.click('button:has-text("Create"), button:has-text("Save")');
    
    // Wait for success message
    await expect(page.locator('text=service created, text=Test 101')).toBeVisible({ timeout: 10000 });
    
    console.log('✅ Test 101 service created successfully');

    // Step 3: Generate intake link
    console.log('🔗 Step 3: Generating intake link...');
    
    // Find the Test 101 service and generate intake link
    const serviceRow = page.locator('tr:has-text("Test 101"), div:has-text("Test 101")');
    await serviceRow.locator('button:has-text("Generate Link"), button:has-text("Generate Intake")').click();
    
    // Wait for intake link to be generated
    await expect(page.locator('text=intake link, text=generated')).toBeVisible({ timeout: 10000 });
    
    // Copy the intake link
    const linkElement = page.locator('input[value*="http"], a[href*="intake"]');
    intakeLink = await linkElement.getAttribute('value') || await linkElement.getAttribute('href') || '';
    
    if (!intakeLink) {
      // Try to find link in text content
      const linkText = await page.locator('text=/http.*intake.*link/').textContent();
      intakeLink = linkText?.match(/https?:\/\/[^\s]+/)?.[0] || '';
    }
    
    expect(intakeLink).toBeTruthy();
    console.log('✅ Intake link generated:', intakeLink);

    // Step 4: Test the intake link
    console.log('🧪 Step 4: Testing intake link functionality...');
    
    // Navigate to intake link
    await page.goto(intakeLink);
    
    // Wait for intake form to load
    await page.waitForLoadState('networkidle');
    
    // Verify form elements are present
    await expect(page.locator('form')).toBeVisible();
    
    // Fill out the form with test data
    const inputs = page.locator('input[type="text"], input[type="email"], textarea');
    const inputCount = await inputs.count();
    
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const inputType = await input.getAttribute('type');
      const inputName = await input.getAttribute('name') || await input.getAttribute('placeholder') || '';
      
      // Fill based on input type/name
      if (inputType === 'email' || inputName.toLowerCase().includes('email')) {
        await input.fill('test@example.com');
      } else if (inputName.toLowerCase().includes('name')) {
        await input.fill('John Doe Test');
      } else if (inputName.toLowerCase().includes('company')) {
        await input.fill('Test Company Inc');
      } else if (inputName.toLowerCase().includes('phone')) {
        await input.fill('555-123-4567');
      } else if (inputName.toLowerCase().includes('address')) {
        await input.fill('123 Test Street, Test City, TS 12345');
      } else {
        await input.fill(`Test Value ${i + 1}`);
      }
    }
    
    // Submit the form
    const submitButton = page.locator('button[type="submit"], button:has-text("Submit")');
    await submitButton.click();
    
    // Wait for submission confirmation
    await expect(page.locator('text=submitted, text=success, text=thank you')).toBeVisible({ timeout: 10000 });
    
    console.log('✅ Intake form submitted successfully');

    // Final verification - check that we can see the submitted data in admin
    await page.goto('/admin');
    await page.click('text=Intakes');
    
    // Should see our submitted intake
    await expect(page.locator('text=Test 101, text=John Doe Test')).toBeVisible({ timeout: 10000 });
    
    console.log('🎉 Complete E2E workflow test passed!');
  });

  test('Individual template upload test', async ({ page }) => {
    console.log('📤 Testing individual template upload...');
    
    // Upload single file
    const fileInput = page.locator('input[type="file"]');
    const filePath = path.join(process.cwd(), 'test-data', 'sample-template.txt');
    
    await fileInput.setInputFiles(filePath);
    
    const uploadButton = page.locator('button:has-text("Upload Template")');
    await uploadButton.click();
    
    // Verify upload success
    await expect(page.locator('text=uploaded successfully, text=processing')).toBeVisible({ timeout: 15000 });
    
    console.log('✅ Individual template upload test passed');
  });

  test('Service creation test', async ({ page }) => {
    console.log('🛠️ Testing service creation...');
    
    // Navigate to services
    await page.click('text=Services');
    
    // Create service
    await page.click('button:has-text("Create Service")');
    await page.fill('input[name="serviceName"], input[placeholder*="service"]', 'Test Service for E2E');
    
    // Select at least one template if available
    const templateCheckbox = page.locator('input[type="checkbox"]').first();
    if (await templateCheckbox.isVisible()) {
      await templateCheckbox.check();
    }
    
    await page.click('button:has-text("Create"), button:has-text("Save")');
    
    // Verify service creation
    await expect(page.locator('text=created, text=Test Service for E2E')).toBeVisible({ timeout: 10000 });
    
    console.log('✅ Service creation test passed');
  });
});