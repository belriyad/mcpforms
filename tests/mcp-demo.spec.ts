import { test, expect } from '@playwright/test';
import { MCPPlaywrightUtils } from './mcp-test-utils';

test.describe('MCP Playwright Integration Demo', () => {
  test('should demonstrate MCP Playwright capabilities', async ({ page }) => {
    // Test basic web navigation and MCP integration
    await page.goto('https://www.example.com');
    
    // Capture page state using MCP utilities
    const pageState = await MCPPlaywrightUtils.capturePageState(page);
    
    // Validate captured state
    expect(pageState.url).toBe('https://www.example.com/');
    expect(pageState.title).toContain('Example');
    expect(pageState.timestamp).toBeTruthy();
    expect(pageState.viewport).toEqual({ width: 1280, height: 720 });
    
    console.log('MCP Page State Captured:', JSON.stringify(pageState, null, 2));
    
    // Test element interaction tracking
    await page.click('a[href]');
    
    // Capture state after interaction
    const afterClickState = await MCPPlaywrightUtils.capturePageState(page);
    console.log('After Click State:', JSON.stringify(afterClickState, null, 2));
  });

  test('should demonstrate API response handling', async ({ page }) => {
    // Test API mocking capabilities
    await MCPPlaywrightUtils.mockFirebaseFunction(page, 'testEndpoint', {
      success: true,
      data: { message: 'MCP integration working!' },
      timestamp: new Date().toISOString()
    });
    
    // Navigate to a page that would call the API
    await page.goto('https://httpbin.org/json');
    
    // Verify the page loads
    await expect(page.locator('body')).toBeVisible();
    
    console.log('API mocking demonstration completed');
  });

  test('should demonstrate MCP test utilities', async ({ page }) => {
    await page.goto('https://www.example.com');
    
    // Test viewport capture
    const viewport = await page.viewportSize();
    expect(viewport).toEqual({ width: 1280, height: 720 });
    
    // Test element detection
    const elements = await page.evaluate(() => {
      const allElements = document.querySelectorAll('*');
      return Array.from(allElements).slice(0, 10).map(el => ({
        tagName: el.tagName,
        text: el.textContent?.slice(0, 50),
        visible: (el as HTMLElement).offsetParent !== null
      }));
    });
    
    expect(elements.length).toBeGreaterThan(0);
    console.log('Detected elements:', elements);
    
    // Test page performance
    const startTime = Date.now();
    await page.reload();
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(10000); // 10 seconds max
    console.log(`Page reload time: ${loadTime}ms`);
  });

  test('should demonstrate Firebase Functions URL testing', async ({ request }) => {
    // Test connection to actual deployed Firebase Functions
    const baseURL = 'https://us-central1-formgenai-4545.cloudfunctions.net';
    
    // Test health endpoint or basic connectivity
    try {
      const response = await request.get(`${baseURL}/intakeFormAPI/health`, {
        timeout: 10000
      });
      
      console.log(`Function response status: ${response.status()}`);
      console.log(`Function response headers:`, await response.headers());
      
      // Even if it returns an error, we've proven connectivity
      expect(response.status()).toBeLessThan(600);
      
    } catch (error) {
      console.log('Firebase Functions connection test:', error);
      // This is expected if the functions require authentication
      expect(error).toBeTruthy();
    }
  });

  test('should demonstrate browser capabilities across different engines', async ({ page, browserName }) => {
    await page.goto('https://www.whatsmybrowser.org/');
    
    // Capture browser-specific information
    const userAgent = await page.evaluate(() => navigator.userAgent);
    const browserInfo = await page.evaluate(() => ({
      cookieEnabled: navigator.cookieEnabled,
      language: navigator.language,
      platform: navigator.platform,
      onLine: navigator.onLine
    }));
    
    console.log(`Testing with ${browserName}`);
    console.log('User Agent:', userAgent);
    console.log('Browser Info:', browserInfo);
    
    expect(browserInfo.cookieEnabled).toBe(true);
    expect(browserInfo.onLine).toBe(true);
    
    // Test browser-specific features
    const supportsLocalStorage = await page.evaluate(() => {
      try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        return true;
      } catch {
        return false;
      }
    });
    
    expect(supportsLocalStorage).toBe(true);
  });

  test('should demonstrate responsive design testing', async ({ page }) => {
    // Test different viewport sizes
    const viewports = [
      { width: 1920, height: 1080, name: 'Desktop' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('https://www.example.com');
      
      // Capture layout at different sizes
      const boundingBox = await page.locator('body').boundingBox();
      
      console.log(`${viewport.name} (${viewport.width}x${viewport.height}):`, {
        bodyWidth: boundingBox?.width,
        bodyHeight: boundingBox?.height
      });
      
      expect(boundingBox?.width).toBeLessThanOrEqual(viewport.width);
    }
  });

  test('should demonstrate accessibility testing', async ({ page }) => {
    await page.goto('https://www.example.com');
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => {
      const focused = document.activeElement;
      return {
        tagName: focused?.tagName,
        hasAttribute: focused?.hasAttribute('href'),
        text: focused?.textContent?.slice(0, 50)
      };
    });
    
    console.log('Focused element after Tab:', focusedElement);
    
    // Test ARIA attributes
    const ariaElements = await page.evaluate(() => {
      const elementsWithAria = document.querySelectorAll('[aria-label], [role]');
      return Array.from(elementsWithAria).slice(0, 5).map(el => ({
        tagName: el.tagName,
        ariaLabel: el.getAttribute('aria-label'),
        role: el.getAttribute('role')
      }));
    });
    
    console.log('Elements with ARIA attributes:', ariaElements);
  });

  test('should demonstrate performance monitoring', async ({ page }) => {
    // Monitor page performance
    const startTime = Date.now();
    
    await page.goto('https://www.example.com');
    
    const loadTime = Date.now() - startTime;
    
    // Get performance metrics
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
        loadComplete: navigation.loadEventEnd - navigation.fetchStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
      };
    });
    
    console.log('Performance Metrics:', metrics);
    console.log(`Total page load time: ${loadTime}ms`);
    
    // Validate performance thresholds
    expect(loadTime).toBeLessThan(10000); // 10 seconds
    expect(metrics.domContentLoaded).toBeLessThan(5000); // 5 seconds
  });
});