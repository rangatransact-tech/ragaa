// The 3D world: WebGL2 renderer, the FPV drone camera and the light.
// render(p, now) is called once per animation frame with the smoothed journey
// progress p; everything on screen is a function of p, so it never drifts
// out of step with the captions.
import { perspective, viewFromBasis, mul, v3, texture2D } from './gl.js';
import { NOISE, NOISE_N, height, pathX, Z } from './terrain-fn.js';
import { preetham } from './atmos.js';
import { createTerrain } from './terrain.js';
import { createSky, invert } from './sky.js';
import { createSea } from './sea.js';
import { createTemple, templeSite } from './temple.js';
import { createParticles } from './particles.js';
import { makeTrack } from './track.js';

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const mix = (a, b, t) => a + (b - a) * t;
const mix3 = (a, b, t) => [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)];
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const D = Math.PI / 180;

// Smoothed ground height along the route, looking ahead so the drone rises
// before a ridge instead of clipping it.
function groundTable() {
  const z0 = -3000, z1 = 17000, step = 5;
  const n = Math.round((z1 - z0) / step) + 1;
  const raw = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const z = z0 + i * step, x = pathX(z);
    raw[i] = Math.max(height(x, z, 5), height(x - 14, z, 5), height(x + 14, z, 5), 0.5);
  }
  const ahead = new Float32Array(n);
  const back = 8, fwd = 36;
  for (let i = 0; i < n; i++) {
    let m = -1e9;
    for (let k = Math.max(0, i - back); k <= Math.min(n - 1, i + fwd); k++) m = Math.max(m, raw[k]);
    ahead[i] = m;
  }
  const blur = (src, r) => {
    const out = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      let s = 0, c = 0;
      for (let k = Math.max(0, i - r); k <= Math.min(n - 1, i + r); k++) { s += src[k]; c++; }
      out[i] = s / c;
    }
    return out;
  };
  const sm = blur(blur(ahead, 10), 10);
  return (z) => {
    const f = clamp((z - z0) / step, 0, n - 1.001);
    const i = Math.floor(f), t = f - i;
    return sm[i] * (1 - t) + sm[i + 1] * t;
  };
}

