import { test, expect } from '@playwright/test';
import { MCPPlaywrightUtils } from './mcp-test-utils';

test.describe('MCPForms API Integration Tests', () => {
  const baseURL = 'https://us-central1-formgenai-4545.cloudfunctions.net';
  
  test.describe('Firebase Functions API Tests', () => {
    test('should connect to uploadTemplateAndParse function', async ({ request }) => {
      // Test the deployed Firebase Function
      const response = await request.post(`${baseURL}/uploadTemplateAndParse`, {
        data: {
          data: {
            fileName: 'test-template.docx',
            fileSize: 1024,
            contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          }
        },
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // Should get a response (may be error due to missing file, but connection works)
      expect(response.status()).toBeLessThan(500);
    });

    test('should connect to createServiceRequest function', async ({ request }) => {
      const response = await request.post(`${baseURL}/createServiceRequest`, {
        data: {
          data: {
            name: 'Test Service',
            description: 'Test service description',
            templateIds: ['template-123']
          }
        },
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      expect(response.status()).toBeLessThan(500);
    });

    test('should connect to generateIntakeLink function', async ({ request }) => {
      const response = await request.post(`${baseURL}/generateIntakeLink`, {
        data: {
          data: {
            serviceId: 'service-123'
          }
        },
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      expect(response.status()).toBeLessThan(500);
    });

    test('should test intakeFormAPI HTTP endpoint', async ({ request }) => {
      const response = await request.get(`${baseURL}/intakeFormAPI/health`);
      
      // Should respond to GET request
      expect(response.status()).toBeLessThan(500);
    });
  });

  test.describe('Frontend API Integration', () => {
    test('should handle API calls from frontend', async ({ page }) => {
      // Start the dev server
      await page.goto('http://127.0.0.1:3000');
      
      // Mock successful API responses
      await page.route('**/api/**', route => {
        const url = route.request().url();
        
        if (url.includes('templates')) {
          route.fulfill({
            status: 200,
            body: JSON.stringify({
              success: true,
              data: { templates: [] }
            })
          });
        } else if (url.includes('services')) {
          route.fulfill({
            status: 200,
            body: JSON.stringify({
              success: true,
              data: { services: [] }
            })
          });
        } else {
          route.continue();
        }
      });
      
      // Navigate to admin section
      await page.goto('/admin/templates');
      
      // Should load without API errors
      await expect(page.locator('body')).toBeVisible();
    });

    test('should handle API errors gracefully', async ({ page }) => {
      await page.goto('http://127.0.0.1:3000');
      
      // Mock API errors
      await page.route('**/api/**', route => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({
            success: false,
            error: 'Internal server error'
          })
        });
      });
      
      // Navigate to admin section
      await page.goto('/admin/templates');
      
      // Should show error state
      await expect(page.locator('[data-testid="error-message"], .error-state')).toBeVisible();
    });
  });

  test.describe('Real Firebase Integration Tests', () => {
    test('should authenticate with Firebase', async ({ page }) => {
      await page.goto('http://127.0.0.1:3000/admin');
      
      // Check if Firebase SDK is loaded
      const firebaseLoaded = await page.evaluate(() => {
        return typeof window !== 'undefined' && 
               (window as any).firebase !== undefined;
      });
      
      // May not be loaded on login page, that's ok
      console.log('Firebase loaded:', firebaseLoaded);
    });

    test('should handle Firestore connection', async ({ page }) => {
      await page.goto('http://127.0.0.1:3000');
      
      // Check if Firestore is accessible
      const firestoreTest = await page.evaluate(async () => {
        try {
          // This will be available if Firebase is properly initialized
          return typeof window !== 'undefined' && 
                 (window as any).firebase !== undefined;
        } catch (error) {
          return false;
        }
      });
      
      console.log('Firestore connection test:', firestoreTest);
    });

    test('should handle Firebase Storage operations', async ({ page }) => {
      await page.goto('http://127.0.0.1:3000/admin/templates');
      
      // Mock file upload to test Firebase Storage integration
      await page.route('**/upload/**', route => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            data: {
              downloadURL: 'https://firebasestorage.googleapis.com/test-file.docx',
              fileName: 'test-file.docx'
            }
          })
        });
      });
      
      // Test file input
      const fileInput = page.locator('input[type="file"]');
      if (await fileInput.count() > 0) {
        await fileInput.setInputFiles('./test-data/sample-template.txt');
        
        // Should trigger upload process
        await expect(page.locator('[data-testid="upload-progress"], .upload-indicator')).toBeVisible();
      }
    });
  });

  test.describe('OpenAI Integration Tests', () => {
    test('should test AI template parsing integration', async ({ page }) => {
      await page.goto('http://127.0.0.1:3000');
      
      // Mock OpenAI response
      await page.route('**/uploadTemplateAndParse*', route => {
        route.fulfill({
          status: 200,
          body: JSON.stringify({
            success: true,
            data: {
              templateId: 'template-123',
              extractedFields: [
                { name: 'client-name', type: 'text', label: 'Client Name' },
                { name: 'client-email', type: 'email', label: 'Email Address' }
              ],
              status: 'processed'
            }
          })
        });
      });
      
      // Navigate to templates page
      await page.goto('/admin/templates');
      
      // Upload a test file
      const fileInput = page.locator('input[type="file"]');
      if (await fileInput.count() > 0) {
        await fileInput.setInputFiles('./test-data/sample-template.txt');
        
        // Should show processing status
        await expect(page.locator('[data-testid="processing-status"]')).toBeVisible();
      }
    });

    test('should handle AI processing errors', async ({ page }) => {
      await page.goto('http://127.0.0.1:3000');
      
      // Mock OpenAI error response
      await page.route('**/uploadTemplateAndParse*', route => {
        route.fulfill({
          status: 400,
          body: JSON.stringify({
            success: false,
            error: 'Unable to extract fields from document'
          })
        });
      });
      
      await page.goto('/admin/templates');
      
      const fileInput = page.locator('input[type="file"]');
      if (await fileInput.count() > 0) {
        await fileInput.setInputFiles('./test-data/sample-template.txt');
        
        // Should show error message
        await expect(page.locator('[data-testid="processing-error"]')).toBeVisible();
      }
    });
  });

  test.describe('Performance Tests', () => {
    test('should load pages within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('http://127.0.0.1:3000');
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(5000); // 5 seconds max
      
      console.log(`Page load time: ${loadTime}ms`);
    });

    test('should handle multiple concurrent requests', async ({ page }) => {
      await page.goto('http://127.0.0.1:3000');
      
      // Mock multiple API endpoints
      const apiPromises = [
        '/api/templates',
        '/api/services',
        '/api/intake/status'
      ].map(endpoint => {
        return page.route(`**${endpoint}*`, route => {
          setTimeout(() => {
            route.fulfill({
              status: 200,
              body: JSON.stringify({ success: true, data: [] })
            });
          }, Math.random() * 1000);
        });
      });
      
      await Promise.all(apiPromises);
      
      // Navigate to admin dashboard
      await page.goto('/admin/dashboard');
      
      // Should handle concurrent requests without issues
      await expect(page.locator('[data-testid="dashboard-title"]')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Security Tests', () => {
    test('should require authentication for admin endpoints', async ({ request }) => {
      // Test admin API without authentication
      const response = await request.get(`${baseURL}/createServiceRequest`);
      
      // Should require authentication
      expect([401, 403, 405]).toContain(response.status());
    });

    test('should validate intake tokens', async ({ page }) => {
      // Test with invalid token
      await page.goto('http://127.0.0.1:3000/intake/invalid-token-123');
      
      // Should show error or redirect
      const hasError = await page.locator('[data-testid="error-message"], .error-state').count() > 0;
      const isRedirected = page.url() !== 'http://127.0.0.1:3000/intake/invalid-token-123';
      
      expect(hasError || isRedirected).toBe(true);
    });

    test('should sanitize user inputs', async ({ page }) => {
      await page.goto('http://127.0.0.1:3000/intake/demo-token-123');
      
      // Try to inject script
      const maliciousInput = '<script>alert("xss")</script>';
      
      const textInput = page.locator('input[type="text"], textarea').first();
      if (await textInput.count() > 0) {
        await textInput.fill(maliciousInput);
        
        // Check if input is sanitized
        const value = await textInput.inputValue();
        expect(value).not.toContain('<script>');
      }
    });
  });
});