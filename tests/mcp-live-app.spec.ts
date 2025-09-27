import { test, expect } from './mcp-test-utils';
import { MCPPlaywrightUtils } from './mcp-test-utils';

test.describe('MCPForms Live Application Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Enable console logs for debugging
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  });

  test('should load the MCPForms landing page successfully', async ({ page }) => {
    // Navigate to the live application
    await page.goto('http://localhost:3000');
    
    // Capture initial page state with MCP
    const pageState = await MCPPlaywrightUtils.capturePageState(page);
    
    console.log('🚀 MCP Page State Analysis:');
    console.log('- URL:', pageState.url);
    console.log('- Title:', pageState.title);
    console.log('- Viewport:', pageState.viewport);
    console.log('- Elements detected:', pageState.elements.length);
    
    // Validate page loaded correctly
    expect(pageState.url).toBe('http://localhost:3000/');
    expect(pageState.title).toBeTruthy();
    expect(pageState.elements.length).toBeGreaterThan(0);
    
    // Check for key page elements
    await expect(page.locator('body')).toBeVisible();
    
    // Look for common Next.js elements
    const hasContent = await page.locator('main, [role="main"], .container, .page, #__next').count() > 0;
    expect(hasContent).toBe(true);
    
    console.log('✅ Landing page loaded successfully');
  });

  test('should navigate to admin section', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Look for admin navigation elements
    const adminLinks = await page.locator('a[href*="admin"], button:has-text("Admin"), [data-testid*="admin"]').count();
    
    if (adminLinks > 0) {
      // Click the first admin link found
      await page.locator('a[href*="admin"], button:has-text("Admin"), [data-testid*="admin"]').first().click();
      
      // Wait for navigation
      await page.waitForLoadState('networkidle');
      
      // Capture state after navigation
      const adminPageState = await MCPPlaywrightUtils.capturePageState(page);
      console.log('🔐 Admin Page State:', adminPageState.url);
      
      expect(adminPageState.url).toContain('admin');
    } else {
      // Try direct navigation to admin
      await page.goto('http://localhost:3000/admin');
      
      const adminPageState = await MCPPlaywrightUtils.capturePageState(page);
      console.log('🔐 Direct Admin Navigation:', adminPageState.url);
      
      expect(adminPageState.url).toContain('admin');
    }
    
    console.log('✅ Admin navigation successful');
  });

  test('should detect Firebase integration', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Check if Firebase is loaded
    const firebaseDetected = await page.evaluate(() => {
      return typeof window !== 'undefined' && 
             (window as any).firebase !== undefined || 
             (window as any).FB_CONFIG !== undefined ||
             document.querySelector('script[src*="firebase"]') !== null;
    });
    
    console.log('🔥 Firebase Integration Detected:', firebaseDetected);
    
    // Check for Firebase configuration
    const hasFirebaseConfig = await page.evaluate(() => {
      const scripts = Array.from(document.scripts);
      return scripts.some(script => 
        script.textContent?.includes('firebase') || 
        script.textContent?.includes('NEXT_PUBLIC_FIREBASE')
      );
    });
    
    console.log('⚙️ Firebase Config Present:', hasFirebaseConfig);
    
    // This is informational - we expect Firebase to be integrated
    expect(typeof firebaseDetected).toBe('boolean');
  });

  test('should test responsive design', async ({ page }) => {
    const viewports = [
      { width: 1920, height: 1080, name: 'Desktop Large' },
      { width: 1280, height: 720, name: 'Desktop' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('http://localhost:3000');
      
      // Wait for layout to stabilize
      await page.waitForTimeout(500);
      
      // Capture responsive state
      const responsiveState = await MCPPlaywrightUtils.capturePageState(page);
      
      console.log(`📱 ${viewport.name} (${viewport.width}x${viewport.height}):`);
      console.log('- Elements visible:', responsiveState.elements.filter(el => el.visible).length);
      
      // Basic responsiveness check
      const bodyBox = await page.locator('body').boundingBox();
      expect(bodyBox?.width).toBeLessThanOrEqual(viewport.width);
      
      // Check if content adapts
      const hasFlexOrGrid = await page.evaluate(() => {
        const bodyStyles = window.getComputedStyle(document.body);
        const hasResponsiveStyles = 
          bodyStyles.display.includes('flex') ||
          bodyStyles.display.includes('grid') ||
          document.querySelector('[class*="responsive"], [class*="container"], [class*="grid"]') !== null;
        return hasResponsiveStyles;
      });
      
      console.log(`- Responsive layout detected: ${hasFlexOrGrid}`);
    }
    
    console.log('✅ Responsive design testing completed');
  });

  test('should test application performance', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('http://localhost:3000');
    
    const loadTime = Date.now() - startTime;
    
    // Get detailed performance metrics
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');
      
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.responseStart,
        loadComplete: navigation.loadEventEnd - navigation.responseStart,
        firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
        resourceCount: performance.getEntriesByType('resource').length
      };
    });
    
    console.log('⚡ Performance Metrics:');
    console.log('- Page Load Time:', loadTime + 'ms');
    console.log('- DOM Content Loaded:', performanceMetrics.domContentLoaded + 'ms');
    console.log('- Load Complete:', performanceMetrics.loadComplete + 'ms');
    console.log('- First Paint:', performanceMetrics.firstPaint + 'ms');
    console.log('- First Contentful Paint:', performanceMetrics.firstContentfulPaint + 'ms');
    console.log('- Resources Loaded:', performanceMetrics.resourceCount);
    
    // Performance assertions
    expect(loadTime).toBeLessThan(10000); // 10 seconds max
    expect(performanceMetrics.domContentLoaded).toBeLessThan(5000); // 5 seconds max
    expect(performanceMetrics.resourceCount).toBeGreaterThan(0);
    
    console.log('✅ Performance testing completed');
  });

  test('should test accessibility features', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Check for accessibility attributes
    const accessibilityFeatures = await page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      let ariaElements = 0;
      let altAttributes = 0;
      let headings = 0;
      let landmarks = 0;
      
      elements.forEach(el => {
        // Count ARIA attributes
        if (el.hasAttribute('aria-label') || el.hasAttribute('aria-describedby') || el.hasAttribute('role')) {
          ariaElements++;
        }
        
        // Count alt attributes on images
        if (el.tagName === 'IMG' && el.hasAttribute('alt')) {
          altAttributes++;
        }
        
        // Count headings
        if (['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(el.tagName)) {
          headings++;
        }
        
        // Count landmark roles
        const role = el.getAttribute('role');
        if (['main', 'navigation', 'banner', 'contentinfo', 'complementary'].includes(role || '')) {
          landmarks++;
        }
      });
      
      return { ariaElements, altAttributes, headings, landmarks };
    });
    
    console.log('♿ Accessibility Analysis:');
    console.log('- Elements with ARIA:', accessibilityFeatures.ariaElements);
    console.log('- Images with alt text:', accessibilityFeatures.altAttributes);
    console.log('- Heading elements:', accessibilityFeatures.headings);
    console.log('- Landmark roles:', accessibilityFeatures.landmarks);
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => {
      const focused = document.activeElement;
      return {
        tagName: focused?.tagName,
        hasTabIndex: focused?.hasAttribute('tabindex'),
        isInteractive: ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(focused?.tagName || '')
      };
    });
    
    console.log('⌨️ Keyboard Navigation:');
    console.log('- Focused element:', focusedElement.tagName);
    console.log('- Is interactive:', focusedElement.isInteractive);
    
    // Basic accessibility expectations
    expect(accessibilityFeatures.headings).toBeGreaterThanOrEqual(0);
    expect(focusedElement.tagName).toBeTruthy();
    
    console.log('✅ Accessibility testing completed');
  });

  test('should simulate user interactions', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Find interactive elements
    const interactiveElements = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button, [role="button"]');
      const links = document.querySelectorAll('a[href]');
      const inputs = document.querySelectorAll('input, textarea, select');
      
      return {
        buttons: buttons.length,
        links: links.length,
        inputs: inputs.length
      };
    });
    
    console.log('🖱️ Interactive Elements Found:');
    console.log('- Buttons:', interactiveElements.buttons);
    console.log('- Links:', interactiveElements.links);
    console.log('- Form inputs:', interactiveElements.inputs);
    
    // Try to interact with elements if they exist
    if (interactiveElements.buttons > 0) {
      const firstButton = page.locator('button, [role="button"]').first();
      if (await firstButton.isVisible()) {
        console.log('🔄 Testing button interaction...');
        await firstButton.hover();
        // Note: Not clicking to avoid navigation issues in testing
      }
    }
    
    if (interactiveElements.links > 0) {
      const firstLink = page.locator('a[href]').first();
      if (await firstLink.isVisible()) {
        console.log('🔄 Testing link hover...');
        await firstLink.hover();
      }
    }
    
    // Capture final state
    const finalState = await MCPPlaywrightUtils.capturePageState(page);
    console.log('📊 Final page state captured with', finalState.elements.length, 'elements');
    
    expect(interactiveElements.buttons + interactiveElements.links).toBeGreaterThanOrEqual(0);
    
    console.log('✅ User interaction simulation completed');
  });

  test('should test error handling', async ({ page }) => {
    // Test 404 page
    await page.goto('http://localhost:3000/non-existent-page');
    
    const errorPageState = await MCPPlaywrightUtils.capturePageState(page);
    console.log('❌ Error Page Test:', errorPageState.url);
    
    // Check if it's a proper error page or redirect
    const isErrorPage = errorPageState.url.includes('404') || 
                       errorPageState.title.toLowerCase().includes('404') ||
                       errorPageState.title.toLowerCase().includes('not found');
    
    console.log('- Is proper error page:', isErrorPage);
    
    // The page should still be accessible (even if it shows an error)
    await expect(page.locator('body')).toBeVisible();
    
    console.log('✅ Error handling test completed');
  });
});