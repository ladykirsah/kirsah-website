import { defineConfig } from '@playwright/test';

// The site is plain files in public/, so the tests serve that folder and use the
// installed Google Chrome (present on Macs and on GitHub's Ubuntu runners).
const PORT = 4173;

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: `http://127.0.0.1:${PORT}`, channel: 'chrome' },
  webServer: {
    command: `python3 -m http.server ${PORT} --bind 127.0.0.1 --directory public`,
    url: `http://127.0.0.1:${PORT}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