export function createWorld({ canvas, reduced }) {
  let gl = null;
  try {
    gl = canvas.getContext('webgl2', { antialias: false, alpha: false, depth: true, stencil: false, powerPreference: 'high-performance', preserveDrawingBuffer: false });
  } catch (e) { gl = null; }
  if (!gl) return null;

  const coarse = matchMedia('(pointer: coarse)').matches;
  const DPR = [0.55, 0.65, 0.75, 0.85, 1.0, 1.15, 1.3, 1.5, 1.75];
  const maxDpr = Math.min(window.devicePixelRatio || 1, 2);
  let di = DPR.findIndex((d) => d >= Math.min(maxDpr, coarse ? 1.3 : 1.5));
  if (di < 0) di = DPR.length - 1;
  let quality = coarse ? 1 : 2;

  // shared noise texture (R8, nearest; the shaders interpolate themselves)
  gl.activeTexture(gl.TEXTURE0);
  const noiseTex = texture2D(gl, NOISE_N, NOISE_N, NOISE, { internal: gl.R8, format: gl.RED, type: gl.UNSIGNED_BYTE, filter: gl.NEAREST });

  let parts;
  try {
    parts = {
      terrain: createTerrain(gl, { N: coarse ? 48 : 64, levels: 8, base: coarse ? 2.6 : 2 }),
      sky: createSky(gl),
      sea: createSea(gl),
      temple: createTemple(gl),
      particles: createParticles(gl),
    };
  } catch (e) {
    console.warn(e);
    return null;
  }
  parts.terrain.setQuality(quality);

  const ground = groundTable();
  const site = templeSite();
  const tracks = {};
  const templeAzFrom = (z) => Math.atan2(site.x - pathX(z), site.z - z) / D;

  let W = 1, H = 1;
  function resize() {
    const d = DPR[di];
    const cw = canvas.clientWidth || innerWidth, ch = canvas.clientHeight || innerHeight;
    const w = Math.max(64, Math.round(cw * d)), h = Math.max(64, Math.round(ch * d));
    if (w !== canvas.width || h !== canvas.height) { canvas.width = w; canvas.height = h; }
    W = w; H = h;
  }
  resize();
  window.addEventListener('resize', resize);

  // --- camera state (smoothed) ---
  let roll = 0, lastYaw = null, lastNow = 0;
  const pose = (track, p) => {
    const e = track(clamp(p, 0, 1));
    const z = e.z;
    const x = pathX(z);
    const y = ground(z) + e.clr;
    return { e, pos: [x, y, z] };
  };

  function environment(e, camZ) {
    const sunE = e.sunE * D, sunAz = e.sunAz * D;
    const sunDir = [Math.sin(sunAz) * Math.cos(sunE), Math.sin(sunE), Math.cos(sunAz) * Math.cos(sunE)];
    const mE = e.moonE * D, mA = -10 * D;
    const moonDir = [Math.sin(mA) * Math.cos(mE), Math.sin(mE), Math.cos(mA) * Math.cos(mE)];
    const n = clamp(e.night, 0, 1);
    const nl = smooth(0.3, 0.7, n);
    const lightDir = v3.norm(mix3(sunDir, moonDir, nl));
    const above = smooth(-0.035, 0.09, sunE);
    const warm = Math.exp(-Math.max(sunE, 0) * 5.5);
    const sunCol = mix3([1.0, 0.93, 0.83], [1.0, 0.5, 0.22], warm * 0.9).map((c) => c * 3.3 * above);
    const moonCol = [0.3, 0.38, 0.6];
    const lightCol = mix3(sunCol, moonCol, nl);
    const dayAmb = [0.28, 0.4, 0.62].map((c) => c * 0.95 * smooth(-0.05, 0.3, sunE));
    const twAmb = [0.16, 0.12, 0.2].map((c) => c * smooth(-0.3, 0.02, sunE) * (1 - smooth(0.02, 0.2, sunE)));
    const skyAmb = mix3(v3.add(dayAmb, twAmb), [0.04, 0.052, 0.09], n);
    const groundAmb = v3.add(skyAmb.map((c, i) => c * [0.55, 0.45, 0.36][i]), lightCol.map((c) => c * 0.045));
    const cloudLit = mix3(v3.add([0.85, 0.85, 0.9], sunCol.map((c) => c * 0.08)), [0.13, 0.15, 0.22], n);
    const cloudShade = mix3([0.42, 0.45, 0.55], [0.035, 0.045, 0.07], n);
    const coast = smooth(Z.cStart0, Z.cStart1, camZ);
    const pre = preetham(sunDir, mix(3.2, 6.5, coast), mix(1.4, 2.2, coast), 0.004);
    return {
      uSunDir: sunDir, uMoonDir: moonDir, uNight: n,
      uLightDir: lightDir, uLightCol: lightCol, uSkyAmb: skyAmb, uGroundAmb: groundAmb,
      uSunE: pre.sunE, uBetaR: pre.betaR, uBetaM: pre.betaM,
      uFogDensity: e.fog, uFogFalloff: 0.0011, uHaze: clamp(e.haze, 0, 1), uCloud: clamp(e.cloud, 0, 1),
      uHazeCol: [0.93, 0.7, 0.47].map((c) => c * mix(0.35, 1.0, above)),
      uCloudCol: mix3(cloudLit, cloudShade, 0.25),
      uExposure: e.exp,
      cloudLit, cloudShade,
    };
  }

  // --- adaptive quality ---
  let perfN = 0, perfT = 0, calm = 0;
  function adapt(dt) {
    if (dt <= 0 || dt > 200) return;
    perfN++; perfT += dt;
    if (perfN < 45) return;
    const avg = perfT / perfN;
    perfN = 0; perfT = 0;
    if (avg > 21) {
      calm = 0;
      if (di > 3) di--;
      else if (quality > 0) { quality--; parts.terrain.setQuality(quality); }
      else if (di > 0) di--;
      resize();
    } else if (avg < 14.5) {
      if (++calm >= 3) {
        calm = 0;
        const cap = DPR.findIndex((d) => d >= maxDpr);
        if (quality < 2 && di >= 4) { quality++; parts.terrain.setQuality(quality); }
        else if (di < (cap < 0 ? DPR.length - 1 : cap)) { di++; resize(); }
      }
    } else calm = 0;
  }

  const state = { p: 0, env: null, pos: [0, 0, 0] };

  function render(kind, p, now) {
    if (!tracks[kind]) tracks[kind] = makeTrack(kind, templeAzFrom(13700));
    const track = tracks[kind];
    const dt = lastNow ? Math.min(0.1, (now - lastNow) / 1000) : 0.016;
    adapt(lastNow ? now - lastNow : 0);
    lastNow = now;
    const t = now / 1000;

    const dbg = window.__ragaaCam;
    const a = pose(track, p);
    const b = pose(track, p + 0.004);
    const e = a.e;
    const pos = a.pos.slice();

    // FPV heading: along the route, pitched with the climb or dive
    let dx = b.pos[0] - pos[0], dy = b.pos[1] - pos[1], dz = b.pos[2] - pos[2];
    const hl = Math.hypot(dx, dz);
    if (hl < 1) { const x2 = pathX(pos[2] + 30); dx = x2 - pos[0]; dz = 30; dy = 0; }
    let fwd = v3.norm([dx, clamp(dy / (Math.hypot(dx, dz) || 1), -0.7, 0.5) * Math.hypot(dx, dz) * 0.55, dz]);
    // gently aim at the temple on the approach
    if (e.aim > 0.001) {
      const tgt = v3.norm([site.x - pos[0], site.y + 9 - pos[1], site.z - pos[2]]);
      if (tgt[2] > 0.2) fwd = v3.norm(mix3(fwd, tgt, clamp(e.aim, 0, 1)));
    }
    // pitch offset
    const yaw = Math.atan2(fwd[0], fwd[2]);
    let pitch = Math.asin(clamp(fwd[1], -1, 1)) + e.pitch * D;
    // drone micro-motion: a hint of hover and prop wash
    if (!reduced) {
      pos[1] += Math.sin(t * 0.8) * 0.35 + Math.sin(t * 1.9) * 0.12;
      pitch += (Math.sin(t * 1.3) * 0.004 + Math.sin(t * 3.7) * 0.0015);
    }
    fwd = [Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)];
    if (dbg) { // ?debug: window.__ragaaCam = { pos:[x,y,z], yaw, pitch } in degrees
      if (dbg.pos) pos.splice(0, 3, ...dbg.pos);
      const yw = (dbg.yaw || 0) * D, pt = (dbg.pitch || 0) * D;
      fwd = [Math.sin(yw) * Math.cos(pt), Math.sin(pt), Math.cos(yw) * Math.cos(pt)];
    }
    // bank into turns in proportion to how fast the heading is changing
    if (lastYaw === null) lastYaw = yaw;
    let dyaw = yaw - lastYaw;
    if (dyaw > Math.PI) dyaw -= 2 * Math.PI; if (dyaw < -Math.PI) dyaw += 2 * Math.PI;
    lastYaw = yaw;
    const rollT = reduced ? 0 : clamp(dyaw / Math.max(dt, 0.001) * 0.55, -0.42, 0.42);
    roll += (rollT - roll) * (1 - Math.exp(-dt * 3.2));
    let right = v3.norm(v3.cross([0, 1, 0], fwd));
    right = v3.scale(right, -1); // right-handed: x right, y up, looking +z
    let up = v3.cross(right, fwd);
    const cr = Math.cos(roll), sr = Math.sin(roll);
    const r2 = v3.add(v3.scale(right, cr), v3.scale(up, sr));
    const u2 = v3.add(v3.scale(up, cr), v3.scale(right, -sr));

    const aspect = W / H;
    const fovy = (aspect < 1 ? 74 : 54) * D;
    const proj = perspective(fovy, aspect, 1.0, 40000);
    const view = viewFromBasis(r2, u2, fwd);
    const vp = mul(proj, view);

    const env = environment(e, pos[2]);
    state.p = p; state.env = env; state.pos = pos; state.e = e;
    const u = Object.assign({ uCamPos: pos, uViewProj: vp, uTime: t % 3600, uNoise: 0 }, env);

    gl.viewport(0, 0, W, H);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, noiseTex);
    gl.disable(gl.CULL_FACE);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    parts.sky.draw(u, invert(vp), Math.max(1.2, H / 700));
    parts.terrain.draw(u, pos);
    if (pos[2] > 11000) {
      parts.temple.draw(u);
      parts.sea.draw(u);
    }
    parts.particles.draw(u, { uRight: r2, uUp: u2, uCloudLit: env.cloudLit, uCloudShade: env.cloudShade }, pos);
  }

  canvas.addEventListener('webglcontextlost', (ev) => { ev.preventDefault(); state.lost = true; });

  return {
    render,
    resize,
    state,
    // warm up shader compilation on a quiet screen
    prime(kind) { render(kind, 0, performance.now()); },
  };
}
