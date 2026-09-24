# Launch checklist (Vercel Hobby)

## One-time: connect the project

1. In Vercel, click **Add New… → Project** and import `rangatransact-tech/ragaa` from GitHub.
2. Framework Preset: **Other**. Leave Build Command empty. `vercel.json` already sets the output directory to `public`.
3. Click **Deploy**.
4. Go to **Settings → Domains** and make sure `ragaa.vercel.app` is assigned. If that name is taken, pick another, then update the absolute URLs in `public/index.html` (`og:url`, `og:image`, `twitter:image`) to match.
5. Every push to the production branch now redeploys the site.

## Before you send the links

- [ ] Photos and film processed: `bash tools/prepare-assets.sh` (see README), and `public/assets/*.jpg` and `public/media/story.mp4` committed.
- [ ] `public/og/og-1200x630.jpg` shows the ring photo with the monogram (not the text-only card).
- [ ] Apps Script deployed and `GAS_URL` set in `public/js/config.js` (docs/APPS-SCRIPT-SETUP.md).
- [ ] `SHOW_PREVIEW_TOGGLE = false` in `public/js/config.js`.
- [ ] Telugu and Tamil proofread by native speakers (`public/js/i18n.js`).
- [ ] Muhurtham shows 7:54 everywhere, including the countdown target `2026-11-01T07:54:00+05:30` in `config.js`.
- [ ] Deployment size under 100 MB: `du -sh public`.
- [ ] Test RSVP and a photo upload end to end, then delete the test rows.

## Test on real devices

- [ ] iPhone: open the `?i=r1` link from a WhatsApp chat (WhatsApp's in-app browser). Check the opening, sound, the 3D flight, every reveal and RSVP.
- [ ] Android (ideally an older or mid-range phone): the same. Watch the 3D for stutter after the first couple of seconds.
- [ ] `?i=g2`: no Sangeeth or Haldi, straight from "The celebrations" to the wedding.
- [ ] Desktop Chrome and Safari: keyboard only (Tab to the rings, Enter to open, Tab through the section dots and buttons).
- [ ] Reduce Motion turned on (iPhone: Settings → Accessibility → Motion): crossfades instead of flights, no powder.
- [ ] Switch EN / తె / த mid-page. The choice is remembered after a reload.

## WhatsApp preview

1. Paste `https://ragaa.vercel.app/?i=r1` into a chat with yourself. The card should show the ring image, "Ranganadh & Gaayathri", and "Tap to open your invitation. 1 November 2026."
2. WhatsApp caches previews. If you changed the image after sharing once, add something harmless to the link to get a fresh card, e.g. `https://ragaa.vercel.app/?i=r1&v=2`. The site ignores extra parameters.
3. You can also check any link at https://www.opengraph.xyz.

## After launch

- Approve guest photos by ticking **Approved** in the **Photos** tab.
- To swap in the longer film: see "Adding your photos and film" in the README.
- Vercel Hobby limits are generous for this site: everything, video included, ships inside the deployment, so no Vercel Blob is used and its 10 GB/month cap doesn't apply.
