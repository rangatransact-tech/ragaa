// Everything you are likely to change lives in this file.

// Google Apps Script web-app URL (see docs/APPS-SCRIPT-SETUP.md).
// Leave empty until the script is deployed: RSVPs are then kept on the
// guest's phone only, and photo uploads show "open once the website is live".
export const GAS_URL = '';

// Development helper: the small "Preview: Full / Wedding" switch.
// It is always hidden when the link has ?i=. Set to false before launch.
export const SHOW_PREVIEW_TOGGLE = true;

// Neutral invitation codes -> invitation type.
export const INVITES = { r1: 'full', g2: 'wedding' };

export const MUHURTHAM = '2026-11-01T07:54:00+05:30';

export const LINKS = {
  map: 'https://maps.app.goo.gl/5ZbnHxxCnk5wkm5K9',
  registry: 'https://gokiki.in/registry/ragaa',
};

// Try embedding the registry in an iframe. Most registries (Kiki included,
// most likely) refuse to be framed, so this stays false unless you have
// checked that https://gokiki.in/registry/ragaa loads inside an iframe.
export const REGISTRY_EMBED = false;

// Our story video. Swap these when the longer film arrives.
export const STORY = {
  src: 'media/story.mp4',
  poster: 'media/story-poster.jpg',
};

// Optional background music per world (open-licence files you add to
// public/media/music/). Empty = no music; the sound button still controls
// the generated sounds.
export const MUSIC = {
  // sangeeth: 'media/music/sangeeth.mp3',
  // haldi: 'media/music/haldi.mp3',
  // wedding: 'media/music/wedding.mp3',
};

// Optional "what to wear" reference looks: photos of real outfits you like,
// with a short credit line. Put images in public/assets/looks/.
// Example: sangeeth: [{ src: 'assets/looks/sequin-gown.jpg', credit: 'Look by @someone' }]
export const LOOKS = { sangeeth: [], haldi: [], wedding: [] };
