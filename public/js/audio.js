// All sound is generated here with Web Audio: no audio files needed.
// Sound starts only after the first tap (browser autoplay rules).
import { MUSIC } from './config.js';

let ctx = null;
let master = null;
let muted = false;
const cache = new Map();

// Sa = D. Frequencies for the notes we use.
export const NOTE = {
  D3: 146.83, A3: 220.0, D4: 293.66, E4: 329.63, Fs4: 369.99, A4: 440.0, B4: 493.88,
  D5: 587.33, E5: 659.25, Fs5: 739.99, A5: 880.0, B5: 987.77,
};
// Raga Mohanam: Sa Re Ga Pa Dha
export const MOHANAM = [NOTE.D5, NOTE.E5, NOTE.Fs5, NOTE.A5, NOTE.B5];

try { muted = localStorage.getItem('ragaa.muted') === '1'; } catch (e) { /* ignore */ }

export function unlock() {
  if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  try {
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.9;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 3;
    master.connect(comp).connect(ctx.destination);
    // iOS needs a sound started inside the gesture.
    const b = ctx.createBuffer(1, 1, 22050);
    const s = ctx.createBufferSource(); s.buffer = b; s.connect(master); s.start(0);
    if (ctx.state === 'suspended') ctx.resume();
  } catch (e) { ctx = null; }
}

export const isMuted = () => muted;
export function setMuted(m) {
  muted = m;
  try { localStorage.setItem('ragaa.muted', m ? '1' : '0'); } catch (e) { /* ignore */ }
  if (master) master.gain.setTargetAtTime(m ? 0 : 0.9, ctx.currentTime, 0.05);
  if (musicEl) musicEl.muted = m;
}

const ready = () => ctx && !muted && ctx.state !== 'closed';

// Karplus-Strong plucked string with a little buzz, rendered once per pitch.
function stringBuffer(freq) {
  const key = 'ks' + freq;
  if (cache.has(key)) return cache.get(key);
  const sr = ctx.sampleRate;
  const len = Math.floor(sr * 2.6);
  const buf = ctx.createBuffer(1, len, sr);
  const out = buf.getChannelData(0);
  const N = Math.max(2, Math.round(sr / freq));
  const line = new Float32Array(N);
  // Pluck position shapes the excitation: a softened noise burst.
  let prev = 0;
  for (let i = 0; i < N; i++) { const n = Math.random() * 2 - 1; prev = prev * 0.45 + n * 0.55; line[i] = prev; }
  let idx = 0;
  const decay = 0.9965;
  for (let i = 0; i < len; i++) {
    const a = line[idx];
    const b = line[(idx + 1) % N];
    line[idx] = decay * 0.5 * (a + b);
    // Jawari-like buzz: a gentle asymmetric bend on the output only
    // (the DC it adds is removed by the high-pass in pluck()).
    out[i] = a + 0.35 * a * a;
    idx = (idx + 1) % N;
  }
  // Fade out the tail and normalise.
  let peak = 0;
  for (let i = 0; i < len; i++) peak = Math.max(peak, Math.abs(out[i]));
  const fadeFrom = Math.floor(len * 0.7);
  for (let i = 0; i < len; i++) {
    let g = 1 / (peak || 1);
    if (i > fadeFrom) g *= 1 - (i - fadeFrom) / (len - fadeFrom);
    out[i] *= g;
  }
  cache.set(key, buf);
  return buf;
}

export function pluck(freq, when = 0, gain = 0.5) {
  if (!ready()) return;
  const t = ctx.currentTime + when;
  const src = ctx.createBufferSource();
  src.buffer = stringBuffer(freq);
  const g = ctx.createGain(); g.gain.value = gain;
  const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 70;
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3800; lp.Q.value = 0.4;
  // A faint body resonance, like the veena's gourd.
  const body = ctx.createBiquadFilter(); body.type = 'peaking'; body.frequency.value = 240; body.gain.value = 5; body.Q.value = 1.2;
  src.connect(hp).connect(lp).connect(body).connect(g).connect(master);
  src.start(t);
}

