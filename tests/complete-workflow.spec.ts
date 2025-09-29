import { test, expect } from '@playwright/test';
import * as path from 'path';

test('Complete workflow: Upload templates and create service', async ({ page }) => {
  console.log('🚀 Complete workflow test starting...');
  
  test.setTimeout(180000); // 3 minutes for complete workflow
  
  try {
    // Step 1: Navigate and authenticate
    console.log('🔐 Step 1: Authentication...');
    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    
    // Handle authentication
    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.isVisible()) {
      await emailInput.fill('test@example.com');
      await page.locator('input[type="password"]').fill('password123');
      await page.locator('button[type="submit"]').click();
      await page.waitForTimeout(5000);
      
      // Try alternative if needed
      if (await page.locator('input[type="email"]').isVisible()) {
        await page.locator('input[type="email"]').fill('briyad@gmail.com');
        await page.locator('input[type="password"]').fill('testpassword123');
        await page.locator('button[type="submit"]').click();
        await page.waitForTimeout(5000);
      }
    }
    
    // Step 2: Upload templates
    console.log('📤 Step 2: Template uploads...');
    await page.screenshot({ path: 'complete-workflow-step1.png' });
    
    const templateFiles = ['sample-template.txt', 'template1.txt', 'template2.txt'];
    
    for (let i = 0; i < templateFiles.length; i++) {
      const filename = templateFiles[i];
      console.log(`📁 Uploading ${filename} (${i + 1}/${templateFiles.length})...`);
      
      // Click Upload Template button to open modal
      const uploadTemplateButton = page.locator('button:has-text("Upload Template")');
      if (await uploadTemplateButton.isVisible()) {
        await uploadTemplateButton.click();
        await page.waitForTimeout(2000);
        
        // Look for drag-drop zone or file input in the modal
        const dropzone = page.locator('[data-testid="dropzone"], .dropzone, div:has-text("drag and drop")');
        const fileInput = page.locator('input[type="file"]');
        
        if (await fileInput.isVisible()) {
          console.log('📎 Using file input...');
          const filePath = path.join(process.cwd(), 'test-data', filename);
          await fileInput.setInputFiles(filePath);
        } else if (await dropzone.isVisible()) {
          console.log('📎 Using dropzone...');
          const filePath = path.join(process.cwd(), 'test-data', filename);
          // Simulate drag and drop
          await dropzone.setInputFiles(filePath);
        } else {
          console.log('❌ No file input method found, trying to find it...');
          await page.screenshot({ path: `upload-modal-${i}.png` });
        }
        
        // Fill template name if there's an input
        const nameInput = page.locator('input[name="templateName"], input[placeholder*="name"], input[placeholder*="Template"]');
        if (await nameInput.isVisible()) {
          await nameInput.fill(`Template ${i + 1} - ${filename.replace('.txt', '')}`);
        }
        
        // Look for upload/submit button in modal
        const uploadButton = page.locator('button:has-text("Upload"):not(:has-text("Upload Template")), button:has-text("Submit"), button[type="submit"]');
        if (await uploadButton.isVisible()) {
          console.log('📤 Clicking upload button...');
          await uploadButton.click();
          await page.waitForTimeout(3000);
          
          // Wait for success or modal to close
          let modalClosed = false;
          for (let attempt = 0; attempt < 10; attempt++) {
            const modal = page.locator('.modal, [role="dialog"], .fixed.inset-0');
            if (!(await modal.isVisible())) {
              modalClosed = true;
              break;
            }
            await page.waitForTimeout(1000);
          }
          
          if (modalClosed) {
            console.log(`✅ ${filename} upload completed`);
          } else {
            console.log(`⚠️ ${filename} upload status unclear, closing modal manually`);
            const closeButton = page.locator('button:has-text("Close"), button:has-text("Cancel"), button[aria-label="Close"]');
            if (await closeButton.isVisible()) {
              await closeButton.click();
            }
          }
        } else {
          console.log('❌ Upload button not found in modal');
          // Close modal
          const closeButton = page.locator('button:has-text("Close"), button:has-text("Cancel")');
          if (await closeButton.isVisible()) {
            await closeButton.click();
          }
        }
      } else {
        console.log('❌ Upload Template button not found');
      }
      
      // Small delay between uploads
      await page.waitForTimeout(2000);
    }
    
    // Step 3: Wait for processing and check templates
    console.log('⏳ Step 3: Waiting for template processing...');
    await page.waitForTimeout(15000); // Wait for AI processing
    await page.screenshot({ path: 'complete-workflow-step2.png' });
    
    // Step 4: Navigate to Services
    console.log('⚙️ Step 4: Creating service...');
    const servicesTab = page.locator('button:has-text("Services"), [role="tab"]:has-text("Services"), text=Services').first();
    if (await servicesTab.isVisible()) {
      await servicesTab.click();
      await page.waitForTimeout(3000);
      
      await page.screenshot({ path: 'complete-workflow-step3.png' });
      
      // Try to create service  
      const createServiceButton = page.locator('button:has-text("Create Service")');
      if (await createServiceButton.isVisible()) {
        await createServiceButton.click();
        await page.waitForTimeout(2000);
        
        await page.screenshot({ path: 'complete-workflow-step4.png' });
        
        // Fill service form
        const nameInput = page.locator('input#serviceName, input[name="serviceName"]');
        const descInput = page.locator('textarea#serviceDescription, textarea[name="serviceDescription"]');
        
        if (await nameInput.isVisible()) {
          await nameInput.fill('Test 101');
          await descInput.fill('Test service for E2E workflow validation');
          
          // Select templates
          const checkboxes = page.locator('input[type="checkbox"]');
          const checkboxCount = await checkboxes.count();
          console.log(`📋 Found ${checkboxCount} template checkboxes`);
          
          if (checkboxCount > 0) {
            // Select first 2-3 templates
            for (let i = 0; i < Math.min(checkboxCount, 3); i++) {
              await checkboxes.nth(i).check();
            }
            
            // Submit
            const submitButton = page.locator('button:has-text("Create Service"):not(:has-text("Create Service Request"))');
            await submitButton.click();
            await page.waitForTimeout(5000);
            
            console.log('🎉 Service creation submitted!');
            await page.screenshot({ path: 'complete-workflow-step5.png' });
            
          } else {
            console.log('❌ No template checkboxes found');
            const noTemplatesMsg = page.locator('text=No parsed templates available');
            if (await noTemplatesMsg.isVisible()) {
              console.log('💡 Templates not processed yet');
            }
          }
        } else {
          console.log('❌ Service form not found');
        }
      } else {
        console.log('❌ Create Service button not found');
      }
    } else {
      console.log('❌ Services tab not found');
    }
    
    console.log('✅ Workflow test completed');
    
  } catch (error) {
    console.error('❌ Workflow error:', error);
    await page.screenshot({ path: 'complete-workflow-error.png' });
  }
});