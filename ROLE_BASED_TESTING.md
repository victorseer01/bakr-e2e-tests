# Role-Based Testing Guide

## Overview

This guide explains how to write tests using the role-based workflow pattern in the Bakr E2E test suite. The role-based approach provides cleaner, more maintainable tests by automatically handling authentication for specific user roles.

## Available User Roles

```typescript
type UserRole = 'SUPER_ADMIN' | 'BRANCH_MANAGER' | 'SALES_STAFF' | 'PRODUCTION_STAFF';
```

### Role Permissions

| Feature | Super Admin | Branch Manager | Sales Staff | Production Staff |
|---------|-------------|----------------|-------------|------------------|
| Users | ✅ Full | ❌ | ❌ | ❌ |
| Branches | ✅ Full | ❌ | ❌ | ❌ |
| Products | ✅ Full | ✅ View/Sell | ✅ View/Sell | ❌ |
| Inventory | ✅ All Branches | ✅ Branch | ✅ View | ❌ |
| Sales | ✅ Analytics | ✅ Reports | ✅ Create | ❌ |
| Raw Materials | ✅ Full | ✅ Manage | ❌ | ✅ View |
| Production | ✅ Monitor | ✅ Full | ❌ | ✅ Full |
| Transfers | ✅ Full | ✅ Receive | ❌ | ❌ |

## Three Approaches to Role-Based Testing

### 1. Manual Login (Traditional Approach)

Use when you need explicit control over the login process:

```typescript
import { test, expect } from '@playwright/test';
import { login, getTestUsers } from '../helpers/auth-helper';

test('manual login example', async ({ page }) => {
  const users = getTestUsers();
  await login(page, users.SUPER_ADMIN.username, users.SUPER_ADMIN.password);

  // Your test code here
  await page.goto('/hq/dashboard');
  await expect(page.getByText('Dashboard')).toBeVisible();
});
```

### 2. Login By Role (Simplified)

Use when you want to login as a specific role without handling credentials:

```typescript
import { test, expect } from '@playwright/test';
import { loginAsRole } from '../helpers/auth-helper';

test('login by role example', async ({ page }) => {
  await loginAsRole(page, 'SUPER_ADMIN');

  // Your test code here
  await page.goto('/hq/users');
  await expect(page.getByText('Users')).toBeVisible();
});
```

### 3. Role-Specific Test Fixtures (Recommended)

Use for clean, role-specific test suites with automatic authentication:

```typescript
import { expect } from '@playwright/test';
import { testAsRole } from '../helpers/auth-helper';

// Create role-specific test instance
const testAsSuperAdmin = testAsRole('SUPER_ADMIN');

testAsSuperAdmin.describe('Admin Features', () => {
  testAsSuperAdmin('should access user management', async ({ authenticatedPage: page }) => {
    // Already logged in as Super Admin!
    await page.goto('/hq/users');
    await expect(page.getByText('Users')).toBeVisible();
  });

  testAsSuperAdmin('should access branch management', async ({ authenticatedPage: page }) => {
    // Session maintained across tests
    await page.goto('/hq/branches');
    await expect(page.getByText('Branches')).toBeVisible();
  });
});
```

## Practical Examples

### Example 1: Testing Multiple Roles

```typescript
import { test, expect } from '@playwright/test';
import { loginAsRole, type UserRole } from '../helpers/auth-helper';

test.describe('Dashboard Access', () => {
  const roles: UserRole[] = ['SUPER_ADMIN', 'BRANCH_MANAGER', 'SALES_STAFF'];

  for (const role of roles) {
    test(`${role} should access their dashboard`, async ({ page }) => {
      await loginAsRole(page, role);

      // All roles should see a dashboard
      await expect(page.getByText(/dashboard/i)).toBeVisible();
    });
  }
});
```

### Example 2: Role-Specific Test Suites

```typescript
import { expect } from '@playwright/test';
import { testAsRole } from '../helpers/auth-helper';

// Create instances for each role
const testAsSuperAdmin = testAsRole('SUPER_ADMIN');
const testAsManager = testAsRole('BRANCH_MANAGER');
const testAsStaff = testAsRole('SALES_STAFF');

// Super Admin Tests
testAsSuperAdmin.describe('Admin Operations', () => {
  testAsSuperAdmin('should manage users', async ({ authenticatedPage: page }) => {
    await page.goto('/hq/users');
    await page.getByTestId('add-user-btn').click();
    // ... test code
  });
});

// Branch Manager Tests
testAsManager.describe('Manager Operations', () => {
  testAsManager('should manage production', async ({ authenticatedPage: page }) => {
    await page.goto('/manager/production');
    await page.getByTestId('create-batch-btn').click();
    // ... test code
  });
});

// Sales Staff Tests
testAsStaff.describe('Staff Operations', () => {
  testAsStaff('should create sales', async ({ authenticatedPage: page }) => {
    await page.goto('/staff/products');
    await page.getByTestId('create-sale-btn').click();
    // ... test code
  });
});
```

### Example 3: Testing Access Control

```typescript
import { expect } from '@playwright/test';
import { testAsRole } from '../helpers/auth-helper';

const testAsStaff = testAsRole('SALES_STAFF');

testAsStaff.describe('Access Control', () => {
  testAsStaff('should NOT access admin features', async ({ authenticatedPage: page }) => {
    // Try to access admin page
    await page.goto('/hq/users');

    // Should be blocked or redirected
    const isBlocked = page.url().includes('/staff') ||
                     await page.getByText(/access denied|unauthorized/i).isVisible();

    expect(isBlocked).toBeTruthy();
  });

  testAsStaff('should NOT see admin menu items', async ({ authenticatedPage: page }) => {
    await page.goto('/staff/dashboard');

    // Admin menu items should not be visible
    await expect(page.getByTestId('nav-link-users')).not.toBeVisible();
    await expect(page.getByTestId('nav-link-branches')).not.toBeVisible();
  });
});
```

