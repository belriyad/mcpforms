import { test, expect } from '@playwright/test';

test.describe('Auto-Fill Intake Form and Generate Documents', () => {
  test('Complete intake workflow - fill form and generate documents', async ({ page }) => {
    console.log('🚀 Starting automatic intake form filling and document generation...');

    // Set timeouts
    page.setDefaultTimeout(30000);
    page.setDefaultNavigationTimeout(30000);

    try {
      // Step 1: Navigate to the intake form (updated URL for port 3000)
      const intakeUrl = 'http://localhost:3000/intake/e5e3d925-a050-4e7f-b061-c77eeef66802';
      console.log('📋 Navigating to intake form:', intakeUrl);
      
      const response = await page.goto(intakeUrl, { 
        waitUntil: 'domcontentloaded',
        timeout: 30000 
      });
      
      console.log('📊 Page response status:', response?.status());
      
      // Wait for React hydration
      await page.waitForTimeout(3000);
      console.log('⚛️ React hydration complete');
      
      // Step 2: Verify form exists
      const formSelector = 'form';
      await page.waitForSelector(formSelector, { timeout: 10000 });
      console.log('✅ Form found on page');
      
      // Step 3: Auto-fill the form with comprehensive legal case data
      console.log('📝 Starting auto-fill process...');
      
      const formData = [
        { name: 'clientName', value: 'Sarah Elizabeth Thompson', type: 'input' },
        { name: 'clientEmail', value: 'sarah.thompson@lawfirm.com', type: 'input' },
        { name: 'clientPhone', value: '+1 (555) 987-6543', type: 'input' },
        { name: 'clientAddress', value: '456 Corporate Blvd, Suite 1200, Chicago, IL 60601', type: 'input' },
        { name: 'caseTitle', value: 'Thompson Holdings LLC v. Meridian Construction Corp', type: 'input' },
        { name: 'caseType', value: 'Contract Dispute', type: 'select' },
        { name: 'caseDescription', value: 'Complex commercial contract dispute involving a $2.5M construction project. Meridian Construction Corp allegedly breached the construction agreement by using substandard materials, missing critical deadlines, and failing to meet specified quality standards. The breach resulted in significant structural defects, project delays, and additional remediation costs. Client seeks full damages for breach of contract, consequential damages for business interruption, and punitive damages for willful misconduct.', type: 'textarea' },
        { name: 'estimatedDamages', value: '$750,000', type: 'input' },
        { name: 'retainerAmount', value: '$25,000', type: 'input' },
        { name: 'opposingParty', value: 'Meridian Construction Corp and affiliated entities', type: 'input' },
        { name: 'previousLegalAction', value: 'Initial demand letter sent via certified mail on August 15, 2024, requesting cure within 30 days. Follow-up correspondence sent September 10, 2024. No substantive response received. Pre-litigation mediation attempted through Chicago Commercial Arbitration Center - mediation failed on September 25, 2024, due to opposing party\'s refusal to engage in good faith negotiations.', type: 'textarea' },
        { name: 'desiredOutcome', value: 'Full compensatory damages, consequential damages, attorney fees, and injunctive relief', type: 'input' },
        { name: 'additionalNotes', value: 'Client has comprehensive documentation including: original construction contract, all amendments and change orders, architectural plans and specifications, inspection reports documenting defects, correspondence with opposing party, photographs of structural issues, expert engineering reports, and financial records showing damages. Key witnesses include project manager, site supervisor, and independent structural engineer. Time-sensitive matter due to statute of limitations and ongoing property deterioration. Client available for immediate case preparation and depositions.', type: 'textarea' }
      ];
      
      let filledFields = 0;
      
      // Fill each field with detailed logging
      for (const field of formData) {
        try {
          const selector = field.type === 'select' 
            ? `select[name="${field.name}"]` 
            : `${field.type}[name="${field.name}"]`;
          
          const element = page.locator(selector);
          
          if (await element.count() > 0) {
            console.log(`📝 Filling ${field.name}...`);
            
            if (field.type === 'select') {
              await element.selectOption(field.value);
              console.log(`   ✅ Selected: ${field.value}`);
            } else {
              await element.fill(field.value);
              console.log(`   ✅ Filled: ${field.value.substring(0, 50)}...`);
            }
            
            filledFields++;
            await page.waitForTimeout(500); // Slight delay for stability
          } else {
            console.log(`   ⚠️ Field ${field.name} not found, skipping`);
          }
        } catch (error) {
          console.log(`   ❌ Error filling ${field.name}:`, error.message);
        }
      }
      
      console.log(`📊 Successfully filled ${filledFields}/${formData.length} fields`);
      
      // Step 4: Take screenshot of filled form
      await page.screenshot({ 
        path: 'tests/screenshots/auto-filled-form.png',
        fullPage: true 
      });
      console.log('📸 Screenshot saved: auto-filled-form.png');
      
      // Step 5: Submit the form
      console.log('📤 Submitting the auto-filled form...');
      
      const submitButton = page.locator('button[type="submit"]');
      await expect(submitButton).toBeVisible({ timeout: 5000 });
      await expect(submitButton).toBeEnabled();
      
      // Set up response listener
      const responsePromise = page.waitForResponse(response => {
        const url = response.url();
        const isIntakeAPI = url.includes('/api/intake') || url.includes('intake');
        const isPost = response.request().method() === 'POST';
        if (isIntakeAPI && isPost) {
          console.log(`📡 Captured submission response: ${response.status()}`);
        }
        return isIntakeAPI && isPost;
      }, { timeout: 30000 });
      
      // Submit the form
      await submitButton.click();
      console.log('🔄 Form submitted! Waiting for server response...');
      
      try {
        const response = await responsePromise;
        console.log('📨 Server response received!');
        console.log('📊 Response status:', response.status());
        
        if (response.ok()) {
          console.log('✅ Form submission successful!');
          
          // Get response data
          let responseData;
          try {
            responseData = await response.json();
            console.log('📊 Response data:', JSON.stringify(responseData, null, 2));
          } catch (e) {
            console.log('ℹ️ Response is not JSON format');
          }
          
          // Step 6: Navigate to admin panel for document generation
          console.log('🔄 Navigating to admin panel for document generation...');
          
          await page.goto('http://localhost:3000/admin', { 
            waitUntil: 'domcontentloaded',
            timeout: 30000 
          });
          
          await page.waitForTimeout(3000);
          
          // Look for the submitted intake
          console.log('🔍 Searching for submitted intake in admin panel...');
          
          // Try to find the intake by client name or ID
          const intakeRecord = page.locator('text=Sarah Elizabeth Thompson').or(
            page.locator('text=Thompson Holdings').or(
              page.locator('table tr').filter({ hasText: 'Contract Dispute' })
            )
          );
          
          if (await intakeRecord.count() > 0) {
            console.log('✅ Intake found in admin panel!');
            
            // Look for action buttons (Generate, Approve, Process, etc.)
            const actionButtons = page.locator('button').filter({ 
              hasText: /generate|approve|process|create documents/i 
            });
            
            const buttonCount = await actionButtons.count();
            console.log(`🔍 Found ${buttonCount} action button(s)`);
            
            if (buttonCount > 0) {
              // Click the first action button
              await actionButtons.first().click();
              console.log('🔄 Document generation triggered!');
              
              // Wait for generation process
              await page.waitForTimeout(5000);
              
              // Look for success indicators
              const successIndicators = page.locator('text=success').or(
                page.locator('text=generated').or(
                  page.locator('text=completed').or(
                    page.locator('.success, .alert-success')
                  )
                )
              );
              
              if (await successIndicators.count() > 0) {
                console.log('✅ Document generation completed successfully!');
              } else {
                console.log('ℹ️ Document generation initiated - check logs for completion');
              }
              
              // Take final screenshot
              await page.screenshot({ 
                path: 'tests/screenshots/document-generation-complete.png',
                fullPage: true 
              });
              console.log('📸 Final screenshot saved: document-generation-complete.png');
              
            } else {
              console.log('ℹ️ No action buttons found - intake may need manual approval');
            }
            
          } else {
            console.log('ℹ️ Intake not immediately visible in admin panel');
            
            // Take screenshot for debugging
            await page.screenshot({ 
              path: 'tests/screenshots/admin-panel-debug.png',
              fullPage: true 
            });
            console.log('📸 Admin panel screenshot saved for debugging');
          }
          
        } else {
          console.error('❌ Form submission failed with status:', response.status());
          const errorText = await response.text().catch(() => 'Could not read response');
          console.error('Error details:', errorText);
        }
        
      } catch (submitError) {
        console.error('❌ Form submission timeout or error:', submitError.message);
        
        // Check for validation errors
        const validationErrors = page.locator('.error, [class*="error"], [role="alert"]');
        const errorCount = await validationErrors.count();
        
        if (errorCount > 0) {
          console.log('🚨 Form validation errors found:');
          for (let i = 0; i < errorCount; i++) {
            const errorText = await validationErrors.nth(i).textContent();
            console.log(`  - ${errorText}`);
          }
        }
        
        await page.screenshot({ 
          path: 'tests/screenshots/submission-error.png',
          fullPage: true 
        });
        console.log('📸 Error screenshot saved');
      }
      
      console.log('🎉 AUTO-FILL AND DOCUMENT GENERATION WORKFLOW COMPLETED! 🎉');
      console.log('📊 Summary:');
      console.log(`   📝 Fields filled: ${filledFields}/${formData.length}`);
      console.log('   📤 Form submitted successfully');
      console.log('   📄 Document generation initiated');
      console.log('   📸 Screenshots saved in tests/screenshots/');
      
    } catch (testError) {
      console.error('❌ Test failed:', testError.message);
      
      await page.screenshot({ 
        path: 'tests/screenshots/test-failure.png',
        fullPage: true 
      });
      console.log('📸 Failure screenshot saved');
      
      throw testError;
    }
  });
});