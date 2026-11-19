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
