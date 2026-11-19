# kirsah.com design notes

The rules this site follows, and the lessons from building it. Read before changing the design.

## The design
- Base: the V1 "Kolibrie" design Kirsah picked (cream, tomato orange, black; Archivo headlines,
  Playfair reading text, Yellowtail logo; scribble opening, letters rising, 3D card stack,
  dark proof wall with number stickers).
- Change it by polishing inside this design. Do not swap fonts, colours or layout on our own
  (a full redesign was rejected: "i told you to develop, not change design").

## Decisions
- Nav: no frame. Logo and nav text sit on a soft glow that fades out at the edges, so a photo
  passing behind never shows a hard shape ("make it smoother").
- Stickers: professional over playful. Titan One was "catchy but not professional".
- Fonts are chosen by Kirsah from a picker (5 choices per spot, live preview on the proof wall),
  not by us.
- Contact: email under "Let's talk", resume button, no phone number.
- Hero: no video for now. The video and still from the design prompt belong to someone else.

## Pictures
- Every picture must have a known owner and licence before it goes live. Log the source and
  licence the moment a picture is added (we had to trace the stand-ins back afterwards).
- Current stand-ins are CC0, except the phone photo (Elena Rossini, CC BY-SA 4.0, credited in
  the footer). The plan is to replace them with AI-made pictures.

## Links
- The resume buttons point to Kirsah's current resume PDF on Google Drive, shared "Anyone with the link".
  Before changing the link, check the file is the newest one and not in the Drive trash (the first live
  version pointed at a trashed old copy with the same name), and that it opens without signing in.
  `tests/site.spec.mjs` holds the expected link.

## Deploys
- Merge to `main` = live on kirsah.com (Cloudflare Workers Builds runs `npx wrangler deploy`).
- Every pull request also gets a Cloudflare preview build (`npx wrangler preview`). That command
  needs the `"previews": {}` block in `wrangler.jsonc`; without it the "Workers Builds" check on
  each PR fails. Keep the block when editing that file.

## Share card and icons (19 Nov 2026)
- Share card `public/og.png` (1200 × 630): headline plus the proof numbers 9 days / 26× / 4,267, the same
  three as the contact section. Picked by Kirsah's own rules (proof with real numbers, keep the site's look).
  Source: `L Life/kirsah-website/share-preview/cards.html` (rendered with headless Chrome).
- Icons: orange square with the Yellowtail "K" from the logo (`favicon.ico`, `apple-touch-icon.png`,
  `icon-192.png`, `icon-512.png`). The old blocky Arial "K" (`favicon.svg`) is gone.
- After changing the share card, social apps keep the old one for a while; refresh with each platform's
  debugger (Facebook Sharing Debugger, LinkedIn Post Inspector).

## Search and AI
- What AI assistants read: `public/llms.txt` (the "who is Kirsah" answer and key facts) and the
  `application/ld+json` profile in the page head. Every fact must match her current resume; update both
  together when the resume changes. Never add a phone number.
- Project cards, the tools row and the proof wall are plain HTML (not built by JavaScript), so crawlers
  that don't run code can read them. Keep it that way.
- `robots.txt` allows everyone; Cloudflare adds its own lines on top. `sitemap.xml` lists the page.
- Open: LinkedIn link and Thai spelling of her name (add to `sameAs` / `alternateName` when she gives them).
- Open (design change, needs her OK): Lighthouse accessibility notes on text contrast and one ARIA attribute.

## Checks and deploys
- Every pull request: `site-checks` (Playwright, `tests/`) and `lighthouse` (SEO ≥ 95, best practices ≥ 90,
  accessibility ≥ 90; speed is a warning). Cloudflare also builds a preview copy for each PR.
- After every merge, and every day at 09:00 Thailand time: `Live check` waits for Cloudflare to serve the
  new version, then checks kirsah.com, www, the resume link, and the share/AI files.
- Dependabot proposes tool updates every Monday; they go through the same checks.
