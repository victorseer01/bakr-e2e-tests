# Bakr E2E Tests

End-to-end tests for the Bakr application using Playwright. Tests run against deployed frontend and backend instances.

## Features

- ✅ Authentication flows (login, logout, role-based access)
- ✅ Product management (create, edit, delete)
- ✅ Raw materials management (create, adjust stock)
- ✅ Production batch management
- ✅ Transfer operations
- ✅ Multi-browser support (Chromium, Firefox, Safari)
- ✅ Visual regression testing capabilities
- ✅ Parallel test execution
- ✅ CI/CD ready with GitHub Actions

## Setup

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

### Environment Configuration

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update `.env` with your deployed URLs and test credentials:
   ```env
   BASE_URL=https://your-frontend.netlify.app
   API_BASE_URL=https://your-backend.railway.app

   SUPER_ADMIN_USERNAME=admin
   SUPER_ADMIN_PASSWORD=your-password
   # ... other credentials
   ```

## Running Tests

### Run all tests

```bash
npm test
```

### Run specific test file

```bash
npx playwright test tests/auth.spec.ts
```

### Run tests in UI mode (for debugging)

```bash
npm run test:ui
```

### Run tests in headed mode

```bash
npm run test:headed
```

### Generate and view HTML report

```bash
npm run report
```

## Test Structure

```
bakr-e2e-tests/
├── helpers/
│   ├── auth-helper.ts      # Authentication utilities
│   └── api-helper.ts       # API testing utilities
├── tests/
│   ├── auth.spec.ts        # Authentication tests
│   ├── products.spec.ts    # Product management tests
│   ├── raw-materials.spec.ts # Raw materials tests
│   └── production.spec.ts  # Production batch tests
├── playwright.config.ts    # Playwright configuration
└── .env                    # Environment variables (not committed)
```

## Test Scenarios

### Authentication (`auth.spec.ts`)
- Login with different user roles
- Invalid credentials handling
- Logout functionality

### Products (`products.spec.ts`)
- Create new product
- Edit existing product
- Delete product with confirmation
- Search and filter products

### Raw Materials (`raw-materials.spec.ts`)
- Create raw material with initial stock
- Adjust stock levels
- View low stock materials
- Edit material details

### Production (`production.spec.ts`)
- Create production batch
- View batch details
- Filter batches by status
- Complete/void batches

## CI/CD Integration

This repository includes GitHub Actions workflow for automated testing:

```yaml
# Triggers:
- On push to main branch
- On pull requests
- Scheduled daily at midnight
```

## Best Practices

1. **Test Data**: Tests create their own data with timestamps to avoid conflicts
2. **Cleanup**: Use API helpers to cleanup test data after tests
3. **Selectors**: Use `data-testid` attributes for reliable element selection
4. **Waits**: Use Playwright's auto-waiting instead of hard timeouts
5. **Assertions**: Use Playwright's expect for better error messages

## Debugging

### Debug specific test

```bash
npx playwright test tests/auth.spec.ts --debug
```

### View trace for failed tests

```bash
npx playwright show-trace trace.zip
```

### Generate trace for all tests

```bash
npx playwright test --trace on
```

## Common Issues

### Tests timing out
- Increase timeout in `playwright.config.ts`
- Check if backend is accessible
- Verify credentials in `.env`

### Element not found
- Check if `data-testid` attributes match
- Ensure page has loaded completely
- Use `await page.waitForLoadState('networkidle')`

### Authentication failing
- Verify credentials in `.env`
- Check if backend authentication endpoint is correct
- Ensure cookies are being set correctly

## Contributing

1. Create feature branch
2. Add/update tests
3. Ensure all tests pass
4. Create pull request

## License

MIT
