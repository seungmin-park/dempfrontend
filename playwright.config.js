import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: 'http://127.0.0.1:5050',
    browserName: 'chromium',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run serve -- --host 127.0.0.1',
    url: 'http://127.0.0.1:5050',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
