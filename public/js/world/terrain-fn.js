// The landscape, defined once and used twice: in GLSL for rendering and in
// JavaScript so the drone knows how high the ground is. Units are metres.
// The flight heads toward +z (east). Geography along the way:
//   z < 4800            Himalaya at night (a long glacial valley)
//   4800 .. 6600        mountains melt into dunes (hidden inside the cloud)
//   6600 .. 11200       desert
//   11200 .. 12400      dunes flatten to the coast (hidden in the haze)
//   12400 ..            beach, the Shore Temple, then the sea

export const Z = {
  mEnd0: 4800, mEnd1: 6600,
  cStart0: 11200, cStart1: 12400,
  shore: 14240,
  templeZ: 14190,
};

// ---- noise texture (shared by GPU and CPU) ----
export const NOISE_N = 256;
export const NOISE = (() => {
  const d = new Uint8Array(NOISE_N * NOISE_N);
  let s = 0x9e3779b9 >>> 0;
  for (let i = 0; i < d.length; i++) {
    s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0;
    d[i] = s & 255;
  }
  return d;
})();

const smoothstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;
const fract = (x) => x - Math.floor(x);

function h(ix, iy) { return NOISE[((iy & 255) << 8) | (ix & 255)] / 255; }
export function vnoise(x, y) {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
  const a = h(ix, iy), b = h(ix + 1, iy), c = h(ix, iy + 1), d = h(ix + 1, iy + 1);
  return mix(mix(a, b, ux), mix(c, d, ux), uy);
}
function fbm(x, y, oct) {
  let s = 0, a = 0.5;
  for (let i = 0; i < oct; i++) {
    s += a * vnoise(x, y);
    const nx = (0.8 * x - 0.6 * y) * 2.03, ny = (0.6 * x + 0.8 * y) * 2.03;
    x = nx + 1.7; y = ny + 9.2; a *= 0.5;
  }
  return s;
}
function ridged(x, y, oct) {
  let s = 0, a = 0.5, w = 1;
  for (let i = 0; i < oct; i++) {
    let n = 1 - Math.abs(vnoise(x, y) * 2 - 1);
    n = n * n * w;
    w = Math.min(1, Math.max(0, n * 1.8));
    s += a * n;
    const nx = (0.8 * x - 0.6 * y) * 2.02, ny = (0.6 * x + 0.8 * y) * 2.02;
    x = nx + 3.1; y = ny + 1.3; a *= 0.5;
  }
  return s;
}

export function pathX(z) {
  return 230 * Math.sin(z * 0.00061) + 110 * Math.sin(z * 0.00173 + 1.3) + 40 * Math.sin(z * 0.0041 + 0.4);
}
export function shoreZ(x) { return Z.shore + 70 * Math.sin(x * 0.0037) + 22 * Math.sin(x * 0.011 + 1.0); }

function mountains(x, z, oct) {
  const dx = Math.abs(x - pathX(z));
  const valley = smoothstep(50, 950, dx);
  const r = ridged(x / 1250, z / 1250, oct);
  const base = 28 + 30 * fbm(x / 260, z / 260, 3);
  return base + Math.pow(valley, 1.3) * (r * r * 2600 + 520 * fbm(x / 700 + 5, z / 700, 4));
}
function dunes(x, z) {
  const qx = 0.866 * x - 0.5 * z, qz = 0.5 * x + 0.866 * z;
  const w = qx / 360 + 0.85 * Math.sin(qz / 540 + 1.6 * vnoise(x / 900, z / 900)) + 1.3 * vnoise(x / 1500 + 3, z / 1500);
  const f = fract(w);
  let prof = f < 0.72 ? f / 0.72 : (1 - f) / 0.28;
  prof = prof * prof * (3 - 2 * prof) * 0.35 + prof * 0.65;
  const amp = 30 + 48 * vnoise(x / 2100 + 7, z / 2100);
  return 16 + amp * prof + 7 * fbm(x / 170, z / 170, 2);
}
function beach(x, z) {
  const d = shoreZ(x) - z; // > 0 on land
  let land = 1.6 + 1.2 * vnoise(x / 55, z / 55) + 9 * smoothstep(250, 1100, d) * vnoise(x / 380, z / 380);
  land *= smoothstep(-12, 70, d);
  return land - 7 * smoothstep(0, -420, d) - 0.4;
}

