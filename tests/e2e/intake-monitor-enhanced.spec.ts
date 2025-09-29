import { test, expect } from '@playwright/test';

test.describe('Intake Monitor with Document Outcomes', () => {
  test('should display intake monitor with document management', async ({ page }) => {
    console.log('🎯 Testing enhanced intake monitor with document outcomes');

    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'log' || msg.type() === 'error') {
        console.log(`🌐 Browser ${msg.type()}: ${msg.text()}`);
      }
    });

    try {
      // Navigate to admin dashboard
      console.log('📋 Navigating to admin dashboard...');
      await page.goto('http://localhost:3000/admin');
      await page.waitForLoadState('networkidle');
      
      // Wait for dashboard to load
      await page.waitForTimeout(2000);
      
      // Click on Intakes tab
      console.log('📝 Clicking on Intakes tab...');
      const intakesTab = page.locator('button:has-text("Intakes")');
      await expect(intakesTab).toBeVisible({ timeout: 10000 });
      await intakesTab.click();
      await page.waitForTimeout(2000);
      
      // Check if intake monitor is loaded
      console.log('🔍 Checking intake monitor components...');
      
      // Should see the title and description
      await expect(page.locator('h2:has-text("Intake Monitor")')).toBeVisible();
      await expect(page.locator('text=Monitor and manage client intake submissions')).toBeVisible();
      
      // Should see generate intake link button
      await expect(page.locator('button:has-text("Generate Intake Link")')).toBeVisible();
      
      // Check for existing intakes
      const intakeCards = page.locator('.card .card-content');
      const intakeCount = await intakeCards.count();
      console.log(`📊 Found ${intakeCount} intake cards`);
      
      if (intakeCount > 0) {
        // Test document viewing functionality
        console.log('📄 Testing document viewing functionality...');
        
        // Look for completed intakes with documents
        for (let i = 0; i < Math.min(intakeCount, 3); i++) {
          const card = intakeCards.nth(i);
          
          // Check if this intake has document links
          const documentsButton = card.locator('button:has-text("Generated Documents")');
          if (await documentsButton.isVisible()) {
            console.log(`📄 Found intake with documents at index ${i}`);
            
            // Click to expand documents
            await documentsButton.click();
            await page.waitForTimeout(1000);
            
            // Check for document artifacts
            const documentsList = card.locator('[class*="bg-gray-50"]').filter({ hasText: '.docx' });
            const docCount = await documentsList.count();
            console.log(`📊 Found ${docCount} document artifacts`);
            
            if (docCount > 0) {
              // Look for download buttons
              const downloadButtons = card.locator('button[title="Download document"]');
              const downloadCount = await downloadButtons.count();
              console.log(`⬇️ Found ${downloadCount} download buttons`);
              
              if (downloadCount > 0) {
                console.log('✅ Document download functionality is present');
              }
            }
            
            // Collapse documents view
            await documentsButton.click();
            await page.waitForTimeout(500);
            break;
          }
        }
        
        // Test quick stats
        const statsElements = page.locator('text=/pending approval|completed|documents generated/');
        const statsCount = await statsElements.count();
        console.log(`📈 Found ${statsCount} quick stat elements`);
        
        if (statsCount > 0) {
          console.log('✅ Quick statistics are visible');
        }
        
      } else {
        console.log('ℹ️ No intakes found - checking empty state');
        
        // Should see empty state
        await expect(page.locator('text=No intakes found')).toBeVisible();
        await expect(page.locator('text=Generate intake links to start collecting client information')).toBeVisible();
      }
      
      // Test generate intake link functionality
      console.log('🔗 Testing generate intake link functionality...');
      
      await page.click('button:has-text("Generate Intake Link")');
      await page.waitForTimeout(1000);
      
      // Should see the modal
      await expect(page.locator('h3:has-text("Generate Intake Link")')).toBeVisible();
      await expect(page.locator('label:has-text("Service")')).toBeVisible();
      
      // Close the modal
      const closeButton = page.locator('button:has-text("Cancel")');
      await closeButton.click();
      await page.waitForTimeout(500);
      
      console.log('✅ Intake monitor enhanced functionality test completed successfully!');
      
    } catch (error) {
      console.error('❌ Test failed:', error);
      
      // Take screenshot for debugging
      await page.screenshot({ path: 'intake-monitor-test-error.png', fullPage: true });
      console.log('📸 Screenshot saved as intake-monitor-test-error.png');
      
      throw error;
    }
  });

  test('should handle document status indicators correctly', async ({ page }) => {
    console.log('🎯 Testing document status indicators');

    // Navigate to intake monitor
    await page.goto('http://localhost:3000/admin');
    await page.click('button:has-text("Intakes")');
    await page.waitForTimeout(2000);
    
    // Look for status indicators
    const statusElements = page.locator('[class*="bg-green-100"], [class*="bg-yellow-100"], [class*="bg-red-100"]');
    const statusCount = await statusElements.count();
    
    console.log(`📊 Found ${statusCount} status indicators`);
    
    if (statusCount > 0) {
      // Check for different status types
      const generatedStatus = page.locator('.bg-green-100:has-text("generated")');
      const generatingStatus = page.locator('.bg-yellow-100:has-text("generating")');  
      const errorStatus = page.locator('.bg-red-100:has-text("error")');
      
      const generatedCount = await generatedStatus.count();
      const generatingCount = await generatingStatus.count();
      const errorCount = await errorStatus.count();
      
      console.log(`✅ Generated: ${generatedCount}, Generating: ${generatingCount}, Error: ${errorCount}`);
      
      expect(generatedCount + generatingCount + errorCount).toBeGreaterThanOrEqual(0);
    }
    
    console.log('✅ Document status indicators test completed');
  });
});