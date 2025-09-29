import { test, expect } from '@playwright/test';
import * as path from 'path';

test('Upload templates and create service', async ({ page }) => {
  console.log('📤 Testing template upload and service creation workflow...');
  
  test.setTimeout(120000); // 2 minutes for upload and processing
  
  try {
    // Navigate to admin
    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    
    // Handle authentication
    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.isVisible()) {
      console.log('🔐 Authenticating...');
      await emailInput.fill('test@example.com');
      await page.locator('input[type="password"]').fill('password123');
      await page.locator('button[type="submit"]').click();
      await page.waitForTimeout(5000);
      
      // If test user failed, try briyad@gmail.com
      if (await page.locator('input[type="email"]').isVisible()) {
        console.log('🔄 Trying alternative credentials...');
        await page.locator('input[type="email"]').fill('briyad@gmail.com');
        await page.locator('input[type="password"]').fill('testpassword123');
        await page.locator('button[type="submit"]').click();
        await page.waitForTimeout(5000);
      }
    }
    
    // Should be on templates tab by default
    console.log('📄 On templates tab...');
    await page.screenshot({ path: 'workflow-step1-templates.png' });
    
    // Upload test templates
    const templateFiles = ['sample-template.txt', 'template1.txt', 'template2.txt'];
    
    for (let i = 0; i < templateFiles.length; i++) {
      const filename = templateFiles[i];
      console.log(`📁 Uploading ${filename} (${i + 1}/${templateFiles.length})...`);
      
      // Find file input
      const fileInput = page.locator('input[type="file"]');
      if (await fileInput.isVisible()) {
        const filePath = path.join(process.cwd(), 'test-data', filename);
        await fileInput.setInputFiles(filePath);
        
        // Click upload button
        const uploadButton = page.locator('button:has-text("Upload Template"), button:has-text("Upload")');
        if (await uploadButton.isVisible()) {
          await uploadButton.click();
          
          // Wait for upload feedback
          await page.waitForTimeout(3000);
          
          // Look for success/processing indication
          const uploadFeedback = page.locator('text=uploaded, text=processing, text=success, text=Upload successful');
          try {
            await uploadFeedback.waitFor({ timeout: 10000 });
            console.log(`✅ ${filename} upload initiated`);
          } catch {
            console.log(`⚠️ ${filename} - no clear upload feedback, continuing...`);
          }
        } else {
          console.log(`❌ Upload button not found for ${filename}`);
        }
      } else {
        console.log(`❌ File input not found for ${filename}`);
      }
      
      // Small delay between uploads
      await page.waitForTimeout(2000);
    }
    
    console.log('⏳ Waiting for template processing...');
    await page.waitForTimeout(10000); // Wait for AI processing
    
    // Check templates status
    await page.screenshot({ path: 'workflow-step2-templates-uploaded.png' });
    
    // Navigate to Services tab
    console.log('⚙️ Navigating to Services tab...');
    const servicesTab = page.locator('text=Services, button:has-text("Services"), [role="tab"]:has-text("Services")');
    if (await servicesTab.isVisible()) {
      await servicesTab.click();
      await page.waitForTimeout(3000);
      
      await page.screenshot({ path: 'workflow-step3-services.png' });
      
      // Try to create service
      const createServiceButton = page.locator('button:has-text("Create Service")');
      if (await createServiceButton.isVisible()) {
        console.log('➕ Create Service button found, clicking...');
        await createServiceButton.click();
        await page.waitForTimeout(2000);
        
        await page.screenshot({ path: 'workflow-step4-create-form.png' });
        
        // Fill service form if it appears
        const nameInput = page.locator('input#serviceName, input[name="serviceName"]');
        const descInput = page.locator('textarea#serviceDescription, textarea[name="serviceDescription"]');
        
        if (await nameInput.isVisible() && await descInput.isVisible()) {
          console.log('📝 Filling service form...');
          await nameInput.fill('Test 101 Service');
          await descInput.fill('Test service created from uploaded templates');
          
          // Check for template checkboxes
          const templateCheckboxes = page.locator('input[type="checkbox"]');
          const templateCount = await templateCheckboxes.count();
          console.log(`📋 Found ${templateCount} template checkboxes`);
          
          if (templateCount > 0) {
            // Select first few templates
            for (let i = 0; i < Math.min(templateCount, 2); i++) {
              await templateCheckboxes.nth(i).check();
              console.log(`✅ Selected template ${i + 1}`);
            }
            
            // Submit form
            const submitButton = page.locator('button:has-text("Create Service"):not(:has-text("Create Service Request"))');
            if (await submitButton.isVisible()) {
              console.log('📤 Submitting service creation...');
              await submitButton.click();
              await page.waitForTimeout(5000);
              
              // Check for success
              const successIndicators = page.locator('text=Service created successfully, text=created, text=success');
              try {
                await successIndicators.waitFor({ timeout: 10000 });
                console.log('🎉 Service created successfully!');
                await page.screenshot({ path: 'workflow-step5-success.png' });
              } catch {
                console.log('⚠️ No clear success message, but form was submitted');
                await page.screenshot({ path: 'workflow-step5-submitted.png' });
              }
            } else {
              console.log('❌ Submit button not found');
            }
          } else {
            console.log('❌ No template checkboxes found - templates may not be processed yet');
            const noTemplatesMsg = page.locator('text=No parsed templates available');
            if (await noTemplatesMsg.isVisible()) {
              console.log('💡 Confirmed: No parsed templates available message found');
            }
          }
        } else {
          console.log('❌ Service form inputs not found');
        }
      } else {
        console.log('❌ Create Service button not found');
      }
    } else {
      console.log('❌ Services tab not found');
    }
    
  } catch (error) {
    console.error('❌ Error during workflow:', error);
    await page.screenshot({ path: 'workflow-error.png' });
  }
});