// Diagnostics. Always records problems; with ?debug in the address it also
// shows a small panel (WebGL support, GPU, frame rate, errors) so a guest's
// phone can tell us what went wrong.
const on = new URLSearchParams(location.search).has('debug');
const lines = [];
const info = {};
let panel = null;
let fps = 0, frames = 0, t0 = performance.now();

function paint() {
  if (!panel) return;
  const rows = Object.entries(info).map(([k, v]) => `${k}: ${v}`);
  panel.textContent = [...rows, `fps: ${fps}`, ...lines.slice(-8)].join('\n');
}

export const diag = {
  log(msg) { lines.push(String(msg).slice(0, 300)); if (lines.length > 40) lines.shift(); paint(); },
  set(k, v) { info[k] = v; paint(); },
  frame(now) {
    frames++;
    if (now - t0 > 1000) { fps = Math.round((frames * 1000) / (now - t0)); frames = 0; t0 = now; paint(); }
  },
};

window.addEventListener('error', (e) => diag.log('error: ' + (e.message || e.error)));
window.addEventListener('unhandledrejection', (e) => diag.log('promise: ' + (e.reason && e.reason.message ? e.reason.message : e.reason)));

if (on) {
  panel = document.createElement('pre');
  panel.style.cssText = 'position:fixed;left:8px;bottom:60px;z-index:99;max-width:94vw;margin:0;padding:8px 10px;font:11px/1.35 ui-monospace,Menlo,monospace;color:#e9f0ff;background:rgba(0,0,0,.72);border-radius:8px;white-space:pre-wrap;pointer-events:none';
  document.addEventListener('DOMContentLoaded', () => document.body.appendChild(panel));
  if (document.body) document.body.appendChild(panel);
  diag.set('ua', navigator.userAgent.replace(/^Mozilla\/5.0 /, '').slice(0, 120));
}
