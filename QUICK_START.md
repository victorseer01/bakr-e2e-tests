# Quick Start Guide

## Repository
🔗 **https://github.com/victorseer01/bakr-e2e-tests**

## Installation (< 2 minutes)

```bash
# Clone repository
git clone https://github.com/victorseer01/bakr-e2e-tests.git
cd bakr-e2e-tests

# Install dependencies
npm install

# Install browsers (one-time setup)
npx playwright install

# Configure environment
cp .env.example .env
# Edit .env with your URLs and credentials
```

## Run Tests

```bash
# All tests (headless)
npm test

# Interactive UI mode (best for development)
npm run test:ui

# See browser in action
npm run test:headed

# Debug mode with inspector
npm run test:debug

# Specific browser
npm run test:chromium
npm run test:firefox
npm run test:webkit
```

## What Gets Tested

✅ **Authentication** (`tests/auth.spec.ts`)
- Login for all user roles
- Invalid credentials handling
- Logout functionality

✅ **Products** (`tests/products.spec.ts`)
- Create/Edit/Delete products
- Product validation
- Confirmation dialogs

✅ **Raw Materials** (`tests/raw-materials.spec.ts`)
- Create materials with stock
- Adjust stock levels
- Low stock warnings

✅ **Production** (`tests/production.spec.ts`)
- Create production batches
- Material consumption
- Status filtering

✅ **Transfers** (`tests/transfers.spec.ts`)
- Create transfers
- View transfer details
- Void transfers

## CI/CD Automation

Tests run automatically on:
- Every push to `main`/`develop`
- Every pull request
- Daily at midnight UTC
- Manual trigger

View results: **GitHub → Actions tab**

## Environment Variables

Required in `.env` (local) or GitHub Secrets (CI):

```env
BASE_URL=https://your-frontend.netlify.app
API_BASE_URL=https://your-backend.railway.app

SUPER_ADMIN_USERNAME=admin
SUPER_ADMIN_PASSWORD=***
BRANCH_MANAGER_USERNAME=manager
BRANCH_MANAGER_PASSWORD=***
SALES_STAFF_USERNAME=staff
SALES_STAFF_PASSWORD=***
PRODUCTION_STAFF_USERNAME=production
PRODUCTION_STAFF_PASSWORD=***
```

## File Structure

```
bakr-e2e-tests/
├── tests/                    # Test specifications
│   ├── auth.spec.ts         # Authentication tests
│   ├── products.spec.ts     # Product management tests
│   ├── raw-materials.spec.ts # Materials tests
│   ├── production.spec.ts   # Production tests
│   └── transfers.spec.ts    # Transfer tests
├── helpers/                  # Utilities
│   ├── auth-helper.ts       # Login/logout helpers
│   └── api-helper.ts        # API testing utilities
├── .github/workflows/        # CI/CD automation
│   └── e2e-tests.yml        # GitHub Actions workflow
├── playwright.config.ts      # Test configuration
├── README.md                 # Full documentation
├── SETUP.md                  # Detailed setup guide
└── .env.example              # Environment template
```

## Common Commands

```bash
# Run single test file
npx playwright test tests/auth.spec.ts

# Run tests matching pattern
npx playwright test --grep "login"

# Show HTML report
npm run report

# Generate test code (record actions)
npm run codegen https://your-app.com

# Run tests in parallel (faster)
npx playwright test --workers=4

# Run only failed tests
npx playwright test --last-failed
```

## Debugging Tips

### View trace for failed test
```bash
npx playwright show-trace test-results/*/trace.zip
```

### Generate traces for all tests
```bash
npx playwright test --trace on
```

### Debug specific test
```bash
npx playwright test tests/auth.spec.ts --debug
```

## Need Help?

- 📖 [Full README](./README.md)
- 🛠️ [Setup Guide](./SETUP.md)
- 📚 [Playwright Docs](https://playwright.dev)
- 🐛 [GitHub Issues](https://github.com/victorseer01/bakr-e2e-tests/issues)

## Quick Test

```bash
# Verify setup works
npx playwright test tests/auth.spec.ts --headed --project=chromium
```

If login test passes, you're all set! 🎉
