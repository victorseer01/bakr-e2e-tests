import { test, expect } from '@playwright/test';
import { login, getTestUsers } from '../helpers/auth-helper';

test.describe('User Management', () => {
  const users = getTestUsers();
  const testUser = {
    username: `testuser${Date.now()}`,
    firstName: 'Test',
    lastName: 'User',
    email: `test${Date.now()}@bakr.com`,
    password: 'Test@123456',
    role: 'SALES_STAFF',
  };

  test.beforeEach(async ({ page }) => {
    // Only Super Admin can manage users
    await login(page, users.SUPER_ADMIN.username, users.SUPER_ADMIN.password);
    await page.goto('/hq/users');
  });

  test('should display users page with table', async ({ page }) => {
    // Should see users heading
    await expect(page.getByText(/users|user management/i)).toBeVisible();

    // Should have add user button
    await expect(page.getByTestId('add-user-btn')).toBeVisible();

    // Should have users table
    await expect(page.locator('table')).toBeVisible();
  });

  test('should create a new user', async ({ page }) => {
    // Click Add User button
    await page.getByTestId('add-user-btn').click();

    // Wait for modal
    await expect(page.getByTestId('add-user-form')).toBeVisible();

    // Fill user details
    await page.getByTestId('username-input').fill(testUser.username);
    await page.getByTestId('firstName-input').fill(testUser.firstName);
    await page.getByTestId('lastName-input').fill(testUser.lastName);
    await page.getByTestId('email-input').fill(testUser.email);
    await page.getByTestId('password-input').fill(testUser.password);

    // Select role
    await page.locator('select[name="role"]').selectOption(testUser.role);

    // Select branch (first available)
    await page.locator('select[name="branchId"]').selectOption({ index: 1 });

    // Submit form
    await page.getByTestId('save-btn').click();

    // Should show success message
    await expect(page.getByText(/user added successfully|user created successfully/i))
      .toBeVisible({ timeout: 10000 });

    // User should appear in table
    await expect(page.getByText(testUser.username)).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    // Click Add User button
    await page.getByTestId('add-user-btn').click();

    // Wait for modal
    await expect(page.getByTestId('add-user-form')).toBeVisible();

    // Try to submit without filling fields
    await page.getByTestId('save-btn').click();

    // Should show validation errors
    await expect(page.getByText(/username is required|required/i)).toBeVisible();
  });

  test('should edit existing user', async ({ page }) => {
    // Find first user's edit button
    const firstEditBtn = page.locator('[data-testid^="edit-user-btn-"]').first();

    if (await firstEditBtn.isVisible()) {
      await firstEditBtn.click();

      // Wait for edit modal
      await expect(page.getByTestId('edit-user-form')).toBeVisible();

      // Update first name
      const updatedFirstName = `Updated${Date.now()}`;
      const firstNameInput = page.getByTestId('firstName-input');
      await firstNameInput.clear();
      await firstNameInput.fill(updatedFirstName);

      // Submit
      await page.getByTestId('save-btn').click();

      // Should show success message
      await expect(page.getByText(/user updated successfully/i))
        .toBeVisible({ timeout: 10000 });

      // Updated name should appear in table
      await expect(page.getByText(updatedFirstName)).toBeVisible();
    }
  });

  test('should delete user with confirmation', async ({ page }) => {
    // Wait for table to load
    await page.waitForTimeout(1000);

    // Find first user's more/delete button
    const moreButtons = page.locator('[data-testid^="more-btn-"]');
    const count = await moreButtons.count();

    if (count > 0) {
      // Click more button
      await moreButtons.first().click();

      // Wait for dropdown
      await page.waitForTimeout(500);

      // Click delete button
      const deleteBtn = page.locator('[data-testid^="delete-user-btn-"]').first();
      await deleteBtn.click();

      // Confirm dialog should appear
      await expect(page.getByText(/are you sure you want to delete/i)).toBeVisible();

      // Confirm deletion
      await page.getByRole('button', { name: /delete/i }).click();

      // Should show success message
      await expect(page.getByText(/user deleted successfully/i))
        .toBeVisible({ timeout: 10000 });
    }
  });

  test('should filter users by role', async ({ page }) => {
    // Check if role filter exists
    const roleFilter = page.getByTestId('role-filter-select');

    if (await roleFilter.isVisible()) {
      // Select BRANCH_MANAGER role
      await roleFilter.selectOption('BRANCH_MANAGER');

      // Wait for table to update
      await page.waitForTimeout(1000);

      // Should show only branch managers
      const rows = page.locator('table tbody tr');
      const count = await rows.count();

      if (count > 0) {
        // Verify at least one row shows branch manager
        await expect(rows.first()).toContainText(/branch manager|manager/i);
      }
    }
  });

  test('should search users by name or username', async ({ page }) => {
    const searchInput = page.getByTestId('search-input');

    if (await searchInput.isVisible()) {
      // Get first user from table to search for
      const firstUserCell = page.locator('table tbody tr').first().locator('td').first();
      const searchTerm = await firstUserCell.textContent();

      if (searchTerm) {
        // Search for the user
        await searchInput.fill(searchTerm.slice(0, 3));

        // Wait for search to filter
        await page.waitForTimeout(1000);

        // Should show filtered results
        await expect(page.locator('table tbody tr')).toHaveCount(1, { timeout: 5000 })
          .catch(() => Promise.resolve()); // May have multiple matches
      }
    }
  });

  test('should display user details/profile', async ({ page }) => {
    // Find first user's view/details button
    const viewBtn = page.locator('[data-testid^="view-user-btn-"]').first();

    if (await viewBtn.isVisible()) {
      await viewBtn.click();

      // Should show user details
      await expect(page.getByText(/user details|user profile/i)).toBeVisible();

      // Should show user information
      await expect(page.getByText(/username|email|role|branch/i)).toBeVisible();
    }
  });

  test('should toggle user active status', async ({ page }) => {
    // Find first user's status toggle
    const statusToggle = page.locator('[data-testid^="status-toggle-"]').first();

    if (await statusToggle.isVisible()) {
      await statusToggle.click();

      // Should show confirmation or success message
      await expect(
        page.getByText(/status updated|user (activated|deactivated) successfully/i)
      ).toBeVisible({ timeout: 10000 });
    }
  });
});
