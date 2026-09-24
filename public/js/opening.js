// The opening: two glimmering rings in the dark, a tap, the monogram draws
// itself, the camera pulls back and the names rise.
import { unlock, openingChord } from './audio.js';
import { t, lang, onLang } from './i18n.js';

// Ring positions in ring.jpg, as fractions of width (x, rx) and height (y, ry).
const RINGS = [
  { x: 0.4499, y: 0.5534, rx: 0.0339, ry: 0.0217 },
  { x: 0.5146, y: 0.5590, rx: 0.0286, ry: 0.0165 },
];
const FOCUS = { x: 0.4818, y: 0.5556 };
const ZOOM = 2.5;

export function initOpening({ reduced, onOpened }) {
  const root = document.getElementById('opening');
  const zoom = root.querySelector('.op-zoom');
  const img = root.querySelector('.op-photo');
  const svg = root.querySelector('.op-rings');
  const mono = root.querySelector('.op-mono');
  const btn = root.querySelector('.op-btn');
  const native = root.querySelector('.names-native');
  let IW = 1536, IH = 2304;
  let opened = false;

  const setNative = () => {
    const l = lang();
    native.textContent = l === 'en' ? '' : t('names.groom') + ' & ' + t('names.bride');
    native.lang = l;
  };
  setNative();
  onLang(setNative);

  function layout() {
    const W = root.clientWidth, H = root.clientHeight;
    const s = Math.max(W / IW, H / IH);
    const dw = IW * s, dh = IH * s;
    // Cover, but keep the rings horizontally centred when the sides are cropped.
    const ox = Math.min(0, Math.max(W - dw, W / 2 - FOCUS.x * dw));
    const oy = (H - dh) / 2;
    Object.assign(zoom.style, { left: ox + 'px', top: oy + 'px', width: dw + 'px', height: dh + 'px' });
    zoom.style.transformOrigin = FOCUS.x * dw + 'px ' + FOCUS.y * dh + 'px';

    svg.setAttribute('viewBox', `0 0 ${IW} ${IH}`);
    svg.setAttribute('preserveAspectRatio', 'none');
    const sw = 1.25 / (s * ZOOM); // about 1.25 screen px while zoomed in
    root.style.setProperty('--ring-sw', sw);
    svg.querySelectorAll('.ring').forEach((g, i) => {
      const r = RINGS[i];
      g.querySelectorAll('ellipse').forEach((e) => {
        e.setAttribute('cx', r.x * IW); e.setAttribute('cy', r.y * IH);
        e.setAttribute('rx', r.rx * IW); e.setAttribute('ry', r.ry * IH);
      });
      g.querySelector('.ring-line').setAttribute('stroke-width', sw);
      g.querySelector('.ring-glint').setAttribute('stroke-width', sw * 2.4);
    });

    // Screen geometry of the rings while zoomed in.
    const fx = ox + FOCUS.x * dw, fy = oy + FOCUS.y * dh;
    const left = ox + (RINGS[0].x - RINGS[0].rx) * dw, right = ox + (RINGS[1].x + RINGS[1].rx) * dw;
    const ringsW = (right - left) * ZOOM;
    const ringsH = Math.max(RINGS[0].ry, RINGS[1].ry) * 2 * dh * ZOOM;
    const monoW = Math.min(W * 0.78, 470), monoH = monoW * 0.4;
    root.style.setProperty('--prompt-y', fy + ringsH / 2 + 34 + 'px');
    root.style.setProperty('--mono-y', Math.max(8, fy - ringsH / 2 - monoH - 6) + 'px');
    root.style.setProperty('--btn-x', fx + 'px');
    root.style.setProperty('--btn-y', fy + 'px');
    root.style.setProperty('--btn-w', Math.max(120, ringsW + 40) + 'px');
    root.style.setProperty('--btn-h', Math.max(90, ringsH + 40) + 'px');
  }

  const measure = () => {
    if (img.naturalWidth) { IW = img.naturalWidth; IH = img.naturalHeight; }
    layout();
  };
  if (img.complete) measure(); else img.addEventListener('load', measure, { once: true });
  img.addEventListener('error', () => root.classList.add('no-photo'), { once: true });
  layout();
  let rt;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(layout, 60); });

  const steps = reduced
    ? [['s-open s-flare s-draw s-fill s-pull s-lift s-bright s-names s-done', 0]]
    : [
        ['s-open s-flare', 0],
        ['s-draw', 150],
        ['s-pull', 450],
        ['s-fill', 1250],
        ['s-lift', 1450],
        ['s-bright', 2050],
        ['s-names', 2400],
        ['s-done', 3100],
      ];

  function open() {
    if (opened) return;
    opened = true;
    unlock();
    openingChord();
    // retire the button; keyboard focus moves to the names
    const h1 = root.querySelector('#names');
    h1.tabIndex = -1;
    if (document.activeElement === btn) h1.focus({ preventScroll: true });
    btn.hidden = true;
    if (reduced) root.classList.add('reduced');
    const go = () => {
      steps.forEach(([cls, at]) => setTimeout(() => root.classList.add(...cls.split(' ')), at));
      setTimeout(() => onOpened && onOpened(), reduced ? 50 : 3100);
    };
    // Make sure Carattere is ready before the monogram starts drawing.
    const f = document.fonts && document.fonts.load ? document.fonts.load('150px Carattere', 'RaGaa') : Promise.resolve();
    Promise.race([f, new Promise((r) => setTimeout(r, 400))]).then(go, go);
  }

  root.addEventListener('click', open);
  btn.addEventListener('click', (e) => { e.stopPropagation(); open(); });
  window.addEventListener('keydown', (e) => {
    if (!opened && (e.key === 'Enter' || e.key === ' ') && document.activeElement === document.body) { e.preventDefault(); open(); }
  });
}
