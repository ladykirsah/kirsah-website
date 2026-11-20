import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

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

  test('work cards > the GoGoCash card opens its company page', async ({ page }) => {
    await page.goto('/');
    const hrefs = await page.locator('#stack .slide').evaluateAll((els) => els.map((a) => a.getAttribute('href')));
    expect(hrefs).toContain('https://about.gogocash.co/th');
    expect(hrefs).not.toContain('https://gogocash.co');
  });

  // iPhone Safari (iOS 26) paints the strips under its clock and bottom bar with the page background, and keeps the
  // colour it first saw. So the background stays cream from the first frame to the last (an orange one got stuck).
  test('page load > the page background stays cream the whole time', async ({ page }) => {
    await page.goto('/');
    const bg = () => page.evaluate(() => [getComputedStyle(document.documentElement).backgroundColor, getComputedStyle(document.body).backgroundColor]);
    expect(await bg()).toEqual(['rgb(250, 243, 228)', 'rgb(250, 243, 228)']);
    await page.waitForTimeout(900);
    expect(await bg()).toEqual(['rgb(250, 243, 228)', 'rgb(250, 243, 228)']);
  });

  test('test links > every pushed branch gets its own preview link (to check on a phone)', async () => {
    const config = readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8');
    expect(config).toMatch(/"preview_urls"\s*:\s*true/);
  });

  test('page load > with reduced motion, there is no wipe and the background stays cream', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto('/');
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor)).toBe('rgb(250, 243, 228)');
    await context.close();
  });

  test('page load > without JavaScript, the background is cream', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('/');
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor)).toBe('rgb(250, 243, 228)');
    await context.close();
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

  for (const s of [{ width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1024, height: 768 }]) {
    test(`top of page > on a ${s.width}px touch screen, there is no floating photo card`, async ({ browser }) => {
      const ctx = await browser.newContext({ viewport: s, hasTouch: true, isMobile: s.width < 900 });
      const page = await ctx.newPage();
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);
      expect(await page.evaluate(() => getComputedStyle(document.querySelector('.hero-card')).display)).toBe('none');
      await ctx.close();
    });
  }

  async function expectCardFollowsMouse(page, width) {
    await page.mouse.move(width * 0.2, 300);
    await page.mouse.move(width * 0.7, 420, { steps: 25 });
    await page.waitForTimeout(1500);
    const r = await page.evaluate(() => {
      const card = document.querySelector('.hero-card'), b = card.getBoundingClientRect(), cs = getComputedStyle(card);
      const img = card.querySelector('.crop.on img');
      return { visible: cs.visibility === 'visible' && +cs.opacity > 0.5, cx: b.left + b.width / 2, cy: b.top + b.height / 2, loaded: img.complete && img.naturalWidth > 0 };
    });
    expect(r.visible).toBe(true);
    expect(r.loaded).toBe(true);
    expect(Math.abs(r.cx - width * 0.7)).toBeLessThan(60);
    expect(Math.abs(r.cy - 420)).toBeLessThan(60);
  }

  test('top of page > with a mouse in a narrow window, the photo card follows the cursor and its photo is loaded', async ({ page }) => {
    await page.setViewportSize({ width: 572, height: 800 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    await expectCardFollowsMouse(page, 572);
  });

  test('window made narrow > the photo card still follows the mouse', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    await page.setViewportSize({ width: 572, height: 800 });
    await page.waitForTimeout(1000);
    await expectCardFollowsMouse(page, 572);
  });

  for (const size of [{ width: 1440, height: 900 }, { width: 991, height: 700 }, { width: 768, height: 1024 }, { width: 572, height: 664 }, { width: 390, height: 844 }, { width: 320, height: 640 }]) {
    test(`work cards > at ${size.width}px wide, the stacked frames peek out evenly`, async ({ page }) => {
      await page.setViewportSize(size);
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);
      const boxes = await page.evaluate(() => [...document.querySelectorAll('#stack .slide')].slice(0, 4).map((s) => s.getBoundingClientRect().toJSON()));
      const tops = boxes.slice(1).map((b, i) => boxes[i].top - b.top);
      const sides = boxes.slice(1).map((b, i) => b.left - boxes[i].left);
      for (const step of tops) expect(Math.abs(step - tops[0])).toBeLessThanOrEqual(1.5);
      for (const step of sides) expect(Math.abs(step - sides[0])).toBeLessThanOrEqual(1.5);
      expect(tops[0]).toBeGreaterThan(8);
    });
  }

  for (const size of [{ width: 572, height: 664 }, { width: 390, height: 667 }, { width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 991, height: 700 }]) {
    test(`work cards > at ${size.width}x${size.height}, the stacked frames stay below the Latest work title`, async ({ page }) => {
      await page.setViewportSize(size);
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);
      await page.evaluate(() => window.scrollTo(0, document.querySelector('#work').getBoundingClientRect().top + scrollY + 5));
      await page.waitForTimeout(1200);
      const { titleBottom, stackTop, stackBottom } = await page.evaluate(() => {
        const title = document.querySelector('#work .h-sec').getBoundingClientRect();
        const cards = [...document.querySelectorAll('#stack .slide')].map((s) => s.getBoundingClientRect());
        return { titleBottom: title.bottom, stackTop: Math.min(...cards.map((c) => c.top)), stackBottom: Math.max(...cards.map((c) => c.bottom)) };
      });
      expect(stackTop).toBeGreaterThanOrEqual(titleBottom);
      expect(stackBottom).toBeLessThanOrEqual(size.height);
    });
  }

  test('window made narrow and short, then wide again > stack fits under the title, then goes back to full size', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    const fullWidth = await page.evaluate(() => document.querySelector('#stack .slide').getBoundingClientRect().width);
    await page.setViewportSize({ width: 572, height: 664 });
    await page.waitForTimeout(1200);
    await page.evaluate(() => window.scrollTo(0, document.querySelector('#work').getBoundingClientRect().top + scrollY + 5));
    await page.waitForTimeout(1200);
    const fits = await page.evaluate(() => {
      const title = document.querySelector('#work .h-sec').getBoundingClientRect();
      return Math.min(...[...document.querySelectorAll('#stack .slide')].map((s) => s.getBoundingClientRect().top)) >= title.bottom;
    });
    expect(fits).toBe(true);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(1200);
    const backWidth = await page.evaluate(() => document.querySelector('#stack .slide').getBoundingClientRect().width);
    expect(Math.abs(backWidth - fullWidth)).toBeLessThanOrEqual(1);
  });

  for (const size of [{ width: 360, height: 740 }, { width: 390, height: 844 }, { width: 572, height: 664 }, { width: 700, height: 500 }, { width: 820, height: 1180 }, { width: 991, height: 700 }, { width: 1280, height: 720 }]) {
    test(`work cards > at ${size.width}x${size.height}, fonts arriving late > no card has an empty gap bigger than one line`, async ({ page }) => {
      // a slow phone network: the web fonts arrive after the page has started its motion
      await page.route('https://fonts.gstatic.com/**', async (route) => { await new Promise((r) => setTimeout(r, 2500)); await route.continue(); });
      await page.setViewportSize(size);
      await page.goto('/');
      await page.waitForTimeout(4500);
      const cards = await page.evaluate(() => [...document.querySelectorAll('#stack .slide')].map((s) => {
        const cs = getComputedStyle(s), sub = s.querySelector('.sub');
        const content = s.querySelector('.crop').offsetHeight + parseFloat(cs.rowGap) + s.querySelector('.slide-body').offsetHeight + parseFloat(cs.paddingBottom);
        return { empty: s.offsetHeight - content, line: parseFloat(getComputedStyle(sub).lineHeight) };
      }));
      for (const c of cards) expect(c.empty).toBeLessThanOrEqual(c.line + 2);
    });
  }

  test('work cards > card text changes size after start (late font) > cards are made equal again', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    await page.addStyleTag({ content: '#stack .slide:last-child .sub{font-size:2rem}' });
    await page.waitForTimeout(600);
    const heights = await page.evaluate(() => [...document.querySelectorAll('#stack .slide')].map((s) => s.offsetHeight));
    expect(Math.max(...heights) - Math.min(...heights)).toBeLessThanOrEqual(1);
  });

  test('window made narrow > stacked frames still peek out evenly', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);
    await page.setViewportSize({ width: 991, height: 700 });
    await page.waitForTimeout(1200);
    const boxes = await page.evaluate(() => [...document.querySelectorAll('#stack .slide')].slice(0, 4).map((s) => s.getBoundingClientRect().toJSON()));
    const tops = boxes.slice(1).map((b, i) => boxes[i].top - b.top);
    for (const step of tops) expect(Math.abs(step - tops[0])).toBeLessThanOrEqual(1.5);
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
