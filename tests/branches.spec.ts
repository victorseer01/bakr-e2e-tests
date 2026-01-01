import { test, expect } from '@playwright/test';
import { login, getTestUsers } from '../helpers/auth-helper';

test.describe('Branch Management', () => {
  const users = getTestUsers();
  const testBranch = {
    name: `Test Branch ${Date.now()}`,
    location: 'Test Location, Lagos',
    phoneNumber: '08012345678',
    email: `branch${Date.now()}@bakr.com`,
    managerName: 'Test Manager',
  };

  test.beforeEach(async ({ page }) => {
    // Only Super Admin can manage branches
    await login(page, users.SUPER_ADMIN.username, users.SUPER_ADMIN.password);
    await page.goto('/hq/branches');
  });

  test('should display branches page', async ({ page }) => {
    // Should see branches heading
    await expect(page.getByText(/branches|branch management/i)).toBeVisible();

    // Should have add branch button
    await expect(page.getByTestId('add-branch-btn')).toBeVisible();

    // Should display branches (cards or table)
    const hasBranchCards = await page.locator('[data-testid^="branch-card-"]').count() > 0;
    const hasBranchTable = await page.locator('table tbody tr').count() > 0;

    expect(hasBranchCards || hasBranchTable).toBeTruthy();
  });

  test('should create a new branch', async ({ page }) => {
    // Click Add Branch button
    await page.getByTestId('add-branch-btn').click();

    // Wait for modal
    await expect(page.getByTestId('add-branch-form')).toBeVisible();

    // Fill branch details
    await page.getByTestId('name-input').fill(testBranch.name);
    await page.getByTestId('location-input').fill(testBranch.location);
    await page.getByTestId('phoneNumber-input').fill(testBranch.phoneNumber);
    await page.getByTestId('email-input').fill(testBranch.email);

    // If manager selection exists
    const managerSelect = page.locator('select[name="managerId"]');
    if (await managerSelect.isVisible()) {
      await managerSelect.selectOption({ index: 1 });
    }

    // Submit form
    await page.getByTestId('save-btn').click();

    // Should show success message
    await expect(page.getByText(/branch added successfully|branch created successfully/i))
      .toBeVisible({ timeout: 10000 });

    // Branch should appear on page
    await expect(page.getByText(testBranch.name)).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    // Click Add Branch button
    await page.getByTestId('add-branch-btn').click();

    // Wait for modal
    await expect(page.getByTestId('add-branch-form')).toBeVisible();

    // Try to submit without filling required fields
    await page.getByTestId('save-btn').click();

    // Should show validation errors
    await expect(page.getByText(/name is required|required/i)).toBeVisible();
  });

  test('should edit existing branch', async ({ page }) => {
    // Find first branch's edit button
    const firstEditBtn = page.locator('[data-testid^="edit-branch-btn-"]').first();

    if (await firstEditBtn.isVisible()) {
      await firstEditBtn.click();

      // Wait for edit modal
      await expect(page.getByTestId('edit-branch-form')).toBeVisible();

      // Update location
      const updatedLocation = `Updated Location ${Date.now()}`;
      const locationInput = page.getByTestId('location-input');
      await locationInput.clear();
      await locationInput.fill(updatedLocation);

      // Submit
      await page.getByTestId('save-btn').click();

      // Should show success message
      await expect(page.getByText(/branch updated successfully/i))
        .toBeVisible({ timeout: 10000 });

      // Updated location should appear
      await expect(page.getByText(updatedLocation)).toBeVisible();
    }
  });

  test('should delete branch with confirmation', async ({ page }) => {
    // Wait for page to load
    await page.waitForTimeout(1000);

    // Find delete button
    const moreButtons = page.locator('[data-testid^="more-btn-"]');
    const count = await moreButtons.count();

    if (count > 0) {
      // Click more button
      await moreButtons.first().click();

      // Wait for dropdown
      await page.waitForTimeout(500);

      // Click delete
      const deleteBtn = page.locator('[data-testid^="delete-branch-btn-"]').first();
      await deleteBtn.click();

      // Confirm dialog should appear
      await expect(page.getByText(/are you sure you want to delete/i)).toBeVisible();

      // Confirm deletion
      await page.getByRole('button', { name: /delete/i }).click();

      // Should show success message
      await expect(page.getByText(/branch deleted successfully/i))
        .toBeVisible({ timeout: 10000 });
    }
  });

  test('should view branch details', async ({ page }) => {
    // Find first branch card or row
    const viewBtn = page.locator('[data-testid^="view-branch-btn-"]').first();
    const branchCard = page.locator('[data-testid^="branch-card-"]').first();

    if (await viewBtn.isVisible()) {
      await viewBtn.click();
    } else if (await branchCard.isVisible()) {
      await branchCard.click();
    } else {
      // Click first row in table
      await page.locator('table tbody tr').first().click();
    }

    // Should show branch details
    await expect(page.getByText(/branch details|branch information/i)).toBeVisible();

    // Should show branch data
    await expect(page.getByText(/location|phone|email|manager/i)).toBeVisible();
  });

  test('should display branch statistics', async ({ page }) => {
    // Check if statistics cards are visible
    const statsCards = page.locator('[data-testid^="branch-stats-"]');
    const hasStats = await statsCards.count() > 0;

    if (hasStats) {
      // Should show at least one stat
      await expect(statsCards.first()).toBeVisible();

      // Common stats: total branches, active branches, etc.
      const hasRelevantStats = await page.getByText(/total|active|revenue|sales/i).isVisible();
      expect(hasRelevantStats).toBeTruthy();
    }
  });

  test('should assign manager to branch', async ({ page }) => {
    // Find first branch's edit button
    const firstEditBtn = page.locator('[data-testid^="edit-branch-btn-"]').first();

    if (await firstEditBtn.isVisible()) {
      await firstEditBtn.click();

      // Wait for edit modal
      await expect(page.getByTestId('edit-branch-form')).toBeVisible();

      // Select manager if dropdown exists
      const managerSelect = page.locator('select[name="managerId"]');
      if (await managerSelect.isVisible()) {
        await managerSelect.selectOption({ index: 1 });

        // Submit
        await page.getByTestId('save-btn').click();

        // Should show success message
        await expect(page.getByText(/branch updated successfully/i))
          .toBeVisible({ timeout: 10000 });
      }
    }
  });

  test('should filter or search branches', async ({ page }) => {
    const searchInput = page.getByTestId('search-input');

    if (await searchInput.isVisible()) {
      // Get first branch name
      const firstBranchName = await page.locator('table tbody tr').first()
        .locator('td').first().textContent();

      if (firstBranchName) {
        // Search for the branch
        await searchInput.fill(firstBranchName.slice(0, 3));

        // Wait for search
        await page.waitForTimeout(1000);

        // Should show filtered results
        await expect(page.getByText(firstBranchName)).toBeVisible();
      }
    }
  });
});