export function height(x, z, oct = 7) {
  const wm = 1 - smoothstep(Z.mEnd0, Z.mEnd1, z);
  const wb = smoothstep(Z.cStart0, Z.cStart1, z);
  const wd = Math.max(0, 1 - wm - wb);
  let y = 0;
  if (wm > 0) y += wm * mountains(x, z, oct);
  if (wd > 0) y += wd * dunes(x, z);
  if (wb > 0) y += wb * beach(x, z);
  return y;
}

// ---- the same, in GLSL ----
export const GLSL_TERRAIN = /* glsl */`
uniform highp sampler2D uNoise;
float hT(ivec2 i){ return texelFetch(uNoise, i & 255, 0).r; }
float vnoise(vec2 p){
  vec2 i = floor(p); vec2 f = p - i; vec2 u = f*f*(3.0 - 2.0*f);
  ivec2 ii = ivec2(i);
  float a = hT(ii), b = hT(ii + ivec2(1,0)), c = hT(ii + ivec2(0,1)), d = hT(ii + ivec2(1,1));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float fbm(vec2 p, int oct){
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 8; i++){
    if (i >= oct) break;
    s += a*vnoise(p);
    p = vec2(0.8*p.x - 0.6*p.y, 0.6*p.x + 0.8*p.y)*2.03 + vec2(1.7, 9.2); a *= 0.5;
  }
  return s;
}
float ridged(vec2 p, int oct){
  float s = 0.0, a = 0.5, w = 1.0;
  for (int i = 0; i < 8; i++){
    if (i >= oct) break;
    float n = 1.0 - abs(vnoise(p)*2.0 - 1.0);
    n = n*n*w; w = clamp(n*1.8, 0.0, 1.0);
    s += a*n;
    p = vec2(0.8*p.x - 0.6*p.y, 0.6*p.x + 0.8*p.y)*2.02 + vec2(3.1, 1.3); a *= 0.5;
  }
  return s;
}
float pathX(float z){ return 230.0*sin(z*0.00061) + 110.0*sin(z*0.00173 + 1.3) + 40.0*sin(z*0.0041 + 0.4); }
float shoreZ(float x){ return ${Z.shore.toFixed(1)} + 70.0*sin(x*0.0037) + 22.0*sin(x*0.011 + 1.0); }
float mountains(vec2 p, int oct){
  float dx = abs(p.x - pathX(p.y));
  float valley = smoothstep(50.0, 950.0, dx);
  float r = ridged(p/1250.0, oct);
  float base = 28.0 + 30.0*fbm(p/260.0, 3);
  return base + pow(valley, 1.3)*(r*r*2600.0 + 520.0*fbm(p/700.0 + vec2(5.0, 0.0), 4));
}
float dunes(vec2 p){
  vec2 q = vec2(0.866*p.x - 0.5*p.y, 0.5*p.x + 0.866*p.y);
  float w = q.x/360.0 + 0.85*sin(q.y/540.0 + 1.6*vnoise(p/900.0)) + 1.3*vnoise(p/1500.0 + vec2(3.0, 0.0));
  float f = fract(w);
  float prof = f < 0.72 ? f/0.72 : (1.0 - f)/0.28;
  prof = prof*prof*(3.0 - 2.0*prof)*0.35 + prof*0.65;
  float amp = 30.0 + 48.0*vnoise(p/2100.0 + vec2(7.0, 0.0));
  return 16.0 + amp*prof + 7.0*fbm(p/170.0, 2);
}
float beach(vec2 p){
  float d = shoreZ(p.x) - p.y;
  float land = 1.6 + 1.2*vnoise(p/55.0) + 9.0*smoothstep(250.0, 1100.0, d)*vnoise(p/380.0);
  land *= smoothstep(-12.0, 70.0, d);
  return land - 7.0*smoothstep(0.0, -420.0, d) - 0.4;
}
vec3 zoneW(float z){
  float wm = 1.0 - smoothstep(${Z.mEnd0.toFixed(1)}, ${Z.mEnd1.toFixed(1)}, z);
  float wb = smoothstep(${Z.cStart0.toFixed(1)}, ${Z.cStart1.toFixed(1)}, z);
  return vec3(wm, max(0.0, 1.0 - wm - wb), wb);
}
float terrainH(vec2 p, int oct){
  vec3 w = zoneW(p.y);
  float y = 0.0;
  if (w.x > 0.0) y += w.x*mountains(p, oct);
  if (w.y > 0.0) y += w.y*dunes(p);
  if (w.z > 0.0) y += w.z*beach(p);
  return y;
}
`;
