import { test, expect } from '@playwright/test';

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

  test('footer > has no draft label and says the photos are my own', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('.foot');
    await expect(footer).not.toContainText(/draft|stand-in/i);
    await expect(footer).toContainText('Photos: my own');
  });

  test('top of page > every picture is my own', async ({ page }) => {
    await page.goto('/');
    const srcs = await page.locator('.hero-card img').evaluateAll((els) => els.map((i) => i.getAttribute('src')));
    expect(srcs).toHaveLength(8);
    for (const src of srcs) expect(src).toMatch(/^\/img\/hero-[a-z]+\.webp$/);
  });

  for (const s of [{ width: 390, height: 844, touch: true }, { width: 572, height: 664 }, { width: 768, height: 1024, touch: true }, { width: 1024, height: 768, touch: true }]) {
    test(`top of page > at ${s.width}x${s.height}${s.touch ? ' touch' : ''}, the picture shows above the text without covering it`, async ({ browser }) => {
      const ctx = await browser.newContext({ viewport: { width: s.width, height: s.height }, hasTouch: !!s.touch, isMobile: !!s.touch && s.width < 900 });
      const page = await ctx.newPage();
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2500);
      const r = await page.evaluate(() => {
        const card = document.querySelector('.hero-card'), role = document.querySelector('.hero-role');
        const c = card.getBoundingClientRect(), t = role.getBoundingClientRect();
        return { visible: getComputedStyle(card).visibility === 'visible' && +getComputedStyle(card).opacity > 0, cardBottom: c.bottom, cardTop: c.top, textTop: t.top };
      });
      expect(r.visible).toBe(true);
      expect(r.cardTop).toBeGreaterThanOrEqual(0);
      expect(r.cardBottom).toBeLessThanOrEqual(r.textTop);
      await ctx.close();
    });
  }

  test('window made narrow > the top picture still shows above the text', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.mouse.move(300, 300);
    await page.mouse.move(900, 500, { steps: 20 });
    await page.waitForTimeout(1500);
    await page.setViewportSize({ width: 572, height: 800 });
    await page.waitForTimeout(1200);
    const r = await page.evaluate(() => {
      const card = document.querySelector('.hero-card'), c = card.getBoundingClientRect(), t = document.querySelector('.hero-role').getBoundingClientRect();
      return { visible: getComputedStyle(card).visibility === 'visible' && +getComputedStyle(card).opacity > 0, left: c.left, right: c.right, bottom: c.bottom, textTop: t.top };
    });
    expect(r.visible).toBe(true);
    expect(r.left).toBeGreaterThanOrEqual(0);
    expect(r.right).toBeLessThanOrEqual(572);
    expect(r.bottom).toBeLessThanOrEqual(r.textTop);
  });

  test('window made narrow > work cards line up inside the screen', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2500);
    await page.setViewportSize({ width: 572, height: 664 });
    await page.waitForTimeout(1200);
    const boxes = await page.evaluate(() => [...document.querySelectorAll('#stack .slide')].map((s) => { const b = s.getBoundingClientRect(); return [b.left, b.right]; }));
    for (const [left, right] of boxes) {
      expect(left).toBeGreaterThanOrEqual(0);
      expect(right).toBeLessThanOrEqual(572);
    }
  });

  test('window made narrow > text re-wraps instead of keeping the old line breaks', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => { const w = document.querySelector('.wall'); window.scrollTo(0, w.getBoundingClientRect().top + window.scrollY + 200); });
    await page.waitForTimeout(2500);
    await page.setViewportSize({ width: 572, height: 664 });
    await page.waitForTimeout(800);
    const leftover = await page.evaluate(() => document.querySelectorAll('.wall .para .line, .work-copy .eyebrow-s .line, .hero-role .line').length);
    expect(leftover).toBe(0);
  });

  for (const size of [{ width: 1440, height: 900 }, { width: 1280, height: 720 }, { width: 1024, height: 768 }]) {
    test(`proof wall > at ${size.width}x${size.height}, photos never cover the title`, async ({ page }) => {
      await page.setViewportSize(size);
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      for (let step = 1; step <= 9; step++) {
        await page.evaluate((f) => {
          const w = document.querySelector('.wall');
          window.scrollTo(0, w.getBoundingClientRect().top + window.scrollY + (w.offsetHeight - innerHeight) * f);
        }, step / 10);
        await page.waitForTimeout(300);
        const hits = await page.evaluate(() => {
          const t = [...document.querySelectorAll('.wall-title > *')].map((e) => e.getBoundingClientRect());
          const title = { l: Math.min(...t.map((r) => r.left)), r: Math.max(...t.map((r) => r.right)), t: Math.min(...t.map((r) => r.top)), b: Math.max(...t.map((r) => r.bottom)) };
          return [...document.querySelectorAll('.wall .ph-photo, .wall .sticker')].filter((p) => {
            const b = p.getBoundingClientRect();
            return b.left < title.r && b.right > title.l && b.top < title.b && b.bottom > title.t;
          }).length;
        });
        expect(hits, `at ${step * 10}%`).toBe(0);
      }
    });
  }

  test('proof wall > on a phone, photos stay inside the screen', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const boxes = await page.evaluate(() => [...document.querySelectorAll('.wall .ph-inner')].map((p) => { const b = p.getBoundingClientRect(); return [b.left, b.right]; }));
    for (const [left, right] of boxes) {
      expect(left).toBeGreaterThanOrEqual(0);
      expect(right).toBeLessThanOrEqual(390);
    }
  });

  test('text size > grows smoothly with the window, no jump between phone and tablet', async ({ page }) => {
    const root = async (w) => { await page.setViewportSize({ width: w, height: 900 }); return page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize)); };
    await page.goto('/');
    const phone = await root(600), tablet = await root(601), small = await root(572);
    expect(phone / tablet).toBeLessThanOrEqual(1.35);
    expect(small).toBeLessThanOrEqual(18);
  });

  test("let's talk > in a short narrow window, everything shows below the menu at the end of the page", async ({ page }) => {
    await page.setViewportSize({ width: 572, height: 664 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(800);
    const r = await page.evaluate(() => ({ inner: document.querySelector('.contact-inner').getBoundingClientRect().toJSON(), nav: document.querySelector('.logo').getBoundingClientRect().bottom, h: innerHeight }));
    expect(r.inner.top).toBeGreaterThanOrEqual(r.nav - 4);
    expect(r.inner.bottom).toBeLessThanOrEqual(r.h);
  });

  test('resume buttons > open the resume page on this site, same tab', async ({ page, baseURL }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const links = page.locator('[data-resume]');
    expect(await links.count()).toBeGreaterThanOrEqual(2);
    for (const { href, target } of await links.evaluateAll((els) => els.map((a) => ({ href: a.href, target: a.target })))) {
      expect(href).toBe(new URL('/resume/', baseURL).href);
      expect(target).toBe('');
    }
  });

  test('work cards > show my own six pictures, Den Air included', async ({ page }) => {
    await page.goto('/');
    const slides = page.locator('#stack .slide');
    await expect(slides).toHaveCount(6);
    for (const src of await slides.locator('img').evaluateAll((els) => els.map((i) => i.getAttribute('src')))) {
      expect(src).toMatch(/^\/img\/work-[a-z]+\.webp$/);
    }
    await expect(slides.locator('.ttl')).toContainText(['TeamPit', 'AirPlus store', '26× on Shopee', 'GoGoCash', '45.9K views', 'Den Air Service']);
  });

  test('work cards > picture fills the card edge to edge, no frame around it', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const box = await page.evaluate(() => {
      const slide = document.querySelector('#stack .slide');
      const s = slide.getBoundingClientRect(), c = slide.querySelector('.crop').getBoundingClientRect();
      return { left: c.left - s.left, right: s.right - c.right, top: c.top - s.top };
    });
    expect(Math.abs(box.left)).toBeLessThanOrEqual(1);
    expect(Math.abs(box.right)).toBeLessThanOrEqual(1);
    expect(Math.abs(box.top)).toBeLessThanOrEqual(1);
  });

  test('photos > show their real colours, no fade filter', async ({ page }) => {
    await page.goto('/');
    const filters = await page.evaluate(() => [...document.querySelectorAll('.slide img, .ph img')].map((i) => getComputedStyle(i).filter));
    expect(filters.length).toBeGreaterThan(0);
    expect(new Set(filters)).toEqual(new Set(['none']));
  });

  test('proof wall > six photos of my own, without 9 days and 198', async ({ page }) => {
    await page.goto('/');
    const photos = page.locator('.wall .ph');
    await expect(photos).toHaveCount(6);
    await expect(photos.locator('.sticker')).toHaveText(['5 yrs', '4,267', '1,035', '26×', '45.9K', '180+']);
    for (const src of await photos.locator('img').evaluateAll((els) => els.map((i) => i.getAttribute('src')))) {
      expect(src).toMatch(/^\/img\/wall-[a-z0-9-]+\.webp$/);
    }
  });

  for (const size of [{ width: 1440, height: 900 }, { width: 1000, height: 764 }, { width: 390, height: 844 }]) {
    test(`proof wall > at ${size.width}px wide, each side always shows at least two photos`, async ({ page }) => {
      await page.setViewportSize(size);
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      for (let step = 1; step <= 9; step++) {
        await page.evaluate((f) => {
          const w = document.querySelector('.wall');
          window.scrollTo(0, w.getBoundingClientRect().top + window.scrollY + (w.offsetHeight - innerHeight) * f);
        }, step / 10);
        await page.waitForTimeout(300);
        const seen = await page.evaluate(() => ['l', 'r'].map((side) => [...document.querySelectorAll(`.wall .ph.${side} .ph-photo`)]
          .map((e) => e.getBoundingClientRect()).filter((b) => b.bottom > 0 && b.top < innerHeight).length));
        expect(seen[0], `left side at ${step * 10}%`).toBeGreaterThanOrEqual(2);
        expect(seen[1], `right side at ${step * 10}%`).toBeGreaterThanOrEqual(2);
      }
    });
  }

  for (const size of [{ width: 1440, height: 900 }, { width: 1000, height: 764 }, { width: 390, height: 844 }]) {
    test(`let's talk > at ${size.width}px wide, sits in the middle of the screen at the end of the page`, async ({ page }) => {
      await page.setViewportSize(size);
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await page.waitForTimeout(800);
      const { middle, height } = await page.evaluate(() => {
        const b = document.querySelector('.contact-inner').getBoundingClientRect();
        return { middle: (b.top + b.bottom) / 2, height: innerHeight };
      });
      expect(Math.abs(middle - height / 2)).toBeLessThanOrEqual(height * 0.04);
    });
  }

  test('proof wall > turns the page dark chocolate while in view', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => {
      const wall = document.querySelector('.wall');
      window.scrollTo(0, wall.getBoundingClientRect().top + window.scrollY + wall.offsetHeight * 0.4);
    });
    await expect
      .poll(() => page.evaluate(() => getComputedStyle(document.body).backgroundColor), { timeout: 5000 })
      .toBe('rgb(46, 29, 21)');
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
