import { INVITES, SHOW_PREVIEW_TOGGLE, MUHURTHAM, LINKS, REGISTRY_EMBED, STORY, LOOKS } from './config.js';
import { setLang, initialLang, t, onLang, lang } from './i18n.js';
import { initOpening } from './opening.js';
import { createWorld } from './world/world.js';
import { initReveals } from './reveals.js';
import { initRSVP, initMemories } from './guests.js';
import { isMuted, setMuted, setWorldMusic } from './audio.js';

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

function applyInvite() {
  document.body.dataset.invite = invite;
  $$('[data-only="full"]').forEach((el) => { el.hidden = invite !== 'full'; });
  buildDots();
  $$('#preview [data-preview]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.preview === invite)));
}

// ---------- language ----------
function paintLang() {
  $$('.lang [data-lang]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === lang())));
}
$$('.lang [data-lang]').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang)));
onLang(paintLang);
setLang(initialLang(), false);
paintLang();

// ---------- scroll lock until the reveal ----------
const lockKeys = new Set([' ', 'PageDown', 'PageUp', 'ArrowDown', 'ArrowUp', 'Home', 'End']);
let locked = true;
const block = (e) => { if (locked) e.preventDefault(); };
const blockKeys = (e) => { if (locked && lockKeys.has(e.key) && !e.target.closest('button')) e.preventDefault(); };
window.addEventListener('wheel', block, { passive: false });
window.addEventListener('touchmove', block, { passive: false });
window.addEventListener('keydown', blockKeys);
document.documentElement.classList.add('is-locked');

// ---------- section dots ----------
let dotTargets = [];
function buildDots() {
  const nav = $('#dots');
  nav.textContent = '';
  dotTargets = $$('[data-dot]').filter((el) => !el.closest('[hidden]'));
  dotTargets.forEach((el) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.i18nAria = el.dataset.dot;
    b.setAttribute('aria-label', t(el.dataset.dot));
    const tip = document.createElement('span');
    tip.className = 'tip'; tip.dataset.i18n = el.dataset.dot; tip.textContent = t(el.dataset.dot);
    tip.setAttribute('aria-hidden', 'true');
    b.appendChild(tip);
    b.addEventListener('click', () => {
      const top = el.getBoundingClientRect().top + scrollY;
      const target = el.classList.contains('scrolly') ? top : top + el.offsetHeight / 2 - innerHeight / 2;
      scrollTo({ top: Math.max(0, target), behavior: reduced ? 'auto' : 'smooth' });
    });
    nav.appendChild(b);
  });
}
function updateDots() {
  const mid = scrollY + innerHeight * 0.5;
  let cur = -1;
  dotTargets.forEach((el, i) => { if (el.getBoundingClientRect().top + scrollY <= mid) cur = i; });
  $$('#dots button').forEach((b, i) => b.setAttribute('aria-current', String(i === cur)));
}

// ---------- preview toggle (development only) ----------
if (SHOW_PREVIEW_TOGGLE && code === null) {
  const p = $('#preview');
  p.hidden = false;
  $$('[data-preview]', p).forEach((b) => b.addEventListener('click', () => {
    invite = b.dataset.preview;
    applyInvite();
    relayout();
  }));
}

applyInvite();

// ---------- links ----------
$('#map-link').href = LINKS.map;
$('#registry-link').href = LINKS.registry;
if (REGISTRY_EMBED) {
  const box = $('.registry-embed');
  const f = document.createElement('iframe');
  f.src = LINKS.registry; f.title = 'Registry'; f.loading = 'lazy';
  box.appendChild(f); box.hidden = false;
}

// ---------- countdown ----------
const target = new Date(MUHURTHAM).getTime();
const cd = { d: $('[data-cd="d"]'), h: $('[data-cd="h"]'), m: $('[data-cd="m"]'), s: $('[data-cd="s"]') };
function tickCountdown() {
  let s = Math.max(0, Math.floor((target - Date.now()) / 1000));
  const d = Math.floor(s / 86400); s -= d * 86400;
  const h = Math.floor(s / 3600); s -= h * 3600;
  const m = Math.floor(s / 60); s -= m * 60;
  cd.d.textContent = d; cd.h.textContent = String(h).padStart(2, '0');
  cd.m.textContent = String(m).padStart(2, '0'); cd.s.textContent = String(s).padStart(2, '0');
}
tickCountdown();
setInterval(tickCountdown, 1000);

