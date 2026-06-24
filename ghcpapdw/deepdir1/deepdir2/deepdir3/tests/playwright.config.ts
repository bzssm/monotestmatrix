import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Zava Bank integration tests.
 *
 * All traffic routes through nginx on port 80 (localhost).
 * Docker services may be slow to respond — timeouts are set generously.
 *
 * Run with:  cd tests && npm test
 * Headed:    cd tests && npm run test:headed
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 60000,
  retries: 1,
  reporter: [['html', { open: 'never', outputFolder: 'playwright-report' }], ['list']],

  use: {
    baseURL: 'http://localhost',
    screenshot: 'only-on-failure',
    video: 'off',
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
