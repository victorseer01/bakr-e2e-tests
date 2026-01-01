import { Page, expect, test as baseTest } from '@playwright/test';

export type UserRole = 'SUPER_ADMIN' | 'BRANCH_MANAGER' | 'SALES_STAFF' | 'PRODUCTION_STAFF';

export interface TestUser {
  username: string;
  password: string;
  role: UserRole;
  dashboardPath: string;
}

/**
 * Login helper for authenticated tests
 * @param page - Playwright page object
 * @param username - User's username
 * @param password - User's password
 */
export async function login(page: Page, username: string, password: string) {
  await page.goto('/');

  // Wait for login form to be visible
  await expect(page.getByTestId('login-form')).toBeVisible();

  // Fill in credentials
  await page.getByTestId('username-input').fill(username);
  await page.getByTestId('password-input').fill(password);

  // Click login button
  await page.getByTestId('login-btn').click();

  // Wait for navigation to dashboard
  await page.waitForURL(/\/(hq|manager|staff)\/dashboard/, { timeout: 10000 });
}

/**
 * Login as specific role
 * @param page - Playwright page object
 * @param role - User role to login as
 */
export async function loginAsRole(page: Page, role: UserRole) {
  const users = getTestUsers();
  const user = users[role];
  await login(page, user.username, user.password);
}

/**
 * Logout helper
 * @param page - Playwright page object
 */
export async function logout(page: Page) {
  // Click menu button
  await page.getByTestId('menu-button').click();

  // Wait for menu to open
  await expect(page.getByTestId('menu-modal')).toBeVisible();

  // Click logout
  await page.getByTestId('menu-item-log-out').click();

  // Wait for redirect to login page
  await page.waitForURL('/', { timeout: 5000 });
}

/**
 * Get test users from environment variables
 */
export function getTestUsers(): Record<UserRole, TestUser> {
  return {
    SUPER_ADMIN: {
      username: process.env.SUPER_ADMIN_USERNAME || 'admin',
      password: process.env.SUPER_ADMIN_PASSWORD || 'password',
      role: 'SUPER_ADMIN',
      dashboardPath: '/hq/dashboard'
    },
    BRANCH_MANAGER: {
      username: process.env.BRANCH_MANAGER_USERNAME || 'manager',
      password: process.env.BRANCH_MANAGER_PASSWORD || 'password',
      role: 'BRANCH_MANAGER',
      dashboardPath: '/manager/dashboard'
    },
    SALES_STAFF: {
      username: process.env.SALES_STAFF_USERNAME || 'staff',
      password: process.env.SALES_STAFF_PASSWORD || 'password',
      role: 'SALES_STAFF',
      dashboardPath: '/staff/dashboard'
    },
    PRODUCTION_STAFF: {
      username: process.env.PRODUCTION_STAFF_USERNAME || 'production',
      password: process.env.PRODUCTION_STAFF_PASSWORD || 'password',
      role: 'PRODUCTION_STAFF',
      dashboardPath: '/staff/dashboard'
    }
  };
}

/**
 * Create a test fixture with authenticated user by role
 * Use this to create role-specific test suites
 */
export const testAsRole = (role: UserRole) => {
  return baseTest.extend<{ authenticatedPage: Page }>({
    authenticatedPage: async ({ page }, use) => {
      await loginAsRole(page, role);
      await use(page);
    },
  });
};
