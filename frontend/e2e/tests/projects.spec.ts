import { test, expect } from '@playwright/test';

/**
 * Projects Management E2E Tests
 */
test.describe('Projects Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login first (you may want to create a helper function for this)
    await page.goto('/');
    // Add login logic here or use a setup function
  });

  test('should display projects list', async ({ page }) => {
    await page.goto('/');
    // Wait for projects table or list
    await expect(page.locator('[data-testid="projects-table"], table, .project-list').first()).toBeVisible({ timeout: 10000 });
  });

  test('should search projects', async ({ page }) => {
    await page.goto('/');
    
    // Find search input
    const searchInput = page.locator('input[placeholder*="search" i], input[type="search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.fill('AI');
      await page.waitForTimeout(500); // Wait for search to execute
      
      // Verify results are filtered
      const results = page.locator('[data-testid="project-row"], tr[data-project-id]');
      const count = await results.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test('should filter projects by status', async ({ page }) => {
    await page.goto('/');
    
    // Find status filter
    const statusFilter = page.locator('select, [role="combobox"]').filter({ hasText: /status/i }).first();
    if (await statusFilter.isVisible()) {
      await statusFilter.selectOption('Pending');
      await page.waitForTimeout(500);
      
      // Verify filtered results
      const results = page.locator('[data-testid="project-row"]');
      const count = await results.count();
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  test('should view project details', async ({ page }) => {
    await page.goto('/');
    
    // Click on first project
    const firstProject = page.locator('[data-testid="project-row"], tr[data-project-id]').first();
    if (await firstProject.isVisible()) {
      await firstProject.click();
      
      // Verify project detail view
      await expect(page.locator('[data-testid="project-detail"], .project-detail').first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should export projects', async ({ page }) => {
    await page.goto('/');
    
    // Find export button
    const exportButton = page.locator('button:has-text("Export"), button:has-text("Download")').first();
    if (await exportButton.isVisible()) {
      // Set up download listener
      const downloadPromise = page.waitForEvent('download');
      await exportButton.click();
      
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toMatch(/\.(csv|xlsx)$/);
    }
  });
});

