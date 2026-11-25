# kirsah.com design notes

The rules this site follows, and the lessons from building it. Read before changing the design.

## The design: Folder room (since 25 Nov 2026)
- Kirsah chose a completely new look herself on 25 Nov 2026 ("i want everything in new design too font and
  everything"), inspired by the MotionSites "Book Library" prompt, with her work projects as folders instead of books.
  It replaces the V1 "Kolibrie" design and its old "do not change the design" rule.
- Approved draft: artifact https://claude.ai/artifact/8JwAZoEkYBVzw9crqxXsHa (version 4, "draft 3"); readable source
  in `L Life/kirsah-website/folder-room-draft/draft3-source.html`. Compare with it before changing the look.
- Look: warm grey `#eeece8`, ink `#161616`; Inter Tight headlines, Inter text, Instrument Serif accents; each folder
  has its own poster colour.
- Top screen: 8 folders orbit "Ideas that go live." Drag to throw, scroll spins, click opens (the folder flies to the
  middle, its photo slides up, details on the right, below it on phones); arrows and Esc; Ring / Grid; search with
  the "/" key; chips Built / Grown / Run / About; the cursor label is for a mouse only. As in the draft, a closed
  folder shows no back tab; the tab appears when it opens.
- Below: "Every folder, one list." (a row scrolls up and opens its folder), "The proof wall." (6 number cards),
  tools row, black "Let's talk." card with email, Copy and resume, footer.
- Folders, their details, list rows, number cards, tools and contact are plain HTML in the page; JavaScript only
  adds the motion and the opening. Without JavaScript the folders show as a plain grid.
- 4,267 tests and 180+ code changes are labelled "Engineering" until she confirms which project they come from.
- Polish inside this design. Do not swap fonts, colours or layout without her OK.
- Every size: on phones the folders orbit in the free space above and below the headline (their size comes from
  the headline's box), so they never slide behind it; short phones drop the sentence under the headline. On short
  screens the open folder is smaller and the details scroll inside their panel, between the top and bottom buttons.
  Checked at 1440×900, 1280×720, 390×844, 390×667 and 700×500.
- Lesson (25 Nov 2026): the draft was only looked at on desktop and a tall phone, so the short-phone and short-window
  problems above only showed when building. Look at every draft at 390×667 and 700×500 too before she approves it.
- Still in the V1 look (open, needs her pick): the share card `og.png`, the tab icons and the colours in
  `site.webmanifest`. The `/resume/` page is unchanged.

## Decisions (V1 design, kept where they still apply)
- Nav: no frame. Logo and nav text sit on a soft glow that fades out at the edges, so a photo
  passing behind never shows a hard shape ("make it smoother").
- Stickers: professional over playful. Titan One was "catchy but not professional".
- Fonts are chosen by Kirsah from a picker (5 choices per spot, live preview on the proof wall),
  not by us.
- Contact: email under "Let's talk", resume button. The home page has no phone number; the resume page shows it
  (her choice, 20 Nov 2026).
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
  together when the resume changes. Keep the phone number out of these two (it is only on the resume page).
- The folders and their details, the work list, the tools row and the proof wall are plain HTML (not built by
  JavaScript), so crawlers that don't run code can read them. Keep it that way.
- `robots.txt` allows everyone; Cloudflare adds its own lines on top. `sitemap.xml` lists the page.
- Open: LinkedIn link and Thai spelling of her name (add to `sameAs` / `alternateName` when she gives them).
- Open (design change, needs her OK): Lighthouse notes low contrast on the small grey text of the new design
  (Grid button, small labels). Accessibility still scores 96; making the grey darker changes her approved look.

## Checks and deploys
- Every pull request: `site-checks` (Playwright, `tests/`) and `lighthouse` (SEO ≥ 95, best practices ≥ 90,
  accessibility ≥ 90; speed is a warning). Cloudflare also builds a preview copy for each PR.
- After every merge, and every day at 09:00 Thailand time: `Live check` waits for Cloudflare to serve the
  new version, then checks kirsah.com, www, the resume link, and the share/AI files.
- Dependabot proposes tool updates every Monday; they go through the same checks.

## Proof wall colour (19 Nov 2026)

_V1 design (replaced 25 Nov 2026). The general lessons still apply._
- Dark chocolate `#2e1d15` (`--night`), picked from 5 browns because the proof numbers must pop
  (cream text 14.6:1, orange headline 4.4:1). Walnut felt warmer but its orange sat near the 3:1 minimum.
- The same brown is used, see-through, for the soft glow behind the logo and menu on the dark section
  and for the title panel on phones. Change all three together.

## Round 6: her own photos, resume page, icon (19 Nov 2026)

_V1 design (replaced 25 Nov 2026). The general lessons still apply._

- **Work cards:** six cards, one per picture in her Desktop "Work" folder (Den Air card added). The picture fills
  the card edge to edge; a frame of card colour around it looked like a mistake to her ("fix the popup background").
- **No fade filter on photos.** The old `saturate/sepia` filter only existed to blend stock photos; on her own photos
  it looked faded. Do not add filters to her pictures.
- **Proof wall spacing follows the photo count.** Photos are spread over the whole wall height, so fewer photos means
  bigger empty gaps. With 6 photos: wall 170vh (180vh under 992px), left and right spots staggered. The check
  "each side always shows at least two photos" guards it on laptop, small laptop and phone.
- **Let's talk** fills the last screen (min-height 100vh, grid 1fr / content / 1fr), so its content sits in the middle
  when you reach the end of the page; footer at the bottom. Checked at ±4% of screen height on three sizes.
- **Resume page** at `/resume/` (folder + index.html so the local test server and Cloudflare both serve it). The PDF
  lives on the site, but `_headers` sends `X-Robots-Tag: noindex` for it, because the PDF has her phone number and
  Google indexes PDFs. (Round 10: the resume page now shows the phone too, her choice.)
- **Tab icon:** her orange K picture. At 16–48 px the soft orange-on-orange K disappears, so the tab sizes use the same
  picture with the K's edges strengthened; phone sizes use it exactly as she made it. She picked this ("Clearer K").
- **Privacy check on every picture she sends:** the TeamPit mock-up showed her phone number and PromptPay QR on the
  phone screen; both are blurred before the picture is used.

## Round 7: every screen size gets its best version (19 Nov 2026)

_V1 design (replaced 25 Nov 2026). The general lessons still apply._

L: "if the full desktop design / layout / motion is the best version > make all sizes the best version of itself too."
- **Text size must not jump between breakpoints.** The phone scale (100vw/24.375) grew to 24.6px at 600px and the
  tablet scale started at 10px at 601px: a narrow desktop window got oversized phone text. Now phone ≤ 17px, tablet ≥ 13px.
- **Resizing a window must look like loading at that size.** Two leftovers broke it: the desktop card stack left its
  centring transform on the cards (cleared when the desktop layout switches off), and text split into lines kept the old
  line breaks (lines are now split only when they appear and put back after).
- **Top of the page:** her own 8 photos (no stand-ins left anywhere). On phones, tablets and touch screens the picture
  sits in the flow above the text, never on top of it.
- **Proof wall:** inner photos at 9.5vw so photos and stickers never cross the title on any desktop size; on tablets the
  title gets the same frosted panel as phones; phone photos stay inside the screen edges.
- **Let's talk** leaves room for the menu at the top, so in a short window nothing hides under the logo.
- Checks cover 390, 572, 768, 1024, 1280 and 1440 wide, touch and mouse, and a wide-to-narrow resize.

## Rounds 8 and 9: the same motion on every size (19 Nov 2026)

_V1 design (replaced 25 Nov 2026). The general lessons still apply._

L checked on her phone: "it's totally the same". Fitting the layout is not enough; the motion must match desktop too.
- **Work cards:** the same pinned card stack on every size (no plain list on phones). Each card behind is the same
  step smaller and higher (scale −0.06, up 26px per card), so the frames peek out evenly. The old 3D depth made the
  steps shrink toward the back ("frame spacing is not even"). These two numbers keep the desktop stack the same size
  and height as the approved 3D one; compare with the live site before changing them.
- **Equal card heights:** every card takes the tallest card's height, measured again whenever card text changes size
  (late fonts, a frame that changes width). A narrow card puts its line of text under the title; squeezed beside the
  title it broke into many lines, one card grew tall, and every card copied that height ("fix the frame").
- **Small screens:** the stack shrinks to fit under "Latest work" and is centred in the space left. Short screens
  (small phones, short narrow windows) were the ones where the back cards covered the title.
- **Top of the page:** the floating photo is only for a mouse (`hover: hover` and `pointer: fine`), at any window
  width. Phones and tablets have no cursor, so it is hidden there (her call). All its photos load as soon as a mouse is
  found; lazy loading left an empty frame when the card flipped to a photo not loaded yet.
- **Proof wall:** no blurred panel behind the title on small screens; the photos move over the title like on desktop.
- **Let's talk on phones:** two equal buttons side by side, 48px tall (still easy to tap), smaller text.
- Checks: even steps at 1440/991/768/572/390/320, stack under the title at five sizes, no empty gap bigger than one
  line at seven sizes with fonts arriving late, no floating photo on touch, photo loaded when it follows the mouse.

## Round 10: resume contact and quick look (20 Nov 2026)

- **Contact on the resume page:** phone with tap-to-call (her choice, she overruled "no phone"), email, and both towns
  at district level only: "Prasat, Surin 32140 and Makkasan, Ratchathewi, Bangkok 10400 · willing to work hybrid
  between Surin and Bangkok". She picked district + province over full addresses: no street, house or room number on
  the site or the PDF. A check guards it.
- **Copy buttons are plain icons** (no text, no frame); the icon turns into an orange tick for a moment, and screen
  readers hear what was copied.
- **Quick look:** every name in Work experience opens a panel (right side on a computer, from the bottom on a phone)
  with her own picture, 2–3 real numbers from the resume and a Visit button; Previous / Next go through all 7.
  She wanted the real sites to scroll inside kirsah.com, but airplusauto.com, about.gogocash.co, Shopee and Facebook
  forbid being shown inside another site (only formulal.cc allows it), so she chose to keep this panel. Check a
  site's `X-Frame-Options` / `frame-ancestors` before promising to show it inside the page.
- **Links she gave:** Den Air = its Facebook page, AirPlus Auto = shopee.co.th/air.plus.auto, GoGoCash =
  about.gogocash.co/th (also on the home page card and in llms.txt). TeamPit (sign-in only) and the AI agents (no
  public page) get a short note instead of a Visit button.
- **PDF:** the address line says "Makkasan, Ratchathewi, Bangkok 10400 (hybrid with Surin)". Made from her resume file
  (`L Life/resume/resume-pi-r-square.html`) with `~/.claude/skills/prepare-papers/scripts/html_sheet_to_pdf.py`;
  re-print the unchanged file first and compare the text, so only the intended line changes. `_headers` adds
  `Content-Disposition: attachment`, so Download PDF saves the file in every browser.


## iPhone Safari: page content under the clock and the bottom bar (20 Nov 2026)

- iPhone Safari (iOS 26) draws page content under its clock and its floating bottom bar ONLY when that content scrolls
  with the page. Fixed layers (the old load wipe, pinned sections) are cut at both bars, and the strips are painted
  with the page background colour, which Safari keeps once it has seen it. Proven in her TeamPit app on 7 Nov
  (Kira.office memory "phone-website-fills-screen"); read sibling projects' phone lessons first.
- Tried and reverted the same day: turning the background orange during the wipe. The clock band stayed orange after
  the wipe, and the nav's soft glow became an orange blur. She called it "worse". The background now stays cream.
- `wrangler.jsonc` has `"preview_urls": true`, so every pushed branch gets a test link she can open on her phone:
  `https://<branch>-kirsah-website.lady-kirsah.workers.dev`. iPhone-only changes are checked there before merge.
  The links only work once that setting is live on main: merge the setting first, then push branches.
- The opening (load wipe) is now part of the page: `position:absolute`, moved to the scroll position at load, 130% of
  the screen height so it reaches under both bars. Its box is exactly screen-wide with `overflow:clip`, and the SVG
  inside is 130% wide. A layer wider than the screen makes a phone widen the whole page (390 px became 449 px), so keep
  any sideways overscan inside a screen-wide clipping box.
- Timing, her pick on the artifact (round of 20 Nov): full orange for 0.3 s, then one even sweep (1.6 s, `sine.inOut`,
  stroke 72% to 20%): about 2 seconds in all. She found the earlier version not smooth: no blur over moving layers,
  even easing.
- On touch screens the Work card stack is pinned with `pinType: "transform"`, so it scrolls with the page and Safari
  keeps drawing it under the bottom bar. Mouse screens keep the fixed pin.
