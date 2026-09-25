// Film mode: real drone footage, scrubbed by scrolling.
// Each scene is a short forward-flying clip turned into a numbered frame
// sequence by tools/prepare-scenes.sh. Scrolling moves through the frames
// (blending neighbours, so it stays fluid at any scroll speed); scenes
// dissolve into each other through a bloom of light, cloud or haze.
// Scenes without footage fall back to the real-time 3D world.
import { diag } from './diag.js';

const BASE = 'media/scenes/';
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

// Where each scene sits in the journey, per invitation, and the colour of
// the light it dissolves through on the way out.
export const SCENES = {
  full: [
    { id: 'sangeeth', a: 0.0, b: 0.37, out: [228, 232, 240] },
    { id: 'haldi', a: 0.38, b: 0.665, out: [246, 214, 168] },
    { id: 'wedding', a: 0.675, b: 0.885, out: [255, 236, 214] },
    { id: 'hyderabad', a: 0.895, b: 1.0 },
  ],
  wedding: [
    { id: 'wedding', a: 0.0, b: 0.77, out: [255, 236, 214] },
    { id: 'hyderabad', a: 0.785, b: 1.0 },
  ],
};

export async function createFilm(canvas) {
  let manifest = null;
  try {
    const r = await fetch(BASE + 'manifest.json', { cache: 'no-cache' });
    if (r.ok) manifest = await r.json();
  } catch (e) { manifest = null; }
  const scenes = {};
  if (manifest && manifest.scenes) {
    for (const s of manifest.scenes) scenes[s.id] = { ...s, img: new Array(s.frames), loaded: 0, queued: false };
  }
  diag.set('film', Object.keys(scenes).length ? Object.keys(scenes).join(', ') : 'no footage yet');
  const ctx = canvas.getContext('2d', { alpha: true });
  let W = 0, H = 0;
  function resize() {
    const d = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.round(canvas.clientWidth * d); H = Math.round(canvas.clientHeight * d);
    if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
  }
  resize();
  window.addEventListener('resize', resize);

  // progressive loading: every 8th frame first, then fill in
  const inflight = { n: 0 };
  function queue(sc) {
    if (sc.queued) return;
    sc.queued = true;
    const order = [];
    for (const step of [8, 4, 2, 1]) for (let i = 0; i < sc.frames; i += step) if (!order.includes(i)) order.push(i);
    const pad = String(sc.frames).length < 4 ? 4 : String(sc.frames).length;
    const next = () => {
      while (inflight.n < 6 && order.length) {
        const i = order.shift();
        inflight.n++;
        const im = new Image();
        im.decoding = 'async';
        im.onload = () => { sc.img[i] = im; sc.loaded++; inflight.n--; next(); };
        im.onerror = () => { inflight.n--; next(); };
        im.src = `${BASE}${sc.id}/${String(i + 1).padStart(pad, '0')}.${sc.ext || 'webp'}`;
      }
    };
    next();
  }

  // nearest loaded frame at or around index i
  function frameNear(sc, i) {
    for (let d = 0; d < sc.frames; d++) {
      if (sc.img[i - d]) return sc.img[i - d];
      if (sc.img[i + d]) return sc.img[i + d];
    }
    return null;
  }

  function cover(img, alpha, zoom) {
    const iw = img.naturalWidth, ih = img.naturalHeight;
    const s = Math.max(W / iw, H / ih) * zoom;
    const dw = iw * s, dh = ih * s;
    ctx.globalAlpha = alpha;
    ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
  }

  function drawScene(sc, t, alpha) {
    const f = clamp(t, 0, 1) * (sc.frames - 1);
    const i0 = Math.floor(f), k = f - i0;
    const a = frameNear(sc, i0), b = sc.img[i0 + 1];
    const zoom = 1.02 + 0.05 * t; // a touch of forward push
    if (a) cover(a, alpha, zoom);
    if (b && k > 0.02) cover(b, alpha * k, zoom);
  }

  return {
    has(id) { return !!scenes[id]; },
    // true if every scene of this invitation has footage (then the 3D world
    // doesn't need to load at all)
    complete(kind) { return SCENES[kind].every((s) => scenes[s.id]); },
    // coverage 0..1 of footage at progress p (1 = fully covered by film)
    render(kind, p) {
      const list = SCENES[kind];
      ctx.globalAlpha = 1;
      ctx.clearRect(0, 0, W, H);
      let covered = 0;
      const X = 0.012; // crossfade half-width
      for (let n = 0; n < list.length; n++) {
        const s = list[n];
        const sc = scenes[s.id];
        if (sc && p > s.a - 0.2 && p < s.b + 0.05) queue(sc);
        const inA = n === 0 ? 1 : smooth(s.a - X, s.a + X, p);
        const outB = n === list.length - 1 ? 1 : 1 - smooth(s.b - X, s.b + X, p);
        const w = inA * outB;
        if (w <= 0.001 || !sc) continue;
        drawScene(sc, (p - s.a) / (s.b - s.a), w);
        covered = Math.max(covered, w);
      }
      // dissolve through light between scenes
      for (let n = 0; n < list.length - 1; n++) {
        const s = list[n];
        if (!s.out) continue;
        const d = Math.abs(p - (s.b + list[n + 1].a) / 2);
        const glow = 1 - smooth(0, 0.022, d);
        if (glow > 0.001 && (scenes[s.id] || scenes[list[n + 1].id])) {
          ctx.globalAlpha = glow * 0.92;
          ctx.fillStyle = `rgb(${s.out.join(',')})`;
          ctx.fillRect(0, 0, W, H);
        }
      }
      ctx.globalAlpha = 1;
      return covered;
    },
    resize,
  };
}
