import { test, expect } from '@playwright/test';
import { login, getTestUsers } from '../helpers/auth-helper';

test.describe('Production Management', () => {
  const users = getTestUsers();

  test.beforeEach(async ({ page }) => {
    await login(page, users.SUPER_ADMIN.username, users.SUPER_ADMIN.password);
    await page.goto('/hq/production');
  });

  test('should display production batches', async ({ page }) => {
    // Should see production batches table
    await expect(page.getByText('Production Batches')).toBeVisible();

    // Should have status filter
    await expect(page.getByTestId('status-filter-select')).toBeVisible();
  });

  test('should create a new production batch', async ({ page }) => {
    // Click New Batch button
    await page.getByTestId('create-batch-btn').click();

    // Wait for modal
    await expect(page.getByTestId('create-production-batch-form')).toBeVisible();

    // Fill batch details (adjust selectors based on your form)
    const batchName = `Test Batch ${Date.now()}`;
    await page.locator('input[name="batchName"]').fill(batchName);

    // Add produced items
    await page.getByTestId('add-produced-item-btn').click();

    // Select product (first option)
    await page.locator('select[name="producedItems.0.productId"]').selectOption({ index: 1 });
    await page.locator('input[name="producedItems.0.quantityProduced"]').fill('10');

    // Add materials consumed
    await page.getByTestId('add-material-btn').click();

    // Select material (first option)
    await page.locator('select[name="materialsConsumed.0.rawMaterialId"]').selectOption({ index: 1 });
    await page.locator('input[name="materialsConsumed.0.quantityUsed"]').fill('5');

    // Submit
    await page.getByTestId('create-batch-btn').click();

    // Should show success message
    await expect(page.getByText(/production batch created successfully/i)).toBeVisible({ timeout: 10000 });
  });

  test('should filter production batches by status', async ({ page }) => {
    // Select COMPLETED status
    await page.getByTestId('status-filter-select').selectOption('COMPLETED');

    // Wait for table to update
    await page.waitForTimeout(1000);

    // Should show only completed batches
    const rows = page.locator('table tbody tr');
    const count = await rows.count();

    if (count > 0) {
      // Verify each visible row has COMPLETED status
      for (let i = 0; i < count; i++) {
        await expect(rows.nth(i)).toContainText(/completed/i);
      }
    }
  });

  test('should view production batch details', async ({ page }) => {
    // Click first batch's view button
    const firstViewBtn = page.locator('[data-testid^="view-batch-btn-"]').first();

    if (await firstViewBtn.isVisible()) {
      await firstViewBtn.click();

      // Should open details modal
      await expect(page.getByText(/batch details|production batch/i)).toBeVisible();

      // Should show batch information
      await expect(page.getByText(/status|materials consumed|items produced/i)).toBeVisible();
    }
  });
});
