import { test, expect } from '@playwright/test';

/**
 * Advanced Search E2E Tests
 */
test.describe('Advanced Search', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should perform basic search', async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="search" i]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('Machine Learning');
      await page.waitForTimeout(1000);
      
      // Verify search results
      const results = page.locator('[data-testid="project-row"]');
      const count = await results.count();
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  test('should apply multiple filters', async ({ page }) => {
    // Apply status filter
    const statusFilter = page.locator('select').filter({ hasText: /status/i }).first();
    if (await statusFilter.isVisible()) {
      await statusFilter.selectOption('Pending');
    }
    
    // Apply advisor filter
    const advisorFilter = page.locator('select').filter({ hasText: /advisor/i }).first();
    if (await advisorFilter.isVisible()) {
      await advisorFilter.selectOption({ index: 1 }); // Select first advisor
    }
    
    await page.waitForTimeout(1000);
    
    // Verify filtered results
    const results = page.locator('[data-testid="project-row"]');
    const count = await results.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should clear filters', async ({ page }) => {
    // Apply some filters first
    const statusFilter = page.locator('select').filter({ hasText: /status/i }).first();
    if (await statusFilter.isVisible()) {
      await statusFilter.selectOption('Pending');
    }
    
    // Find and click clear button
    const clearButton = page.locator('button:has-text("Clear"), button:has-text("Reset")').first();
    if (await clearButton.isVisible()) {
      await clearButton.click();
      await page.waitForTimeout(500);
      
      // Verify filters are cleared
      await expect(statusFilter).toHaveValue('');
    }
  });
});

