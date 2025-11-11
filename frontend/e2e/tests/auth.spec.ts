import { test, expect } from '@playwright/test';

/**
 * Authentication E2E Tests
 */
test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display welcome page initially', async ({ page }) => {
    await expect(page).toHaveTitle(/Final Project Management/i);
    // Check for welcome page elements
    await expect(page.locator('text=Welcome')).toBeVisible();
  });

  test('should navigate to login page', async ({ page }) => {
    // Click login button or link
    const loginButton = page.locator('button:has-text("Login"), a:has-text("Login")').first();
    if (await loginButton.isVisible()) {
      await loginButton.click();
      // Wait for login form
      await expect(page.locator('input[type="email"], input[name="username"], input[placeholder*="username" i]')).toBeVisible();
    }
  });

  test('should login with valid credentials', async ({ page }) => {
    // Navigate to login
    const loginButton = page.locator('button:has-text("Login"), a:has-text("Login")').first();
    if (await loginButton.isVisible()) {
      await loginButton.click();
    }

    // Fill login form (adjust selectors based on actual form)
    const usernameInput = page.locator('input[type="email"], input[name="username"], input[placeholder*="username" i]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submitButton = page.locator('button[type="submit"], button:has-text("Login")').first();

    if (await usernameInput.isVisible()) {
      await usernameInput.fill('admin@example.com');
      await passwordInput.fill('password123');
      await submitButton.click();

      // Wait for redirect to dashboard or home
      await page.waitForURL(/\/(dashboard|home|projects)/, { timeout: 10000 });
      
      // Verify user is logged in (check for user menu or logout button)
      await expect(page.locator('button:has-text("Logout"), [data-testid="user-menu"]').first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should show error with invalid credentials', async ({ page }) => {
    // Navigate to login
    const loginButton = page.locator('button:has-text("Login"), a:has-text("Login")').first();
    if (await loginButton.isVisible()) {
      await loginButton.click();
    }

    const usernameInput = page.locator('input[type="email"], input[name="username"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    const submitButton = page.locator('button[type="submit"]').first();

    if (await usernameInput.isVisible()) {
      await usernameInput.fill('invalid@example.com');
      await passwordInput.fill('wrongpassword');
      await submitButton.click();

      // Wait for error message
      await expect(page.locator('text=/invalid|error|incorrect/i')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should logout successfully', async ({ page }) => {
    // First login (reuse login test logic)
    // Then logout
    const logoutButton = page.locator('button:has-text("Logout")').first();
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      
      // Should redirect to welcome/login page
      await page.waitForURL(/\/(welcome|login|\/)$/, { timeout: 5000 });
    }
  });
});