### Example 4: Cross-Role Comparison

```typescript
import { expect } from '@playwright/test';
import { testAsRole } from '../helpers/auth-helper';

const testAsSuperAdmin = testAsRole('SUPER_ADMIN');
const testAsManager = testAsRole('BRANCH_MANAGER');

// Super Admin sees all branches
testAsSuperAdmin.describe('Multi-Branch View', () => {
  testAsSuperAdmin('should view all branches inventory', async ({ authenticatedPage: page }) => {
    await page.goto('/hq/dashboard');

    const branches = await page.locator('[data-testid^="branch-"]').count();
    expect(branches).toBeGreaterThan(1); // Multiple branches visible
  });
});

// Branch Manager sees only their branch
testAsManager.describe('Single Branch View', () => {
  testAsManager('should view own branch inventory only', async ({ authenticatedPage: page }) => {
    await page.goto('/manager/dashboard');

    // Should not see other branches
    await expect(page.getByText(/select branch|all branches/i)).not.toBeVisible();
  });
});
```

## Best Practices

### 1. Use Role Fixtures for Role-Specific Features

✅ **Good:**
```typescript
const testAsAdmin = testAsRole('SUPER_ADMIN');

testAsAdmin.describe('User Management', () => {
  testAsAdmin('should create user', async ({ authenticatedPage: page }) => {
    // Test code
  });
});
```

❌ **Avoid:**
```typescript
test.describe('User Management', () => {
  test('should create user', async ({ page }) => {
    await loginAsRole(page, 'SUPER_ADMIN');
    // Repeating login in every test
  });
});
```

### 2. Group Tests by Role

```typescript
// Good organization
testAsSuperAdmin.describe('Admin: User Management', () => { /* ... */ });
testAsSuperAdmin.describe('Admin: Branch Management', () => { /* ... */ });

testAsManager.describe('Manager: Production', () => { /* ... */ });
testAsManager.describe('Manager: Inventory', () => { /* ... */ });
```

### 3. Test Access Control

Always test that roles cannot access features they shouldn't:

```typescript
testAsStaff('should NOT access admin features', async ({ authenticatedPage: page }) => {
  await page.goto('/hq/users');
  // Verify access is denied
});
```

### 4. Use Descriptive Test Names

Include role in test name when testing role-specific behavior:

```typescript
test('Super Admin should create user', async ({ page }) => { /* ... */ });
test('Branch Manager should NOT create user', async ({ page }) => { /* ... */ });
```

## Migration Guide

### Converting Existing Tests

**Before:**
```typescript
test('should view dashboard', async ({ page }) => {
  const users = getTestUsers();
  await login(page, users.SUPER_ADMIN.username, users.SUPER_ADMIN.password);
  await page.goto('/hq/dashboard');
  // test code
});
```

**After:**
```typescript
const testAsAdmin = testAsRole('SUPER_ADMIN');

testAsAdmin('should view dashboard', async ({ authenticatedPage: page }) => {
  await page.goto('/hq/dashboard');
  // test code - login already done!
});
```

## Helper Functions Reference

### `login(page, username, password)`
Manual login with explicit credentials.

### `loginAsRole(page, role)`
Login as a specific role using environment credentials.

### `logout(page)`
Logout current user.

### `getTestUsers()`
Get all test users with credentials from environment.

### `testAsRole(role)`
Create a test instance with automatic authentication fixture.

Returns test instance with `authenticatedPage` fixture.

## Running Role-Specific Tests

```bash
# Run all tests
npm test

# Run specific role tests
npx playwright test tests/auth-roles.spec.ts
npx playwright test tests/sales-roles.spec.ts

# Run tests by grep pattern
npx playwright test --grep "Admin"
npx playwright test --grep "Manager"
npx playwright test --grep "Staff"

# Run in UI mode to see roles
npm run test:ui
```

## Troubleshooting

### Issue: Authentication fails for role
**Solution:** Check environment variables in `.env` file:
```bash
SUPER_ADMIN_USERNAME=admin
SUPER_ADMIN_PASSWORD=your-password
```

### Issue: Test can't access feature
**Solution:** Verify the role has permission for that feature in the permission matrix above.

### Issue: Session not maintained
**Solution:** Ensure you're using `authenticatedPage` fixture, not `page`:
```typescript
testAsAdmin('test', async ({ authenticatedPage: page }) => {
  // Use authenticatedPage, not page
});
```

## Examples in Codebase

See these files for complete examples:
- [tests/auth-roles.spec.ts](tests/auth-roles.spec.ts) - Authentication with roles
- [tests/sales-roles.spec.ts](tests/sales-roles.spec.ts) - Sales operations by role
- [helpers/auth-helper.ts](helpers/auth-helper.ts) - Helper implementation

## Summary

The role-based testing workflow provides:
- ✅ **Cleaner code** - No repetitive login calls
- ✅ **Better organization** - Group tests by role
- ✅ **Session management** - Automatic session handling
- ✅ **Type safety** - TypeScript support for roles
- ✅ **Maintainability** - Change login once, affects all tests
- ✅ **Clarity** - Test intent is immediately clear

Choose the approach that best fits your test case, with role fixtures being recommended for most scenarios.
