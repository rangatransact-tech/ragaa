# RaGaa: Ranganadh & Gaayathri

The wedding invitation website. It's a static site (plain HTML, CSS and JavaScript, no build step) that deploys to Vercel's free Hobby plan.

- Full invitation: `https://ragaa.vercel.app/?i=r1` (Sangeeth, Haldi, Wedding, Vratham)
- Wedding invitation: `https://ragaa.vercel.app/?i=g2` (Wedding and Vratham only)
- No `?i=` shows the full invitation.

## Run it locally

```bash
cd public
python3 -m http.server 8000     # or: npx serve .
```

Open http://localhost:8000. To test on your phone over Wi-Fi, open `http://<your-computer's-IP>:8000`. Opening `index.html` straight from the disk won't work, because ES modules need a server.

## Files

```
public/                    everything Vercel serves
  index.html               all sections, in page order
  css/site.css             design tokens (--kohl, --zari, --jasmine, --smoke) and all styling
  css/fonts.css            self-hosted Google Fonts (EB Garamond, Carattere, Tiro Telugu, Tiro Tamil)
  js/config.js             <- the settings you'll edit: GAS_URL, preview toggle, links, video, music
  js/i18n.js               every visible string in English, Telugu and Tamil
  js/main.js               wiring: invitation type, language, dots, countdown, lazy photos, video
  js/opening.js            the ring reveal
  js/audio.js              generated sound (veena pluck, bells, Mohanam) + background-music hook
  js/reveals.js            scroll-driven reveals: stars, colour, lamps, swatches, ribbon
  js/guests.js             RSVP and Memories photo wall
  js/world/shader.js       the 3D world (one raymarched GLSL shader)
  js/world/world.js        renderer, camera flight path, adaptive quality, fallback
  js/fx/diya.js            brass diya with flickering flame
  js/fx/gulal.js           gulal powder particles
  js/fx/fabrics.js         procedural fabric swatches
  assets/                  photos (made by tools/prepare-assets.sh)
  media/                   story.mp4 + poster (made by tools/prepare-assets.sh)
  og/                      WhatsApp link-preview images
  fonts/                   woff2 font files
apps-script/Code.gs        Google Apps Script backend (RSVP sheet + photo uploads)
tools/prepare-assets.sh    optimises your originals (photos, film, preview images)
tools/make-overlays.py     draws the monogram overlays and favicons (already run)
docs/                      Apps Script setup guide and the launch checklist
vercel.json                serves public/ with caching headers
```

## Adding your photos and film

1. Create a folder called `originals/` at the top of the project. Git ignores it, so the 267 MB film never gets committed.
2. Put these files in it: `ring.jpg`, `blue.jpg`, `birds.jpg`, `court.jpg`, `charminar.jpg`, and the save-the-date `.mp4`.
3. Run `bash tools/prepare-assets.sh` (you need `ffmpeg`; on a Mac: `brew install ffmpeg`).

The script:
- resizes the photos (1100 px long edge, 1500 px for the opening photo) and saves them as roughly quality-78 JPEGs;
- cuts the 16 s story highlight starting at 0:22 (24 fps, 1280×720, H.264 High, CRF 26, no audio, fade in and out, `+faststart`, about 1.7 MB) plus a poster frame. It never reaches the end card with the wrong 7:45 time. To use a different moment, set the start and length: `STORY_START=30 STORY_LEN=14 bash tools/prepare-assets.sh`;
- builds the WhatsApp preview images (`og/og-1200x630.jpg` and `og/og-square.jpg`) from the ring photo, with the gold monogram and date.

Until you run it, the site still works: the photo prints show a soft paper placeholder, the story frame shows a dark gradient, and the link preview is a text card (RaGaa, the names and the date).

**When the longer "our story" film arrives:** run the script on it, or drop your own `story.mp4` and `story-poster.jpg` into `public/media/`. Paths are set in `STORY` in `js/config.js`. Keep the whole `public/` folder under 100 MB; the script prints its size at the end.

## Everyday edits

| To change… | Edit |
|---|---|
| Any wording, in any language | `public/js/i18n.js` (the same key in `en`, `te`, `ta`) |
| Map link, registry link, muhurtham time | `public/js/config.js` |
| Backend URL | `GAS_URL` in `public/js/config.js` |
| Background music | Add open-licence files to `public/media/music/` and list them in `MUSIC` in `config.js` |
| "What to wear" reference photos | Add images to `public/assets/looks/` and list them in `LOOKS` in `config.js` |
| Colours and type | the tokens at the top of `public/css/site.css` |
| Camera position for a section | its `data-cam="z height pitch light-start light-end"` in `index.html` (see below) |

### The 3D camera

Each world section in `index.html` has `data-cam="z y pitch l0 l1"`:
- `z`: distance along the journey. Himalaya ≈ 0–38, cloud 38–52, desert 52–84, haze 84–94, coast 94+. The Shore Temple is at 114 and the shoreline is at about 117.
- `y`: height above the ground level.
- `pitch`: looking up (positive) or down (negative), in radians.
- `l0 l1`: the moon or sun elevation (radians) when the section starts and ends. The wedding timeline goes from −0.075 to +0.075, so the sun meets the horizon exactly at the 7:54 lamp.

