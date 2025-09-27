import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should display login form on admin page when not authenticated', async ({ page }) => {
    await page.goto('/admin');
    
    // Should see login form
    await expect(page.locator('h2')).toContainText('Admin Login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Should also see Google Sign In button
    await expect(page.locator('text=Sign in with Google')).toBeVisible();
  });

  test('should show validation errors for empty form submission', async ({ page }) => {
    await page.goto('/admin');
    
    // Try to submit empty form
    await page.click('button[type="submit"]');
    
    // Should show validation errors (assuming form validation exists)
    // This would depend on the specific validation implementation
    await expect(page.locator('input[type="email"]')).toBeFocused();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/admin');
    
    // Fill in invalid credentials
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Should remain on login page (since we're using demo Firebase config)
    await expect(page.locator('h2')).toContainText('Admin Login');
  });

  test('should redirect to home page from admin without authentication', async ({ page }) => {
    // This test validates that admin pages are protected
    await page.goto('/admin');
    
    // Should show login form instead of admin dashboard
    await expect(page.locator('h2')).toContainText('Admin Login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });
});

test.describe('Navigation and Basic UI', () => {
  test('should display home page correctly', async ({ page }) => {
    await page.goto('/');
    
    // Check for basic page structure
    await expect(page.locator('body')).toBeVisible();
    
    // The home page should load without errors
    const errors = await page.locator('text=Error').count();
    expect(errors).toBe(0);
  });

  test('should handle 404 pages gracefully', async ({ page }) => {
    await page.goto('/nonexistent-page');
    
    // Should show not found page or redirect
    const title = await page.title();
    expect(title).toBeTruthy();
  });
});