import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

// The resume page at /resume/: L's resume as a web page, plus the one-page PDF to download.
const PDF = '/Kirsah_Tiathawornchai_AI_Project_Manager.pdf';

test.describe('resume page', () => {
  test('on load > shows my name, title and every section, with no errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto('/resume/');
    await expect(page).toHaveTitle('Resume · Kirsah Tiathawornchai · AI Project Manager');
    await expect(page.locator('h1')).toHaveText(/Kirsah\s+Tiathawornchai/);
    await expect(page.locator('.role')).toHaveText('AI Project Manager | AI Automation & Business Process Analyst');
    // section headings only: the quick-look panel has its own heading
    await expect(page.locator('h2.sec-h')).toHaveText(['Work experience', 'Skills', 'Education', 'Awards and training']);
    await expect(page.locator('.org')).toHaveText(['Den Air Service', 'Formula L', 'GoGoCash.co', 'Burapha University']);
    await page.waitForLoadState('networkidle');
    expect(errors).toEqual([]);
  });

  test('contact > shows my phone (tap to call) and both towns with the hybrid note', async ({ page }) => {
    await page.goto('/resume/');
    await expect(page.locator('#phone')).toHaveText('+66 63 926 1445');
    expect(await page.locator('#phone').getAttribute('href')).toBe('tel:+66639261445');
    await expect(page.locator('.meta')).toContainText('Prasat, Surin 32140 and Makkasan, Ratchathewi, Bangkok 10400 · willing to work hybrid between Surin and Bangkok');
  });

  test('real page > carries no notes left over from the drawing', async ({ request }) => {
    const html = await (await request.get('/resume/')).text();
    expect(html).not.toMatch(/Drawing only|in this drawing/i);
  });

  test('privacy > shows no street address or room number', async ({ request }) => {
    const html = await (await request.get('/resume/')).text();
    expect(html).not.toMatch(/339\/281|Life Asoke|Chaturathit|Kung-ann|Chongchom|\b88,/i);
  });

  test('copy buttons > are plain icons, and copy the phone and the email', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/resume/');
    const buttons = page.locator('.copy');
    await expect(buttons).toHaveCount(2);
    for (const [i, value, label] of [[0, '+66 63 926 1445', 'Copy phone number'], [1, 'lady.kirsah@gmail.com', 'Copy email address']]) {
      const btn = buttons.nth(i);
      expect((await btn.textContent()).trim()).toBe('');
      expect(await btn.getAttribute('aria-label')).toBe(label);
      await btn.click();
      await expect(btn).toHaveClass(/done/);
      expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(value);
    }
  });

  test('quick look > every work name opens a panel, and Next goes through all 7 without leaving the page', async ({ page }) => {
    await page.goto('/resume/');
    const names = page.locator('[data-peek]');
    await expect(names).toHaveCount(7);
    await names.first().click();
    const panel = page.locator('#peek');
    await expect(panel).toBeVisible();
    const titles = [];
    for (let i = 0; i < 7; i++) {
      titles.push((await page.locator('#peek-title').textContent()).trim());
      await page.locator('#peek-next').click();
    }
    expect(titles).toEqual(['Den Air Service', 'Formula L', 'TeamPit', 'AirPlus web store', 'AI agents and workflow automation', 'AirPlus Auto', 'GoGoCash.co']);
    expect(page.url()).toMatch(/\/resume\/$/);
    await page.keyboard.press('Escape');
    await expect(panel).toBeHidden();
  });

  test('quick look > Visit buttons open the real sites in a new tab; private work says why there is none', async ({ page }) => {
    await page.goto('/resume/');
    const expected = {
      denair: 'https://www.facebook.com/profile.php?id=100063697504009',
      formulal: 'https://formulal.cc/',
      teampit: null,
      airplus: 'https://airplusauto.com/',
      agents: null,
      shopee: 'https://shopee.co.th/air.plus.auto',
      ggc: 'https://about.gogocash.co/th',
    };
    for (const [key, href] of Object.entries(expected)) {
      await page.locator(`[data-peek="${key}"]`).click();
      const visit = page.locator('#peek-go a');
      if (href) {
        expect(await visit.getAttribute('href')).toBe(href);
        expect(await visit.getAttribute('target')).toBe('_blank');
      } else {
        await expect(visit).toHaveCount(0);
        await expect(page.locator('#peek-go .peek-private')).not.toBeEmpty();
      }
      await page.locator('#peek-x').click();
    }
  });

  test('quick look > every picture loads', async ({ page }) => {
    await page.goto('/resume/');
    for (const key of ['denair', 'formulal', 'teampit', 'airplus', 'shopee', 'ggc']) {
      await page.locator(`[data-peek="${key}"]`).click();
      await expect.poll(() => page.locator('#peek-img').evaluate((img) => img.complete && img.naturalWidth > 0)).toBe(true);
      await page.locator('#peek-x').click();
    }
  });

  test('quick look > on a phone, the panel slides up from the bottom and fits the screen', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/resume/');
    await page.locator('[data-peek="airplus"]').click();
    await page.waitForTimeout(700);
    const box = await page.locator('#peek').boundingBox();
    expect(Math.round(box.x)).toBe(0);
    expect(Math.round(box.width)).toBe(390);
    expect(Math.abs(box.y + box.height - 844)).toBeLessThanOrEqual(1);
    expect(box.y).toBeGreaterThan(0);
  });

  test('download buttons > get the one-page PDF from this site', async ({ page, request }) => {
    await page.goto('/resume/');
    const hrefs = await page.locator('a', { hasText: 'Download PDF' }).evaluateAll((els) => els.map((a) => a.getAttribute('href')));
    // top bar, under my name and at the end of the page
    expect(hrefs).toEqual([PDF, PDF, PDF]);
    const res = await request.get(PDF);
    expect(res.ok()).toBe(true);
    expect(res.headers()['content-type']).toBe('application/pdf');
    expect((await res.body()).subarray(0, 5).toString('latin1')).toBe('%PDF-');
  });

  test('PDF > downloads as a file in every browser, instead of opening in a tab', async () => {
    const rules = readFileSync(new URL('../public/_headers', import.meta.url), 'utf8');
    expect(rules).toContain('  Content-Disposition: attachment; filename="Kirsah_Tiathawornchai_AI_Project_Manager.pdf"');
  });

  test('PDF > is kept out of search results, because it has my phone number', async () => {
    const rules = readFileSync(new URL('../public/_headers', import.meta.url), 'utf8');
    expect(rules).toMatch(new RegExp(`^${PDF.replace(/\./g, '\\.')}\\n\\s+X-Robots-Tag: noindex$`, 'm'));
  });

  test('top bar > the round back button and the logo both go home', async ({ page }) => {
    await page.goto('/resume/');
    expect(await page.locator('.bar').getByRole('link', { name: 'Back to home' }).getAttribute('href')).toBe('/');
    expect(await page.locator('.logo').getAttribute('href')).toBe('/');
  });

  // The resume page moved to the Folder room look with the home page (her drawing, 25 Nov 2026).
  test('look > Folder room: warm grey page, Inter Tight name, work as folder cards with their pictures', async ({ page }) => {
    await page.goto('/resume/');
    await page.waitForLoadState('networkidle');
    expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe('rgb(238, 236, 232)');
    expect(await page.locator('h1').evaluate((h) => getComputedStyle(h).fontFamily)).toMatch(/^"Inter Tight"/);
    // pictures on the page itself (the quick-look picture is filled in when a folder opens)
    for (const img of await page.locator('main img:not(#peek-img)').all()) {
      expect(await img.evaluate((i) => i.complete && i.naturalWidth > 0), await img.getAttribute('src')).toBe(true);
    }
  });

  for (const size of [{ width: 390, height: 844 }, { width: 390, height: 667 }, { width: 700, height: 500 }, { width: 768, height: 1024 }, { width: 1280, height: 720 }, { width: 1440, height: 900 }]) {
    test(`at ${size.width}x${size.height} > never scrolls sideways`, async ({ page }) => {
      await page.setViewportSize(size);
      await page.goto('/resume/');
      await page.waitForLoadState('networkidle');
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(size.width);
    });
  }
});
