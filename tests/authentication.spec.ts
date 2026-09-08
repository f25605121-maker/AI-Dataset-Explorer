import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  const testEmail = 'testuser@example.com';
  const testPassword = 'TestPassword123!';

  test('signup page loads and validates fields', async ({ page }) => {
    await page.goto('/signup');
    await expect(page).toHaveTitle(/AI Dataset Explorer/i);

    const nameInput = page.getByLabel(/Full Name/i);
    const emailInput = page.getByLabel(/Email Address/i);
    const passwordInput = page.getByLabel(/Password/i);
    const submitBtn = page.getByRole('button', { name: 'Create Free Account →' });

    await expect(nameInput).toBeVisible();
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitBtn).toBeVisible();

    await submitBtn.click();
    await expect(page).toHaveURL(/.*\/signup.*/);
  });

  test('login works with existing user', async ({ page }) => {
    await page.goto('/login');
    
    // Wait for hydration so the form submit works properly
    await expect(page.getByRole('button', { name: 'Sign In →' })).toBeEnabled();
    await page.waitForTimeout(1000); 

    await expect(page).toHaveTitle(/AI Dataset Explorer/i);

    await page.getByLabel(/Email Address/i).fill(testEmail);
    await page.getByLabel(/Password/i).fill(testPassword);
    
    // NextAuth will change window.location
    await Promise.all([
      page.waitForNavigation({ url: /.*\/explore.*/, timeout: 15000 }),
      page.getByRole('button', { name: 'Sign In →' }).click()
    ]);
  });

  test('invalid credentials show error', async ({ page }) => {
    await page.goto('/login');
    
    // Wait for hydration
    await expect(page.getByRole('button', { name: 'Sign In →' })).toBeEnabled();
    await page.waitForTimeout(1000); 
    
    await page.getByLabel(/Email Address/i).fill('wrong@example.com');
    await page.getByLabel(/Password/i).fill('WrongPassword123!');
    
    await page.getByRole('button', { name: 'Sign In →' }).click();

    // With NextAuth redirect: false, it stays on the page
    // With redirect: true, it redirects back to login with an error param
    await expect(page.locator('text=/Invalid email or password/i').first()).toBeVisible({ timeout: 10000 });
  });
});
