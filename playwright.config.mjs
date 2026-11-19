import { defineConfig } from '@playwright/test';

// Two ways to run the checks:
// - default: serve the files in public/ locally and check them (every pull request).
// - LIVE_URL=https://kirsah.com: check the real site after a deploy and once a day.
// Both use the installed Google Chrome (present on Macs and on GitHub's Ubuntu runners).
const PORT = 4173;
const LIVE_URL = process.env.LIVE_URL;

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  forbidOnly: !!process.env.CI,
  retries: LIVE_URL ? 2 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL: LIVE_URL || `http://127.0.0.1:${PORT}`, channel: 'chrome' },
  projects: LIVE_URL
    ? [{ name: 'live', testMatch: /live\.spec\.mjs/ }]
    : [{ name: 'site', testIgnore: /live\.spec\.mjs/ }],
  webServer: LIVE_URL
    ? undefined
    : {
        command: `python3 -m http.server ${PORT} --bind 127.0.0.1 --directory public`,
        url: `http://127.0.0.1:${PORT}/`,
        reuseExistingServer: !process.env.CI,
        timeout: 30_000,
      },
});
