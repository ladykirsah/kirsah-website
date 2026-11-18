import { test, expect } from '@playwright/test';

const RESUME_URL = 'https://drive.google.com/file/d/1ulZomG9QY1oNPI25NE-MFR4rrFEOVwm0/view';
const TITLE = 'Kirsah Tiathawornchai · Tech / AI Project Manager';

function collectErrors(page) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  return errors;
}

async function widestScroll(page) {
  return page.evaluate(async () => {
    let widest = 0;
    for (let y = 0; y <= document.documentElement.scrollHeight; y += 500) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 40));
      widest = Math.max(widest, document.documentElement.scrollWidth);
    }
    return widest;
  });
}

test.describe('home page', () => {
  test('on load > shows the headline with no errors', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('/');
    await expect(page.locator('h1.h-hero')).toContainText(/ideas that\s*go live/i);
    await page.waitForLoadState('networkidle');
    expect(errors).toEqual([]);
  });

  test('every picture > is served as an image file', async ({ page, request }) => {
    await page.goto('/');
    const sources = await page.evaluate(() => [...new Set([...document.images].map((i) => i.src))]);
    expect(sources.length).toBeGreaterThan(0);
    for (const src of sources) {
      const res = await request.get(src);
      expect(res.ok(), src).toBe(true);
      expect(res.headers()['content-type'], src).toMatch(/^image\//);
    }
  });

  test('tab title > is her name and role', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(TITLE);
  });

  test('hero > has no sample video or sample still', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('video')).toHaveCount(0);
    const html = await page.content();
    expect(html).not.toMatch(/hero\.mp4|plate\.webp|data:video/);
  });

  test('footer > has no draft label and credits the stand-in photos', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('.foot');
    await expect(footer).not.toContainText(/draft/i);
    await expect(footer).toContainText('Elena Rossini');
    await expect(footer).toContainText('CC BY-SA 4.0');
  });

  test('resume buttons > open the resume on Google Drive', async ({ page }) => {
    await page.goto('/');
    const links = page.locator('[data-resume]');
    expect(await links.count()).toBeGreaterThanOrEqual(2);
    for (const href of await links.evaluateAll((els) => els.map((a) => a.href))) {
      expect(href).toBe(RESUME_URL);
    }
  });

  for (const size of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
    test(`at ${size.width}px wide > never scrolls sideways`, async ({ page }) => {
      await page.setViewportSize(size);
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      expect(await widestScroll(page)).toBeLessThanOrEqual(size.width);
    });
  }
});
