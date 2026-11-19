import { test, expect } from '@playwright/test';

// Runs only with LIVE_URL set (after each deploy and once a day): checks the real kirsah.com.

test.describe('live kirsah.com', () => {
  test('home page > loads with the right title and no errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const res = await page.goto('/');
    expect(res?.status()).toBe(200);
    await expect(page).toHaveTitle('Kirsah Tiathawornchai · Tech / AI Project Manager');
    expect(errors).toEqual([]);
  });

  test('resume buttons > open a Drive file anyone can see', async ({ page, request }) => {
    await page.goto('/');
    const links = [...new Set(await page.locator('[data-resume]').evaluateAll((els) => els.map((a) => a.href)))];
    expect(links).toHaveLength(1);
    expect(links[0]).toMatch(/^https:\/\/drive\.google\.com\/file\/d\/[\w-]+\/view$/);
    // A private or deleted file answers 401/404 instead of 200.
    const res = await request.get(links[0], { maxRedirects: 0 });
    expect(res.status()).toBe(200);
  });

  test('share image, icons and AI files > are online', async ({ request }) => {
    for (const path of ['/og.png', '/favicon.ico', '/apple-touch-icon.png', '/site.webmanifest', '/llms.txt', '/sitemap.xml']) {
      const res = await request.get(path);
      expect(res.status(), path).toBe(200);
    }
    const robots = await (await request.get('/robots.txt')).text();
    expect(robots).toContain('Sitemap: https://kirsah.com/sitemap.xml');
  });

  test('www address > leads to the same site', async ({ request }) => {
    const res = await request.get('https://www.kirsah.com/');
    expect(res.status()).toBe(200);
    expect(await res.text()).toContain('<title>Kirsah Tiathawornchai · Tech / AI Project Manager</title>');
  });
});
