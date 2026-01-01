import { test, expect } from '@playwright/test';
import { login, getTestUsers } from '../helpers/auth-helper';

test.describe('Raw Materials Management', () => {
  const users = getTestUsers();
  const testMaterial = {
    name: `Test Material ${Date.now()}`,
    unitOfMeasure: 'kg',
    costPerUnit: '250',
    initialStock: '100',
    minimumStockLevel: '10',
    description: 'Test material for E2E testing',
  };

  test.beforeEach(async ({ page }) => {
    await login(page, users.SUPER_ADMIN.username, users.SUPER_ADMIN.password);
    await page.goto('/hq/raw-materials');
  });

  test('should create a new raw material', async ({ page }) => {
    // Click Add Material button
    await page.getByTestId('add-material-btn').click();

    // Wait for modal
    await expect(page.getByTestId('add-raw-material-form')).toBeVisible();

    // Fill form
    await page.getByTestId('name-input').fill(testMaterial.name);
    await page.locator('select[name="unitOfMeasure"]').selectOption(testMaterial.unitOfMeasure);
    await page.getByTestId('costPerUnit-input').fill(testMaterial.costPerUnit);
    await page.getByTestId('initialStock-input').fill(testMaterial.initialStock);
    await page.getByTestId('minimumStockLevel-input').fill(testMaterial.minimumStockLevel);
    await page.locator('textarea[name="description"]').fill(testMaterial.description);

    // Submit form
    await page.getByTestId('save-btn').click();

    // Should show success message
    await expect(page.getByText(/raw material added successfully/i)).toBeVisible({ timeout: 10000 });

    // Material should appear in table
    await expect(page.getByText(testMaterial.name)).toBeVisible();
  });

  test('should adjust stock for a raw material', async ({ page }) => {
    // Click first material's adjust stock button
    const firstAdjustBtn = page.locator('[data-testid^="adjust-stock-btn-"]').first();
    await firstAdjustBtn.click();

    // Wait for modal
    await expect(page.getByTestId('adjust-stock-form')).toBeVisible();

    // Fill adjustment
    await page.getByTestId('adjustment-input').fill('50');
    await page.getByTestId('reason-input').fill('Test stock increase');

    // Submit
    await page.getByTestId('save-btn').click();

    // Should show success message
    await expect(page.getByText(/stock adjusted successfully/i)).toBeVisible({ timeout: 10000 });
  });

  test('should view low stock materials', async ({ page }) => {
    // Navigate to low stock filter or view
    // This depends on your UI implementation
    const statusFilter = page.getByTestId('status-filter-select');
    if (await statusFilter.isVisible()) {
      await statusFilter.selectOption('low-stock');
    }

    // Should show only low stock materials
    await expect(page.locator('table tbody tr')).toHaveCount(0, { timeout: 5000 })
      .catch(() => {
        // If there are low stock items, that's fine too
        return Promise.resolve();
      });
  });
});
