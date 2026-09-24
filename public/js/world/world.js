// Renders the 3D world behind the event sections and flies the camera
// between section anchors as guests scroll.
import { VERT, FRAG } from './shader.js';

const pathX = (z) => 2.4 * Math.sin(z * 0.08) + 1.3 * Math.sin(z * 0.031 + 1.7);
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const mix = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const easeInOut = (t) => t * t * t * (t * (t * 6 - 15) + 10);

const QUALITY = [
  { steps: 48, oct: 4, shadow: 0 },
  { steps: 72, oct: 5, shadow: 10 },
  { steps: 100, oct: 6, shadow: 16 },
];
const MAX_PIXELS = 900000;

export function createWorld({ canvas, fallback, shade, reduced }) {
  const coarse = matchMedia('(pointer: coarse)').matches;
  const phone = coarse && Math.min(innerWidth, innerHeight) < 820;
  let scale = phone ? 0.42 : 0.55;
  const minScale = 0.2, maxScale = phone ? 0.6 : 0.8;
  let q = phone ? 1 : 2;

  const gl = initGL();
  let anchors = [];
  let gateTop = 0, shadeRange = null;
  let running = false, visible = false;
  let camera = null;               // smoothed state
  let lastRoll = 0, lastYaw = null;
  let frame = 0, perfFrames = 0, perfTime = 0, lastNow = 0, stillFor = 0, calmWindows = 0;
  let reducedIdx = -1, reducedCam = null;
  let debugPose = null;

  function initGL() {
    let g = null;
    try {
      g = canvas.getContext('webgl', { antialias: false, alpha: false, depth: false, stencil: false, powerPreference: 'high-performance', preserveDrawingBuffer: false });
    } catch (e) { g = null; }
    if (!g) return null;
    const hp = g.getShaderPrecisionFormat(g.FRAGMENT_SHADER, g.HIGH_FLOAT);
    const prec = hp && hp.precision > 0 ? 'highp' : 'mediump';
    const sh = (type, src) => {
      const s = g.createShader(type);
      g.shaderSource(s, src); g.compileShader(s);
      if (!g.getShaderParameter(s, g.COMPILE_STATUS)) { console.warn(g.getShaderInfoLog(s)); return null; }
      return s;
    };
    const vs = sh(g.VERTEX_SHADER, VERT);
    const fs = sh(g.FRAGMENT_SHADER, 'precision ' + prec + ' float;\nprecision ' + prec + ' int;\n' + FRAG);
    if (!vs || !fs) return null;
    const prog = g.createProgram();
    g.attachShader(prog, vs); g.attachShader(prog, fs); g.linkProgram(prog);
    if (!g.getProgramParameter(prog, g.LINK_STATUS)) { console.warn(g.getProgramInfoLog(prog)); return null; }
    g.useProgram(prog);
    const buf = g.createBuffer();
    g.bindBuffer(g.ARRAY_BUFFER, buf);
    g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), g.STATIC_DRAW);
    const loc = g.getAttribLocation(prog, 'aPos');
    g.enableVertexAttribArray(loc);
    g.vertexAttribPointer(loc, 2, g.FLOAT, false, 0, 0);
    // 256x256 random texture for fast smooth noise
    const tex = g.createTexture();
    const data = new Uint8Array(256 * 256 * 4);
    let seed = 1337;
    for (let i = 0; i < data.length; i++) { seed = (seed * 1664525 + 1013904223) >>> 0; data[i] = seed >>> 24; }
    g.activeTexture(g.TEXTURE0);
    g.bindTexture(g.TEXTURE_2D, tex);
    g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, 256, 256, 0, g.RGBA, g.UNSIGNED_BYTE, data);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MIN_FILTER, g.LINEAR);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_MAG_FILTER, g.LINEAR);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_S, g.REPEAT);
    g.texParameteri(g.TEXTURE_2D, g.TEXTURE_WRAP_T, g.REPEAT);
    const u = {};
    ['uRes', 'uTime', 'uCamPos', 'uCamFwd', 'uCamRight', 'uCamUp', 'uFocal', 'uSun', 'uMoon', 'uNight', 'uDawn', 'uDay',
      'uHaze', 'uCloud', 'uExposure', 'uPix', 'uSteps', 'uOct', 'uShadow', 'uNoise']
      .forEach((n) => { u[n] = g.getUniformLocation(prog, n); });
    g.uniform1i(u.uNoise, 0);
    canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); useFallback(); });
    return { g, u };
  }

  let usingFallback = !gl;
  function useFallback() {
    usingFallback = true;
    canvas.classList.remove('on');
    canvas.style.display = 'none';
  }
  if (!gl) useFallback();

  function resize() {
    if (!gl) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const cw = canvas.clientWidth || innerWidth, ch = canvas.clientHeight || innerHeight;
    let w = cw * dpr * scale, h = ch * dpr * scale;
    if (w * h > MAX_PIXELS) { const k = Math.sqrt(MAX_PIXELS / (w * h)); w *= k; h *= k; }
    w = Math.max(64, Math.round(w)); h = Math.max(64, Math.round(h));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w; canvas.height = h;
      gl.g.viewport(0, 0, w, h);
    }
  }

  // --- anchors from the DOM ---
  function parseCam(str) {
    const [z, y, pitch, l0, l1] = str.trim().split(/\s+/).map(Number);
    return { z, y, pitch, l0, l1: isNaN(l1) ? l0 : l1 };
  }
  function refreshAnchors(invite) {
    const vh = window.innerHeight;
    const sy = window.scrollY;
    anchors = [];
    const gate = document.getElementById('gate');
    gateTop = gate.getBoundingClientRect().top + sy;
    const gateCam = parseCam(gate.dataset[invite === 'wedding' ? 'camWedding' : 'camFull']);
    const gTop = gateTop + gate.offsetHeight - vh;
    anchors.push({ ...gateCam, a: gTop - vh * 0.6, b: gTop - vh * 0.6, el: gate });
    document.querySelectorAll('[data-cam]').forEach((el) => {
      if (!el.offsetParent && getComputedStyle(el).position !== 'fixed') return; // hidden for this invite
      const r = el.getBoundingClientRect();
      const top = r.top + sy, h = el.offsetHeight;
      const cam = parseCam(el.dataset.cam);
      let a, b;
      if (el.classList.contains('scrolly')) { a = top; b = top + h - vh; }
      else { a = b = top + h / 2 - vh / 2; }
      anchors.push({ ...cam, a, b, el });
    });
    anchors.sort((m, n) => m.a - n.a);
    // shade: fades in after the last world section, deepens after the Vratham
    const vr = document.getElementById('vratham');
    const venue = document.getElementById('venue');
    const lastWorld = [...document.querySelectorAll('.world .w-sec')].filter((e) => e.offsetParent).pop();
    const lwEnd = lastWorld.getBoundingClientRect().top + sy + lastWorld.offsetHeight / 2 - vh / 2;
    const vrTop = vr.getBoundingClientRect().top + sy;
    const vrEnd = vrTop + vr.offsetHeight - vh;
    const veMid = venue.getBoundingClientRect().top + sy + venue.offsetHeight / 2 - vh / 2;
    shadeRange = { a: lwEnd, b: vrTop, c: vrEnd, d: veMid };
  }

  function targetAt(s) {
    const n = anchors.length;
    if (!n) return null;
    if (s <= anchors[0].b) { const A = anchors[0]; return { z: A.z, y: A.y, pitch: A.pitch, l: A.l0, idx: 0 }; }
    for (let i = 0; i < n; i++) {
      const A = anchors[i];
      if (s >= A.a && s <= A.b) {
        const k = A.b > A.a ? (s - A.a) / (A.b - A.a) : 0;
        return { z: A.z, y: A.y, pitch: A.pitch, l: mix(A.l0, A.l1, k), idx: i };
      }
      const B = anchors[i + 1];
      if (B && s > A.b && s < B.a) {
        const u = (s - A.b) / (B.a - A.b);
        const e = easeInOut(clamp((u - 0.2) / 0.6, 0, 1));
        const dz = Math.abs(B.z - A.z);
        const arc = Math.min(2.2, dz * 0.07) * Math.sin(Math.PI * e);
        return {
          z: mix(A.z, B.z, e), y: mix(A.y, B.y, e) + arc, pitch: mix(A.pitch, B.pitch, e) + arc * 0.02,
          l: mix(A.l1, B.l0, u), idx: u < 0.5 ? i : i + 1,
        };
      }
    }
    const Z = anchors[n - 1];
    return { z: Z.z, y: Z.y, pitch: Z.pitch, l: Z.l1, idx: n - 1 };
  }

  function shadeAt(s) {
    if (!shadeRange) return 0;
    const { a, b, c, d } = shadeRange;
    return 0.6 * smooth(a, b, s) + 0.4 * smooth(c, d, s);
  }

  // Lighting and weather from the camera's position along the journey.
  function environment(z, l) {
    const night = 1 - smooth(38, 50, z);
    const coast = smooth(84, 94, z);
    const dawn = coast * (1 - smooth(0.12, 0.5, l)) * (1 - night);
    const day = clamp(1 - night - dawn, 0, 1);
    const haze = smooth(80, 86, z) * (1 - smooth(89.5, 93.5, z));
    const cloud = z > 12 && z < 55 ? 1 : 0;
    const ce = Math.cos(l), se = Math.sin(l);
    // desert sun comes from the side; at the coast it rises ahead, behind the temple
    const sx = mix(0.86, 0.1, coast), sz = mix(0.5, 1, coast);
    const hl = Math.hypot(sx, sz);
    const sun = [ce * sx / hl, se, ce * sz / hl];
    const moon = [-0.1 * ce, se, 0.995 * ce];
    const exposure = night * 1.9 + dawn * 1.15 + day * 0.88;
    return { night, dawn, day, haze, cloud, sun, moon, exposure };
  }

  function norm(v) { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }
  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }

  function render(now, s) {
    const tgt = debugPose || (reduced ? reducedTarget(s) : targetAt(s));
    if (!tgt) return;
    if (debugPose) camera = { ...debugPose };
    const dt = Math.min(0.12, (now - lastNow) / 1000 || 0.016);
    if (!camera) camera = { ...tgt };
    const k = 1 - Math.exp(-dt * (reduced ? 1000 : 5.5));
    const before = camera.z + camera.y + camera.pitch;
    camera.z += (tgt.z - camera.z) * k;
    camera.y += (tgt.y - camera.y) * k;
    camera.pitch += (tgt.pitch - camera.pitch) * k;
    camera.l += (tgt.l - camera.l) * k;
    const moving = Math.abs(camera.z + camera.y + camera.pitch - before) > 0.0004;

    const t = now / 1000;
    const z = camera.z;
    const bob = reduced ? 0 : 0.035 * Math.sin(t * 0.9) + 0.015 * Math.sin(t * 2.3);
    const pos = [pathX(z), camera.y + bob, z];
    // look ahead along the path, FPV style
    const la = 3.5;
    const yaw = Math.atan2(pathX(z + la) - pathX(z), la);
    if (lastYaw === null) lastYaw = yaw;
    const yawRate = (yaw - lastYaw) / Math.max(dt, 0.001);
    lastYaw = yaw;
    const rollT = reduced ? 0 : clamp(-yawRate * 0.35, -0.3, 0.3);
    lastRoll += (rollT - lastRoll) * (1 - Math.exp(-dt * 3));
    const pitch = camera.pitch + (reduced ? 0 : 0.006 * Math.sin(t * 0.7));
    let fwd = norm([Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)]);
    let right = norm(cross([0, 1, 0], fwd));
    let up = cross(fwd, right);
    const cr = Math.cos(lastRoll), sr = Math.sin(lastRoll);
    const r2 = [right[0] * cr + up[0] * sr, right[1] * cr + up[1] * sr, right[2] * cr + up[2] * sr];
    const u2 = [up[0] * cr - right[0] * sr, up[1] * cr - right[1] * sr, up[2] * cr - right[2] * sr];
    right = r2; up = u2;

    const env = environment(z, camera.l);
    state.z = z; state.env = env;

    if (usingFallback) { paintFallback(env); return moving; }

    const { g, u } = gl;
    const portrait = canvas.clientHeight > canvas.clientWidth;
    const fovY = (portrait ? 64 : 48) * Math.PI / 180;
    const focal = 0.5 / Math.tan(fovY / 2);
    const Q = QUALITY[q];
    g.uniform2f(u.uRes, canvas.width, canvas.height);
    g.uniform1f(u.uTime, t % 1000);
    g.uniform3fv(u.uCamPos, pos);
    g.uniform3fv(u.uCamFwd, fwd);
    g.uniform3fv(u.uCamRight, right);
    g.uniform3fv(u.uCamUp, up);
    g.uniform1f(u.uFocal, focal);
    g.uniform3fv(u.uSun, env.sun);
    g.uniform3fv(u.uMoon, norm(env.moon));
    g.uniform1f(u.uNight, env.night);
    g.uniform1f(u.uDawn, env.dawn);
    g.uniform1f(u.uDay, env.day);
    g.uniform1f(u.uHaze, env.haze);
    g.uniform1f(u.uCloud, env.cloud);
    g.uniform1f(u.uExposure, env.exposure);
    g.uniform1f(u.uPix, 1 / (focal * canvas.height));
    g.uniform1i(u.uSteps, Q.steps);
    g.uniform1i(u.uOct, Q.oct);
    g.uniform1i(u.uShadow, Q.shadow);
    g.drawArrays(g.TRIANGLES, 0, 3);
    return moving;
  }

  // Reduced motion: no flights; cross-fade between section views.
  function reducedTarget(s) {
    const tg = targetAt(s);
    if (!tg) return null;
    const A = anchors[tg.idx];
    if (tg.idx !== reducedIdx) {
      const first = reducedIdx === -1;
      reducedIdx = tg.idx;
      if (first) { reducedCam = { z: A.z, y: A.y, pitch: A.pitch, l: A.l0 }; }
      else {
        canvas.style.transition = 'opacity .45s';
        canvas.style.opacity = '0';
        setTimeout(() => { reducedCam = { z: A.z, y: A.y, pitch: A.pitch, l: tg.l }; canvas.style.opacity = ''; }, 460);
      }
    }
    if (reducedCam) reducedCam.l = tg.l;
    return reducedCam;
  }

  let fbKey = '';
  function paintFallback(env) {
    const k = [env.night, env.dawn, env.haze].map((v) => v.toFixed(2)).join();
    if (k === fbKey) return;
    fbKey = k;
    const c = (n, d, y) => {
      const r = n[0] * env.night + d[0] * env.dawn + y[0] * env.day;
      const gg = n[1] * env.night + d[1] * env.dawn + y[1] * env.day;
      const b = n[2] * env.night + d[2] * env.dawn + y[2] * env.day;
      return `rgb(${r | 0},${gg | 0},${b | 0})`;
    };
    const top = c([6, 10, 28], [24, 32, 78], [70, 120, 200]);
    const mid = c([18, 28, 60], [190, 110, 120], [200, 200, 205]);
    const bot = c([40, 50, 80], [250, 140, 70], [226, 180, 120]);
    fallback.style.background = `linear-gradient(${top}, ${mid} 58%, ${bot})`;
  }

  const state = { z: 0, env: null };

  function loop(now) {
    if (!running) return;
    requestAnimationFrame(loop);
    const s = window.scrollY;
    const vh = window.innerHeight;
    const sh = shadeAt(s);
    shade.style.opacity = sh.toFixed(3);
    visible = debugPose || (s + vh > gateTop + vh * 0.25 && sh < 0.985);
    if (!visible) { lastNow = now; return; }

    frame++;
    // when still, redraw slowly (stars twinkle, sea moves) to save battery
    if (stillFor > 0.6 && frame % 3 !== 0) { lastNow = now; return; }
    const dt = now - lastNow;
    const moving = render(now, s);
    stillFor = moving ? 0 : stillFor + dt / 1000;
    lastNow = now;

    // adapt resolution and quality every ~40 rendered frames
    if (!usingFallback && dt > 0 && dt < 250 && stillFor === 0) {
      perfFrames++; perfTime += dt;
      if (perfFrames >= 40) {
        const avg = perfTime / perfFrames;
        perfFrames = 0; perfTime = 0;
        if (avg > 24) {
          calmWindows = 0;
          if (scale > 0.3) scale = Math.max(minScale, scale * (avg > 40 ? 0.75 : 0.87));
          else if (q > 0) q--;
          else scale = Math.max(minScale, scale * 0.88);
          resize();
        } else if (avg < 17.5) {
          calmWindows++;
          if (calmWindows >= 3) {
            calmWindows = 0;
            if (q < 2 && scale >= (phone ? 0.4 : 0.5)) q++;
            else if (scale < maxScale) { scale = Math.min(maxScale, scale * 1.08); resize(); }
          }
        } else calmWindows = 0;
      }
    }
  }

  function start() {
    if (running) return;
    running = true;
    (usingFallback ? fallback : canvas).classList.add('on');
    lastNow = performance.now();
    requestAnimationFrame(loop);
  }
  function stop() { running = false; }

  // ?debug in the URL: window.ragaaWorld.pose({ z, y, pitch, l }) pins the camera.
  if (new URLSearchParams(location.search).has('debug')) {
    window.ragaaWorld = { pose(p) { debugPose = p ? { z: 0, y: 3, pitch: 0, l: 0.2, ...p } : null; }, quality(n) { q = n; }, state: () => state };
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stop(); else if (state.started) start();
  });
  window.addEventListener('resize', () => resize());
  resize();

  return {
    start() { state.started = true; start(); },
    refreshAnchors,
    state,
    get webgl() { return !usingFallback; },
  };
}