// Bell from inharmonic sine partials.
function bellVoice(freq, t, gain, partials, length) {
  partials.forEach(([ratio, amp, decay]) => {
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = freq * ratio;
    o.detune.value = (Math.random() - 0.5) * 6;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain * amp, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, t + length * decay);
    o.connect(g).connect(master);
    o.start(t);
    o.stop(t + length * decay + 0.05);
  });
}

const TEMPLE = [[0.5, 0.35, 1], [1, 1, 0.9], [1.183, 0.45, 0.6], [1.506, 0.3, 0.5], [2.0, 0.35, 0.45], [2.74, 0.22, 0.3], [3.76, 0.12, 0.2], [5.4, 0.07, 0.12]];
const SOFT = [[1, 1, 1], [2.0, 0.22, 0.55], [3.01, 0.08, 0.35], [4.18, 0.04, 0.2]];

export function templeBell(when = 0, freq = 1180, gain = 0.28) {
  if (!ready()) return;
  bellVoice(freq, ctx.currentTime + when, gain, TEMPLE, 3.6);
}

export function softBell(freq, when = 0, gain = 0.22) {
  if (!ready()) return;
  bellVoice(freq, ctx.currentTime + when, gain, SOFT, 1.8);
}

// Opening: Sa, Pa, Sa on the veena, then a small temple bell.
export function openingChord() {
  pluck(NOTE.D3, 0, 0.55);
  pluck(NOTE.A3, 0.22, 0.5);
  pluck(NOTE.D4, 0.44, 0.5);
  templeBell(0.95, 1320, 0.2);
}

export function templeBells() {
  templeBell(0, 1180, 0.26);
  templeBell(0.42, 1420, 0.18);
  templeBell(0.9, 1180, 0.22);
}

// Colour throw: a soft low note with a breath of noise.
export function puff(i = 0) {
  if (!ready()) return;
  softBell([NOTE.D4, NOTE.Fs4, NOTE.A4, NOTE.B4, NOTE.D5][i % 5], 0, 0.14);
  const t = ctx.currentTime;
  const len = Math.floor(ctx.sampleRate * 0.5);
  const b = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = b.getChannelData(0);
  for (let k = 0; k < len; k++) d[k] = (Math.random() * 2 - 1) * Math.pow(1 - k / len, 2);
  const s = ctx.createBufferSource(); s.buffer = b;
  const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 0.7;
  const g = ctx.createGain(); g.gain.value = 0.08;
  s.connect(f).connect(g).connect(master); s.start(t);
}

export const pageTurn = (i = 0) => softBell([NOTE.A4, NOTE.B4, NOTE.D5, NOTE.E5, NOTE.Fs5][i % 5], 0, 0.1);

// ---- Background music hook (per world, open-licence files only) ----
let musicEl = null;
let musicWorld = null;
export function setWorldMusic(world) {
  if (world === musicWorld) return;
  musicWorld = world;
  const src = world && MUSIC[world];
  if (!ctx) return; // only after the first tap
  if (!src) { if (musicEl) fadeTo(musicEl, 0, () => musicEl && musicEl.pause()); return; }
  if (!musicEl) { musicEl = new Audio(); musicEl.loop = true; musicEl.preload = 'none'; musicEl.volume = 0; }
  musicEl.muted = muted;
  const start = () => { musicEl.play().catch(() => {}); fadeTo(musicEl, 0.35); };
  if (musicEl.src.endsWith(src)) { start(); return; }
  fadeTo(musicEl, 0, () => { musicEl.src = src; start(); });
}
function fadeTo(el, v, done) {
  const from = el.volume, t0 = performance.now();
  const step = (now) => {
    const k = Math.min(1, (now - t0) / 900);
    el.volume = from + (v - from) * k;
    if (k < 1) requestAnimationFrame(step); else if (done) done();
  };
  requestAnimationFrame(step);
}
