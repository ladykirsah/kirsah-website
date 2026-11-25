import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

// The "Folder room" home page (Kirsah's own pick, 25 Nov 2026): eight work folders orbit the headline,
// then the proof wall, the tools row and "Let's talk". (25 Nov, her call: no search box, no work list, no top-right
// Resume button; the big button under the headline is "My resume".)

const TITLE = 'Kirsah Tiathawornchai · Tech / AI Project Manager';
const BG = 'rgb(238, 236, 232)';
const SIZES = [
  { width: 1440, height: 900 },
  { width: 1280, height: 720 },
  { width: 390, height: 844 },
  { width: 390, height: 667 },
  { width: 700, height: 500 },
];
// Folder order, the title its panel shows, and where its main button goes.
const FOLDERS = [
  { name: 'About me', title: 'Kirsah Tiathawornchai', href: '/resume/' },
  { name: 'TeamPit', title: 'TeamPit', href: 'https://teampit.formulal.cc' },
  { name: 'AirPlus store', title: 'AirPlus store', href: 'https://airplusauto.com' },
  { name: 'AirPlus Auto', title: '26× on Shopee', href: 'https://shopee.co.th/air.plus.auto' },
  { name: 'GoGoCash', title: 'GoGoCash', href: 'https://about.gogocash.co/th' },
  { name: 'Den Air TikTok', title: '45.9K views', href: null },
  { name: 'Den Air Service', title: 'Den Air Service', href: 'https://www.facebook.com/profile.php?id=100063697504009' },
  { name: 'Let’s talk', title: 'Let’s talk', href: null },
];

function collectErrors(page) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  return errors;
}

async function widestScroll(page) {
  return page.evaluate(async () => {
    let widest = 0;
    for (let y = 0; y <= document.documentElement.scrollHeight; y += 400) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 40));
      widest = Math.max(widest, document.documentElement.scrollWidth);
    }
    return widest;
  });
}

// Folders keep drifting, so tests that need them still (a real mouse click, hovering) use reduced motion.
async function stillPage(browser, viewport = { width: 1440, height: 900 }) {
  const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(600);
  return { context, page };
}

const overlap = (a, b) => a.left < b.right - 1 && a.right > b.left + 1 && a.top < b.bottom - 1 && a.bottom > b.top + 1;