The camera rests at a section's anchor while it's on screen and flies to the next one over the middle 60% of the scroll gap.

To look at any spot directly, open the site with `?debug`, tap the rings, then run this in the browser console:
`ragaaWorld.pose({ z: 100, y: 1.1, pitch: 0.06, l: 0 })`. Run `ragaaWorld.pose(null)` to go back to scrolling.

## What to check on your phone

Open the link from WhatsApp (tap it inside a chat, so it opens in WhatsApp's own browser) on an iPhone and an Android phone, and in desktop Chrome and Safari.

**Opening**
- The screen is almost dark (warm, never pure black), with two thin gold rings and small glints travelling round them.
- The language switch (EN · తె · த) is at the top right.
- The page doesn't scroll before you tap.
- On tap: the veena Sa-Pa-Sa, then a small bell (iPhone: turn the silent switch off). The rings flare, RaGaa draws itself in gold and fills, then rises to the top and shrinks. The photo pulls back and warms to a clean off-white light (not yellow), and the names rise with "Scroll to begin".
- Settings → Accessibility → Reduce Motion: the end state appears straight away, without the zoom.

**The 3D world**
- After "The celebrations", the night Himalaya fades in: a moon, stars, the Milky Way and glinting snow.
- Scrolling holds the camera still while you read, then flies to the next place: up into cloud, down to golden dunes, through warm haze, then along the beach to the Shore Temple at dawn.
- The sun rises behind the temple as you light the three lamps, and meets the horizon at 7:54.
- After the wedding, the camera lifts above the temple and the page darkens for the Vratham and the rest.
- It should feel smooth. If an older phone stutters for the first second or two, that's the site measuring the phone and lowering resolution. It should settle.

**Interactions** (all by scrolling; tapping a star, lamp, swatch or bow just scrolls you on)
- Stars: each one lights with a Mohanam note and draws part of a ♪; five lines of details appear.
- Haldi: colour powder bursts with each line. Tapping the screen there throws extra colour.
- Wedding lamps: the flames flicker. The 7:54 lamp rings temple bells.
- Swatches: each "what to wear" card turns up like a swatch book.
- Gifts: the bow lifts and the ribbons slide off to reveal the registry button.
- RSVP: − / + adds little figures. Send, reload the page, and it remembers you.

**The two links**: `?i=g2` has no Sangeeth or Haldi, no dots for them, and no preview switch.

## Decisions and open points

These are things the brief left open, or where I deviated, and why.

1. **All reveals happen by scrolling.** The brief's "dislikes" list says every reveal should happen through scrolling, not clicking. So stars, colour, lamps, swatches, the Vratham lamp and the ribbon are all scroll-driven. The only exception is the opening tap, which the brief specifies. The English copy that said "Tap…" now says "Scroll…" (for example "Scroll to reveal the night"), and so do the Telugu and Tamil. Every tap target is still a real button for accessibility: tapping it scrolls you to its next reveal.
2. **"What to wear" is a swatch book of realistic fabric**, drawn in code (sequins, velvet, satin, zari borders, bandhani, hammered temple gold…). The **dress-up doll** in §12 isn't built. It needs illustrated avatars from an illustrator, and illustrated figures clash with "never cartoonish". If you'd like photos of real outfits ("shoutouts"), add them to `LOOKS` in `config.js` with a credit line and they appear under each swatch book.
3. **Wedding intro text is light, not dark ink.** Before sunrise the scene is still dark, and dark ink wasn't readable there. From the lamps onward the Wedding world uses dark ink with a light glow, as briefed.
4. **The Kiki registry is a link, not an embed.** I couldn't reach gokiki.in from here to test framing, and registries almost always block it. If you check and it does load in an iframe, set `REGISTRY_EMBED = true` in `config.js`.
5. **Fonts are self-hosted** (in `public/fonts`) rather than loaded from Google, for speed on slow data and so the site makes no third-party requests.
6. **Telugu and Tamil are my drafts.** I didn't have `ragaa.html`, so I wrote them from scratch. Please have native speakers proofread `js/i18n.js`.
7. **3D performance is the main risk.** The world is one full-screen raymarched shader. It starts at 0.42× resolution on phones (0.55× on laptops, capped at 900k pixels). Every 40 frames it measures frame time and steps down resolution, then detail (march steps, noise octaves, shadows). It redraws slowly when the camera is still, and it pauses when the tab is hidden or the world is off screen. It has only been tested in a software renderer here. Please try it on the slowest Android phone you can find. If it's still heavy there, the next lever is the lowest level in `QUALITY` in `js/world/world.js`, or a lower starting `scale`.
8. **Without WebGL** (very old phones, some locked-down browsers), a sky gradient follows the same night → morning → dawn → day journey.
