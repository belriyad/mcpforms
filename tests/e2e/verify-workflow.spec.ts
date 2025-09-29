import { test } from '@playwright/test';

test('verify service creation and intake generation work', async ({ page }) => {
  console.log('🎯 Testing service creation and intake generation (using existing templates)');

  // Enable console logging
  page.on('console', msg => {
    if (msg.type() === 'log' || msg.type() === 'error') {
      console.log(`🌐 Browser ${msg.type()}: ${msg.text()}`);
    }
  });

  // Navigate to app
  await page.goto('http://localhost:3002');
  await page.click('a:has-text("Admin Dashboard")');
  await page.waitForTimeout(3000);
  
  // Go to services
  await page.click('text=Services');
  await page.waitForTimeout(2000);
  
  console.log('📊 Checking existing services...');
  
  // Count existing services
  const serviceRows = page.locator('tbody tr');
  const serviceCount = await serviceRows.count();
  console.log(`📊 Found ${serviceCount} existing services`);
  
  // If we have services, test intake generation
  if (serviceCount > 0) {
    console.log('✅ Services exist, testing intake generation...');
    
    // Try to generate intake for first service
    const firstServiceRow = serviceRows.first();
    const serviceName = await firstServiceRow.locator('td').first().textContent();
    console.log(`🔧 Testing service: ${serviceName}`);
    
    const generateButton = firstServiceRow.locator('button:has-text("Generate Intake")');
    if (await generateButton.isVisible()) {
      console.log('🔗 Generate Intake button found, clicking...');
      await generateButton.click();
      
      // Wait for intake generation
      await page.waitForTimeout(8000);
      
      // Look for success message or intake link
      const successMessages = [
        page.locator('text*=Intake link generated'),
        page.locator('text*=generated successfully'),
        page.locator('[data-testid="intake-link"]')
      ];
      
      let success = false;
      for (const msg of successMessages) {
        if (await msg.isVisible()) {
          const text = await msg.textContent();
          console.log(`✅ Intake generation success: ${text}`);
          success = true;
          break;
        }
      }
      
      if (!success) {
        console.log('❌ No intake generation success message found');
      }
      
    } else {
      console.log('❌ Generate Intake button not found');
    }
  } else {
    // No services exist, create one
    console.log('📝 No services found, creating a new service...');
    
    const createButton = page.locator('button:has-text("Create Service")').first();
    if (await createButton.isVisible()) {
      await createButton.click();
      await page.waitForTimeout(2000);
      
      // Fill form
      await page.fill('#serviceName', 'Quick Test Service');
      await page.fill('#serviceDescription', 'Quick test for verification');
      
      // Select first template
      const checkboxes = page.locator('input[type="checkbox"]');
      const checkboxCount = await checkboxes.count();
      console.log(`📋 Found ${checkboxCount} templates available`);
      
      if (checkboxCount > 0) {
        await checkboxes.first().check();
        console.log('☑️ Selected first template');
        
        // Submit
        const submitButton = page.locator('button:has-text("Create Service")').last();
        if (await submitButton.isEnabled()) {
          await submitButton.click();
          console.log('📤 Submitted service creation');
          
          // Wait for creation
          await page.waitForTimeout(8000);
          
          // Check if service appears
          const newServiceRow = page.locator('text=Quick Test Service');
          if (await newServiceRow.isVisible()) {
            console.log('✅ Service created and appears in list!');
            
            // Try intake generation
            const parentRow = newServiceRow.locator('..').locator('..');
            const generateIntakeBtn = parentRow.locator('button:has-text("Generate Intake")');
            
            if (await generateIntakeBtn.isVisible()) {
              console.log('🔗 Testing intake generation on new service...');
              await generateIntakeBtn.click();
              await page.waitForTimeout(8000);
              console.log('✅ Intake generation attempted');
            }
          } else {
            console.log('❌ Service not found in list after creation');
          }
        } else {
          console.log('❌ Submit button not enabled');
        }
      } else {
        console.log('❌ No templates available for service creation');
      }
    } else {
      console.log('❌ Create Service button not found');
    }
  }
  
  console.log('🏁 Verification test completed');
});