test.describe('home page', () => {
  test('on load > shows the headline with no errors', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('/');
    await expect(page.locator('h1')).toContainText(/ideas that\s*go\s*live/i);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);
    expect(errors).toEqual([]);
  });

  test('tab title > is her name and role', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(TITLE);
  });

  // iPhone Safari paints the strips under its clock and bottom bar with the page background and keeps the
  // colour it first saw, so the background is the warm grey from the first frame.
  test('page background > is warm grey from the first frame, with and without JavaScript', async ({ page, browser }) => {
    await page.goto('/');
    const bg = () => page.evaluate(() => [getComputedStyle(document.documentElement).backgroundColor, getComputedStyle(document.body).backgroundColor]);
    expect(await bg()).toEqual([BG, BG]);
    await page.waitForTimeout(900);
    expect(await bg()).toEqual([BG, BG]);
    const context = await browser.newContext({ javaScriptEnabled: false });
    const nojs = await context.newPage();
    await nojs.goto('/');
    expect(await nojs.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe(BG);
    await context.close();
  });

  test('test links > every pushed branch gets its own preview link (to check on a phone)', async () => {
    const config = readFileSync(new URL('../wrangler.jsonc', import.meta.url), 'utf8');
    expect(config).toMatch(/"preview_urls"\s*:\s*true/);
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

  test('page > has no sample video or sample still', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('video')).toHaveCount(0);
    expect(await page.content()).not.toMatch(/hero\.mp4|plate\.webp|data:video|data:image/);
  });

  test('footer > has no draft label and says the photos are my own', async ({ page }) => {
    await page.goto('/');
    const footer = page.locator('footer');
    await expect(footer).not.toContainText(/draft|stand-in/i);
    await expect(footer).toContainText('Photos: my own');
  });

  test('folders > eight folders in order, each with my own picture except Let’s talk', async ({ page }) => {
    await page.goto('/');
    const folders = page.locator('.folder');
    await expect(folders).toHaveCount(8);
    expect(await folders.evaluateAll((els) => els.map((e) => e.getAttribute('aria-label')))).toEqual(FOLDERS.map((f) => `Open ${f.name}`));
    const srcs = await folders.locator('img').evaluateAll((els) => els.map((i) => i.getAttribute('src')));
    expect(srcs).toHaveLength(7);
    for (const src of srcs) expect(src).toMatch(/^\/img\/(work|hero)-[a-z]+\.webp$/);
  });

  test('photos > show their real colours, no fade filter', async ({ page }) => {
    await page.goto('/');
    const filters = await page.evaluate(() => [...document.querySelectorAll('.folder img')].map((i) => getComputedStyle(i).filter));
    expect(filters.length).toBeGreaterThan(0);
    expect(new Set(filters)).toEqual(new Set(['none']));
  });

  test('folder > a mouse click opens it in the middle; Escape closes it', async ({ browser }) => {
    const { context, page } = await stillPage(browser);
    const teampit = page.locator('.folder[aria-label="Open TeamPit"]');
    await teampit.click();
    await page.waitForTimeout(1200);
    await expect(page.locator('#panel h2')).toHaveText('TeamPit');
    await expect(teampit).toHaveClass(/\bopen\b/);
    const box = await teampit.boundingBox();
    expect(box.x + box.width / 2).toBeGreaterThan(1440 * 0.15);
    expect(box.x + box.width / 2).toBeLessThan(1440 * 0.5);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(800);
    await expect(teampit).not.toHaveClass(/\bopen\b/);
    expect(await page.locator('#panel').evaluate((p) => +getComputedStyle(p).opacity)).toBeLessThan(0.1);
    await context.close();
  });

  test('folder panel > Next goes through all eight with the right buttons, then back to the start', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1200);
    await page.locator('.folder').first().focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(900);
    for (const f of FOLDERS) {
      await expect(page.locator('#panel h2')).toHaveText(f.title);
      const link = page.locator('#panel .actions a');
      if (f.href) {
        await expect(link).toHaveCount(1);
        expect(await link.getAttribute('href')).toBe(f.href);
        expect(await link.getAttribute('target')).toBe(f.href.startsWith('http') ? '_blank' : null);
      } else {
        await expect(link).toHaveCount(0);
      }
      await page.locator('#next').click();
      await page.waitForTimeout(300);
    }
    await expect(page.locator('#panel h2')).toHaveText(FOLDERS[0].title);
    await page.locator('#prev').click();
    await expect(page.locator('#panel h2')).toHaveText(FOLDERS[7].title);
  });

  test('top of page > no search box and no Resume button in the top corner (her call, 25 Nov)', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#q, .search, input[type="search"]')).toHaveCount(0);
    await expect(page.locator('.bar.top a[data-resume]')).toHaveCount(0);
  });

  test('top of page > the big button under the headline says My resume and opens the resume page, same tab', async ({ page, baseURL }) => {
    await page.goto('/');
    const start = page.locator('#start');
    await expect(start).toHaveText(/^\s*My resume\s*→\s*$/);
    expect(await start.evaluate((a) => [a.href, a.target, a.hasAttribute('data-resume')])).toEqual([new URL('/resume/', baseURL).href, '', true]);
  });

  test('chips > "Run" keeps only Den Air Service bright; pressing it again shows all', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1200);
    const run = page.locator('.chip', { hasText: 'Run' });
    await run.click();
    await page.waitForTimeout(900);
    expect(await page.locator('.folder').evaluateAll((els) => els.map((e) => e.classList.contains('dim')))).toEqual([true, true, true, true, true, true, false, true]);
    await expect(run).toHaveAttribute('aria-pressed', 'true');
    await run.click();
    await page.waitForTimeout(900);
    expect(await page.locator('.folder.dim').count()).toBe(0);
  });

  for (const size of [SIZES[0], SIZES[2], SIZES[4]]) {
    test(`grid view > at ${size.width}x${size.height}, folders sit side by side on screen without covering each other`, async ({ browser }) => {
      const { context, page } = await stillPage(browser, size);
      await page.locator('#vGrid').click();
      await page.waitForTimeout(400);
      const boxes = await page.locator('.folder').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().toJSON()));
      for (let i = 0; i < boxes.length; i++) {
        expect(boxes[i].left).toBeGreaterThanOrEqual(0);
        expect(boxes[i].right).toBeLessThanOrEqual(size.width);
        for (let j = i + 1; j < boxes.length; j++) expect(overlap(boxes[i], boxes[j]), `${i} and ${j}`).toBe(false);
      }
      await page.locator('#vRing').click();
      await expect(page.locator('#vRing')).toHaveAttribute('aria-pressed', 'true');
      await context.close();
    });
  }

  test('work list > the "Every folder, one list." section is gone (her call, 25 Nov)', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#index, #work')).toHaveCount(0);
    await expect(page.getByText('Every folder')).toHaveCount(0);
  });

  // Spin the ring step by step (drag along the top band) and record, for each folder, its box (cover + photo),
  // how faded it is, and which of the words it covers.
  async function spinAndLook(page, size, turns = 12) {
    const looks = [];
    for (let turn = 0; turn < turns; turn++) {
      looks.push(await page.evaluate(() => {
        const words = ['h1', '.sub', '#start', '#chips'].map((s) => document.querySelector(s)).filter((e) => e && e.offsetHeight)
          .map((e) => e.getBoundingClientRect());
        const copy = { top: Math.min(...words.map((r) => r.top)), bottom: Math.max(...words.map((r) => r.bottom)) };
        return [...document.querySelectorAll('.folder')].map((f) => {
          const a = f.querySelector('.front').getBoundingClientRect(), b = f.querySelector('.paper').getBoundingClientRect();
          const box = { left: Math.min(a.left, b.left), right: Math.max(a.right, b.right), top: Math.min(a.top, b.top), bottom: Math.max(a.bottom, b.bottom) };
          // a real cover-up, not a brush past: at least 24 px across and 18 px down of one word block
          const covers = words.some((w) => Math.min(box.right, w.right) - Math.max(box.left, w.left) > 24
            && Math.min(box.bottom, w.bottom) - Math.max(box.top, w.top) > 18);
          const anyOverlap = words.some((w) => box.left < w.right && box.right > w.left && box.top < w.bottom && box.bottom > w.top);
          const midY = (a.top + a.bottom) / 2;
          return { name: f.getAttribute('aria-label'), covers, anyOverlap, opacity: Number(getComputedStyle(f).opacity),
            besideWords: midY > copy.top && midY < copy.bottom && a.right > 0 && a.left < innerWidth };
        });
      }));
      await page.mouse.move(size.width * 0.3, 70);
      await page.mouse.down();
      await page.mouse.move(size.width * 0.3 + 40, 70, { steps: 4 });
      await page.mouse.up();
      await page.waitForTimeout(1600);
    }
    return looks.flat();
  }

  // Computers: the ring swings out beside the text, so no folder (with its photo) ever covers the words.
  test('folders > at 1280x720, spinning the ring never puts a folder over the headline', async ({ browser }) => {
    const size = { width: 1280, height: 720 };
    const { context, page } = await stillPage(browser, size);
    const hits = (await spinAndLook(page, size, 10)).filter((f) => f.anyOverlap).map((f) => f.name);
    expect(hits).toEqual([]);
    await context.close();
  });

  // Phones (her pick, 25 Nov): the folders go round in a full circle again, down the sides past the words,
  // and the words stay on top: a folder fades while it passes behind them.
  for (const size of [{ width: 440, height: 860 }, { width: 390, height: 844 }, { width: 390, height: 667 }]) {
    test(`folders > at ${size.width}x${size.height}, the ring is a circle that passes beside the words`, async ({ browser }) => {
      const { context, page } = await stillPage(browser, size);
      const looks = await spinAndLook(page, size);
      expect(looks.some((f) => f.besideWords), 'some folder comes down the side, level with the words').toBe(true);
      await context.close();
    });

    test(`folders > at ${size.width}x${size.height}, a folder behind the words is faded so they stay readable`, async ({ browser }) => {
      const { context, page } = await stillPage(browser, size);
      const z = await page.evaluate(() => [getComputedStyle(document.querySelector('.copy')).zIndex, getComputedStyle(document.querySelector('#ring')).zIndex].map(Number));
      expect(z[0], 'the words sit above the folders').toBeGreaterThan(z[1]);
      const looks = await spinAndLook(page, size);
      const loud = looks.filter((f) => f.covers && f.opacity > 0.4).map((f) => `${f.name} (${f.opacity})`);
      expect(loud).toEqual([]);
      await context.close();
    });
  }

  test('proof wall > six number cards; the two unconfirmed numbers are labelled Engineering', async ({ page }) => {
    await page.goto('/');
    const cards = page.locator('#numbers .num');
    await expect(cards.locator('b')).toHaveText(['5 yrs', '4,267', '1,035', '26×', '45.9K', '180+']);
    await expect(cards.locator('.from')).toHaveText(['Den Air', 'Engineering', 'GoGoCash', 'AirPlus Auto', 'Den Air TikTok', 'Engineering']);
  });

  test('tools row > lists the eight tools I use', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.track li:not([aria-hidden])')).toHaveText(['Claude Code', 'Cursor', 'Cloudflare', 'GitHub', 'Figma', 'Shopee', 'TikTok Shop', 'LINE OA']);
  });

  test("let's talk > shows my email and Copy email copies it", async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await page.goto('/');
    await expect(page.locator('#addr')).toHaveText('lady.kirsah@gmail.com');
    await page.locator('#copyMail').click();
    await expect(page.locator('#copyMail')).toHaveText('Copied');
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('lady.kirsah@gmail.com');
  });

  test('resume buttons > open the resume page on this site, same tab', async ({ page, baseURL }) => {
    await page.goto('/');
    const links = page.locator('[data-resume]');
    expect(await links.count()).toBeGreaterThanOrEqual(2);
    for (const { href, target } of await links.evaluateAll((els) => els.map((a) => ({ href: a.href, target: a.target })))) {
      expect(href).toBe(new URL('/resume/', baseURL).href);
      expect(target).toBe('');
    }
  });

  test('cursor label > follows the mouse over a folder', async ({ browser }) => {
    const { context, page } = await stillPage(browser);
    const box = await page.locator('.folder[aria-label="Open TeamPit"]').boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 5 });
    await page.waitForTimeout(400);
    const label = page.locator('#follow');
    await expect(label).toHaveText('Open TeamPit');
    await expect(label).toHaveClass(/\bon\b/);
    await context.close();
  });

  test('cursor label > is never shown on a touch screen', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    await page.goto('/');
    expect(await page.evaluate(() => getComputedStyle(document.querySelector('#follow')).display)).toBe('none');
    await context.close();
  });

  test('reduced motion > folders stay still and the tools row does not slide', async ({ browser }) => {
    const { context, page } = await stillPage(browser);
    const where = () => page.locator('.folder').evaluateAll((els) => els.map((e) => e.style.transform));
    const before = await where();
    await page.waitForTimeout(1200);
    expect(await where()).toEqual(before);
    expect(await page.evaluate(() => getComputedStyle(document.querySelector('.track')).animationName)).toBe('none');
    await context.close();
  });

  test('without JavaScript > the folders show as a tidy grid, none covering another', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1280, height: 720 } });
    const page = await context.newPage();
    await page.goto('/');
    const boxes = await page.locator('.folder').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().toJSON()));
    expect(boxes).toHaveLength(8);
    for (let i = 0; i < boxes.length; i++) {
      expect(boxes[i].width).toBeGreaterThan(100);
      for (let j = i + 1; j < boxes.length; j++) expect(overlap(boxes[i], boxes[j]), `${i} and ${j}`).toBe(false);
    }
    await context.close();
  });

  for (const size of SIZES) {
    test(`at ${size.width}x${size.height} > headline, button and chips stay clear of the top and bottom bars`, async ({ page }) => {
      await page.setViewportSize(size);
      await page.goto('/');
      await page.waitForTimeout(1500);
      const r = await page.evaluate(() => {
        const box = (s) => document.querySelector(s).getBoundingClientRect();
        const start = box('#start');
        const hit = document.elementFromPoint(start.left + start.width / 2, start.top + start.height / 2);
        const chips = box('#chips');
        return { h1: box('h1').toJSON(), search: box('.logo').bottom, bottomBar: box('.bar.bottom').top,
          last: chips.height > 0 ? chips.bottom : start.bottom, startHit: !!hit?.closest('#start') };
      });
      expect(r.h1.top).toBeGreaterThanOrEqual(r.search + 4);
      expect(r.last).toBeLessThanOrEqual(r.bottomBar - 4);
      expect(r.h1.left).toBeGreaterThanOrEqual(0);
      expect(r.h1.right).toBeLessThanOrEqual(size.width);
      expect(r.startHit).toBe(true);
    });

    test(`at ${size.width}x${size.height} > an open folder and its details never cover each other, and the details can be read`, async ({ page }) => {
      await page.setViewportSize(size);
      await page.goto('/');
      await page.waitForTimeout(1200);
      await page.locator('.folder[aria-label="Open TeamPit"]').focus();
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1200);
      const r = await page.evaluate(() => {
        const panel = document.querySelector('#panel');
        return { folder: document.querySelector('.folder.open').getBoundingClientRect().toJSON(), panel: panel.getBoundingClientRect().toJSON(),
          title: panel.querySelector('h2').getBoundingClientRect().toJSON(), scrolls: panel.scrollHeight > panel.clientHeight + 1 };
      });
      expect(overlap(r.folder, r.panel)).toBe(false);
      expect(r.title.top).toBeGreaterThanOrEqual(0);
      expect(r.title.bottom).toBeLessThanOrEqual(size.height);
      expect(r.panel.right).toBeLessThanOrEqual(size.width);
      expect(r.folder.left).toBeGreaterThanOrEqual(-1);
      expect(r.folder.right).toBeLessThanOrEqual(size.width + 1);
      // the Visit button is on screen, or the details scroll to reach it
      const visit = page.locator('#panel .actions a');
      await visit.scrollIntoViewIfNeeded();
      const v = await visit.boundingBox();
      expect(v.y + v.height).toBeLessThanOrEqual(size.height);
    });

    test(`at ${size.width}x${size.height} > never scrolls sideways`, async ({ page }) => {
      await page.setViewportSize(size);
      await page.goto('/');
      await page.waitForTimeout(1200);
      expect(await widestScroll(page)).toBeLessThanOrEqual(size.width);
    });
  }
});
