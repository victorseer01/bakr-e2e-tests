import { test, expect } from '@playwright/test';
import { login, logout, loginAsRole, getTestUsers, testAsRole, type UserRole } from '../helpers/auth-helper';

/**
 * Authentication Tests - Role-Based Workflow
 * Demonstrates different approaches to role-based testing
 */

test.describe('Authentication - Basic Flows', () => {
  const users = getTestUsers();

  test('should show error on invalid credentials', async ({ page }) => {
    await page.goto('/');

    await page.getByTestId('username-input').fill('invalid-user');
    await page.getByTestId('password-input').fill('wrong-password');
    await page.getByTestId('login-btn').click();

    // Should show error toast
    await expect(page.getByText(/invalid credentials|authentication failed/i)).toBeVisible({ timeout: 5000 });
  });

  test('should logout successfully', async ({ page }) => {
    await login(page, users.SUPER_ADMIN.username, users.SUPER_ADMIN.password);

    await logout(page);

    // Should redirect to login page
    await expect(page).toHaveURL('/');
    await expect(page.getByTestId('login-form')).toBeVisible();
  });
});

test.describe('Authentication - Role-Based Login', () => {
  const roles: UserRole[] = ['SUPER_ADMIN', 'BRANCH_MANAGER', 'SALES_STAFF', 'PRODUCTION_STAFF'];
  const users = getTestUsers();

  for (const role of roles) {
    test(`should login successfully as ${role}`, async ({ page }) => {
      const user = users[role];
      await loginAsRole(page, role);

      // Should redirect to appropriate dashboard
      await expect(page).toHaveURL(new RegExp(user.dashboardPath));
      await expect(page.getByTestId('nav-link-dashboard')).toBeVisible();
    });
  }
});

test.describe('Authentication - Role Access Validation', () => {
  test('Super Admin should access HQ features', async ({ page }) => {
    await loginAsRole(page, 'SUPER_ADMIN');

    // Should have access to admin features
    await expect(page.getByTestId('nav-link-users')).toBeVisible();
    await expect(page.getByTestId('nav-link-branches')).toBeVisible();
  });

  test('Branch Manager should access manager features', async ({ page }) => {
    await loginAsRole(page, 'BRANCH_MANAGER');

    // Should have access to manager features
    await expect(page.getByTestId('nav-link-production')).toBeVisible();
    await expect(page.getByTestId('nav-link-stocks')).toBeVisible();

    // Should NOT see admin-only features
    await expect(page.getByTestId('nav-link-users')).not.toBeVisible();
  });

  test('Sales Staff should access sales features only', async ({ page }) => {
    await loginAsRole(page, 'SALES_STAFF');

    // Should have access to sales features
    await expect(page.getByTestId('nav-link-products')).toBeVisible();

    // Should NOT see admin or manager features
    await expect(page.getByTestId('nav-link-users')).not.toBeVisible();
    await expect(page.getByTestId('nav-link-branches')).not.toBeVisible();
  });

  test('Production Staff should access production features', async ({ page }) => {
    await loginAsRole(page, 'PRODUCTION_STAFF');

    // Should have access to production features
    await expect(page.getByTestId('nav-link-production')).toBeVisible();
    await expect(page.getByTestId('nav-link-materials')).toBeVisible();
  });
});

// ==========================================
// ROLE-SPECIFIC TEST FIXTURES EXAMPLES
// ==========================================

const testAsSuperAdmin = testAsRole('SUPER_ADMIN');
const testAsManager = testAsRole('BRANCH_MANAGER');
const testAsStaff = testAsRole('SALES_STAFF');

testAsSuperAdmin.describe('Super Admin Session', () => {
  testAsSuperAdmin('should maintain session across pages', async ({ authenticatedPage: page }) => {
    // Already logged in as Super Admin via fixture

    // Navigate to different pages
    await page.goto('/hq/users');
    await expect(page.getByText(/users/i)).toBeVisible();

    await page.goto('/hq/branches');
    await expect(page.getByText(/branches/i)).toBeVisible();

    // Session should still be active
    await expect(page.getByTestId('user-profile-button')).toBeVisible();
  });

  testAsSuperAdmin('should have full system access', async ({ authenticatedPage: page }) => {
    const adminPages = [
      '/hq/dashboard',
      '/hq/users',
      '/hq/branches',
      '/hq/products',
      '/hq/raw-materials',
      '/hq/production',
      '/hq/transfers',
    ];

    for (const pagePath of adminPages) {
      await page.goto(pagePath);
      // Should not show access denied
      await expect(page.getByText(/access denied|unauthorized/i)).not.toBeVisible();
    }
  });
});

testAsManager.describe('Branch Manager Session', () => {
  testAsManager('should access branch-level features', async ({ authenticatedPage: page }) => {
    await page.goto('/manager/dashboard');
    await expect(page).toHaveURL(/\/manager\/dashboard/);

    // Can access manager features
    await page.goto('/manager/production');
    await expect(page.getByText(/production/i)).toBeVisible();

    await page.goto('/manager/stocks');
    await expect(page.getByText(/stock/i)).toBeVisible();
  });

  testAsManager('should NOT access HQ-only features', async ({ authenticatedPage: page }) => {
    // Try to access HQ dashboard
    await page.goto('/hq/users');

    // Should be blocked or redirected
    const isBlocked = page.url().includes('/manager') ||
                     await page.getByText(/access denied|unauthorized/i).isVisible();

    expect(isBlocked).toBeTruthy();
  });
});

testAsStaff.describe('Sales Staff Session', () => {
  testAsStaff('should access sales features only', async ({ authenticatedPage: page }) => {
    await page.goto('/staff/dashboard');
    await expect(page).toHaveURL(/\/staff\/dashboard/);

    // Can view products
    await page.goto('/staff/products');
    await expect(page.getByText(/products/i)).toBeVisible();
  });

  testAsStaff('should NOT access management features', async ({ authenticatedPage: page }) => {
    // Try to access manager production
    await page.goto('/manager/production');

    // Should be blocked or redirected
    const isBlocked = page.url().includes('/staff') ||
                     await page.getByText(/access denied|unauthorized/i).isVisible();

    expect(isBlocked).toBeTruthy();
  });
});
