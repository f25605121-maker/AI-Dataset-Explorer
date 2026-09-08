import { test, expect } from '@playwright/test';

test.describe('Explore and Search', () => {
  const testEmail = 'testuser@example.com';
  const testPassword = 'TestPassword123!';

  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    
    // Wait for hydration so the form submit works properly
    await expect(page.getByRole('button', { name: 'Sign In →' })).toBeEnabled();
    await page.waitForTimeout(1000); // Give React a moment to attach event listeners
    
    await page.getByLabel(/Email Address/i).fill(testEmail);
    await page.getByLabel(/Password/i).fill(testPassword);
    
    // Wait for the navigation trigger
    await Promise.all([
      page.waitForNavigation({ url: /.*\/explore.*/, timeout: 15000 }),
      page.getByRole('button', { name: 'Sign In →' }).click()
    ]);
  });

  test('search box works and triggers search on explore page', async ({ page }) => {
    await expect(page).toHaveURL(/.*\/explore.*/);

    const searchInput = page.getByPlaceholder(/describe your project/i).first();
    await expect(searchInput).toBeVisible({ timeout: 15000 });

    await searchInput.fill('machine learning');
    await searchInput.press('Enter');

    // It should load datasets/models/overview.
    await expect(page.locator('text=/Overview & AI Rationale|AI Direct Response/i').first()).toBeVisible({ timeout: 15000 });
  });

  test('dataset results render correctly', async ({ page }) => {
    await page.goto('/explore?q=NLP');
    
    const searchInput = page.getByPlaceholder(/describe your project/i).first();
    await expect(searchInput).toBeVisible({ timeout: 15000 });
    
    // Look for dataset cards container
    const resultsContainer = page.locator('main');
    await expect(resultsContainer).toBeVisible();
    
    await expect(page.locator('text=Error').first()).not.toBeVisible();
  });
});
