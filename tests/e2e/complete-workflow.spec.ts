import { test, expect } from '@playwright/test';
import path from 'path';

const SAMPLE_FILES = [
  'Warranty Deed Template.docx',
  'Revocable Living Trust Template.docx', 
  'Certificate_of_Trust_Fillable Template.docx'
];

test.describe('Complete E2E Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3002');
    
    // Check if we're on landing page or already logged in
    const adminDashboardLink = page.locator('a:has-text("Admin Dashboard")');
    
    if (await adminDashboardLink.isVisible()) {
      // We're on landing page - click Admin Dashboard
      console.log('🏠 On landing page, clicking Admin Dashboard');
      await adminDashboardLink.click();
      
      // Wait for auth check and potential redirect to login
      await page.waitForTimeout(3000);
      
      // Check if we need to sign in
      const googleSignInButton = page.locator('button:has-text("Sign in with Google")');
      if (await googleSignInButton.isVisible()) {
        console.log('🔐 Login required, signing in with Google');
        await googleSignInButton.click();
        
        // Wait for auth to complete and redirect
        await page.waitForTimeout(3000);
      }
    }
    
    // Wait for dashboard - check for various possible indicators
    const dashboardIndicators = [
      page.locator('text=Admin Dashboard'),
      page.locator('text=Template Management'), 
      page.locator('text=Service Management'),
      page.locator('text=Templates'),
      page.locator('text=Services')
    ];
    
    let dashboardLoaded = false;
    for (const indicator of dashboardIndicators) {
      try {
        await indicator.waitFor({ timeout: 3000 });
        dashboardLoaded = true;
        console.log(`✅ Dashboard loaded - found: ${await indicator.textContent()}`);
        break;
      } catch (e) {
        // Continue to next indicator
      }
    }
    
    if (!dashboardLoaded) {
      console.log('❌ Dashboard not loaded, current page content:');
      console.log(await page.content());
      throw new Error('Dashboard failed to load');
    }
  });

  test('should complete full workflow: upload templates -> create service -> generate intake', async ({ page }) => {
    console.log('🚀 Starting complete E2E workflow test');

    // Step 1: Upload templates
    console.log('📤 Step 1: Uploading templates...');
    
    // Navigate to templates
    await page.click('text=Templates');
    await expect(page.locator('text=Template Management')).toBeVisible();

    const uploadedTemplateIds: string[] = [];

    for (const filename of SAMPLE_FILES) {
      console.log(`📄 Uploading: ${filename}`);
      
      // Click upload button
      await page.click('button:has-text("Upload Template")');
      
      // Fill form
      await page.fill('input[name="name"]', filename.replace('.docx', ''));
      await page.fill('textarea[name="description"]', `Template for ${filename}`);
      
      // Upload file
      const filePath = path.join(__dirname, '..', '..', 'src', 'sample', filename);
      console.log(`📁 File path: ${filePath}`);
      
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(filePath);
      
      // Submit
      await page.click('button[type="submit"]:has-text("Upload Template")');
      
      // Wait for success and parsing
      await expect(page.locator('text=Template uploaded successfully')).toBeVisible({ timeout: 10000 });
      
      // Wait for parsing to complete (up to 60 seconds)
      await page.waitForFunction(() => {
        const statusElements = document.querySelectorAll('[data-testid="template-status"]');
        const lastStatus = statusElements[statusElements.length - 1];
        return lastStatus && (lastStatus.textContent === 'parsed' || lastStatus.textContent === 'error');
      }, { timeout: 60000 });
      
      // Check if parsing succeeded
      const lastStatusElement = page.locator('[data-testid="template-status"]').last();
      const status = await lastStatusElement.textContent();
      
      if (status === 'parsed') {
        console.log(`✅ ${filename} parsed successfully`);
      } else {
        console.log(`❌ ${filename} parsing failed with status: ${status}`);
        throw new Error(`Template parsing failed for ${filename}`);
      }
    }

    console.log(`✅ All ${SAMPLE_FILES.length} templates uploaded and parsed`);

    // Step 2: Create service
    console.log('🔧 Step 2: Creating service...');
    
    await page.click('text=Services');
    await expect(page.locator('text=Service Management')).toBeVisible();
    
    // Click create service
    await page.click('button:has-text("Create Service")');
    
    // Fill service form
    await page.fill('input[name="name"]', 'Test 101');
    await page.fill('textarea[name="description"]', 'E2E Test Service with all sample templates');
    
    // Select all available templates
    const templateCheckboxes = page.locator('input[type="checkbox"][name="templateIds"]');
    const checkboxCount = await templateCheckboxes.count();
    console.log(`📋 Found ${checkboxCount} templates to select`);
    
    for (let i = 0; i < checkboxCount; i++) {
      await templateCheckboxes.nth(i).check();
    }
    
    // Submit service creation
    console.log('💾 Submitting service creation...');
    await page.click('button[type="submit"]:has-text("Create Service")');
    
    // Wait for success message
    await expect(page.locator('text=Service created successfully')).toBeVisible({ timeout: 15000 });
    console.log('✅ Service creation success message shown');
    
    // Wait for service to appear in list
    await page.waitForTimeout(2000); // Give time for UI to update
    await expect(page.locator('text=Test 101')).toBeVisible({ timeout: 10000 });
    console.log('✅ Service "Test 101" appears in service list');

    // Step 3: Generate intake link
    console.log('🔗 Step 3: Generating intake link...');
    
    // Find the service row and click generate intake
    const serviceRow = page.locator('tr:has-text("Test 101")');
    await serviceRow.locator('button:has-text("Generate Intake")').click();
    
    // Wait for intake link generation
    await expect(page.locator('text=Intake link generated successfully')).toBeVisible({ timeout: 10000 });
    console.log('✅ Intake link generated successfully');
    
    // Get the intake link
    const intakeLinkElement = page.locator('[data-testid="intake-link"]').last();
    const intakeLink = await intakeLinkElement.textContent();
    console.log(`🔗 Intake link: ${intakeLink}`);
    
    // Step 4: Test intake link
    console.log('📝 Step 4: Testing intake link...');
    
    if (intakeLink) {
      // Open intake link in new tab
      const [intakePage] = await Promise.all([
        page.context().waitForEvent('page'),
        page.click(`a[href="${intakeLink}"]`)
      ]);
      
      // Wait for intake form
      await expect(intakePage.locator('text=Intake Form')).toBeVisible({ timeout: 10000 });
      console.log('✅ Intake form loads successfully');
      
      // Fill some basic fields if they exist
      const nameField = intakePage.locator('input[type="text"]').first();
      if (await nameField.isVisible()) {
        await nameField.fill('John Doe');
        console.log('✅ Filled sample name field');
      }
      
      // Check if form has submit button
      const submitButton = intakePage.locator('button[type="submit"]');
      if (await submitButton.isVisible()) {
        console.log('✅ Submit button is available');
      }
      
      await intakePage.close();
    }
    
    console.log('🎉 Complete E2E workflow test completed successfully!');
  });

  test('debug service creation with enhanced logging', async ({ page }) => {
    console.log('🔍 Starting service creation debug test');
    
    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'log' || msg.type() === 'error') {
        console.log(`🌐 Browser ${msg.type()}: ${msg.text()}`);
      }
    });

    // Navigate to services
    await page.click('text=Services');
    await expect(page.locator('text=Service Management')).toBeVisible();
    
    // Check how many services exist
    const serviceRows = page.locator('tbody tr');
    const initialCount = await serviceRows.count();
    console.log(`📊 Initial service count: ${initialCount}`);
    
    // Click create service
    await page.click('button:has-text("Create Service")');
    
    // Fill service form with test data
    await page.fill('input[name="name"]', 'Debug Test Service');
    await page.fill('textarea[name="description"]', 'Service for debugging creation issues');
    
    // Check available templates
    const templateCheckboxes = page.locator('input[type="checkbox"][name="templateIds"]');
    const checkboxCount = await templateCheckboxes.count();
    console.log(`📋 Available templates: ${checkboxCount}`);
    
    if (checkboxCount === 0) {
      console.log('❌ No templates available - need to upload templates first');
      return;
    }
    
    // Select first template
    await templateCheckboxes.first().check();
    
    // Submit with detailed logging
    console.log('💾 Submitting service creation with debug logging...');
    await page.click('button[type="submit"]:has-text("Create Service")');
    
    // Wait for response
    await page.waitForTimeout(5000);
    
    // Check if success message appears
    const successMessage = page.locator('text=Service created successfully');
    const hasSuccess = await successMessage.isVisible();
    console.log(`✅ Success message visible: ${hasSuccess}`);
    
    // Check final service count
    await page.waitForTimeout(2000);
    const finalCount = await serviceRows.count();
    console.log(`📊 Final service count: ${finalCount}`);
    console.log(`📈 Services added: ${finalCount - initialCount}`);
    
    // List all services
    for (let i = 0; i < finalCount; i++) {
      const serviceName = await serviceRows.nth(i).locator('td').first().textContent();
      console.log(`📋 Service ${i + 1}: ${serviceName}`);
    }
  });
});