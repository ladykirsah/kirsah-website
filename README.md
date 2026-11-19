# kirsah.com

Kirsah Tiathawornchai's personal site for job applications.

- The site is plain files in `public/` (one page, `public/index.html`, plus pictures in `public/img/`).
- Every pull request runs the site checks in `tests/` (page, pictures, resume links, share card,
  icons, AI and search files, no sideways scrolling) and a Lighthouse check (`lighthouserc.json`).
- After each merge and every morning, `Live check` tests the real kirsah.com.
- Dependabot proposes tool updates weekly.
- Merging to `main` puts the site live: Cloudflare builds from this repository and serves
  `public/` on kirsah.com and www.kirsah.com (`wrangler.jsonc`).
- Design rules and lessons for this site: `docs/design-notes.md`.

Run the checks on a Mac: `npm install` once, then `npm test` (local files) or `npm run test:live` (kirsah.com).
