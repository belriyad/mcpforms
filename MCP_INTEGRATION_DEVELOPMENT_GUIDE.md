# MCP Integration Development Guide

## How to Add New MCP Integration Points

This guide explains how to extend MCPForms with new MCP server integration points for testing, monitoring, and validation.

---

## 📋 Table of Contents

1. [Understanding MCP in MCPForms](#understanding-mcp)
2. [Adding New Test Fixtures](#adding-test-fixtures)
3. [Creating New Test Scenarios](#creating-test-scenarios)
4. [Integrating New Cloud Functions](#integrating-cloud-functions)
5. [MCP Configuration Updates](#mcp-configuration)
6. [Testing Best Practices](#testing-practices)

---

## Understanding MCP in MCPForms {#understanding-mcp}

### What is MCP?

**Model Context Protocol (MCP)** in MCPForms refers to **Playwright's MCP support** (`@playwright/mcp`), which provides:

- Standardized protocol for browser automation
- Enhanced testing capabilities
- AI-powered test analysis
- Performance monitoring
- Accessibility validation

### Current MCP Usage

```typescript
// Example: Using MCP in MCPForms
import { test } from './mcp-test-utils';

test('example test', async ({ page, firebaseAuth, templateHelpers }) => {
  // firebaseAuth, templateHelpers, etc. are MCP fixtures
  await firebaseAuth.login('user@test.com', 'password');
  
  // MCP provides AI-powered analysis
  const pageState = await MCPPlaywrightUtils.capturePageState(page);
});
```

---

## Adding New Test Fixtures {#adding-test-fixtures}

### Step 1: Define the Fixture Interface

Add to `tests/mcp-test-utils.ts`:

```typescript
export interface NewFeatureHelpers {
  performAction: (params: any) => Promise<string>;
  verifyState: (expectedState: string) => Promise<boolean>;
  cleanupAction: (resourceId: string) => Promise<void>;
}
```

### Step 2: Implement the Fixture

```typescript
export const test = base.extend<{
  newFeatureHelpers: NewFeatureHelpers;
}>({
  newFeatureHelpers: async ({ page }, use) => {
    const helpers = {
      async performAction(params: any): Promise<string> {
        // Implement action logic
        console.log(`🔧 Performing action with params:`, params);
        
        // Example: Click a button and verify navigation
        await page.click('[data-testid="action-button"]');
        await page.waitForNavigation();
        
        // Return ID or confirmation
        return 'action-completed';
      },

      async verifyState(expectedState: string): Promise<boolean> {
        // Implement verification logic
        const currentState = await page.locator('[data-testid="state-display"]')
          .innerText();
        return currentState === expectedState;
      },

      async cleanupAction(resourceId: string): Promise<void> {
        // Implement cleanup logic
        console.log(`🧹 Cleaning up resource: ${resourceId}`);
        // Delete from database, cleanup files, etc.
      }
    };

    await use(helpers);
  }
});
```

### Step 3: Use the Fixture in Tests

```typescript
test('new feature integration', async ({ page, newFeatureHelpers }) => {
  // Now available in all tests
  const result = await newFeatureHelpers.performAction({ name: 'test' });
  expect(result).toBe('action-completed');
  
  const isCorrectState = await newFeatureHelpers.verifyState('success');
  expect(isCorrectState).toBe(true);
  
  await newFeatureHelpers.cleanupAction(result);
});
```

---

## Creating New Test Scenarios {#creating-test-scenarios}

### Pattern: Feature-Specific Test File

Create `tests/mcp-new-feature.spec.ts`:

```typescript
import { test, expect } from './mcp-test-utils';
import { MCPPlaywrightUtils } from './mcp-test-utils';

test.describe('MCPForms New Feature Tests', () => {
  // Setup/teardown
  test.beforeEach(async ({ page, firebaseAuth }) => {
    // Setup before each test
    await firebaseAuth.login('admin@test.com', 'password');
    await page.goto('/admin/new-feature');
  });

  test.afterEach(async ({ page }) => {
    // Cleanup after each test
    await page.close();
  });

  // Test suites
  test.describe('Feature Workflow', () => {
    test('should complete basic workflow', async ({ 
      page, 
      newFeatureHelpers 
    }) => {
      // Arrange
      const testData = { name: 'Test Item' };
      
      // Act
      const result = await newFeatureHelpers.performAction(testData);
      
      // Assert
      expect(result).toBeTruthy();
      
      // MCP Analysis
      const pageState = await MCPPlaywrightUtils.capturePageState(page);
      console.log('✅ Workflow completed:', pageState);
    });

    test('should handle errors gracefully', async ({ 
      page, 
      newFeatureHelpers 
    }) => {
      // Arrange
      const invalidData = { name: '' };
      
      // Act & Assert
      try {
        await newFeatureHelpers.performAction(invalidData);
        // Should fail
        expect(false).toBe(true);
      } catch (error) {
        // Expected error
        expect(error).toBeTruthy();
      }
    });
  });

  test.describe('Integration with Other Features', () => {
    test('should integrate with services', async ({ 
      page, 
      serviceHelpers, 
      newFeatureHelpers 
    }) => {
      // Create a service first
      const serviceId = await serviceHelpers.createService('Test', ['template-1']);
      
      // Use new feature with service
      const result = await newFeatureHelpers.performAction({ 
        serviceId 
      });
      
      expect(result).toBeTruthy();
    });
  });

  test.describe('Performance & Accessibility', () => {
    test('should maintain performance standards', async ({ page }) => {
      const metrics = await page.evaluate(() => {
        const perf = performance.getEntriesByType('navigation')[0] as any;
        return {
          loadTime: perf.loadEventEnd - perf.loadEventStart,
          firstPaint: performance.now()
        };
      });

      expect(metrics.loadTime).toBeLessThan(3000); // 3 second target
    });

    test('should comply with accessibility standards', async ({ page }) => {
      const violations = await MCPPlaywrightUtils.checkAccessibility(page);
      expect(violations.length).toBe(0);
    });
  });
});
```

### Pattern: Scenario-Based Testing

```typescript
test.describe('User Journey: New Feature Adoption', () => {
  test('should support complete user workflow', async ({ 
    page, 
    firebaseAuth,
    newFeatureHelpers 
  }) => {
    // Step 1: User logs in
    await firebaseAuth.login('user@test.com', 'password');
    
    // Step 2: Discovers new feature
    await page.goto('/admin/labs'); // Feature flags
    await page.check('[data-testid="enable-new-feature"]');
    
    // Step 3: Uses new feature
    await page.goto('/admin/new-feature');
    const result = await newFeatureHelpers.performAction({ name: 'My Item' });
    
    // Step 4: Verifies results
    const isCorrect = await newFeatureHelpers.verifyState('completed');
    expect(isCorrect).toBe(true);
    
    // Step 5: MCP captures journey
    const pageState = await MCPPlaywrightUtils.capturePageState(page);
    console.log('User journey:', pageState);
  });
});
```

---

## Integrating New Cloud Functions {#integrating-cloud-functions}

### Step 1: Create the Cloud Function

In `functions/src/index.ts`:

```typescript
import * as functions from 'firebase-functions';

export const newFeatureFunction = functions.https.onCall(
  async (data, context) => {
    try {
      // Validate input
      if (!data.requiredField) {
        throw new Error('requiredField is required');
      }

      // Process
      const result = await processNewFeature(data);

      // Log
      console.log('✅ New feature executed:', { data, result });

      return { success: true, data: result };
    } catch (error) {
      console.error('❌ New feature error:', error);
      return { success: false, error: (error as Error).message };
    }
  }
);
```

### Step 2: Add MCP Test for the Function

In `tests/mcp-firebase-integration.spec.ts`:

```typescript
test.describe('New Feature Function Integration', () => {
  test('should connect to newFeatureFunction', async ({ request }) => {
    const baseURL = 'https://us-central1-formgenai-4545.cloudfunctions.net';
    
    const response = await request.post(`${baseURL}/newFeatureFunction`, {
      data: {
        data: {
          requiredField: 'test-value',
          optionalField: 'optional'
        }
      }
    });

    // Validate response
    expect(response.status()).toBeLessThan(500);
    
    const body = await response.json();
    console.log('✅ Function response:', body);
  });

  test('should mock newFeatureFunction for testing', async ({ page }) => {
    // Mock the function
    await MCPPlaywrightUtils.mockFirebaseFunction(
      page,
      'newFeatureFunction',
      {
        success: true,
        data: { result: 'mocked-result' }
      }
    );

    // Test with mocked function
    // Your test logic here
  });
});
```

### Step 3: Add Helper in MCP Test Utils

```typescript
export interface NewFeatureFunctionHelpers {
  callFunction: (params: any) => Promise<any>;
  validateResponse: (response: any) => Promise<boolean>;
}

export const test = base.extend<{
  newFeatureFunction: NewFeatureFunctionHelpers;
}>({
  newFeatureFunction: async ({ page }, use) => {
    const helpers = {
      async callFunction(params: any): Promise<any> {
        const response = await page.evaluate(async (data) => {
          // Call Firebase Function
          const func = firebase.functions().httpsCallable('newFeatureFunction');
          return await func(data);
        }, params);
        return response.data;
      },

      async validateResponse(response: any): Promise<boolean> {
        return response && response.success === true;
      }
    };

    await use(helpers);
  }
});
```

---

## MCP Configuration Updates {#mcp-configuration}

### Add New Test Pattern

In `mcp-playwright.config.json`:

```json
{
  "testPatterns": {
    "ui": "tests/**/*.spec.ts",
    "api": "tests/api/**/*.spec.ts",
    "e2e": "tests/e2e/**/*.spec.ts",
    "newFeature": "tests/mcp-new-feature.spec.ts"  // NEW
  }
}
```

### Add New Selectors

```json
{
  "selectors": {
    "newFeature": {
      "actionButton": "[data-testid='new-feature-action']",
      "stateDisplay": "[data-testid='state-display']",
      "resultPanel": "[data-testid='result-panel']"
    }
  }
}
```

### Add New Environment Variables

```json
{
  "baseConfig": {
    "baseURL": "http://127.0.0.1:3000",
    "timeout": 30000,
    "retries": 2,
    "headless": true,
    "env": {
      "NEW_FEATURE_ENABLED": "true",
      "NEW_FEATURE_API_URL": "https://api.example.com"
    }
  }
}
```

---

## Testing Best Practices {#testing-practices}

### 1. **Arrange-Act-Assert Pattern**

```typescript
test('should work correctly', async ({ page, helpers }) => {
  // ARRANGE: Set up test data and state
  const testData = { name: 'Test' };
  
  // ACT: Perform the action
  const result = await helpers.performAction(testData);
  
  // ASSERT: Verify the results
  expect(result).toBeTruthy();
});
```

### 2. **Error Handling**

```typescript
test('should handle errors', async ({ page, helpers }) => {
  try {
    await helpers.performAction({ /* invalid data */ });
    expect(false).toBe(true); // Should have thrown
  } catch (error) {
    expect((error as Error).message).toContain('expected error');
  }
});
```

### 3. **Async/Await Properly**

```typescript
// ✅ Good: Wait for async operations
await page.waitForNavigation();
await page.waitForSelector('[data-testid="result"]');

// ❌ Bad: Don't mix sync and async improperly
page.goto('/path'); // Missing await
```

### 4. **Use Data Attributes for Selectors**

```typescript
// ✅ Good: Specific, maintainable
await page.click('[data-testid="submit-button"]');

// ❌ Bad: Brittle selectors
await page.click('button:nth-child(2)');
```

### 5. **Test Isolation**

```typescript
test.beforeEach(async ({ page }) => {
  // Setup unique state for each test
  await page.goto('/');
  await clearDatabase();
});

test.afterEach(async ({ page }) => {
  // Cleanup after each test
  await clearDatabase();
  await page.close();
});
```

### 6. **Performance Testing**

```typescript
test('should load quickly', async ({ page }) => {
  const startTime = Date.now();
  
  await page.goto('/admin/feature');
  
  const loadTime = Date.now() - startTime;
  expect(loadTime).toBeLessThan(2000); // 2 second target
});
```

### 7. **Accessibility Testing**

```typescript
test('should be accessible', async ({ page }) => {
  const violations = await MCPPlaywrightUtils.checkAccessibility(page);
  
  expect(violations).toHaveLength(0);
  
  // Or filter to non-critical violations
  const criticalViolations = violations.filter(v => v.impact === 'critical');
  expect(criticalViolations).toHaveLength(0);
});
```

### 8. **Screenshot/Video Snapshots**

```typescript
test('should match visual snapshot', async ({ page }) => {
  await page.goto('/admin/feature');
  
  await expect(page).toHaveScreenshot('feature-page.png');
});
```

---

## Complete Example: Adding a "Billing" Feature

### Step 1: Add Test Fixture

```typescript
// In tests/mcp-test-utils.ts
export interface BillingHelpers {
  createInvoice: (data: InvoiceData) => Promise<string>;
  viewInvoices: () => Promise<Invoice[]>;
  downloadInvoice: (invoiceId: string) => Promise<Buffer>;
  verifyPaymentStatus: (invoiceId: string) => Promise<string>;
}

export const test = base.extend<{
  billingHelpers: BillingHelpers;
}>({
  billingHelpers: async ({ page }, use) => {
    const helpers = {
      async createInvoice(data: InvoiceData): Promise<string> {
        await page.goto('/admin/billing');
        await page.fill('[data-testid="invoice-number"]', data.number);
        await page.fill('[data-testid="invoice-amount"]', data.amount.toString());
        await page.click('[data-testid="create-invoice-btn"]');
        
        const invoiceId = await page.locator('[data-testid="invoice-id"]')
          .innerText();
        return invoiceId;
      },

      async viewInvoices(): Promise<Invoice[]> {
        await page.goto('/admin/billing/invoices');
        
        const invoices: Invoice[] = [];
        const rows = await page.locator('[data-testid="invoice-row"]').count();
        
        for (let i = 0; i < rows; i++) {
          const row = page.locator('[data-testid="invoice-row"]').nth(i);
          invoices.push({
            id: await row.locator('[data-testid="id"]').innerText(),
            status: await row.locator('[data-testid="status"]').innerText(),
            amount: await row.locator('[data-testid="amount"]').innerText()
          });
        }
        
        return invoices;
      },

      async downloadInvoice(invoiceId: string): Promise<Buffer> {
        const downloadPromise = page.waitForEvent('download');
        await page.click(`[data-testid="download-${invoiceId}"]`);
        const download = await downloadPromise;
        return await download.buffer();
      },

      async verifyPaymentStatus(invoiceId: string): Promise<string> {
        await page.goto(`/admin/billing/invoices/${invoiceId}`);
        return await page.locator('[data-testid="payment-status"]').innerText();
      }
    };

    await use(helpers);
  }
});
```

### Step 2: Create Test File

```typescript
// tests/mcp-billing.spec.ts
import { test, expect } from './mcp-test-utils';

test.describe('MCPForms Billing Feature Tests', () => {
  test.beforeEach(async ({ page, firebaseAuth }) => {
    await firebaseAuth.login('admin@test.com', 'password');
  });

  test('should create and manage invoices', async ({ billingHelpers }) => {
    // Create invoice
    const invoiceId = await billingHelpers.createInvoice({
      number: 'INV-001',
      amount: 1000
    });

    expect(invoiceId).toBeTruthy();

    // View invoices
    const invoices = await billingHelpers.viewInvoices();
    expect(invoices.some(inv => inv.id === invoiceId)).toBe(true);

    // Check payment status
    const status = await billingHelpers.verifyPaymentStatus(invoiceId);
    expect(status).toBe('pending');
  });

  test('should download invoices', async ({ billingHelpers }) => {
    const invoiceId = await billingHelpers.createInvoice({
      number: 'INV-002',
      amount: 500
    });

    const buffer = await billingHelpers.downloadInvoice(invoiceId);
    expect(buffer.length).toBeGreaterThan(0);
  });
});
```

### Step 3: Add Cloud Function

```typescript
// functions/src/billing.ts
export const createInvoice = functions.https.onCall(
  async (data: InvoiceData, context) => {
    // Implementation
    const invoiceId = generateId();
    await db.collection('invoices').doc(invoiceId).set(data);
    return { success: true, invoiceId };
  }
);
```

### Step 4: Update Configuration

```json
// mcp-playwright.config.json
{
  "testPatterns": {
    "billing": "tests/mcp-billing.spec.ts"
  },
  "selectors": {
    "billing": {
      "invoiceNumber": "[data-testid='invoice-number']",
      "invoiceAmount": "[data-testid='invoice-amount']",
      "createBtn": "[data-testid='create-invoice-btn']"
    }
  }
}
```

### Step 5: Update package.json Scripts

```json
{
  "scripts": {
    "test:billing": "playwright test tests/mcp-billing.spec.ts",
    "test:billing:headed": "playwright test tests/mcp-billing.spec.ts --headed"
  }
}
```

### Step 6: Run Tests

```bash
npm run test:billing
```

---

## Running New Tests

```bash
# Run all MCP tests
npm run test:mcp

# Run specific feature tests
npm run test:mcp -- tests/mcp-new-feature.spec.ts

# Run with UI
npm run test:mcp-ui

# Run in debug mode
npm run test:debug

# Run with headed browser (see browser actions)
playwright test tests/mcp-new-feature.spec.ts --headed

# Run and generate report
npm run test:report
```

---

## Debugging MCP Tests

### Enable Verbose Logging

```bash
# Run with debug output
DEBUG=pw:api npm run test:debug
```

### Use Test.only() to Run Single Test

```typescript
test.only('should debug this specific test', async ({ page }) => {
  // Only this test runs
});
```

### Pause Execution

```typescript
test('debug test', async ({ page }) => {
  // Code
  await page.pause(); // Browser pauses here
  // Code resumes after clicking continue in browser
});
```

### Print Page State

```typescript
test('inspect page', async ({ page }) => {
  const state = await MCPPlaywrightUtils.capturePageState(page);
  console.log(JSON.stringify(state, null, 2));
});
```

---

## Summary

To add new MCP integration points:

1. ✅ **Define fixtures** in `mcp-test-utils.ts`
2. ✅ **Create test file** following patterns
3. ✅ **Implement Cloud Function** (if needed)
4. ✅ **Add MCP integration tests** for validation
5. ✅ **Update configuration** in `mcp-playwright.config.json`
6. ✅ **Add npm scripts** to `package.json`
7. ✅ **Run and verify** tests pass
8. ✅ **Document** the new integration

All new integrations follow MCPForms' **Test-Driven Development (TDD)** approach ensuring quality and maintainability!
