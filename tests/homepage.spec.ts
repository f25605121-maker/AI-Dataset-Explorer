import { test, expect } from '@playwright/test';

test('AI Dataset Explorer homepage loads', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/AI Dataset Explorer/i);
});