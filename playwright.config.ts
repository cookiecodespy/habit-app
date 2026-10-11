import { defineConfig } from '@playwright/test';

// End-to-end tests run against the built site served by `wrangler dev`, i.e. with the same
// response headers (CSP, caching) Cloudflare applies in production.
//   TEST_URL=https://…  run against a deployed site instead
//   CHROME_PATH=/usr/bin/chromium  use a system browser instead of Playwright's download
const PORT = 8788;
const baseURL = process.env.TEST_URL || `http://127.0.0.1:${PORT}`;
const chromium = process.env.CHROME_PATH ? { launchOptions: { executablePath: process.env.CHROME_PATH } } : {};
const phone = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true };

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  timeout: 45_000,
  use: {
    baseURL,
    locale: 'es-CL',
    timezoneId: 'America/Santiago',
    serviceWorkers: 'allow',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'movil', use: { browserName: 'chromium', ...chromium, ...phone } },
    { name: 'escritorio', use: { browserName: 'chromium', ...chromium, viewport: { width: 1440, height: 900 } } },
    // Safari's engine. Needs `npx playwright install webkit`; CI always runs it.
    ...(process.env.CI || process.env.PW_WEBKIT ? [{ name: 'iphone', use: { browserName: 'webkit' as const, ...phone } }] : []),
  ],
  webServer: process.env.TEST_URL ? undefined : {
    command: `npx wrangler dev --port ${PORT} --ip 127.0.0.1`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
