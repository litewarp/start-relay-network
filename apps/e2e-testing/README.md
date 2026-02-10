# E2E Testing

End-to-end testing with Playwright.

## Setup

```bash
# Install Playwright browsers
cd apps/e2e-testing
bunx playwright install
```

## Running Tests

```bash
# Run all tests
moon run e2e-testing:test

# Run tests in UI mode
moon run e2e-testing:test-ui

# Run tests in headed mode (visible browser)
moon run e2e-testing:test-headed

# View test report
moon run e2e-testing:report
```

## Writing Tests

Tests are in `tests/` directory. See `tests/example.spec.ts` for examples.

```typescript
import { test, expect } from '@playwright/test';

test('my test', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('Welcome');
});
```
