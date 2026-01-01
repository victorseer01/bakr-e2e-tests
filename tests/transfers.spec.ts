import { test, expect } from '@playwright/test';
import { login, getTestUsers } from '../helpers/auth-helper';

test.describe('Transfer Management', () => {
  const users = getTestUsers();

  test.beforeEach(async ({ page }) => {
    await login(page, users.SUPER_ADMIN.username, users.SUPER_ADMIN.password);
    await page.goto('/hq/transfers');
  });

  test('should display transfers page', async ({ page }) => {
    // Should see transfers heading
    await expect(page.getByText(/transfers|material transfers/i)).toBeVisible();

    // Should have status filter
    await expect(page.getByTestId('status-filter-select')).toBeVisible();

    // Should have create transfer button
    await expect(page.getByTestId('create-transfer-btn')).toBeVisible();
  });

  test('should create a new transfer', async ({ page }) => {
    // Click Create Transfer button
    await page.getByTestId('create-transfer-btn').click();

    // Wait for modal
    await expect(page.getByTestId('create-transfer-form')).toBeVisible();

    // Select destination branch (first option)
    await page.locator('select[name="destinationBranchId"]').selectOption({ index: 1 });

    // Add transfer items
    await page.getByTestId('add-transfer-item-btn').click();

    // Select material (first option)
    await page.locator('select[name="items.0.rawMaterialId"]').selectOption({ index: 1 });
    await page.locator('input[name="items.0.quantity"]').fill('10');

    // Add notes
    await page.locator('textarea[name="notes"]').fill('Test transfer for E2E testing');

    // Submit
    await page.getByTestId('create-transfer-btn-submit').click();

    // Should show success message
    await expect(page.getByText(/transfer created successfully/i)).toBeVisible({ timeout: 10000 });
  });

  test('should filter transfers by status', async ({ page }) => {
    // Select COMPLETED status
    await page.getByTestId('status-filter-select').selectOption('COMPLETED');

    // Wait for table to update
    await page.waitForTimeout(1000);

    // Should show only completed transfers
    const rows = page.locator('table tbody tr');
    const count = await rows.count();

    if (count > 0) {
      // Verify each visible row has COMPLETED status
      for (let i = 0; i < count; i++) {
        await expect(rows.nth(i)).toContainText(/completed/i);
      }
    }
  });

  test('should view transfer details', async ({ page }) => {
    // Click first transfer's view button
    const firstViewBtn = page.locator('[data-testid^="view-transfer-btn-"]').first();

    if (await firstViewBtn.isVisible()) {
      await firstViewBtn.click();

      // Should open details modal
      await expect(page.getByText(/transfer details/i)).toBeVisible();

      // Should show transfer information
      await expect(page.getByText(/status|destination|items|total cost/i)).toBeVisible();
    }
  });

  test('should void a pending transfer', async ({ page }) => {
    // Find a pending transfer
    await page.getByTestId('status-filter-select').selectOption('PENDING');
    await page.waitForTimeout(1000);

    const firstVoidBtn = page.locator('[data-testid^="void-transfer-btn-"]').first();

    if (await firstVoidBtn.isVisible()) {
      await firstVoidBtn.click();

      // Should show void confirmation modal
      await expect(page.getByText(/void transfer|cancel transfer/i)).toBeVisible();

      // Provide reason
      await page.locator('textarea[name="reason"]').fill('Test void for E2E testing');

      // Confirm void
      await page.getByTestId('confirm-void-btn').click();

      // Should show success message
      await expect(page.getByText(/transfer voided successfully/i)).toBeVisible({ timeout: 10000 });
    }
  });
});
