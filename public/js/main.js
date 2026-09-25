import { INVITES, SHOW_PREVIEW_TOGGLE, MUHURTHAM, LINKS, REGISTRY_EMBED, STORY, GAS_URL } from './config.js';
import { setLang, initialLang, t, onLang, lang } from './i18n.js';
import { initOpening } from './opening.js';
import { createJourney } from './journey.js';
import { initRSVP, initMemories } from './guests.js';
import { isMuted, setMuted } from './audio.js';
import { CAPTIONS } from './world/track.js';
import './diag.js';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

// ---------- which invitation ----------
const params = new URLSearchParams(location.search);
const code = params.get('i');
let invite = code !== null ? (INVITES[code] || 'full') : 'full';
const getInvite = () => invite;

// ---------- language ----------
const paintLang = () => $$('.lang [data-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang())));
$$('.lang [data-lang]').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang)));
onLang(paintLang);
setLang(initialLang(), false);
paintLang();

// ---------- scroll lock until the reveal ----------
const lockKeys = new Set([' ', 'PageDown', 'PageUp', 'ArrowDown', 'ArrowUp', 'Home', 'End']);
let locked = true;
const block = (e) => { if (locked) e.preventDefault(); };
window.addEventListener('wheel', block, { passive: false });
window.addEventListener('touchmove', block, { passive: false });
window.addEventListener('keydown', (e) => { if (locked && lockKeys.has(e.key) && !e.target.closest('button')) e.preventDefault(); });
document.documentElement.classList.add('is-locked');

// ---------- links, countdown ----------
$('#map-link').href = LINKS.map;
$('#registry-link').href = LINKS.registry;
if (REGISTRY_EMBED) {
  const box = $('.registry-embed');
  const f = document.createElement('iframe');
  f.src = LINKS.registry; f.title = 'Registry'; f.loading = 'lazy';
  box.appendChild(f); box.hidden = false;
}
const target = new Date(MUHURTHAM).getTime();
const cd = { d: $('[data-cd="d"]'), h: $('[data-cd="h"]'), m: $('[data-cd="m"]'), s: $('[data-cd="s"]') };
function tick() {
  let s = Math.max(0, Math.floor((target - Date.now()) / 1000));
  const d = Math.floor(s / 86400); s -= d * 86400;
  const h = Math.floor(s / 3600); s -= h * 3600;
  const m = Math.floor(s / 60); s -= m * 60;
  cd.d.textContent = d; cd.h.textContent = String(h).padStart(2, '0');
  cd.m.textContent = String(m).padStart(2, '0'); cd.s.textContent = String(s).padStart(2, '0');
}
tick();
setInterval(tick, 1000);

// ---------- memories only once the backend exists ----------
if (GAS_URL) $('#memories').hidden = false;

// ---------- the opening and the flight ----------
const opening = initOpening({
  reduced,
  onOpened() {
    locked = false;
    window.removeEventListener('wheel', block);
    window.removeEventListener('touchmove', block);
    document.documentElement.classList.remove('is-locked');
    document.body.classList.remove('is-locked');
    $('#dots').hidden = false; $('#mute').hidden = false;
    requestAnimationFrame(() => { $('#dots').classList.add('on'); $('#mute').classList.add('on'); });
    journey.measure();
    journey.start();
  },
});
const journey = createJourney({ reduced, getInvite, opening, onChapter: updateDots });
journey.initStory(STORY.src, STORY.poster);
// load and compile the 3D world while the guest looks at the rings
const loadWorld = () => journey.loadWorld();
if ('requestIdleCallback' in window) requestIdleCallback(loadWorld, { timeout: 1500 }); else setTimeout(loadWorld, 400);

// ---------- which chapters exist for this invitation ----------
function applyInvite() {
  document.body.dataset.invite = invite;
  $$('[data-only="full"]').forEach((el) => { el.hidden = invite !== 'full'; });
  journey.measure();
  buildDots();
  $$('#preview [data-preview]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.preview === invite)));
}

// ---------- section dots ----------
let dotTargets = [];
function buildDots() {
  const nav = $('#dots');
  nav.textContent = '';
  const cfg = CAPTIONS[invite];
  dotTargets = [];
  for (const [id, p] of Object.entries(cfg.dots)) {
    if (id === 'story' && !journey.hasStory()) continue;
    dotTargets.push({ key: 'dot.' + (id === 'invite' ? 'invite' : id), p });
  }
  $$('.after [data-dot]').forEach((el) => dotTargets.push({ key: el.dataset.dot, el }));
  dotTargets.forEach((d) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.i18nAria = d.key;
    b.setAttribute('aria-label', t(d.key));
    const tip = document.createElement('span');
    tip.className = 'tip'; tip.dataset.i18n = d.key; tip.textContent = t(d.key);
    tip.setAttribute('aria-hidden', 'true');
    b.appendChild(tip);
    b.addEventListener('click', () => {
      if (d.el) {
        const top = d.el.getBoundingClientRect().top + scrollY;
        scrollTo({ top: top + d.el.offsetHeight / 2 - innerHeight / 2, behavior: reduced ? 'auto' : 'smooth' });
      } else journey.scrollToP(d.p);
    });
    nav.appendChild(b);
  });
}
let lastCur = -2;
function updateDots(p) {
  const mid = scrollY + innerHeight * 0.5;
  let cur = -1;
  dotTargets.forEach((d, i) => {
    if (d.el) { if (d.el.getBoundingClientRect().top + scrollY <= mid) cur = i; }
    else if (p >= d.p - 0.02 && scrollY > innerHeight * 0.5) cur = i;
  });
  if (cur === lastCur) return;
  lastCur = cur;
  $$('#dots button').forEach((b, i) => b.setAttribute('aria-current', String(i === cur)));
}

// ---------- preview toggle (development only) ----------
if (SHOW_PREVIEW_TOGGLE && code === null) {
  const pv = $('#preview');
  pv.hidden = false;
  $$('[data-preview]', pv).forEach((b) => b.addEventListener('click', () => { invite = b.dataset.preview; applyInvite(); }));
}
applyInvite();
onLang(() => { journey.measure(); });
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => journey.measure());

// rebuild dots once we know whether the story video exists
$('#story-video').addEventListener('loadeddata', buildDots);

// ---------- after the flight: quiet fade-ins ----------
if (!reduced) {
  const seen = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('seen'); seen.unobserve(e.target); } }), { threshold: 0.15 });
  $$('.after .panel-in > *, .vratham .lines li').forEach((el) => { el.classList.add('fade-in'); seen.observe(el); });
}

// ---------- guests ----------
initRSVP(getInvite);
initMemories(getInvite);

// ---------- sound button ----------
const mute = $('#mute');
const paintMute = () => mute.setAttribute('aria-pressed', String(isMuted()));
mute.addEventListener('click', () => { setMuted(!isMuted()); paintMute(); });
paintMute();
