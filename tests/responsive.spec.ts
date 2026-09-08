import { test, expect } from '@playwright/test';

test.describe('Responsive Design', () => {
  test('homepage on mobile', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 812 });
    
    await page.goto('/');
    
    // The heading should still be visible
    const heading = page.getByRole('heading', { level: 1, name: /Find the perfect dataset/i });
    await expect(heading).toBeVisible();

    // Check that there is no horizontal overflow by evaluating scrollWidth vs innerWidth
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(hasHorizontalOverflow).toBeFalsy();
  });

  test('homepage on tablet', async ({ page }) => {
    // Set viewport to tablet size
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await page.goto('/');
    
    const heading = page.getByRole('heading', { level: 1, name: /Find the perfect dataset/i });
    await expect(heading).toBeVisible();

    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(hasHorizontalOverflow).toBeFalsy();
  });
});
