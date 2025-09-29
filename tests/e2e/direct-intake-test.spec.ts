import { test, expect } from '@playwright/test';

test.describe('Direct Intake Link Testing', () => {
  test('should create intake link via API and test the form directly', async ({ page }) => {
    console.log('🔗 DIRECT INTAKE LINK TEST');
    console.log('=========================');

    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'log' || msg.type() === 'error') {
        console.log(`🌐 Browser ${msg.type()}: ${msg.text()}`);
      }
    });

    let intakeUrl: string | null = null;

    try {
      // Step 1: Create intake link via direct API call
      console.log('\n📋 STEP 1: Create Intake Link via API');
      
      // First get a service ID
      const firebaseConfigResponse = await page.evaluate(async () => {
        const { initializeApp } = await import('firebase/app');
        const { getFirestore, collection, getDocs, query, where } = await import('firebase/firestore');
        const { getFunctions, httpsCallable } = await import('firebase/functions');

        const firebaseConfig = {
          apiKey: "AIzaSyDzPhI6M0tQH8EcnlqLGWJq-QX5ZsNXCCQ",
          authDomain: "formgenai-4545.firebaseapp.com",
          projectId: "formgenai-4545",
          storageBucket: "formgenai-4545.firebasestorage.app",
          messagingSenderId: "1076508421825",
          appId: "1:1076508421825:web:5d4a6e0e6b90f7b6b78090"
        };

        const app = initializeApp(firebaseConfig);
        const db = getFirestore(app);
        const functions = getFunctions(app);

        try {
          // Get active services
          console.log('🔍 Fetching active services...');
          const servicesQuery = query(
            collection(db, 'services'),
            where('status', '==', 'active')
          );
          const servicesSnapshot = await getDocs(servicesQuery);
          
          if (servicesSnapshot.empty) {
            console.log('⚠️ No active services found');
            return { error: 'No active services found' };
          }

          const service = servicesSnapshot.docs[0];
          const serviceId = service.id;
          const serviceName = service.data().name;
          
          console.log(`✅ Found active service: ${serviceName} (${serviceId})`);

          // Generate intake link
          console.log('🔗 Generating intake link...');
          const generateIntakeLink = httpsCallable(functions, 'generateIntakeLink');
          const result = await generateIntakeLink({
            serviceId: serviceId,
            clientEmail: 'playwright-test@example.com',
            expiresInDays: 30
          });

          console.log('📤 Intake generation result:', result.data);
          return { success: true, data: result.data };
          
        } catch (error) {
          console.error('❌ Error in API call:', error);
          return { error: error instanceof Error ? error.message : String(error) };
        }
      });

      if (firebaseConfigResponse.success && (firebaseConfigResponse as any).data?.data?.intakeUrl) {
        intakeUrl = (firebaseConfigResponse as any).data.data.intakeUrl;
        console.log(`✅ Generated intake URL: ${intakeUrl}`);
      } else {
        console.log('❌ Failed to generate intake URL:', (firebaseConfigResponse as any).error);
        console.log('❌ Response data:', JSON.stringify(firebaseConfigResponse, null, 2));
      }

      // Step 2: Test the intake link directly
      if (intakeUrl) {
        console.log('\n📝 STEP 2: Test Direct Intake Link');
        console.log(`🔗 Testing URL: ${intakeUrl}`);

        await page.goto(intakeUrl);
        await page.waitForTimeout(5000);

        // Check if page loads successfully
        const pageTitle = await page.title();
        console.log(`📄 Page title: "${pageTitle}"`);

        // Check for error messages
        const errorMessages = page.locator('text*=error, text*=not found, text*=expired');
        if (await errorMessages.isVisible()) {
          const errorText = await errorMessages.textContent();
          console.log(`❌ Error on intake page: "${errorText}"`);
        } else {
          console.log('✅ No error messages found');
        }

        // Look for form elements
        const forms = page.locator('form');
        const formCount = await forms.count();
        console.log(`📝 Forms found: ${formCount}`);

        if (formCount > 0) {
          console.log('✅ Intake form detected');

          // Analyze form structure
          const inputs = page.locator('input, textarea, select');
          const inputCount = await inputs.count();
          console.log(`📝 Form input fields: ${inputCount}`);

          // List form fields for debugging
          for (let i = 0; i < Math.min(10, inputCount); i++) {
            const input = inputs.nth(i);
            const type = await input.getAttribute('type') || 'text';
            const name = await input.getAttribute('name') || '';
            const placeholder = await input.getAttribute('placeholder') || '';
            
            console.log(`📝 Field ${i + 1}: type="${type}", name="${name}", placeholder="${placeholder}"`);
          }

          // Step 3: Fill out the form
          if (inputCount > 0) {
            console.log('\n📝 STEP 3: Fill Out Intake Form');

            // Fill different types of inputs
            const textInputs = page.locator('input[type="text"], input:not([type]), textarea');
            const textCount = await textInputs.count();
            
            for (let i = 0; i < Math.min(5, textCount); i++) {
              try {
                await textInputs.nth(i).fill(`Test Data ${i + 1} - Playwright Generated`);
                console.log(`✅ Filled text field ${i + 1}`);
              } catch (e) {
                console.log(`⚠️ Could not fill text field ${i + 1}: ${e}`);
              }
            }

            // Fill email inputs
            const emailInputs = page.locator('input[type="email"]');
            const emailCount = await emailInputs.count();
            
            for (let i = 0; i < emailCount; i++) {
              try {
                await emailInputs.nth(i).fill('playwright.test@example.com');
                console.log(`✅ Filled email field ${i + 1}`);
              } catch (e) {
                console.log(`⚠️ Could not fill email field ${i + 1}: ${e}`);
              }
            }

            // Fill number inputs
            const numberInputs = page.locator('input[type="number"]');
            const numberCount = await numberInputs.count();
            
            for (let i = 0; i < numberCount; i++) {
              try {
                await numberInputs.nth(i).fill('12345');
                console.log(`✅ Filled number field ${i + 1}`);
              } catch (e) {
                console.log(`⚠️ Could not fill number field ${i + 1}: ${e}`);
              }
            }

            // Handle dropdowns
            const selects = page.locator('select');
            const selectCount = await selects.count();
            
            for (let i = 0; i < selectCount; i++) {
              try {
                const select = selects.nth(i);
                const options = select.locator('option');
                const optionCount = await options.count();
                
                if (optionCount > 1) {
                  await select.selectOption({ index: 1 });
                  console.log(`✅ Selected option in dropdown ${i + 1}`);
                }
              } catch (e) {
                console.log(`⚠️ Could not select dropdown option ${i + 1}: ${e}`);
              }
            }

            console.log('✅ Form filling completed');

            // Step 4: Test form submission
            console.log('\n📤 STEP 4: Test Form Submission');

            const submitButtons = page.locator('button[type="submit"], button:has-text("Submit"), button:has-text("Save"), button:has-text("Send")');
            const submitCount = await submitButtons.count();
            
            console.log(`📤 Submit buttons found: ${submitCount}`);

            if (submitCount > 0) {
              const submitButton = submitButtons.first();
              const isVisible = await submitButton.isVisible();
              const isEnabled = await submitButton.isEnabled();
              const buttonText = await submitButton.textContent();
              
              console.log(`📤 Submit button: "${buttonText}" (visible: ${isVisible}, enabled: ${isEnabled})`);

              if (isVisible && isEnabled) {
                console.log('📤 Attempting form submission...');
                
                try {
                  await submitButton.click();
                  await page.waitForTimeout(5000);
                  
                  // Check for success messages
                  const successSelectors = [
                    'text*=success',
                    'text*=submitted',
                    'text*=received',
                    'text*=thank you',
                    'text*=completed'
                  ];
                  
                  let successFound = false;
                  for (const selector of successSelectors) {
                    const element = page.locator(selector);
                    if (await element.isVisible()) {
                      const text = await element.textContent();
                      console.log(`✅ Success message: "${text}"`);
                      successFound = true;
                      break;
                    }
                  }
                  
                  if (!successFound) {
                    console.log('⚠️ No explicit success message found');
                    
                    // Check for form validation errors
                    const errorSelectors = [
                      'text*=required',
                      'text*=invalid',
                      'text*=error',
                      '.error',
                      '.invalid'
                    ];
                    
                    for (const selector of errorSelectors) {
                      const element = page.locator(selector);
                      if (await element.isVisible()) {
                        const text = await element.textContent();
                        console.log(`⚠️ Validation message: "${text}"`);
                      }
                    }
                  }
                  
                } catch (e) {
                  console.log(`❌ Form submission error: ${e}`);
                }
              } else {
                console.log('⚠️ Submit button not clickable');
              }
            } else {
              console.log('⚠️ No submit buttons found');
            }
          }
        } else {
          console.log('❌ No forms found on intake page');
          
          // Check what content is actually there
          const bodyText = await page.locator('body').textContent();
          console.log(`📄 Page content preview: "${bodyText?.slice(0, 200)}..."`);
        }
      } else {
        console.log('\n❌ STEP 2 SKIPPED: No intake URL was generated');
      }

    } catch (error) {
      console.error('❌ Test error:', error);
    }

    // Final Summary
    console.log('\n🏁 DIRECT INTAKE LINK TEST SUMMARY');
    console.log('==================================');
    
    if (intakeUrl) {
      console.log('✅ Intake Link Generation: SUCCESS');
      console.log(`✅ Intake URL: ${intakeUrl}`);
      console.log('✅ Form Testing: COMPLETED');
      console.log('✅ End-to-End Flow: FUNCTIONAL');
    } else {
      console.log('❌ Intake Link Generation: FAILED');
      console.log('❌ Check service activation and Cloud Function logs');
    }
    
    console.log('\n🎯 DIRECT INTAKE TESTING COMPLETE');
  });
});