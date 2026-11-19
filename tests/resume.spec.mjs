import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

// The resume page at /resume/: L's resume as a web page, plus the one-page PDF to download.
const PDF = '/Kirsah_Tiathawornchai_AI_Project_Manager.pdf';
const PHONE = /63\s?926|0639261445|\+66/;

test.describe('resume page', () => {
  test('on load > shows my name, title and every section, with no errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto('/resume/');
    await expect(page).toHaveTitle('Resume · Kirsah Tiathawornchai · AI Project Manager');
    await expect(page.locator('h1')).toHaveText(/Kirsah\s+Tiathawornchai/);
    await expect(page.locator('.role')).toHaveText('AI Project Manager | AI Automation & Business Process Analyst');
    await expect(page.locator('h2')).toHaveText(['Work experience', 'Skills', 'Education', 'Awards and training']);
    await expect(page.locator('.org')).toHaveText(['Den Air Service', 'Formula L', 'GoGoCash.co', 'Burapha University']);
    await page.waitForLoadState('networkidle');
    expect(errors).toEqual([]);
  });

  test('privacy > never shows my phone number', async ({ request }) => {
    const html = await (await request.get('/resume/')).text();
    expect(html).not.toMatch(PHONE);
  });

  test('download buttons > get the one-page PDF from this site', async ({ page, request }) => {
    await page.goto('/resume/');
    const hrefs = await page.locator('a', { hasText: 'Download PDF' }).evaluateAll((els) => els.map((a) => a.getAttribute('href')));
    expect(hrefs).toEqual([PDF, PDF]);
    const res = await request.get(PDF);
    expect(res.ok()).toBe(true);
    expect(res.headers()['content-type']).toBe('application/pdf');
    expect((await res.body()).subarray(0, 5).toString('latin1')).toBe('%PDF-');
  });

  test('PDF > is kept out of search results, because it has my phone number', async () => {
    const rules = readFileSync(new URL('../public/_headers', import.meta.url), 'utf8');
    expect(rules).toMatch(new RegExp(`^${PDF.replace(/\./g, '\\.')}\\n\\s+X-Robots-Tag: noindex$`, 'm'));
  });

  test('nav > Resume is marked as this page and the logo goes home', async ({ page }) => {
    await page.goto('/resume/');
    await expect(page.locator('.nav-link[aria-current="page"]')).toHaveText('Resume');
    expect(await page.locator('.logo').getAttribute('href')).toBe('/');
  });

  for (const size of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
    test(`at ${size.width}px wide > never scrolls sideways`, async ({ page }) => {
      await page.setViewportSize(size);
      await page.goto('/resume/');
      await page.waitForLoadState('networkidle');
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(size.width);
    });
  }
});
