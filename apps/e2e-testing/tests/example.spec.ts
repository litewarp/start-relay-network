import { test, expect } from '@playwright/test';

test('homepage loads', async ({ page }) => {
  await page.goto('/');

  // Check if the page title contains expected text
  await expect(page).toHaveTitle(/TanStack/i);
});

test('navigation works', async ({ page }) => {
  await page.goto('/');

  // Basic smoke test
  const body = page.locator('body');
  await expect(body).toBeVisible();
});