// ---------- lazy photos ----------
const lazy = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    const img = e.target;
    lazy.unobserve(img);
    img.addEventListener('load', () => img.classList.add('loaded'), { once: true });
    img.addEventListener('error', () => img.classList.add('missing'), { once: true });
    img.src = img.dataset.src;
  });
}, { rootMargin: '120% 0px' });
$$('img[data-src]').forEach((img) => lazy.observe(img));

// optional reference looks
Object.entries(LOOKS).forEach(([world, looks]) => {
  const box = $(`[data-looks="${world}"]`);
  if (!box || !looks.length) return;
  looks.slice(0, 3).forEach((l) => {
    const f = document.createElement('figure');
    f.innerHTML = '<img alt="" loading="lazy" decoding="async"><figcaption></figcaption>';
    f.querySelector('img').src = l.src;
    f.querySelector('figcaption').textContent = l.credit || '';
    box.appendChild(f);
  });
});

// ---------- our story video ----------
const video = $('#story-video');
video.poster = STORY.poster;
new IntersectionObserver((es, o) => {
  if (!es[0].isIntersecting) return;
  o.disconnect();
  video.src = STORY.src;
  video.preload = 'auto';
}, { rootMargin: '100% 0px' }).observe(video);
new IntersectionObserver((es) => {
  if (es[0].isIntersecting) video.play().catch(() => {}); else video.pause();
}, { threshold: 0.3 }).observe(video);
if (reduced) video.removeAttribute('loop');

// ---------- gentle fade-in for panels ----------
if (!reduced) {
  const seen = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('seen'); seen.unobserve(e.target); } }), { threshold: 0.15 });
  $$('.invite .panel-in > *, .story .panel-in > *, .venue .panel-in > *, .rsvp .panel-in > *, .memories .panel-in > *, .closing .panel-in > *')
    .forEach((el) => { el.classList.add('fade-in'); seen.observe(el); });
}

// ---------- the 3D world ----------
const world = createWorld({ canvas: $('#world'), fallback: $('#world-fallback'), shade: $('#shade'), reduced });
const reveals = initReveals({ reduced });

function relayout() {
  world.refreshAnchors(invite);
  reveals.measure();
  reveals.update();
  updateDots();
}
let rl;
const relayoutSoon = () => { clearTimeout(rl); rl = setTimeout(relayout, 80); };
window.addEventListener('resize', relayoutSoon);
if ('ResizeObserver' in window) new ResizeObserver(relayoutSoon).observe($('main'));
if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayoutSoon);
onLang(relayoutSoon);
relayout();

// ---------- guests ----------
initRSVP(getInvite);
initMemories(getInvite);

// ---------- sound button ----------
const mute = $('#mute');
const paintMute = () => mute.setAttribute('aria-pressed', String(isMuted()));
mute.addEventListener('click', () => { setMuted(!isMuted()); paintMute(); });
paintMute();

// ---------- scroll-linked bits ----------
let q = false;
window.addEventListener('scroll', () => {
  if (q) return; q = true;
  requestAnimationFrame(() => {
    q = false;
    updateDots();
    const env = world.state.env;
    const inWorld = env && parseFloat($('#shade').style.opacity || '0') < 0.5 && scrollY > $('#gate').offsetTop;
    setWorldMusic(inWorld ? (world.state.z < 45 ? 'sangeeth' : world.state.z < 90 ? 'haldi' : 'wedding') : null);
  });
}, { passive: true });

// ---------- opening ----------
initOpening({
  reduced,
  onOpened() {
    locked = false;
    document.documentElement.classList.remove('is-locked');
    document.body.classList.remove('is-locked');
    $('#dots').hidden = false; $('#mute').hidden = false;
    requestAnimationFrame(() => { $('#dots').classList.add('on'); $('#mute').classList.add('on'); });
    relayout();
    world.start();
  },
});
