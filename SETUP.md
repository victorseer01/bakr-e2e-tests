# Setup Guide for Bakr E2E Tests

## Quick Start

### 1. Push to GitHub (if not already done)

```bash
git push -u origin master
```

### 2. Configure GitHub Secrets

Add the following secrets to your GitHub repository:
**Settings → Secrets and variables → Actions → New repository secret**

#### Required Secrets:
- `BASE_URL` - Your deployed frontend URL (e.g., https://bakr.netlify.app)
- `API_BASE_URL` - Your backend API URL (e.g., https://bakr-api.railway.app)
- `SUPER_ADMIN_USERNAME` - Super admin test account username
- `SUPER_ADMIN_PASSWORD` - Super admin test account password
- `BRANCH_MANAGER_USERNAME` - Branch manager test account username
- `BRANCH_MANAGER_PASSWORD` - Branch manager test account password
- `SALES_STAFF_USERNAME` - Sales staff test account username
- `SALES_STAFF_PASSWORD` - Sales staff test account password
- `PRODUCTION_STAFF_USERNAME` - Production staff test account username
- `PRODUCTION_STAFF_PASSWORD` - Production staff test account password

### 3. Local Development Setup

```bash
# Install dependencies
npm install

# Install browsers
npx playwright install

# Create .env file
cp .env.example .env

# Edit .env with your configuration
nano .env
```

### 4. Run Tests Locally

```bash
# Run all tests
npm test

# Run with UI mode (great for debugging)
npm run test:ui

# Run specific test file
npx playwright test tests/auth.spec.ts

# Run in headed mode (see browser)
npm run test:headed
```

## CI/CD Workflow

The GitHub Actions workflow runs automatically:
- ✅ On every push to `main` or `develop` branches
- ✅ On every pull request
- ✅ Daily at midnight UTC (scheduled)
- ✅ Manual trigger via GitHub Actions UI

### Viewing Test Results

1. Go to **Actions** tab in GitHub
2. Click on the latest workflow run
3. Download artifacts:
   - `playwright-report-*` - HTML test reports
   - `playwright-traces-*` - Debug traces (only on failures)

## Test Account Setup

You need to create test accounts in your deployed backend with these roles:

1. **Super Admin** - Full access to HQ features
2. **Branch Manager** - Access to branch-level operations
3. **Sales Staff** - Access to sales and products
4. **Production Staff** - Access to production features

### Creating Test Accounts via API

```bash
# Example: Create Super Admin test account
curl -X POST https://your-backend.railway.app/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "username": "test-admin",
    "password": "test-password",
    "firstName": "Test",
    "lastName": "Admin",
    "email": "test-admin@bakr.com",
    "role": "SUPER_ADMIN",
    "branchId": 1
  }'
```

## Troubleshooting

### Tests timing out
```bash
# Increase timeout in playwright.config.ts
use: {
  actionTimeout: 30000, // Increase from 15000
  navigationTimeout: 60000, // Increase from 30000
}
```

### Authentication failures
- Verify credentials in `.env` or GitHub Secrets
- Check if backend is accessible
- Ensure test accounts exist in the database

### Element not found errors
- Check if `data-testid` attributes exist in frontend
- Verify element selectors in test files
- Use Playwright Inspector to debug: `npm run test:debug`

## Writing New Tests

### Test Template

```typescript
import { test, expect } from '@playwright/test';
import { login, getTestUsers } from '../helpers/auth-helper';

test.describe('Feature Name', () => {
  const users = getTestUsers();

  test.beforeEach(async ({ page }) => {
    await login(page, users.SUPER_ADMIN.username, users.SUPER_ADMIN.password);
    await page.goto('/your-page');
  });

  test('should do something', async ({ page }) => {
    // Your test here
    await expect(page.getByTestId('element')).toBeVisible();
  });
});
```

### Best Practices

1. **Use data-testid**: More reliable than CSS selectors
   ```typescript
   await page.getByTestId('submit-btn').click();
   ```

2. **Wait for visibility**: Use Playwright's auto-waiting
   ```typescript
   await expect(page.getByText('Success')).toBeVisible();
   ```

3. **Unique test data**: Use timestamps to avoid conflicts
   ```typescript
   const name = `Test Item ${Date.now()}`;
   ```

4. **Cleanup**: Remove test data after tests
   ```typescript
   test.afterEach(async ({ page }) => {
     // Cleanup logic
   });
   ```

## Monitoring & Alerts

### Setting up Slack Notifications

Edit `.github/workflows/e2e-tests.yml` to add Slack webhook:

```yaml
- name: Send notification
  uses: slackapi/slack-github-action@v1
  with:
    payload: |
      {
        "text": "E2E Tests Failed!",
        "blocks": [
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "E2E tests failed on scheduled run"
            }
          }
        ]
      }
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

## Resources

- [Playwright Documentation](https://playwright.dev)
- [GitHub Actions Documentation](https://docs.github.com/actions)
- [Test Best Practices](https://playwright.dev/docs/best-practices)
