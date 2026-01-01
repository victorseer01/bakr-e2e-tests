import { test, expect } from '@playwright/test';
import { login, logout, getTestUsers } from '../helpers/auth-helper';

test.describe('Authentication', () => {
  const users = getTestUsers();

  test('should login successfully as Super Admin', async ({ page }) => {
    await login(page, users.SUPER_ADMIN.username, users.SUPER_ADMIN.password);

    // Should redirect to HQ dashboard
    await expect(page).toHaveURL(/\/hq\/dashboard/);
    await expect(page.getByTestId('nav-link-dashboard')).toBeVisible();
  });

  test('should login successfully as Branch Manager', async ({ page }) => {
    await login(page, users.BRANCH_MANAGER.username, users.BRANCH_MANAGER.password);

    // Should redirect to manager dashboard
    await expect(page).toHaveURL(/\/manager\/dashboard/);
    await expect(page.getByTestId('nav-link-dashboard')).toBeVisible();
  });

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
