import { test, expect } from './mcp-test-utils';
import { MCPPlaywrightUtils } from './mcp-test-utils';

test.describe('MCPForms Firebase Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Setup test environment
    await page.goto('/');
    
    // Mock Firebase Functions if needed for testing
    await MCPPlaywrightUtils.mockFirebaseFunction(page, 'uploadTemplateAndParse', {
      success: true,
      data: { templateId: 'test-template-123', status: 'processing' }
    });
  });

  test.describe('Template Management Flow', () => {
    test('should upload template and trigger AI processing', async ({ 
      page, 
      firebaseAuth, 
      templateHelpers 
    }) => {
      // Login as admin
      await firebaseAuth.login('admin@test.com', 'testpassword');
      
      // Navigate to templates
      await page.goto('/admin/templates');
      
      // Create a test file for upload
      const testFilePath = './test-data/sample-template.docx';
      
      // Upload template
      const templateId = await templateHelpers.uploadTemplate(testFilePath);
      expect(templateId).toBeTruthy();
      
      // Wait for AI processing to complete
      await templateHelpers.waitForProcessing(templateId);
      
      // Verify template status
      const status = await templateHelpers.getTemplateStatus(templateId);
      expect(status).toContain('processed');
      
      // Capture page state for MCP analysis
      const pageState = await MCPPlaywrightUtils.capturePageState(page);
      console.log('Template processing completed:', pageState);
    });

    test('should handle template upload failures gracefully', async ({ 
      page, 
      firebaseAuth, 
      templateHelpers 
    }) => {
      await firebaseAuth.login('admin@test.com', 'testpassword');
      
      // Mock a failed upload
      await MCPPlaywrightUtils.mockFirebaseFunction(page, 'uploadTemplateAndParse', {
        success: false,
        error: 'Invalid file format'
      });
      
      await page.goto('/admin/templates');
      
      // Try to upload invalid file
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles('./test-data/invalid-file.txt');
      
      // Expect error message
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid file format');
    });
  });

  test.describe('Service Creation and Management', () => {
    test('should create service from processed templates', async ({ 
      page, 
      firebaseAuth, 
      templateHelpers, 
      serviceHelpers 
    }) => {
      await firebaseAuth.login('admin@test.com', 'testpassword');
      
      // First upload and process templates
      const template1Id = await templateHelpers.uploadTemplate('./test-data/template1.docx');
      const template2Id = await templateHelpers.uploadTemplate('./test-data/template2.docx');
      
      await templateHelpers.waitForProcessing(template1Id);
      await templateHelpers.waitForProcessing(template2Id);
      
      // Create service
      const serviceId = await serviceHelpers.createService(
        'Test Legal Service',
        [template1Id, template2Id]
      );
      
      expect(serviceId).toBeTruthy();
      
      // Activate service
      await serviceHelpers.activateService(serviceId);
      
      // Verify service status
      const status = await serviceHelpers.getServiceStatus(serviceId);
      expect(status).toBe('active');
    });
  });

  test.describe('Complete Intake Workflow', () => {
    test('should complete full intake form workflow', async ({ 
      page, 
      firebaseAuth, 
      templateHelpers, 
      serviceHelpers, 
      intakeHelpers 
    }) => {
      // Setup: Create a service
      await firebaseAuth.login('admin@test.com', 'testpassword');
      
      const templateId = await templateHelpers.uploadTemplate('./test-data/sample-template.docx');
      await templateHelpers.waitForProcessing(templateId);
      
      const serviceId = await serviceHelpers.createService('Test Service', [templateId]);
      await serviceHelpers.activateService(serviceId);
      
      // Generate intake link
      const intakeLink = await intakeHelpers.generateIntakeLink(serviceId);
      expect(intakeLink).toContain('/intake/');
      
      // Extract token from link
      const token = intakeLink.split('/intake/')[1];
      
      // Navigate to intake form (as client)
      await firebaseAuth.logout();
      await page.goto(`/intake/${token}`);
      
      // Fill intake form
      await intakeHelpers.fillIntakeForm({
        'client-name': 'John Doe',
        'client-email': 'john@example.com',
        'business-name': 'Acme Corp',
        'service-type': 'legal-consultation',
        'description': 'Need help with contract review'
      });
      
      // Submit intake
      await intakeHelpers.submitIntake();
      
      // Verify submission success
      await expect(page.locator('[data-testid="submission-success"]')).toBeVisible();
      
      // Capture final state
      const finalState = await MCPPlaywrightUtils.capturePageState(page);
      console.log('Intake workflow completed:', finalState);
    });

    test('should handle intake form validation', async ({ page }) => {
      // Navigate to intake form with demo token
      await page.goto('/intake/demo-token-123');
      
      // Try to submit empty form
      await page.click('[data-testid="submit-intake"]');
      
      // Expect validation errors
      await expect(page.locator('[data-testid="validation-error"]')).toBeVisible();
      
      // Fill required fields
      await page.fill('[data-field-name="client-name"]', 'Jane Doe');
      await page.fill('[data-field-name="client-email"]', 'jane@example.com');
      
      // Submit again
      await page.click('[data-testid="submit-intake"]');
      
      // Should proceed without validation errors
      await expect(page.locator('[data-testid="validation-error"]')).not.toBeVisible();
    });
  });

  test.describe('Real Firebase Functions Integration', () => {
    test('should connect to actual deployed Firebase Functions', async ({ page }) => {
      // Test actual connection to deployed functions
      const response = await MCPPlaywrightUtils.waitForFirebaseFunction(
        page, 
        'uploadTemplateAndParse'
      );
      
      expect(response.status()).toBe(200);
    });

    test('should handle Firebase authentication flow', async ({ page, firebaseAuth }) => {
      // Test Firebase Auth integration
      await page.goto('/admin');
      
      // Should redirect to login
      await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
      
      // Login with Firebase
      await firebaseAuth.login('admin@test.com', 'testpassword');
      
      // Should redirect to dashboard
      await expect(page).toHaveURL('/admin/dashboard');
      await expect(page.locator('[data-testid="dashboard-title"]')).toBeVisible();
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    test('should handle network failures gracefully', async ({ page }) => {
      // Simulate network failure
      await page.route('**/*', route => route.abort());
      
      await page.goto('/admin/templates');
      
      // Should show offline message or error state
      await expect(page.locator('[data-testid="network-error"]')).toBeVisible();
    });

    test('should handle large file uploads', async ({ page, firebaseAuth, templateHelpers }) => {
      await firebaseAuth.login('admin@test.com', 'testpassword');
      
      // Test with large file (mock scenario)
      await MCPPlaywrightUtils.mockFirebaseFunction(page, 'uploadTemplateAndParse', {
        success: false,
        error: 'File too large'
      });
      
      const templateId = await templateHelpers.uploadTemplate('./test-data/large-template.docx');
      
      // Should handle error appropriately
      await expect(page.locator('[data-testid="upload-error"]')).toContainText('File too large');
    });
  });
});