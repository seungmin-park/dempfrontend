import { defineConfig } from '@playwright/test';

const port = process.env.DEMP_E2E_PORT ?? '5050';
if (!/^\d+$/.test(port) || Number(port) < 1 || Number(port) > 65535) throw new Error('Invalid DEMP_E2E_PORT');
const baseURL = `http://127.0.0.1:${Number(port)}`;
const devPort = process.env.DEMP_DEV_E2E_PORT ?? '5051';
if (!/^\d+$/.test(devPort) || Number(devPort) < 1 || Number(devPort) > 65535 || Number(devPort) === Number(port)) throw new Error('Invalid DEMP_DEV_E2E_PORT');
const devURL = `http://127.0.0.1:${Number(devPort)}`;
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: 0,
  projects: [
    { name: 'production', use: { baseURL } },
    { name: 'development', use: { baseURL: devURL } },
  ],
  reporter: [['list'], ['json', { outputFile: '.verification/e2e.json' }], ['html', { open: 'never' }]],
  use: {
    baseURL,
    browserName: 'chromium',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: [{
    command: `npm run preview -- --host 127.0.0.1 --port ${Number(port)} --strictPort`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120000,
  }, {
    command: `npm run dev -- --host 127.0.0.1 --port ${Number(devPort)} --strictPort`,
    url: devURL,
    reuseExistingServer: false,
    timeout: 120000,
  }],
});
