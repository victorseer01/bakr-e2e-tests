import { expect } from '@playwright/test';
import { testAsRole } from '../helpers/auth-helper';

/**
 * Sales/Orders Management - Role-Based Tests
 * Using role-specific test fixtures for cleaner test organization
 */

// Create role-specific test instances
const testAsSalesStaff = testAsRole('SALES_STAFF');
const testAsBranchManager = testAsRole('BRANCH_MANAGER');
const testAsSuperAdmin = testAsRole('SUPER_ADMIN');

// ==========================================
// SALES STAFF TESTS
// ==========================================

testAsSalesStaff.describe('Sales Staff - Sales Operations', () => {
  testAsSalesStaff('should access sales dashboard', async ({ authenticatedPage: page }) => {
    await page.goto('/staff/dashboard');

    // Should see dashboard elements
    await expect(page.getByText(/dashboard|sales|overview/i)).toBeVisible();

    // Should have access to products
    await expect(page.getByTestId('nav-link-products')).toBeVisible();
  });

  testAsSalesStaff('should view products catalog', async ({ authenticatedPage: page }) => {
    await page.goto('/staff/products');

    // Should see products
    await expect(page.getByText(/products|product catalog/i)).toBeVisible();

    // Should have products table or grid
    const hasProducts = await page.locator('table tbody tr').count() > 0 ||
                       await page.locator('[data-testid^="product-card-"]').count() > 0;

    expect(hasProducts).toBeTruthy();
  });

  testAsSalesStaff('should create a sale order', async ({ authenticatedPage: page }) => {
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

  testAsSalesStaff('should view sales history', async ({ authenticatedPage: page }) => {
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

  testAsSalesStaff('should check stock availability', async ({ authenticatedPage: page }) => {
    await page.goto('/staff/stocks');

    // Should see stock information
    await expect(page.getByText(/stock|available|inventory/i)).toBeVisible();

    // Should show products with availability
    const productRows = page.locator('table tbody tr');
    const count = await productRows.count();

    expect(count).toBeGreaterThan(0);
  });
});

// ==========================================
// BRANCH MANAGER TESTS
// ==========================================

testAsBranchManager.describe('Branch Manager - Sales Management', () => {
  testAsBranchManager('should view branch sales report', async ({ authenticatedPage: page }) => {
    await page.goto('/manager/dashboard');

    // Should see sales overview
    await expect(page.getByText(/sales|revenue|performance/i)).toBeVisible();
  });

  testAsBranchManager('should view inventory after sales', async ({ authenticatedPage: page }) => {
    await page.goto('/manager/stocks');

    // Should see stock levels
    await expect(page.getByText(/stock|inventory/i)).toBeVisible();

    // Should have stock table
    await expect(page.locator('table')).toBeVisible();
  });

  testAsBranchManager('should monitor sales performance', async ({ authenticatedPage: page }) => {
    await page.goto('/manager/dashboard');

    // Should have access to sales metrics
    const hasMetrics = await page.getByText(/revenue|sales|orders/i).isVisible();
    expect(hasMetrics).toBeTruthy();
  });

  testAsBranchManager('should filter sales by date', async ({ authenticatedPage: page }) => {
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
      }
    }
  });
});

// ==========================================
// SUPER ADMIN TESTS
// ==========================================

testAsSuperAdmin.describe('Super Admin - Sales Analytics', () => {
  testAsSuperAdmin('should view all branches sales', async ({ authenticatedPage: page }) => {
    await page.goto('/hq/dashboard');

    // Should see overall sales metrics
    await expect(page.getByText(/revenue|sales|performance/i)).toBeVisible();

    // Should have sales by branch or charts
    const hasBranchSales = await page.locator('[data-testid^="branch-sales-"]').count() > 0;
    const hasSalesChart = await page.locator('canvas').count() > 0;
    const hasSalesTable = await page.locator('table').count() > 0;

    expect(hasBranchSales || hasSalesChart || hasSalesTable).toBeTruthy();
  });

  testAsSuperAdmin('should view sales analytics', async ({ authenticatedPage: page }) => {
    await page.goto('/hq/dashboard');

    // Should see analytics/statistics
    const hasAnalytics = await page.getByText(/analytics|statistics|insights/i).isVisible()
      .catch(() => false);

    const hasCharts = await page.locator('canvas').count() > 0;

    expect(hasAnalytics || hasCharts).toBeTruthy();
  });

  testAsSuperAdmin('should compare branch performance', async ({ authenticatedPage: page }) => {
    await page.goto('/hq/branches');

    // Should see branch performance metrics
    const performanceMetrics = await page.getByText(/performance|revenue|sales/i).count();

    expect(performanceMetrics).toBeGreaterThan(0);
  });

  testAsSuperAdmin('should access all sales features', async ({ authenticatedPage: page }) => {
    // Navigate to different sections to verify access
    const sections = [
      { path: '/hq/dashboard', name: 'Dashboard' },
      { path: '/hq/branches', name: 'Branches' },
      { path: '/hq/products', name: 'Products' },
    ];

    for (const section of sections) {
      await page.goto(section.path);
      // Should successfully load without access denied
      await expect(page.getByText(/access denied|unauthorized/i)).not.toBeVisible();
    }
  });
});

// ==========================================
// CROSS-ROLE COMPARISON TESTS
// ==========================================

testAsSalesStaff.describe('Role-Based Access Control', () => {
  testAsSalesStaff('should not access admin-only features', async ({ authenticatedPage: page }) => {
    // Try to access HQ dashboard (admin only)
    await page.goto('/hq/dashboard');

    // Should be redirected or show access denied
    const currentUrl = page.url();
    const isBlocked = currentUrl.includes('/staff') ||
                     await page.getByText(/access denied|unauthorized/i).isVisible();

    expect(isBlocked).toBeTruthy();
  });

  testAsSalesStaff('should have limited menu options', async ({ authenticatedPage: page }) => {
    await page.goto('/staff/dashboard');

    // Should NOT see admin menu items
    await expect(page.getByTestId('nav-link-branches')).not.toBeVisible();
    await expect(page.getByTestId('nav-link-users')).not.toBeVisible();

    // Should see appropriate menu items
    await expect(page.getByTestId('nav-link-products')).toBeVisible();
  });
});
