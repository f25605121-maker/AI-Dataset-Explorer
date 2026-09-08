import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('navigation to explore page redirects to login if unauthenticated', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /Start Exploring Studio/i }).click();
    await expect(page).toHaveURL(/.*\/login.*/);
  });

  test('navigation to benchmark page redirects to login if unauthenticated', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /Benchmark Lab/i }).click();
    await expect(page).toHaveURL(/.*\/login.*/);
  });

  test('navigation to roadmap page redirects to login if unauthenticated', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /Pipeline Roadmap/i }).click();
    await expect(page).toHaveURL(/.*\/login.*/);
  });
});
