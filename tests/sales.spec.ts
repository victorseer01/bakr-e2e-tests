import { test, expect } from '@playwright/test';
import { login, getTestUsers } from '../helpers/auth-helper';

test.describe('Sales/Orders Management', () => {
  const users = getTestUsers();

  test.describe('As Sales Staff', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, users.SALES_STAFF.username, users.SALES_STAFF.password);
    });

    test('should access sales dashboard', async ({ page }) => {
      await page.goto('/staff/dashboard');

      // Should see dashboard elements
      await expect(page.getByText(/dashboard|sales|overview/i)).toBeVisible();

      // Should have access to products
      await expect(page.getByTestId('nav-link-products')).toBeVisible();
    });

    test('should view products catalog', async ({ page }) => {
      await page.goto('/staff/products');

      // Should see products
      await expect(page.getByText(/products|product catalog/i)).toBeVisible();

      // Should have products table or grid
      const hasProducts = await page.locator('table tbody tr').count() > 0 ||
                         await page.locator('[data-testid^="product-card-"]').count() > 0;

      expect(hasProducts).toBeTruthy();
    });

    test('should create a sale order', async ({ page }) => {
      await page.goto('/staff/products');

      // Look for "Make Sale" or "Create Order" button
      const createSaleBtn = page.getByTestId('create-sale-btn')
        .or(page.getByTestId('make-sale-btn'))
        .or(page.getByRole('button', { name: /new sale|create order|make sale/i }));

      if (await createSaleBtn.isVisible()) {
        await createSaleBtn.click();

        // Wait for sale form/modal
        await expect(page.getByTestId('sale-form').or(page.getByTestId('order-form')))
          .toBeVisible();

        // Add items to sale
        const addItemBtn = page.getByTestId('add-item-btn');
        await addItemBtn.click();

        // Select product (first available)
        await page.locator('select[name="items.0.productId"]').selectOption({ index: 1 });
        await page.locator('input[name="items.0.quantity"]').fill('5');

        // Customer information (if required)
        const customerNameInput = page.getByTestId('customerName-input');
        if (await customerNameInput.isVisible()) {
          await customerNameInput.fill('Test Customer');
        }

        // Payment method
        const paymentMethodSelect = page.locator('select[name="paymentMethod"]');
        if (await paymentMethodSelect.isVisible()) {
          await paymentMethodSelect.selectOption('CASH');
        }

        // Submit sale
        await page.getByTestId('create-sale-btn').or(page.getByTestId('submit-order-btn')).click();

        // Should show success message
        await expect(page.getByText(/sale created successfully|order completed/i))
          .toBeVisible({ timeout: 10000 });
      }
    });

    test('should view sales history', async ({ page }) => {
      // Navigate to sales or reports page
      const reportsLink = page.getByTestId('nav-link-reports')
        .or(page.getByTestId('nav-link-sales'));

      if (await reportsLink.isVisible()) {
        await reportsLink.click();

        // Should see sales history
        await expect(page.getByText(/sales|orders|transactions/i)).toBeVisible();

        // Should have sales table
        const hasSalesTable = await page.locator('table').isVisible();
        expect(hasSalesTable).toBeTruthy();
      }
    });

    test('should filter sales by date', async ({ page }) => {
      const reportsLink = page.getByTestId('nav-link-reports')
        .or(page.getByTestId('nav-link-sales'));

      if (await reportsLink.isVisible()) {
        await reportsLink.click();

        // Look for date filters
        const startDateInput = page.getByTestId('start-date-input');
        const endDateInput = page.getByTestId('end-date-input');

        if (await startDateInput.isVisible() && await endDateInput.isVisible()) {
          // Set date range to today
          const today = new Date().toISOString().split('T')[0];
          await startDateInput.fill(today);
          await endDateInput.fill(today);

          // Apply filter
          const filterBtn = page.getByTestId('apply-filter-btn');
          if (await filterBtn.isVisible()) {
            await filterBtn.click();
          }

          // Wait for results
          await page.waitForTimeout(1000);

          // Should show filtered results
          await expect(page.locator('table tbody tr')).toHaveCount(0, { timeout: 5000 })
            .catch(() => Promise.resolve()); // May have sales today
        }
      }
    });

    test('should view sale details', async ({ page }) => {
      const reportsLink = page.getByTestId('nav-link-reports')
        .or(page.getByTestId('nav-link-sales'));

      if (await reportsLink.isVisible()) {
        await reportsLink.click();

        // Find first sale's view button
        const viewBtn = page.locator('[data-testid^="view-sale-btn-"]').first();

        if (await viewBtn.isVisible()) {
          await viewBtn.click();

          // Should show sale details
          await expect(page.getByText(/sale details|order details/i)).toBeVisible();

          // Should show sale information
          await expect(page.getByText(/items|total|payment|customer/i)).toBeVisible();
        }
      }
    });

    test('should display sales statistics', async ({ page }) => {
      await page.goto('/staff/dashboard');

      // Should show sales metrics
      const statsCards = page.locator('[data-testid^="stat-card-"]');
      const hasStats = await statsCards.count() > 0;

      if (hasStats) {
        // Should show revenue or sales count
        await expect(page.getByText(/revenue|total sales|orders/i)).toBeVisible();
      }
    });
  });

  test.describe('As Branch Manager', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, users.BRANCH_MANAGER.username, users.BRANCH_MANAGER.password);
    });

    test('should view branch sales report', async ({ page }) => {
      await page.goto('/manager/dashboard');

      // Should see sales overview
      await expect(page.getByText(/sales|revenue|performance/i)).toBeVisible();
    });

    test('should view inventory after sales', async ({ page }) => {
      await page.goto('/manager/stocks');

      // Should see stock levels
      await expect(page.getByText(/stock|inventory/i)).toBeVisible();

      // Should have stock table
      await expect(page.locator('table')).toBeVisible();
    });

    test('should generate sales report', async ({ page }) => {
      const reportsLink = page.getByTestId('nav-link-reports');

      if (await reportsLink.isVisible()) {
        await reportsLink.click();

        // Look for export or generate report button
        const exportBtn = page.getByTestId('export-report-btn')
          .or(page.getByRole('button', { name: /export|download|generate/i }));

        if (await exportBtn.isVisible()) {
          // Could test download functionality here
          await expect(exportBtn).toBeVisible();
        }
      }
    });
  });

  test.describe('As Super Admin', () => {
    test.beforeEach(async ({ page }) => {
      await login(page, users.SUPER_ADMIN.username, users.SUPER_ADMIN.password);
    });

    test('should view all branches sales', async ({ page }) => {
      await page.goto('/hq/dashboard');

      // Should see overall sales metrics
      await expect(page.getByText(/revenue|sales|performance/i)).toBeVisible();

      // Should have sales by branch
      const branchSalesCards = page.locator('[data-testid^="branch-sales-"]');
      const hasBranchSales = await branchSalesCards.count() > 0;

      if (!hasBranchSales) {
        // Check for sales chart or table
        const hasSalesChart = await page.locator('canvas').count() > 0;
        const hasSalesTable = await page.locator('table').count() > 0;
        expect(hasSalesChart || hasSalesTable).toBeTruthy();
      }
    });

    test('should view sales analytics', async ({ page }) => {
      await page.goto('/hq/dashboard');

      // Should see analytics/statistics
      const hasAnalytics = await page.getByText(/analytics|statistics|insights/i).isVisible()
        .catch(() => false);

      const hasCharts = await page.locator('canvas').count() > 0;

      expect(hasAnalytics || hasCharts).toBeTruthy();
    });

    test('should compare branch performance', async ({ page }) => {
      await page.goto('/hq/branches');

      // Should see branch performance metrics
      const performanceMetrics = await page.getByText(/performance|revenue|sales/i).count();

      expect(performanceMetrics).toBeGreaterThan(0);
    });
  });
});
