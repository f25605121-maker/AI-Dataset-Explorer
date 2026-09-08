import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for AI Dataset Explorer
 */
export default defineConfig({
  testDir: './tests',

  // Run tests in parallel
  fullyParallel: true,

  // Fail CI if test.only is accidentally left in the code
  forbidOnly: !!process.env.CI,

  // Retry failed tests on CI
  retries: process.env.CI ? 2 : 0,

  // Use one worker on CI
  workers: process.env.CI ? 1 : undefined,

  // Generate HTML test report
  reporter: 'html',

  // Shared settings
  use: {
    // Frontend URL
    baseURL: 'http://localhost:3000',

    // Take screenshot only when a test fails
    screenshot: 'only-on-failure',

    // No video recording — avoids requiring FFmpeg
    video: 'off',

    // Collect trace when retrying
    trace: 'on-first-retry',
  },

  // Use Google Chrome already installed on the computer
  projects: [
    {
      name: 'chrome',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
      },
    },
  ],

  // Start the frontend automatically
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
  },
});