import { test, expect } from '@playwright/test';
import { login, getTestUsers } from '../helpers/auth-helper';

test.describe('Product Management', () => {
  const users = getTestUsers();
  const testProduct = {
    name: `Test Product ${Date.now()}`,
    unitOfMeasure: 'Loaf',
    costPrice: '500',
    sellingPrice: '800',
  };

  test.beforeEach(async ({ page }) => {
    await login(page, users.SUPER_ADMIN.username, users.SUPER_ADMIN.password);
    await page.goto('/hq/products');
  });

  test('should create a new product', async ({ page }) => {
    // Click Add Product button
    await page.getByTestId('add-product-btn').click();

    // Wait for modal
    await expect(page.getByTestId('add-product-form')).toBeVisible();

    // Fill form
    await page.getByTestId('name-input').fill(testProduct.name);
    await page.locator('select[name="unitOfMeasure"]').selectOption(testProduct.unitOfMeasure);
    await page.getByTestId('costPrice-input').fill(testProduct.costPrice);
    await page.getByTestId('sellingPrice-input').fill(testProduct.sellingPrice);

    // Submit form
    await page.getByTestId('save-btn').click();

    // Should show success message
    await expect(page.getByText(/product added successfully/i)).toBeVisible({ timeout: 10000 });

    // Product should appear in table
    await expect(page.getByText(testProduct.name)).toBeVisible();
  });

  test('should edit an existing product', async ({ page }) => {
    // Find first product's edit button
    const firstEditBtn = page.locator('[data-testid^="edit-product-btn-"]').first();
    await firstEditBtn.click();

    // Wait for edit modal
    await expect(page.getByTestId('edit-product-form')).toBeVisible();

    // Update name
    const updatedName = `Updated Product ${Date.now()}`;
    await page.getByTestId('name-input').clear();
    await page.getByTestId('name-input').fill(updatedName);

    // Submit
    await page.getByTestId('save-btn').click();

    // Should show success message
    await expect(page.getByText(/product updated successfully/i)).toBeVisible({ timeout: 10000 });

    // Updated product should appear in table
    await expect(page.getByText(updatedName)).toBeVisible();
  });

  test('should delete a product with confirmation', async ({ page }) => {
    // Click first product's more menu
    const firstMoreBtn = page.locator('[data-testid^="more-btn-"]').first();
    await firstMoreBtn.click();

    // Wait for dropdown
    await page.waitForTimeout(500);

    // Click delete
    const deleteBtn = page.locator('[data-testid^="delete-product-btn-"]').first();
    await deleteBtn.click();

    // Confirm dialog should appear
    await expect(page.getByText(/are you sure you want to delete/i)).toBeVisible();

    // Confirm deletion
    await page.getByRole('button', { name: /delete/i }).click();

    // Should show success message
    await expect(page.getByText(/product deleted successfully/i)).toBeVisible({ timeout: 10000 });
  });
});
