// Scroll-driven reveals. Each tall ".scrolly" section pins its content
// while guests scroll; progress through it lights stars, throws colour,
// lights lamps, turns swatches and pulls the ribbon. Tapping any of those
// simply scrolls guests forward to the next reveal.
import { MOHANAM, softBell, templeBells, puff, pageTurn, NOTE } from './audio.js';
import { Diya } from './fx/diya.js';
import { createGulal } from './fx/gulal.js';
import { fabricURL } from './fx/fabrics.js';
import { t, onLang } from './i18n.js';

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

export function initReveals({ reduced }) {
  const sections = [];
  const gulal = reduced ? null : createGulal(document.getElementById('gulal'));

  function register(el, handlers) {
    const steps = +el.dataset.steps || 1;
    const s = { el, steps, count: 0, p: 0, top: 0, len: 1, ...handlers };
    sections.push(s);
    // a "finish" link and tap targets scroll forward instead of revealing by click
    el.querySelectorAll('[data-finish]').forEach((b) => b.addEventListener('click', () => scrollToP(s, 0.93)));
    return s;
  }

  function measure() {
    const sy = window.scrollY, vh = window.innerHeight;
    sections.forEach((s) => {
      s.top = s.el.getBoundingClientRect().top + sy;
      s.len = Math.max(1, s.el.offsetHeight - vh);
    });
  }

  // progress 0.06..0.86 maps onto the steps
  const countFor = (s, p) => clamp(Math.ceil(((p - 0.06) / 0.8) * s.steps), 0, s.steps);
  const pFor = (s, count) => 0.06 + ((count - 0.5) / s.steps) * 0.8;

  function scrollToP(s, p) {
    window.scrollTo({ top: s.top + p * s.len + 2, behavior: reduced ? 'auto' : 'smooth' });
  }
  function next(s) { scrollToP(s, pFor(s, Math.min(s.steps, s.count + 1)) + 0.02); }

  function update() {
    const sy = window.scrollY;
    sections.forEach((s) => {
      if (!s.el.offsetParent) return;
      const p = clamp((sy - s.top) / s.len, 0, 1);
      s.p = p;
      if (s.onProgress) s.onProgress(p);
      const c = countFor(s, p);
      // reveals stay once revealed
      while (s.count < c) { s.count++; s.onStep && s.onStep(s.count - 1); }
      if (s.count >= s.steps && s.done !== true) { s.done = true; s.el.querySelectorAll('[data-finish]').forEach((b) => b.classList.add('gone')); }
    });
  }

  // ---------- Sangeeth: five stars form a musical note ----------
  const stars = document.getElementById('sg-stars');
  if (stars) {
    const starBtns = [...stars.querySelectorAll('.star')];
    const lines = [...stars.querySelectorAll('.note-lines line')];
    lines.forEach((l) => l.setAttribute('pathLength', '1'));
    const items = [...stars.querySelectorAll('.reveal-lines li')];
    const s = register(stars, {
      onStep(i) {
        starBtns[i].classList.add('on');
        if (i > 0) lines[i - 1].classList.add('on');
        items[i].classList.add('on');
        softBell(MOHANAM[i], 0, 0.2);
      },
    });
    starBtns.forEach((b) => b.addEventListener('click', () => next(s)));
  }

  // ---------- Haldi: throw colour ----------
  const thr = document.getElementById('hd-throw');
  if (thr) {
    const items = [...thr.querySelectorAll('.reveal-lines li')];
    const spots = [[0.28, 0.24], [0.74, 0.3], [0.22, 0.76], [0.78, 0.72]];
    register(thr, {
      onStep(i) {
        items[i].classList.add('on');
        puff(i);
        if (gulal) { const [x, y] = spots[i % 4]; gulal.burst(x * innerWidth, y * innerHeight, 1); }
      },
    });
    // tapping anywhere here throws a little extra colour, just for fun
    thr.addEventListener('pointerdown', (e) => {
      if (!gulal || e.target.closest('button')) return;
      gulal.burst(e.clientX, e.clientY, 0.7);
      puff(Math.floor(Math.random() * 5));
    });
  }

  // ---------- Wedding: lamps light the morning ----------
  const tl = document.getElementById('wd-time');
  if (tl) {
    const rows = [...tl.querySelectorAll('.timeline li')];
    const diyas = rows.map((r) => new Diya(r.querySelector('canvas')));
    const s = register(tl, {
      onStep(i) {
        rows[i].classList.add('on');
        diyas[i].light();
        if (i === 1) templeBells(); else softBell(i === 0 ? NOTE.A4 : NOTE.D5, 0, 0.2);
      },
    });
    rows.forEach((r) => r.querySelector('button').addEventListener('click', () => next(s)));
  }

  // ---------- Vratham: one larger lamp, then the details ----------
  const vr = document.getElementById('vratham');
  if (vr) {
    const diya = new Diya(vr.querySelector('canvas'));
    const items = [...vr.querySelectorAll('.reveal-lines li')];
    const s = register(vr, {
      onStep(i) {
        if (i === 0) { diya.light(); softBell(NOTE.D4, 0, 0.24); softBell(NOTE.A4, 0.25, 0.16); }
        else items[i - 1].classList.add('on');
      },
    });
    vr.querySelector('.diya-btn').addEventListener('click', () => next(s));
  }

  // ---------- What to wear: a swatch book that turns as you scroll ----------
  document.querySelectorAll('.swatchbook').forEach((book) => {
    const set = book.dataset.set;
    const fabrics = book.dataset.fabrics.split(/\s+/);
    const cards = fabrics.map((f, i) => {
      const card = document.createElement('div');
      card.className = 'swatch';
      card.innerHTML = `<div class="swatch-fabric" role="img"></div><span class="swatch-count">${i + 1} / ${fabrics.length}</span>
        <div class="swatch-tag"><span class="swatch-no">${String(i + 1).padStart(2, '0')}</span><span class="swatch-name"></span><span class="swatch-text"></span></div>`;
      card.style.zIndex = String(fabrics.length - i);
      book.appendChild(card);
      return { card, fab: f, painted: false };
    });
    const label = () => cards.forEach((c, i) => {
      c.card.querySelector('.swatch-name').textContent = t(`wear.${set}.${i + 1}.n`);
      c.card.querySelector('.swatch-text').textContent = t(`wear.${set}.${i + 1}.t`);
      c.card.querySelector('.swatch-fabric').setAttribute('aria-label', t(`wear.${set}.${i + 1}.n`));
    });
    label(); onLang(label);
    // paint the fabrics shortly before the section arrives
    const paint = () => cards.forEach((c, i) => setTimeout(() => {
      if (c.painted) return; c.painted = true;
      c.card.querySelector('.swatch-fabric').style.backgroundImage = `url(${fabricURL(c.fab)})`;
    }, i * 60));
    new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { paint(); o.disconnect(); } }, { rootMargin: '150% 0px' }).observe(book);

    const n = cards.length;
    let lastTurned = 0;
    const sec = book.closest('.scrolly');
    const s = register(sec, {
      onProgress(p) {
        const T = clamp((p - 0.08) / 0.8, 0, 1) * (n - 1);
        const top = Math.floor(T);
        cards.forEach((c, i) => {
          const a = clamp(T - i, 0, 1);
          const e = a * a * (3 - 2 * a);
          if (a > 0) {
            c.card.style.transform = `translateY(${-e * 8}%) rotateX(${-e * 100}deg)`;
            c.card.style.opacity = String(1 - clamp((e - 0.7) / 0.3, 0, 1));
          } else {
            const r = i - top;
            c.card.style.transform = `translateY(${r * 9}px) scale(${1 - r * 0.035})`;
            c.card.style.opacity = r > 3 ? '0' : '1';
          }
        });
        const turned = Math.floor(T + 0.5);
        if (turned > lastTurned) pageTurn(turned);
        lastTurned = Math.max(lastTurned, turned);
      },
    });
    book.addEventListener('click', () => {
      const cur = Math.round(clamp((s.p - 0.08) / 0.8, 0, 1) * (n - 1));
      scrollToP(s, 0.08 + ((cur + 1) / (n - 1)) * 0.8);
    });
  });

  // ---------- Gifts: pull the ribbon ----------
  const gifts = document.getElementById('gifts');
  if (gifts) {
    const v = gifts.querySelector('.ribbon-v'), h = gifts.querySelector('.ribbon-h');
    const bow = gifts.querySelector('.bow'), inner = gifts.querySelector('.gc-inner');
    let rang = false;
    const s = register(gifts, {
      onProgress(p) {
        const k = clamp((p - 0.12) / 0.62, 0, 1);
        const e = k * k * (3 - 2 * k);
        const b = clamp(k / 0.45, 0, 1);
        bow.style.transform = `translate(-50%, ${-54 - b * 40}%) scale(${1 - b * 0.35}) rotate(${b * -12}deg)`;
        bow.style.opacity = String(1 - b);
        bow.style.visibility = b >= 1 ? 'hidden' : '';
        v.style.transform = `translateY(${clamp((e - 0.25) / 0.75, 0, 1) * 110}%)`;
        h.style.transform = `translateX(${clamp((e - 0.3) / 0.7, 0, 1) * 110}%)`;
        inner.style.opacity = String(clamp((k - 0.55) / 0.4, 0, 1));
        inner.style.pointerEvents = k > 0.8 ? 'auto' : 'none';
        if (k > 0.3 && !rang) { rang = true; softBell(NOTE.Fs5, 0, 0.18); softBell(NOTE.A5, 0.18, 0.14); }
      },
    });
    bow.addEventListener('click', () => scrollToP(s, 0.9));
  }

  let queued = false;
  const onScroll = () => { if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; update(); }); } };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => { measure(); update(); });
  measure();
  update();
  return { measure, update };
}
