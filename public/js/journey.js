// One animation loop drives everything after the opening: scroll position is
// smoothed into journey progress p, and p positions the drone, the light and
// every caption. Nothing is pinned, nothing waits: it simply flies.
import { CAPTIONS, remapP } from './world/track.js';
import { createFilm } from './film.js';
import { MOHANAM, softBell, templeBells, puff, NOTE } from './audio.js';
import { diag } from './diag.js';

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

export function createJourney({ reduced, getInvite, opening, onChapter }) {
  const journey = document.getElementById('journey');
  const shade = document.getElementById('shade');
  const canvas = document.getElementById('world');
  const fallback = document.getElementById('world-fallback');
  const filmCanvas = document.getElementById('film');
  let film = null;
  const filmReady = createFilm(filmCanvas).then((f) => { film = f; return f; });
  const caps = [...document.querySelectorAll('.cap')];
  let world = null;
  let worldFailed = false;
  let started = false;
  let p = 0, pT = 0, lastNow = 0, frame = 0;
  let geo = { top: 0, len: 1, vh: innerHeight, afterTop: 0 };
  let storyOn = false;
  let renderErrors = 0, loadingWorld = false;
  function useFallback() { world = null; worldFailed = true; canvas.style.display = 'none'; fallback.classList.add('on'); }
  function startWorld() { loadWorldImpl(); }
  const revealed = new Map();

  function config() { return CAPTIONS[getInvite()]; }

  function measure() {
    const vh = innerHeight;
    journey.style.setProperty('--screens', config().screens);
    const r = journey.getBoundingClientRect();
    const top = r.top + scrollY;
    geo = { top, len: Math.max(1, journey.offsetHeight - vh), vh, afterTop: top + journey.offsetHeight };
  }

  function scrollToP(q) {
    measure();
    scrollTo({ top: geo.top + clamp(q, 0, 1) * geo.len, behavior: reduced ? 'auto' : 'smooth' });
  }

  // caption visibility for progress p
  function updateCaptions(p) {
    const cfg = config();
    const byId = new Map(cfg.list.map((c) => [c[0], c]));
    for (const el of caps) {
      const id = el.dataset.cap;
      const c = byId.get(id);
      let o = 0, y = 0;
      if (c && !(id === 'story' && !storyOn)) {
        const [, a, b] = c;
        const f = Math.min(0.022, (b - a) / 4);
        o = smooth(a, a + f, p) * (1 - smooth(b - f, b, p));
        const mid = (a + b) / 2;
        y = reduced ? 0 : ((mid - p) / (b - a)) * 70;
        // lines appear one after another as you fly on
        const lines = el.querySelectorAll('.ln');
        if (lines.length) {
          const at = cfg.lineAt && cfg.lineAt[id];
          const span = c[3] || (b - a) * 0.6;
          lines.forEach((ln, i) => {
            const t = at ? at[i] : a + f + (span * i) / lines.length;
            const on = p >= t && o > 0.01;
            if (on !== ln.classList.contains('on')) {
              ln.classList.toggle('on', on);
              if (on) chime(el.dataset.sound, i, id);
            }
          });
        }
      }
      const key = o.toFixed(3) + '|' + y.toFixed(1);
      if (el._k === key) continue;
      el._k = key;
      el.style.opacity = o.toFixed(3);
      el.style.visibility = o > 0.001 ? 'visible' : 'hidden';
      el.style.transform = `translate(-50%, calc(-50% + ${y.toFixed(1)}px))`;
    }
  }

  function chime(kind, i, id) {
    const k = id + i;
    if (revealed.get(k)) return; // each line sounds once
    revealed.set(k, true);
    if (kind === 'mohanam') softBell(MOHANAM[Math.min(i, 4)], 0, 0.18);
    else if (kind === 'puff') puff(i);
    else if (kind === 'wedding') { if (i === 1) templeBells(); else softBell(i === 0 ? NOTE.A4 : NOTE.D5, 0, 0.16); }
  }

  function paintFallback(p) {
    // without WebGL: a painted sky that still travels night -> morning -> dawn
    const kind = getInvite();
    const stops = kind === 'wedding'
      ? [[0, '#0a1024', '#2a2a4a', '#6a4a5a'], [0.4, '#1d2a55', '#b0707a', '#f0a060'], [1, '#6f9ad0', '#f2c9a0', '#f6d2a0']]
      : [[0, '#050814', '#0f1733', '#26314f'], [0.36, '#0a1024', '#8a8fa6', '#c8cbd6'], [0.45, '#3f73c2', '#9cc0e6', '#e0b77e'],
        [0.66, '#5a86c4', '#d8b890', '#e7b479'], [0.72, '#141a3a', '#8a5a6a', '#e08a4a'], [1, '#6f9ad0', '#f2c9a0', '#f6d2a0']];
    let a = stops[0], b = stops[stops.length - 1];
    for (let i = 0; i < stops.length - 1; i++) if (p >= stops[i][0] && p <= stops[i + 1][0]) { a = stops[i]; b = stops[i + 1]; }
    const t = (p - a[0]) / Math.max(1e-6, b[0] - a[0]);
    const lerp = (x, y) => {
      const c = (h) => [1, 3, 5].map((k) => parseInt(h.slice(k, k + 2), 16));
      const X = c(x), Y = c(y);
      return `rgb(${X.map((v, i) => Math.round(v + (Y[i] - v) * t)).join(',')})`;
    };
    fallback.style.setProperty('--fb-top', lerp(a[1], b[1]));
    fallback.style.setProperty('--fb-mid', lerp(a[2], b[2]));
    fallback.style.setProperty('--fb-bot', lerp(a[3], b[3]));
  }

  function loop(now) {
    requestAnimationFrame(loop);
    if (document.hidden) { lastNow = now; return; }
    const dt = lastNow ? Math.min(0.1, (now - lastNow) / 1000) : 0.016;
    lastNow = now;
    frame++;
    const sy = scrollY;
    const vh = geo.vh;
    // opening: fly into the light
    const q = clamp(sy / vh, 0, 1);
    opening.exit(q);
    pT = clamp((sy - geo.top) / geo.len, 0, 1);
    const k = 1 - Math.exp(-dt * 3.6);
    const settled = Math.abs(pT - p) < 1e-5;
    p += (pT - p) * k;
    if (Math.abs(pT - p) < 1e-6) p = pT;

    // the dark shade that settles over the final scene for the last sections
    const post = clamp((sy - (geo.afterTop - vh)) / vh, 0, 1.5);
    const sh = Math.max(0.55 * smooth(0.99, 1, p), 0.55 + 0.4 * smooth(0, 1, post) * (p > 0.995 ? 1 : 0));
    shade.style.opacity = (p > 0.985 ? sh : 0).toFixed(3);

    updateCaptions(p);
    if (onChapter) onChapter(p);

    const visible = q > 0.02 && !(sh > 0.94);
    if (!visible || !started) return;
    const renderP = remapP(getInvite(), p); // scroll-driven: the guest moves it, so it flies for everyone
    const covered = film ? film.render(getInvite(), p) : 0;
    if (covered > 0.999) return; // real footage fills the screen
    if (!world && !worldFailed) loadWorldImpl();
    if (world && world.state.restored) { world = null; worldFailed = false; loadingWorld = false; startWorld(); }
    if (world && !world.state.lost) {
      // when nothing moves, draw every other frame (stars still twinkle)
      if (settled && (frame & 1)) return;
      try {
        world.render(getInvite(), renderP, now);
        renderErrors = 0;
        diag.frame(now);
        if ((frame & 63) === 0) { const i = world.info(); diag.set('render', `${i.size} @${i.dpr} q${i.quality}`); }
      } catch (e) {
        diag.log('render: ' + e.message);
        if (++renderErrors > 3) useFallback();
      }
    } else paintFallback(renderP);
  }

  // Our story shows only once a video is actually there.
  const video = document.getElementById('story-video');
  const storyCap = document.querySelector('.cap[data-cap="story"]');
  function initStory(src, poster) {
    if (!src) return;
    video.addEventListener('loadeddata', () => { storyOn = true; storyCap.hidden = false; }, { once: true });
    video.addEventListener('error', () => { storyOn = false; }, { once: true });
    video.poster = poster;
    video.src = src;
    new IntersectionObserver((es) => {
      if (es[0].isIntersecting) video.play().catch(() => {}); else video.pause();
    }).observe(storyCap);
  }

  async function loadWorldImpl() {
    if (world || worldFailed || loadingWorld) return;
    loadingWorld = true;
    const t = performance.now();
    try {
      const mod = await import('./world/world.js');
      world = mod.createWorld({ canvas, reduced });
      if (world) world.prime(getInvite());
    } catch (e) { diag.log('world: ' + e.message); world = null; }
    loadingWorld = false;
    diag.set('world', world ? `ready in ${Math.round(performance.now() - t)} ms` : 'unavailable (fallback)');
    if (!world) useFallback();
    else { canvas.style.display = ''; canvas.classList.add('on'); }
  }

  measure();
  window.addEventListener('resize', measure);
  requestAnimationFrame(loop);

  return {
    measure,
    scrollToP,
    initStory,
    get p() { return p; },
    get geo() { return geo; },
    hasStory: () => storyOn,
    // load the 3D world only if some scene still has no footage
    loadWorld: () => filmReady.then((f) => { if (!f.complete(getInvite())) loadWorldImpl(); }),
    start() { started = true; },
  };
}
