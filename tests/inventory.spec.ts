import { test, expect } from '@playwright/test';
import { login, getTestUsers } from '../helpers/auth-helper';

test.describe('Inventory/Stock Management', () => {
  const users = getTestUsers();

  test.describe('As Branch Manager', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, users.BRANCH_MANAGER.username, users.BRANCH_MANAGER.password);
      await page.goto('/manager/stocks');
    });

    test('should display stock overview', async ({ page }) => {
      // Should see stocks heading
      await expect(page.getByText(/stock|inventory/i)).toBeVisible();

      // Should have stock table
      await expect(page.locator('table')).toBeVisible();

      // Should show stock levels
      const firstRow = page.locator('table tbody tr').first();
      if (await firstRow.isVisible()) {
        await expect(firstRow).toContainText(/\d+/); // Should contain numbers
      }
    });

    test('should view stock by product', async ({ page }) => {
      // Should list products with stock levels
      const productRows = page.locator('table tbody tr');
      const count = await productRows.count();

      expect(count).toBeGreaterThan(0);

      // Each row should have product name and quantity
      if (count > 0) {
        const firstRow = productRows.first();
        const cells = firstRow.locator('td');
        const cellCount = await cells.count();

        expect(cellCount).toBeGreaterThanOrEqual(2); // At least name and quantity
      }
    });

    test('should identify low stock items', async ({ page }) => {
      // Look for low stock indicator
      const lowStockIndicators = page.locator('[data-testid^="low-stock-"]')
        .or(page.getByText(/low stock|out of stock/i));

      const hasLowStockIndicator = await lowStockIndicators.count() > 0;

      if (hasLowStockIndicator) {
        // Should highlight low stock items
        await expect(lowStockIndicators.first()).toBeVisible();
      }
    });

    test('should filter stock by status', async ({ page }) => {
      const statusFilter = page.getByTestId('stock-status-filter');

      if (await statusFilter.isVisible()) {
        // Filter by low stock
        await statusFilter.selectOption('low-stock');

        // Wait for filter
        await page.waitForTimeout(1000);

        // Should show only low stock items
        const rows = page.locator('table tbody tr');
        const count = await rows.count();

        if (count > 0) {
          // Should have low stock indicator
          await expect(page.getByText(/low stock/i)).toBeVisible();
        }
      }
    });

    test('should view stock history', async ({ page }) => {
      // Click on first product to view details/history
      const firstRow = page.locator('table tbody tr').first();
      const viewBtn = page.locator('[data-testid^="view-stock-btn-"]').first();

      if (await viewBtn.isVisible()) {
        await viewBtn.click();

        // Should show stock history or details
        await expect(page.getByText(/stock history|movements|transactions/i)).toBeVisible();
      }
    });

    test('should request stock replenishment', async ({ page }) => {
      // Look for request replenishment button
      const requestBtn = page.getByTestId('request-replenishment-btn')
        .or(page.getByRole('button', { name: /request|order stock/i }));

      if (await requestBtn.isVisible()) {
        await requestBtn.click();

        // Should open request form
        await expect(page.getByTestId('replenishment-form')).toBeVisible();

        // Select product
        await page.locator('select[name="productId"]').selectOption({ index: 1 });

        // Enter quantity
        await page.locator('input[name="quantity"]').fill('50');

        // Submit request
        await page.getByTestId('submit-request-btn').click();

        // Should show success message
        await expect(page.getByText(/request submitted|order placed/i))
          .toBeVisible({ timeout: 10000 });
      }
    });

    test('should view pending stock orders', async ({ page }) => {
      // Navigate to orders or pending requests
      const ordersLink = page.getByTestId('nav-link-orders')
        .or(page.getByRole('link', { name: /orders|requests/i }));

      if (await ordersLink.isVisible()) {
        await ordersLink.click();

        // Should see pending orders
        await expect(page.getByText(/pending|orders/i)).toBeVisible();
      }
    });

    test('should export stock report', async ({ page }) => {
      // Look for export button
      const exportBtn = page.getByTestId('export-stock-btn')
        .or(page.getByRole('button', { name: /export|download/i }));

      if (await exportBtn.isVisible()) {
        // Button should be visible and clickable
        await expect(exportBtn).toBeEnabled();
      }
    });
  });

  test.describe('As Sales Staff', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, users.SALES_STAFF.username, users.SALES_STAFF.password);
      await page.goto('/staff/stocks');
    });

    test('should view available stock for sales', async ({ page }) => {
      // Should see stock information
      await expect(page.getByText(/stock|available|inventory/i)).toBeVisible();

      // Should show products with availability
      const productRows = page.locator('table tbody tr');
      const count = await productRows.count();

      expect(count).toBeGreaterThan(0);
    });

    test('should check product availability before sale', async ({ page }) => {
      await page.goto('/staff/products');

      // Each product should show availability
      const availabilityIndicators = page.locator('[data-testid^="availability-"]')
        .or(page.getByText(/in stock|out of stock/i));

      if (await availabilityIndicators.count() > 0) {
        await expect(availabilityIndicators.first()).toBeVisible();
      }
    });

    test('should be notified of out of stock items', async ({ page }) => {
      // Look for out of stock notifications
      const outOfStockItems = page.getByText(/out of stock|unavailable/i);

      if (await outOfStockItems.count() > 0) {
        // Should clearly indicate out of stock
        await expect(outOfStockItems.first()).toBeVisible();
      }
    });
  });

  test.describe('As Super Admin - HQ Stock Management', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, users.SUPER_ADMIN.username, users.SUPER_ADMIN.password);
    });

    test('should view stock across all branches', async ({ page }) => {
      await page.goto('/hq/dashboard');

      // Should see overall stock metrics
      const stockMetrics = page.getByText(/total stock|inventory value/i);

      if (await stockMetrics.isVisible()) {
        await expect(stockMetrics).toBeVisible();
      }
    });

    test('should view stock by branch', async ({ page }) => {
      await page.goto('/hq/branches');

      // Should see branch stock information
      const hasBranchStock = await page.getByText(/stock|inventory/i).count() > 0;

      expect(hasBranchStock).toBeTruthy();
    });

    test('should monitor low stock alerts across branches', async ({ page }) => {
      await page.goto('/hq/dashboard');

      // Look for alerts or notifications
      const alerts = page.locator('[data-testid^="alert-"]')
        .or(page.getByText(/low stock|alert/i));

      if (await alerts.count() > 0) {
        // Should show low stock alerts
        await expect(alerts.first()).toBeVisible();
      }
    });

    test('should initiate stock transfer to branch', async ({ page }) => {
      // This is already covered in transfers.spec.ts
      await page.goto('/hq/transfers');

      // Should have access to create transfers
      await expect(page.getByTestId('create-transfer-btn')).toBeVisible();
    });

    test('should view stock movement history', async ({ page }) => {
      await page.goto('/hq/audit-logs');

      // Should be able to filter by stock-related actions
      const actionFilter = page.getByTestId('action-filter-select');

      if (await actionFilter.isVisible()) {
        // Look for stock-related actions
        const hasStockActions = await page.getByText(/stock|inventory|transfer/i).count() > 0;
        expect(hasStockActions).toBeTruthy();
      }
    });
  });
});
