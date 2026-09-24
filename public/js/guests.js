// RSVP and the Memories photo wall, backed by Google Apps Script.
import { GAS_URL } from './config.js';
import { t, lang, onLang } from './i18n.js';

const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode */ } },
};

function post(payload) {
  // no-cors: Apps Script answers with a redirect we can't read; a resolved
  // fetch means the request left the phone.
  return fetch(GAS_URL, {
    method: 'POST', mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(payload),
  });
}

const PERSON = '<svg viewBox="0 0 18 30" aria-hidden="true"><circle cx="9" cy="6" r="3.6"/><path d="M3 28V17.5C3 13.6 5.6 11.5 9 11.5s6 2.1 6 6V28"/></svg>';

export function initRSVP(getInvite) {
  const form = document.getElementById('rsvp-form');
  const done = document.getElementById('rsvp-done');
  const nameIn = form.elements.name;
  const out = document.getElementById('count');
  const people = form.querySelector('.people');
  const msg = form.querySelector('.form-msg');
  const [less, more] = form.querySelectorAll('.step');
  let n = 1;

  function setCount(v) {
    n = Math.min(20, Math.max(1, v));
    out.textContent = n;
    less.disabled = n <= 1; more.disabled = n >= 20;
    while (people.children.length < n) people.insertAdjacentHTML('beforeend', PERSON);
    while (people.children.length > n) people.lastElementChild.remove();
  }
  less.addEventListener('click', () => setCount(n - 1));
  more.addEventListener('click', () => setCount(n + 1));

  function showDone(r) {
    done.querySelector('.thanks').textContent = t('rsvp.thanks', { name: r.name });
    form.hidden = true; done.hidden = false;
  }
  onLang(() => { const r = store.get('ragaa.rsvp'); if (r && !done.hidden) showDone(r); });

  const saved = store.get('ragaa.rsvp');
  if (saved) { nameIn.value = saved.name; setCount(saved.people); showDone(saved); } else setCount(1);

  done.querySelector('button').addEventListener('click', () => {
    done.hidden = true; form.hidden = false; msg.textContent = ''; nameIn.focus();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = nameIn.value.trim().replace(/\s+/g, ' ');
    if (!name) { msg.textContent = t('rsvp.errName'); nameIn.focus(); return; }
    msg.textContent = '';
    const r = { type: 'rsvp', name, people: n, invite: getInvite(), lang: lang(), at: new Date().toISOString() };
    const btn = form.querySelector('[type=submit]');
    btn.disabled = true;
    try {
      if (GAS_URL) await post(r);
      store.set('ragaa.rsvp', r);
      showDone(r);
    } catch (err) {
      msg.textContent = t('rsvp.errNet');
    } finally { btn.disabled = false; }
  });
}

// Resize on the phone to at most 1600 px, JPEG quality 0.85.
async function shrink(file) {
  let src;
  try { src = await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch (e) { src = null; }
  if (!src) {
    src = await new Promise((res, rej) => {
      const im = new Image();
      im.onload = () => res(im); im.onerror = rej;
      im.src = URL.createObjectURL(file);
    });
  }
  const w = src.width, h = src.height;
  const k = Math.min(1, 1600 / Math.max(w, h));
  const c = document.createElement('canvas');
  c.width = Math.round(w * k); c.height = Math.round(h * k);
  c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
  if (src.close) src.close();
  return c.toDataURL('image/jpeg', 0.85).split(',')[1];
}

export function initMemories(getInvite) {
  const input = document.getElementById('photo-input');
  const label = input.closest('.file-btn');
  const status = document.querySelector('.mem-status');
  const wall = document.querySelector('.wall');
  const empty = document.querySelector('.mem-empty');
  let statusKey = null, statusVars = null;
  const say = (k, v) => { statusKey = k; statusVars = v; status.textContent = k ? t(k, v) : ''; };
  onLang(() => say(statusKey, statusVars));

  if (!GAS_URL) {
    label.classList.add('disabled');
    input.disabled = true;
    say('mem.closed');
    return;
  }

  async function load() {
    try {
      const res = await fetch(GAS_URL + '?action=list', { cache: 'no-store' });
      const data = await res.json();
      const photos = (data && data.photos) || [];
      wall.textContent = '';
      photos.forEach((p, i) => {
        const f = document.createElement('figure');
        f.style.setProperty('--r', ((i * 37) % 7 - 3) * 0.6 + 'deg');
        const img = new Image();
        img.loading = 'lazy'; img.decoding = 'async'; img.alt = '';
        img.referrerPolicy = 'no-referrer';
        img.src = p.url;
        f.appendChild(img);
        wall.appendChild(f);
      });
      empty.hidden = photos.length > 0;
    } catch (e) { empty.hidden = false; }
  }
  new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { load(); o.disconnect(); } }, { rootMargin: '600px' })
    .observe(document.getElementById('memories'));

  input.addEventListener('change', async () => {
    const files = [...input.files].filter((f) => f.type.startsWith('image/'));
    input.value = '';
    if (!files.length) return;
    say('mem.sending', { n: files.length });
    let failed = 0;
    for (const file of files) {
      try {
        const data = await shrink(file);
        await post({ type: 'photo', name: file.name, mime: 'image/jpeg', data, invite: getInvite(), lang: lang(), at: new Date().toISOString() });
      } catch (e) { failed++; }
    }
    say(failed ? 'mem.err' : 'mem.thanks');
  });
}
