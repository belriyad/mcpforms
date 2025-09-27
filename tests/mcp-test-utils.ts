import { test as base, expect, Page } from '@playwright/test';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load MCP configuration
const mcpConfig = JSON.parse(
  readFileSync(join(__dirname, '../mcp-playwright.config.json'), 'utf-8')
);

// Extended test fixture with MCP utilities
export const test = base.extend<{
  mcpPage: Page;
  firebaseAuth: {
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    isLoggedIn: () => Promise<boolean>;
  };
  templateHelpers: {
    uploadTemplate: (filePath: string) => Promise<string>;
    waitForProcessing: (templateId: string) => Promise<void>;
    getTemplateStatus: (templateId: string) => Promise<string>;
  };
  serviceHelpers: {
    createService: (name: string, templateIds: string[]) => Promise<string>;
    activateService: (serviceId: string) => Promise<void>;
    getServiceStatus: (serviceId: string) => Promise<string>;
  };
  intakeHelpers: {
    generateIntakeLink: (serviceId: string) => Promise<string>;
    fillIntakeForm: (data: Record<string, any>) => Promise<void>;
    submitIntake: () => Promise<void>;
  };
}>({
  mcpPage: async ({ page }, use) => {
    // Enhanced page with MCP capabilities
    await use(page);
  },

  firebaseAuth: async ({ page }, use) => {
    const auth = {
      async login(email: string, password: string) {
        await page.goto('/admin');
        await page.fill(mcpConfig.selectors.firebase.emailInput, email);
        await page.fill(mcpConfig.selectors.firebase.passwordInput, password);
        await page.click(mcpConfig.selectors.firebase.submitButton);
        await page.waitForURL('/admin/dashboard');
      },

      async logout() {
        await page.click('[data-testid="logout-button"]');
        await page.waitForURL('/admin');
      },

      async isLoggedIn() {
        try {
          await page.waitForSelector('[data-testid="user-menu"]', { timeout: 5000 });
          return true;
        } catch {
          return false;
        }
      }
    };
    await use(auth);
  },

  templateHelpers: async ({ page }, use) => {
    const helpers = {
      async uploadTemplate(filePath: string): Promise<string> {
        await page.goto('/admin/templates');
        
        // Upload file
        const fileInput = page.locator(mcpConfig.selectors.templates.fileInput);
        await fileInput.setInputFiles(filePath);
        
        // Wait for upload to complete and get template ID
        const templateItem = page.locator(mcpConfig.selectors.templates.templateItem).first();
        await templateItem.waitFor();
        
        const templateId = await templateItem.getAttribute('data-template-id');
        return templateId || '';
      },

      async waitForProcessing(templateId: string): Promise<void> {
        const statusSelector = `[data-template-id="${templateId}"] [data-testid="status"]`;
        await page.waitForFunction(
          (selector) => {
            const element = document.querySelector(selector);
            return element?.textContent?.includes('processed') || 
                   element?.textContent?.includes('completed');
          },
          statusSelector,
          { timeout: 60000 }
        );
      },

      async getTemplateStatus(templateId: string): Promise<string> {
        const statusElement = page.locator(`[data-template-id="${templateId}"] [data-testid="status"]`);
        return await statusElement.textContent() || '';
      }
    };
    await use(helpers);
  },

  serviceHelpers: async ({ page }, use) => {
    const helpers = {
      async createService(name: string, templateIds: string[]): Promise<string> {
        await page.goto('/admin/services');
        await page.click(mcpConfig.selectors.services.createButton);
        
        // Fill form
        await page.fill('[data-testid="service-name"]', name);
        await page.fill('[data-testid="service-description"]', `Test service: ${name}`);
        
        // Select templates
        for (const templateId of templateIds) {
          await page.check(`[data-template-id="${templateId}"] input[type="checkbox"]`);
        }
        
        await page.click('[data-testid="submit-service"]');
        
        // Get service ID from response
        const serviceItem = page.locator(mcpConfig.selectors.services.serviceList).first();
        await serviceItem.waitFor();
        
        const serviceId = await serviceItem.getAttribute('data-service-id');
        return serviceId || '';
      },

      async activateService(serviceId: string): Promise<void> {
        await page.click(`[data-service-id="${serviceId}"] [data-testid="activate-service"]`);
        await page.waitForSelector(`[data-service-id="${serviceId}"][data-status="active"]`);
      },

      async getServiceStatus(serviceId: string): Promise<string> {
        const statusElement = page.locator(`[data-service-id="${serviceId}"] [data-testid="service-status"]`);
        return await statusElement.textContent() || '';
      }
    };
    await use(helpers);
  },

  intakeHelpers: async ({ page }, use) => {
    const helpers = {
      async generateIntakeLink(serviceId: string): Promise<string> {
        await page.click(`[data-service-id="${serviceId}"] [data-testid="generate-intake-link"]`);
        
        const linkElement = page.locator('[data-testid="intake-link"]');
        await linkElement.waitFor();
        
        const link = await linkElement.textContent();
        return link || '';
      },

      async fillIntakeForm(data: Record<string, any>): Promise<void> {
        for (const [fieldName, value] of Object.entries(data)) {
          const field = page.locator(`[data-field-name="${fieldName}"]`);
          
          const fieldType = await field.getAttribute('type') || await field.evaluate(el => el.tagName.toLowerCase());
          
          switch (fieldType) {
            case 'checkbox':
              if (value) await field.check();
              break;
            case 'select':
              await field.selectOption(value);
              break;
            case 'textarea':
              await field.fill(value);
              break;
            default:
              await field.fill(value);
          }
        }
      },

      async submitIntake(): Promise<void> {
        await page.click(mcpConfig.selectors.intake.submitButton);
        await page.waitForSelector('[data-testid="submission-success"]');
      }
    };
    await use(helpers);
  }
});

export { expect };

// MCP integration utilities
export class MCPPlaywrightUtils {
  static async capturePageState(page: Page): Promise<any> {
    return {
      url: page.url(),
      title: await page.title(),
      timestamp: new Date().toISOString(),
      viewport: await page.viewportSize(),
      elements: await page.evaluate(() => {
        const elements = document.querySelectorAll('[data-testid]');
        return Array.from(elements).map(el => ({
          testId: el.getAttribute('data-testid'),
          text: el.textContent?.slice(0, 100),
          visible: (el as HTMLElement).offsetParent !== null
        }));
      })
    };
  }

  static async waitForFirebaseFunction(page: Page, functionName: string, timeout = 30000): Promise<any> {
    return page.waitForResponse(
      response => response.url().includes(functionName) && response.status() === 200,
      { timeout }
    );
  }

  static async mockFirebaseFunction(page: Page, functionName: string, mockResponse: any): Promise<void> {
    await page.route(`**/*${functionName}*`, route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockResponse)
      });
    });
  }
}