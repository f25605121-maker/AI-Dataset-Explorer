import { test, expect } from '@playwright/test';

test.describe('Error Handling', () => {
  const testEmail = 'testuser@example.com';
  const testPassword = 'TestPassword123!';

  test.beforeEach(async ({ page }) => {
    // Login before each test so we bypass middleware redirects
    await page.goto('/login');
    
    await expect(page.getByRole('button', { name: 'Sign In →' })).toBeEnabled();
    await page.waitForTimeout(1000); 
    
    await page.getByLabel(/Email Address/i).fill(testEmail);
    await page.getByLabel(/Password/i).fill(testPassword);
    
    await Promise.all([
      page.waitForNavigation({ url: /.*\/explore.*/, timeout: 15000 }),
      page.getByRole('button', { name: 'Sign In →' }).click()
    ]);
  });

  test('invalid route shows 404', async ({ page }) => {
    await page.goto('/this-route-does-not-exist');
    
    // With Next.js app router 404 page, we look for standard 'This page could not be found'
    // or we check if there is a 404 text
    await expect(page.locator('text=/404|This page could not be found/i').first()).toBeVisible({ timeout: 5000 });
  });
});
