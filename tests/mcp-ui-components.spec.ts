import { test, expect } from './mcp-test-utils';
import { MCPPlaywrightUtils } from './mcp-test-utils';

test.describe('MCPForms UI Component Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Enable console logs for debugging
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  });

  test.describe('Landing Page and Navigation', () => {
    test('should display landing page correctly', async ({ page }) => {
      await page.goto('/');
      
      // Check page title
      await expect(page).toHaveTitle(/MCPForms/);
      
      // Check main navigation elements
      await expect(page.locator('[data-testid="main-header"]')).toBeVisible();
      await expect(page.locator('[data-testid="hero-section"]')).toBeVisible();
      
      // Check call-to-action buttons
      await expect(page.locator('[data-testid="cta-admin"]')).toBeVisible();
      await expect(page.locator('[data-testid="cta-learn-more"]')).toBeVisible();
      
      // Capture page state for analysis
      const pageState = await MCPPlaywrightUtils.capturePageState(page);
      expect(pageState.title).toContain('MCPForms');
    });

    test('should navigate to admin section', async ({ page }) => {
      await page.goto('/');
      
      // Click admin button
      await page.click('[data-testid="cta-admin"]');
      
      // Should navigate to admin login
      await expect(page).toHaveURL('/admin');
      await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
    });
  });

  test.describe('Admin Authentication UI', () => {
    test('should display login form correctly', async ({ page }) => {
      await page.goto('/admin');
      
      // Check form elements
      await expect(page.locator('[data-testid="login-form"]')).toBeVisible();
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
      
      // Check form labels
      await expect(page.locator('label[for="email"]')).toContainText('Email');
      await expect(page.locator('label[for="password"]')).toContainText('Password');
    });

    test('should handle login form validation', async ({ page }) => {
      await page.goto('/admin');
      
      // Try to submit empty form
      await page.click('button[type="submit"]');
      
      // Check for validation messages (may vary based on implementation)
      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');
      
      // HTML5 validation should prevent submission
      expect(await emailInput.evaluate(el => (el as HTMLInputElement).validity.valid)).toBe(false);
      expect(await passwordInput.evaluate(el => (el as HTMLInputElement).validity.valid)).toBe(false);
    });

    test('should handle Firebase auth errors gracefully', async ({ page }) => {
      await page.goto('/admin');
      
      // Fill invalid credentials
      await page.fill('input[type="email"]', 'invalid@email.com');
      await page.fill('input[type="password"]', 'wrongpassword');
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Wait for error message (adjust selector based on implementation)
      const errorMessage = page.locator('[data-testid="auth-error"], .error-message, [role="alert"]');
      await expect(errorMessage).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Template Upload Interface', () => {
    test('should display template upload area', async ({ page, firebaseAuth }) => {
      // Simulate successful login
      await page.goto('/admin');
      await firebaseAuth.login('admin@test.com', 'testpassword');
      
      await page.goto('/admin/templates');
      
      // Check upload interface
      await expect(page.locator('[data-testid="template-upload"]')).toBeVisible();
      await expect(page.locator('input[type="file"]')).toBeVisible();
      
      // Check supported formats information
      const uploadArea = page.locator('[data-testid="template-upload"]');
      await expect(uploadArea).toContainText(/drag.*drop|choose.*file/i);
    });

    test('should handle file drag and drop', async ({ page, firebaseAuth }) => {
      await page.goto('/admin');
      await firebaseAuth.login('admin@test.com', 'testpassword');
      
      await page.goto('/admin/templates');
      
      const uploadArea = page.locator('[data-testid="template-upload"]');
      
      // Simulate drag over
      await uploadArea.dispatchEvent('dragover', {
        dataTransfer: {
          files: [new File(['test content'], 'test.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })]
        }
      });
      
      // Check visual feedback
      await expect(uploadArea).toHaveClass(/drag-over|highlighted/);
    });

    test('should show upload progress', async ({ page, firebaseAuth }) => {
      await page.goto('/admin');
      await firebaseAuth.login('admin@test.com', 'testpassword');
      
      await page.goto('/admin/templates');
      
      // Mock slow upload response
      await page.route('**/uploadTemplateAndParse*', async route => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        route.fulfill({
          status: 200,
          body: JSON.stringify({ success: true, data: { templateId: 'test-123' } })
        });
      });
      
      // Upload file
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles('./test-data/sample-template.txt');
      
      // Check progress indicator
      await expect(page.locator('[data-testid="upload-progress"]')).toBeVisible();
      await expect(page.locator('[data-testid="upload-progress"]')).toContainText(/uploading|processing/i);
    });
  });

  test.describe('Template List and Management', () => {
    test('should display template list', async ({ page, firebaseAuth }) => {
      await page.goto('/admin');
      await firebaseAuth.login('admin@test.com', 'testpassword');
      
      await page.goto('/admin/templates');
      
      // Mock templates data
      await page.route('**/api/templates*', route => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            templates: [
              { id: '1', name: 'Contract Template', status: 'processed', createdAt: new Date().toISOString() },
              { id: '2', name: 'NDA Template', status: 'processing', createdAt: new Date().toISOString() }
            ]
          })
        });
      });
      
      await page.reload();
      
      // Check template list
      await expect(page.locator('[data-testid="template-list"]')).toBeVisible();
      await expect(page.locator('[data-testid="template-item"]')).toHaveCount(2);
      
      // Check template details
      const firstTemplate = page.locator('[data-testid="template-item"]').first();
      await expect(firstTemplate).toContainText('Contract Template');
      await expect(firstTemplate).toContainText('processed');
    });

    test('should handle template status updates', async ({ page, firebaseAuth }) => {
      await page.goto('/admin');
      await firebaseAuth.login('admin@test.com', 'testpassword');
      
      await page.goto('/admin/templates');
      
      // Mock template status change
      await page.route('**/api/templates*', route => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            templates: [
              { id: '1', name: 'Processing Template', status: 'processing', createdAt: new Date().toISOString() }
            ]
          })
        });
      });
      
      await page.reload();
      
      // Template should show processing status
      const template = page.locator('[data-template-id="1"]');
      await expect(template.locator('[data-testid="status"]')).toContainText('processing');
      
      // Mock status update to completed
      await page.route('**/api/templates*', route => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            templates: [
              { id: '1', name: 'Processing Template', status: 'completed', createdAt: new Date().toISOString() }
            ]
          })
        });
      });
      
      // Trigger refresh
      await page.click('[data-testid="refresh-templates"]');
      
      // Status should update
      await expect(template.locator('[data-testid="status"]')).toContainText('completed');
    });
  });

  test.describe('Service Creation Interface', () => {
    test('should display service creation form', async ({ page, firebaseAuth }) => {
      await page.goto('/admin');
      await firebaseAuth.login('admin@test.com', 'testpassword');
      
      await page.goto('/admin/services');
      
      // Click create service button
      await page.click('[data-testid="create-service"]');
      
      // Check form elements
      await expect(page.locator('[data-testid="service-form"]')).toBeVisible();
      await expect(page.locator('[data-testid="service-name"]')).toBeVisible();
      await expect(page.locator('[data-testid="service-description"]')).toBeVisible();
      await expect(page.locator('[data-testid="template-selector"]')).toBeVisible();
    });

    test('should handle template selection', async ({ page, firebaseAuth }) => {
      await page.goto('/admin');
      await firebaseAuth.login('admin@test.com', 'testpassword');
      
      await page.goto('/admin/services');
      await page.click('[data-testid="create-service"]');
      
      // Mock available templates
      await page.route('**/api/templates*', route => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            templates: [
              { id: '1', name: 'Template 1', status: 'processed' },
              { id: '2', name: 'Template 2', status: 'processed' }
            ]
          })
        });
      });
      
      // Select templates
      await page.check('[data-template-id="1"] input[type="checkbox"]');
      await page.check('[data-template-id="2"] input[type="checkbox"]');
      
      // Check selection count
      const selectedCount = page.locator('[data-testid="selected-templates-count"]');
      await expect(selectedCount).toContainText('2');
    });
  });

  test.describe('Intake Form Interface', () => {
    test('should display intake form for valid token', async ({ page }) => {
      // Mock intake form data
      await page.route('**/api/intake/*', route => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            data: {
              intake: {
                id: 'intake-123',
                serviceId: 'service-123',
                status: 'pending',
                formFields: [
                  { name: 'client-name', type: 'text', label: 'Client Name', required: true },
                  { name: 'client-email', type: 'email', label: 'Email Address', required: true },
                  { name: 'description', type: 'textarea', label: 'Description', required: false }
                ]
              }
            }
          })
        });
      });
      
      await page.goto('/intake/valid-token-123');
      
      // Check form elements
      await expect(page.locator('[data-testid="intake-form"]')).toBeVisible();
      await expect(page.locator('[data-field-name="client-name"]')).toBeVisible();
      await expect(page.locator('[data-field-name="client-email"]')).toBeVisible();
      await expect(page.locator('[data-field-name="description"]')).toBeVisible();
      
      // Check required field indicators
      const requiredFields = page.locator('[required]');
      await expect(requiredFields).toHaveCount(2);
    });

    test('should handle invalid intake token', async ({ page }) => {
      // Mock invalid token response
      await page.route('**/api/intake/*', route => {
        route.fulfill({
          status: 404,
          body: JSON.stringify({
            success: false,
            error: 'Intake form not found'
          })
        });
      });
      
      await page.goto('/intake/invalid-token');
      
      // Should show error message
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="error-message"]')).toContainText('not found');
    });

    test('should validate form before submission', async ({ page }) => {
      // Mock valid intake form
      await page.route('**/api/intake/*', route => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            data: {
              intake: {
                id: 'intake-123',
                formFields: [
                  { name: 'client-name', type: 'text', label: 'Client Name', required: true },
                  { name: 'client-email', type: 'email', label: 'Email Address', required: true }
                ]
              }
            }
          })
        });
      });
      
      await page.goto('/intake/valid-token');
      
      // Try to submit without filling required fields
      await page.click('[data-testid="submit-intake"]');
      
      // Check for validation errors
      await expect(page.locator('[data-testid="validation-error"]')).toBeVisible();
      
      // Fill required fields
      await page.fill('[data-field-name="client-name"]', 'John Doe');
      await page.fill('[data-field-name="client-email"]', 'john@example.com');
      
      // Validation errors should disappear
      await expect(page.locator('[data-testid="validation-error"]')).not.toBeVisible();
    });
  });

  test.describe('Responsive Design Tests', () => {
    test('should adapt to mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto('/');
      
      // Check mobile navigation
      await expect(page.locator('[data-testid="mobile-menu-toggle"]')).toBeVisible();
      
      // Check responsive layout
      const heroSection = page.locator('[data-testid="hero-section"]');
      const boundingBox = await heroSection.boundingBox();
      expect(boundingBox?.width).toBeLessThanOrEqual(375);
    });

    test('should adapt to tablet viewport', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      
      await page.goto('/admin/templates');
      
      // Check tablet layout adaptations
      const templateGrid = page.locator('[data-testid="template-grid"]');
      await expect(templateGrid).toHaveClass(/grid-cols-2|tablet/);
    });
  });

  test.describe('Accessibility Tests', () => {
    test('should have proper ARIA labels', async ({ page }) => {
      await page.goto('/');
      
      // Check main navigation
      await expect(page.locator('[role="navigation"]')).toBeVisible();
      
      // Check form labels
      await page.goto('/admin');
      await expect(page.locator('input[type="email"]')).toHaveAttribute('aria-label');
      await expect(page.locator('input[type="password"]')).toHaveAttribute('aria-label');
    });

    test('should support keyboard navigation', async ({ page }) => {
      await page.goto('/');
      
      // Tab through interactive elements
      await page.keyboard.press('Tab');
      await expect(page.locator(':focus')).toBeVisible();
      
      await page.keyboard.press('Tab');
      await expect(page.locator(':focus')).toBeVisible();
    });
  });
});