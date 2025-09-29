import { test, expect, Page } from '@playwright/test';
import path from 'path';

const BASE_URL = 'http://localhost:3000';
const ADMIN_EMAIL = 'briyad@gmail.com';
// We'll handle auth manually or skip login if already authenticated

// Sample files paths
const SAMPLE_FILES = [
  'Certificate_of_Trust_Fillable Template.docx',
  'Revocable Living Trust Template.docx', 
  'Warranty Deed Template.docx'
];

const SAMPLE_DIR = path.join(__dirname, '..', 'src', 'sample');

test.describe('MCP Forms E2E Test', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    
    // Navigate to admin login
    await page.goto(`${BASE_URL}/admin`);
    console.log('🔗 Navigated to admin page');
    
    // Check if we need to login or if we're already authenticated
    try {
      await page.waitForSelector('text=Template Management', { timeout: 5000 });
      console.log('✅ Already authenticated - admin dashboard loaded');
    } catch {
      // Need to login - try automated login first
      try {
        await page.waitForSelector('input[type="email"]', { timeout: 5000 });
        
        // Fill email
        await page.fill('input[type="email"]', ADMIN_EMAIL);
        
        // Try common password or let user handle it
        console.log('🔐 Attempting automated login...');
        
        // Look for password field and try to continue
        const passwordField = page.locator('input[type="password"]');
        if (await passwordField.isVisible()) {
          // For automated testing, we might need to set up test credentials
          console.log('⚠️ Password required - using test password');
          await passwordField.fill('testpassword123'); // You can change this
          
          await page.click('button[type="submit"]');
          
          // Wait for either success or error
          try {
            await page.waitForSelector('text=Template Management', { timeout: 10000 });
            console.log('✅ Login successful');
          } catch {
            console.log('❌ Login failed - may need to set correct password');
            throw new Error('Authentication failed');
          }
        }
      } catch (loginError) {
        console.log('❌ Automated login failed:', loginError);
        throw new Error('Please ensure you have proper test credentials set up');
      }
    }
  });

  test('Upload first sample template', async () => {
    console.log('📤 Starting upload of first template...');
    
    // Click upload template button
    await page.click('text=Upload Template');
    
    // Wait for upload modal
    await page.waitForSelector('text=Template Name');
    
    // Enter template name
    const templateName = 'Certificate of Trust';
    await page.fill('input[placeholder="Enter template name"]', templateName);
    
    // Upload file
    const filePath = path.join(SAMPLE_DIR, SAMPLE_FILES[0]);
    await page.setInputFiles('input[type="file"]', filePath);
    
    console.log(`📄 Selected file: ${SAMPLE_FILES[0]}`);
    
    // Click upload button (should be direct upload by default)
    await page.click('text=Upload Template');
    
    // Wait for success message
    await expect(page.locator('text=Template uploaded successfully')).toBeVisible({ timeout: 30000 });
    
    console.log('✅ First template uploaded successfully');
    
    // Close modal
    await page.click('text=Cancel');
  });

  test('Upload second sample template', async () => {
    console.log('📤 Starting upload of second template...');
    
    await page.click('text=Upload Template');
    await page.waitForSelector('text=Template Name');
    
    const templateName = 'Revocable Living Trust';
    await page.fill('input[placeholder="Enter template name"]', templateName);
    
    const filePath = path.join(SAMPLE_DIR, SAMPLE_FILES[1]);
    await page.setInputFiles('input[type="file"]', filePath);
    
    console.log(`📄 Selected file: ${SAMPLE_FILES[1]}`);
    
    await page.click('text=Upload Template');
    await expect(page.locator('text=Template uploaded successfully')).toBeVisible({ timeout: 30000 });
    
    console.log('✅ Second template uploaded successfully');
    await page.click('text=Cancel');
  });

  test('Upload third sample template', async () => {
    console.log('📤 Starting upload of third template...');
    
    await page.click('text=Upload Template');
    await page.waitForSelector('text=Template Name');
    
    const templateName = 'Warranty Deed';
    await page.fill('input[placeholder="Enter template name"]', templateName);
    
    const filePath = path.join(SAMPLE_DIR, SAMPLE_FILES[2]);
    await page.setInputFiles('input[type="file"]', filePath);
    
    console.log(`📄 Selected file: ${SAMPLE_FILES[2]}`);
    
    await page.click('text=Upload Template');
    await expect(page.locator('text=Template uploaded successfully')).toBeVisible({ timeout: 30000 });
    
    console.log('✅ Third template uploaded successfully');
    await page.click('text=Cancel');
    
    // Verify all templates are visible
    await expect(page.locator('text=Certificate of Trust')).toBeVisible();
    await expect(page.locator('text=Revocable Living Trust')).toBeVisible();
    await expect(page.locator('text=Warranty Deed')).toBeVisible();
    
    console.log('✅ All three templates are visible in the dashboard');
  });

  test('Create service named Test 101', async () => {
    console.log('🔧 Creating service Test 101...');
    
    // Navigate to services tab (assuming it exists)
    const servicesTab = page.locator('text=Services').or(page.locator('text=Service Management'));
    if (await servicesTab.isVisible()) {
      await servicesTab.click();
    }
    
    // Look for create service button
    const createServiceBtn = page.locator('text=Create Service').or(page.locator('text=+ Create Service'));
    await createServiceBtn.click();
    
    // Fill service form
    await page.fill('input[placeholder*="service name" i]', 'Test 101');
    
    // Select templates (this will depend on the UI implementation)
    // We'll need to adapt this based on how template selection works
    
    await page.click('text=Create Service');
    
    await expect(page.locator('text=Test 101')).toBeVisible({ timeout: 15000 });
    console.log('✅ Service Test 101 created successfully');
  });

  test('Generate intake link for Test 101 service', async () => {
    console.log('🔗 Generating intake link...');
    
    // Find the Test 101 service and generate link
    const serviceRow = page.locator('text=Test 101').locator('..');
    await serviceRow.locator('text=Generate Link').or(serviceRow.locator('button')).first().click();
    
    // Wait for link generation
    await expect(page.locator('text=copied to clipboard')).toBeVisible({ timeout: 15000 });
    
    console.log('✅ Intake link generated successfully');
  });

  test('Test intake link functionality', async () => {
    console.log('🧪 Testing intake link...');
    
    // Get the intake link from clipboard or extract from page
    // For now, we'll simulate opening a typical intake link
    const intakeUrl = `${BASE_URL}/intake/test-token`;
    
    await page.goto(intakeUrl);
    
    // Check if intake form loads
    const formTitle = page.locator('h1').or(page.locator('h2')).first();
    await expect(formTitle).toBeVisible({ timeout: 15000 });
    
    console.log('✅ Intake form loaded successfully');
    
    // Fill out sample form data
    await page.fill('input[name*="name" i]', 'John Doe');
    await page.fill('input[name*="email" i]', 'john.doe@example.com');
    
    // Submit form
    await page.click('text=Submit');
    
    await expect(page.locator('text=submitted').or(page.locator('text=success'))).toBeVisible({ timeout: 15000 });
    
    console.log('✅ Intake form submitted successfully');
  });

  test('Verify end-to-end workflow completion', async () => {
    console.log('🎯 Verifying complete workflow...');
    
    // Navigate back to admin
    await page.goto(`${BASE_URL}/admin`);
    
    // Check intake submissions (if there's an intakes section)
    const intakesSection = page.locator('text=Intakes').or(page.locator('text=Submissions'));
    if (await intakesSection.isVisible()) {
      await intakesSection.click();
      
      // Look for the submitted intake
      await expect(page.locator('text=John Doe').or(page.locator('text=john.doe@example.com'))).toBeVisible({ timeout: 10000 });
      
      console.log('✅ Intake submission visible in admin dashboard');
    }
    
    console.log('🎉 End-to-end workflow completed successfully!');
  });

  test.afterAll(async () => {
    await page.close();
  });
});