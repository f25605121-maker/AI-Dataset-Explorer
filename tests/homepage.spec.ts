import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('loads successfully and displays correct title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/AI Dataset Explorer/i);
  });

  test('main heading is visible', async ({ page }) => {
    await page.goto('/');
    const heading = page.getByRole('heading', { level: 1, name: /Find the perfect dataset/i });
    await expect(heading).toBeVisible();
  });

  test('important sections are visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: /Start Exploring Studio/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Benchmark Lab/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Pipeline Roadmap/i })).toBeVisible();
  });

  test('action buttons work', async ({ page }) => {
    await page.goto('/');
    
    // Check explore button
    const exploreBtn = page.getByRole('link', { name: /Start Exploring Studio/i });
    await expect(exploreBtn).toHaveAttribute('href', '/explore');

    // Check benchmark button
    const benchmarkBtn = page.getByRole('link', { name: /Benchmark Lab/i });
    await expect(benchmarkBtn).toHaveAttribute('href', '/benchmark');
  });

  test('popular project searches are visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Quick explore popular project searches:')).toBeVisible();
  });
});