import { test, expect } from '@playwright/test';

// What search engines, chat apps and AI assistants read about kirsah.com.
// These read the raw files (no JavaScript), the way crawlers do.

const SITE = 'https://kirsah.com/';
const SHARE_IMAGE = 'https://kirsah.com/og.png';
const SHARE_ALT = 'Kirsah Folders: Ideas that go live. Kirsah Tiathawornchai, Tech / AI Project Manager, kirsah.com, with project folders: 45.9K, TeamPit, Hi, I’m Kirsah, 9 days and 26×.';

function pngSize(buffer) {
  // PNG header: 8-byte signature, then the IHDR chunk with width and height.
  expect(buffer.subarray(1, 4).toString('latin1')).toBe('PNG');
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

async function rawHome(request) {
  const res = await request.get('/');
  expect(res.ok()).toBe(true);
  return res.text();
}

function meta(html, attr, key) {
  const re = new RegExp(`<meta[^>]*${attr}="${key.replace(/[:.]/g, '\\$&')}"[^>]*content="([^"]*)"`, 'i');
  return html.match(re)?.[1];
}

test.describe('search and share', () => {
  test('page head > has a description and a canonical link', async ({ request }) => {
    const html = await rawHome(request);
    const description = meta(html, 'name', 'description');
    expect(description?.length).toBeGreaterThan(80);
    expect(description?.length).toBeLessThanOrEqual(160);
    expect(html).toContain(`<link rel="canonical" href="${SITE}">`);
  });

  test('share card tags > are complete and use absolute links', async ({ request }) => {
    const html = await rawHome(request);
    expect(meta(html, 'property', 'og:type')).toBe('website');
    expect(meta(html, 'property', 'og:url')).toBe(SITE);
    expect(meta(html, 'property', 'og:title')).toBe('Kirsah Tiathawornchai · Tech / AI Project Manager');
    expect(meta(html, 'property', 'og:description')).toBe(meta(html, 'name', 'description'));
    expect(meta(html, 'property', 'og:image')).toBe(SHARE_IMAGE);
    expect(meta(html, 'property', 'og:image:width')).toBe('1200');
    expect(meta(html, 'property', 'og:image:height')).toBe('630');
    // The share card shows the Folder room look (25 Nov 2026): the words must describe that picture.
    expect(meta(html, 'property', 'og:image:alt')).toBe(SHARE_ALT);
    expect(meta(html, 'name', 'twitter:card')).toBe('summary_large_image');
  });

  test('share image > is a 1200 x 630 PNG under 1 MB', async ({ request }) => {
    const res = await request.get('/og.png');
    expect(res.ok()).toBe(true);
    expect(res.headers()['content-type']).toBe('image/png');
    const body = await res.body();
    expect(body.length).toBeLessThan(1_000_000);
    expect(pngSize(body)).toEqual({ width: 1200, height: 630 });
  });

  test('tab and phone icons > are linked and served at the right sizes', async ({ request }) => {
    const html = await rawHome(request);
    expect(html).toContain('<link rel="icon" href="/favicon.ico" sizes="48x48">');
    expect(html).toContain('<link rel="apple-touch-icon" href="/apple-touch-icon.png">');
    expect(html).toContain('<link rel="manifest" href="/site.webmanifest">');
    const ico = await request.get('/favicon.ico');
    expect(ico.ok()).toBe(true);
    for (const [path, size] of [['/apple-touch-icon.png', 180], ['/icon-192.png', 192], ['/icon-512.png', 512]]) {
      const res = await request.get(path);
      expect(res.ok(), path).toBe(true);
      expect(pngSize(await res.body()), path).toEqual({ width: size, height: size });
    }
    const manifest = await (await request.get('/site.webmanifest')).json();
    expect(manifest.name).toBe('Kirsah Tiathawornchai');
    expect(manifest.icons.map((i) => i.src)).toEqual(['/icon-192.png', '/icon-512.png']);
  });

  // Her pick (25 Nov): Mix C, a lilac folder with "k." in front of a yellow folder, on the page's warm grey.
  test('tab and phone icons > show Mix C (lilac, yellow and black on warm grey), not the old orange K', async ({ page, request }) => {
    const manifest = await (await request.get('/site.webmanifest')).json();
    expect([manifest.background_color, manifest.theme_color]).toEqual(['#eeece8', '#eeece8']);
    await page.goto('/');
    for (const path of ['/icon-512.png', '/apple-touch-icon.png']) {
      const share = await page.evaluate(async (src) => {
        const img = new Image(); img.src = src; await img.decode();
        const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
        const x = c.getContext('2d'); x.drawImage(img, 0, 0);
        const d = x.getImageData(0, 0, c.width, c.height).data, n = d.length / 4;
        const near = (r, g, b) => { let k = 0; for (let i = 0; i < d.length; i += 4) if (Math.abs(d[i] - r) + Math.abs(d[i + 1] - g) + Math.abs(d[i + 2] - b) < 30) k++; return k / n; };
        return { grey: near(0xee, 0xec, 0xe8), lilac: near(0xcb, 0xb9, 0xf2), yellow: near(0xf6, 0xd1, 0x3a), ink: near(0x16, 0x16, 0x16), orange: near(0xef, 0x4a, 0x23) };
      }, path);
      expect(share.grey, path).toBeGreaterThan(0.15);
      expect(share.lilac, path).toBeGreaterThan(0.2);
      expect(share.yellow, path).toBeGreaterThan(0.05);
      expect(share.ink, path).toBeGreaterThan(0.02);
      expect(share.orange, path).toBeLessThan(0.01);
    }
  });

  test('AI profile > describes the person with no phone number', async ({ request }) => {
    const html = await rawHome(request);
    const block = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1];
    expect(block).toBeTruthy();
    const data = JSON.parse(block);
    expect(data['@type']).toBe('ProfilePage');
    const person = data.mainEntity;
    expect(person['@type']).toBe('Person');
    expect(person.name).toBe('Kirsah Tiathawornchai');
    expect(person.jobTitle).toBe('Tech / AI Project Manager');
    expect(person.url).toBe(SITE);
    expect(JSON.stringify(data)).not.toMatch(/telephone|\+66|063/);
  });

  test('crawler files > robots, sitemap and llms.txt point to the site', async ({ request }) => {
    const robots = await (await request.get('/robots.txt')).text();
    expect(robots).toContain('Sitemap: https://kirsah.com/sitemap.xml');
    expect(robots).not.toMatch(/Disallow:\s*\/\s*$/m);
    const sitemap = await (await request.get('/sitemap.xml')).text();
    expect(sitemap).toContain(`<loc>${SITE}</loc>`);
    expect(sitemap).toContain(`<loc>${SITE}resume/</loc>`);
    const llms = await (await request.get('/llms.txt')).text();
    expect(llms.startsWith('# Kirsah Tiathawornchai')).toBe(true);
    expect(llms).toContain('Tech / AI Project Manager');
    expect(llms).toContain(`(${SITE}resume/)`);
    expect(llms).not.toContain('drive.google.com');
  });

  test('resume page head > has its own description, canonical link and share tags', async ({ request }) => {
    const res = await request.get('/resume/');
    expect(res.ok()).toBe(true);
    const html = await res.text();
    const description = meta(html, 'name', 'description');
    expect(description?.length).toBeGreaterThan(80);
    expect(description?.length).toBeLessThanOrEqual(160);
    expect(html).toContain(`<link rel="canonical" href="${SITE}resume/">`);
    expect(meta(html, 'property', 'og:url')).toBe(`${SITE}resume/`);
    expect(meta(html, 'property', 'og:image')).toBe(SHARE_IMAGE);
    expect(meta(html, 'property', 'og:image:alt')).toBe(SHARE_ALT);
    expect(html).toContain('<link rel="icon" href="/favicon.ico" sizes="48x48">');
    expect(html).toContain('<html lang="en">');
  });

  test('raw page without JavaScript > already shows projects and proof numbers', async ({ request }) => {
    // Text inside <script> is code, not page content: crawlers skip it.
    const html = (await rawHome(request)).replace(/<script[\s\S]*?<\/script>/g, '');
    for (const text of ['TeamPit', 'AirPlus store', 'GoGoCash', 'Claude Code', 'Running Den Air', '45.9K', '1,035', '4,267',
      'Den Air Service', 'The proof wall', 'lady.kirsah@gmail.com']) {
      expect(html, text).toContain(text);
    }
  });

  test('raw page without JavaScript > already has the eight folders and every project link', async ({ request }) => {
    const html = (await rawHome(request)).replace(/<script[\s\S]*?<\/script>/g, '');
    expect(html.match(/<button class="folder"/g)).toHaveLength(8);
    for (const href of ['https://teampit.formulal.cc', 'https://airplusauto.com', 'https://shopee.co.th/air.plus.auto',
      'https://about.gogocash.co/th', 'https://www.facebook.com/profile.php?id=100063697504009']) {
      expect(html, href).toContain(`href="${href}"`);
    }
    expect(html).not.toContain('href="https://gogocash.co');
  });
});
