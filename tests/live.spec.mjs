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

  test('resume buttons > open the resume page, and its PDF stays out of search results', async ({ page, request, baseURL }) => {
    await page.goto('/');
    const links = [...new Set(await page.locator('[data-resume]').evaluateAll((els) => els.map((a) => a.href)))];
    expect(links).toEqual([new URL('/resume/', baseURL).href]);
    const resume = await request.get('/resume/');
    expect(resume.status()).toBe(200);
    // Her choice (20 Nov 2026): the resume page shows her phone, but never a street address.
    expect(await resume.text()).toContain('tel:+66639261445');
    expect(await resume.text()).not.toMatch(/339\/281|Life Asoke|Kung-ann/i);
    // The PDF has her phone number: it must answer, but tell search engines not to list it.
    const pdf = await request.get('/Kirsah_Tiathawornchai_AI_Project_Manager.pdf');
    expect(pdf.status()).toBe(200);
    expect(pdf.headers()['content-type']).toBe('application/pdf');
    expect(pdf.headers()['x-robots-tag']).toBe('noindex');
    expect(pdf.headers()['content-disposition']).toMatch(/^attachment/);
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
