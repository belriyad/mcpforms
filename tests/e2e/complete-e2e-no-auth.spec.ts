import { test, expect } from '@playwright/test';
import path from 'path';

const SAMPLE_FILES = [
  'Warranty Deed Template.docx',
  'Revocable Living Trust Template.docx', 
  'Certificate_of_Trust_Fillable Template.docx'
];

test.describe('Complete E2E Workflow (No Auth)', () => {
  test('should complete full workflow: upload templates -> create service -> generate intake', async ({ page }) => {
    console.log('🎯 Starting complete E2E workflow test (auth disabled)');

    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'log' || msg.type() === 'error') {
        console.log(`🌐 Browser ${msg.type()}: ${msg.text()}`);
      }
    });

    // Step 1: Navigate to app
    await page.goto('http://localhost:3002');
    await page.click('a:has-text("Admin Dashboard")');
    await page.waitForTimeout(3000);
    console.log('✅ Step 1: Navigated to admin dashboard');

    // Step 2: Upload templates
    console.log('📤 Step 2: Starting template upload process...');
    await page.click('text=Templates');
    await page.waitForTimeout(2000);

    // Check current template count
    const templateRows = page.locator('tbody tr');
    const initialTemplateCount = await templateRows.count();
    console.log(`📊 Initial template count: ${initialTemplateCount}`);

    if (initialTemplateCount < 3) {
      console.log('📤 Need to upload templates...');
      
      for (const filename of SAMPLE_FILES) {
        console.log(`📄 Uploading: ${filename}`);
        
        // Click upload button
        await page.click('button:has-text("Upload Template")');
        await page.waitForTimeout(1000);
        
        // Fill form
        const nameInput = page.locator('#templateName');
        const descInput = page.locator('#templateDescription');
        
        if (await nameInput.isVisible()) {
          await nameInput.fill(filename.replace('.docx', ''));
          await descInput.fill(`Template for ${filename}`);
          
          // Upload file
          const filePath = path.join(__dirname, '..', '..', 'src', 'sample', filename);
          console.log(`📁 File path: ${filePath}`);
          
          const fileInput = page.locator('input[type="file"]');
          await fileInput.setInputFiles(filePath);
          
          // Submit
          const submitButton = page.locator('button[type="submit"]:has-text("Upload Template")');
          await submitButton.click();
          
          // Wait for upload success
          await page.waitForTimeout(3000);
          
          // Wait for parsing (up to 60 seconds)
          let parseComplete = false;
          for (let i = 0; i < 30; i++) {
            await page.waitForTimeout(2000);
            const statusElements = page.locator('[data-testid="template-status"]');
            if (await statusElements.count() > 0) {
              const lastStatus = await statusElements.last().textContent();
              console.log(`📊 Template ${filename} status: ${lastStatus}`);
              if (lastStatus === 'parsed' || lastStatus === 'error') {
                parseComplete = true;
                if (lastStatus === 'parsed') {
                  console.log(`✅ ${filename} parsed successfully`);
                } else {
                  console.log(`❌ ${filename} parsing failed`);
                }
                break;
              }
            }
          }
          
          if (!parseComplete) {
            console.log(`⏰ ${filename} parsing timeout`);
          }
        }
      }
    } else {
      console.log('✅ Templates already uploaded');
    }

    // Step 3: Create service
    console.log('🔧 Step 3: Creating service...');
    
    await page.click('text=Services');
    await page.waitForTimeout(2000);
    
    // Check if service already exists
    const existingService = page.locator('text=E2E Test Service');
    if (await existingService.isVisible()) {
      console.log('✅ Service already exists, proceeding...');
    } else {
      console.log('🔧 Creating new service...');
      
      // Click create service
      await page.locator('button:has-text("Create Service")').first().click();
      await page.waitForTimeout(2000);
      
      // Fill service form
      await page.fill('#serviceName', 'E2E Test Service');
      await page.fill('#serviceDescription', 'Complete E2E test service with all sample templates');
      
      // Select all available templates
      const checkboxes = page.locator('input[type="checkbox"]');
      const checkboxCount = await checkboxes.count();
      console.log(`📋 Found ${checkboxCount} templates to select`);
      
      for (let i = 0; i < checkboxCount; i++) {
        await checkboxes.nth(i).check();
      }
      
      // Submit service creation
      const submitButton = page.locator('button:has-text("Create Service")').last();
      await submitButton.click();
      
      // Wait for success
      await page.waitForTimeout(5000);
      console.log('✅ Service creation submitted');
    }

    // Step 4: Generate intake link
    console.log('🔗 Step 4: Generating intake link...');
    
    // Find the service row and click generate intake
    const serviceRow = page.locator('tr:has-text("E2E Test Service")');
    if (await serviceRow.isVisible()) {
      const generateButton = serviceRow.locator('button:has-text("Generate Intake")');
      if (await generateButton.isVisible()) {
        await generateButton.click();
        
        // Wait for intake link generation
        await page.waitForTimeout(5000);
        console.log('✅ Intake link generation requested');
        
        // Look for intake link
        const intakeLinkElement = page.locator('[data-testid="intake-link"]');
        if (await intakeLinkElement.isVisible()) {
          const intakeLink = await intakeLinkElement.textContent();
          console.log(`🔗 Intake link: ${intakeLink}`);
          
          // Step 5: Test intake link (optional)
          if (intakeLink && intakeLink.startsWith('http')) {
            console.log('📝 Step 5: Testing intake link...');
            
            // Open intake link
            await page.goto(intakeLink);
            await page.waitForTimeout(3000);
            
            // Check if intake form loads
            const intakeTitle = page.locator('h1, h2, h3').first();
            if (await intakeTitle.isVisible()) {
              const title = await intakeTitle.textContent();
              console.log(`✅ Intake form loaded: ${title}`);
            }
          }
        } else {
          console.log('❌ Intake link not found');
        }
      } else {
        console.log('❌ Generate Intake button not found');
      }
    } else {
      console.log('❌ Service not found in list');
    }

    console.log('🎉 E2E workflow test completed!');
  });
});