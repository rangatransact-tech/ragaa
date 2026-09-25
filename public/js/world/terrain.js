// GPU terrain: nested square rings of grid (a geometry clipmap) that follow
// the drone. Heights, normals and long sun/moon shadows are computed in the
// vertex shader from the shared terrain function; rings morph smoothly into
// the next coarser ring so there are no cracks or popping.
import { createProgram, createMesh, setUniforms, draw } from './gl.js';
import { GLSL_TERRAIN } from './terrain-fn.js';
import { GLSL_COMMON, GLSL_ATMOS } from './atmos.js';

const VS = (N) => /* glsl */`#version 300 es
precision highp float;
precision highp int;
${GLSL_COMMON}
${GLSL_TERRAIN}
in vec2 aGrid;
uniform vec2 uCenter;
uniform float uScale, uOct, uShadowSteps;
out vec3 vWorld;
out vec3 vNormal;
out float vShadow;

float H(vec2 p, int oct){ return terrainH(p, oct); }

void main(){
  vec2 wp = uCenter + aGrid*uScale;
  float E = ${(N / 2).toFixed(1)}*uScale;
  vec2 dc = abs(wp - uCamPos.xz);
  float d = max(dc.x, dc.y);
  float a = clamp((d - 0.55*E)/(0.23*E), 0.0, 1.0);
  vec2 g = wp/uScale;
  wp -= fract(g*0.5)*2.0*uScale*a;
  int oct = int(uOct);
  float h = H(wp, oct);
  float e = max(uScale, 0.75);
  float hx0 = H(wp - vec2(e, 0.0), oct), hx1 = H(wp + vec2(e, 0.0), oct);
  float hz0 = H(wp - vec2(0.0, e), oct), hz1 = H(wp + vec2(0.0, e), oct);
  vNormal = normalize(vec3(hx0 - hx1, 2.0*e, hz0 - hz1));
  vWorld = vec3(wp.x, h, wp.y);

  // soft shadow: march toward the light over the coarse terrain
  float sh = 1.0;
  if (uLightDir.y > 0.005){
    vec3 L = uLightDir;
    float t = 6.0;
    for (int i = 0; i < 14; i++){
      if (float(i) >= uShadowSteps) break;
      vec3 q = vWorld + L*t;
      float th = H(q.xz, 4);
      sh = min(sh, clamp((q.y - th)/(0.06*t) + 0.5, 0.0, 1.0));
      t *= 1.55;
    }
  }
  vShadow = sh;
  gl_Position = uViewProj*vec4(vWorld - uCamPos, 1.0);
}`;

const FS = /* glsl */`#version 300 es
precision highp float;
precision highp int;
${GLSL_COMMON}
${GLSL_TERRAIN}
${GLSL_ATMOS}
in vec3 vWorld;
in vec3 vNormal;
in float vShadow;
out vec4 outColor;

void main(){
  vec3 p = vWorld;
  vec3 V = p - uCamPos;
  float dist = length(V);
  vec3 n = normalize(vNormal);
  vec3 w = zoneW(p.z);
  vec3 L = uLightDir;

  // fine detail normals close to the camera
  float near = 1.0 - smoothstep(120.0, 520.0, dist);
  if (near > 0.0){
    vec2 q = p.xz*0.35;
    float e = 0.35;
    float n0 = vnoise(q), nx = vnoise(q + vec2(e, 0.0)), nz = vnoise(q + vec2(0.0, e));
    vec2 q2 = p.xz*1.7;
    float m0 = vnoise(q2), mx = vnoise(q2 + vec2(e, 0.0)), mz = vnoise(q2 + vec2(0.0, e));
    vec3 dn = vec3(n0 - nx, 0.0, n0 - nz)*1.1 + vec3(m0 - mx, 0.0, m0 - mz)*0.5;
    n = normalize(n + dn*near*(0.22*w.x + 0.35*w.y + 0.08*w.z));
  }

  float large = fbm(p.xz/90.0, 3);
  vec3 alb = vec3(0.0);
  float spec = 0.0, rough = 30.0, sparkle = 0.0;

  if (w.x > 0.0){
    float snow = smoothstep(0.34, 0.6, n.y + 0.28*(large - 0.5) + 0.00004*p.y);
    float strata = 0.5 + 0.5*sin(p.y*0.045 + 6.0*large);
    vec3 rock = vec3(0.12, 0.11, 0.105)*(0.55 + 0.6*large)*(0.75 + 0.35*strata);
    vec3 sn = vec3(0.82, 0.87, 0.95)*(0.92 + 0.08*large);
    alb += w.x*mix(rock, sn, snow);
    spec += w.x*snow*0.35;
    if (dist < 220.0 && snow > 0.4){
      vec2 c = floor(p.xz*3.0);
      float h = hash12(c);
      float tw = pow(max(0.0, sin(uTime*1.7 + h*90.0)), 16.0);
      sparkle = step(0.965, h)*tw*snow*(1.0 - dist/220.0)*w.x;
    }
  }
  if (w.y > 0.0){
    vec3 sand = mix(vec3(0.66, 0.36, 0.16), vec3(0.8, 0.52, 0.27), large);
    // wind ripples
    float rip = sin(dot(p.xz, vec2(0.5, 0.87))*2.4 + 3.0*vnoise(p.xz*0.08));
    float rn = near*(1.0 - smoothstep(20.0, 160.0, dist));
    n = normalize(n + vec3(0.5, 0.0, 0.87)*rip*0.1*rn*w.y);
    alb += w.y*sand;
    rough = mix(rough, 12.0, w.y);
    spec += w.y*0.04;
  }
  if (w.z > 0.0){
    float d = shoreZ(p.x) - p.z;
    float wet = 1.0 - smoothstep(0.0, 26.0, d);
    vec3 sand = mix(vec3(0.7, 0.6, 0.47), vec3(0.82, 0.73, 0.6), large);
    alb += w.z*mix(sand, sand*vec3(0.52, 0.5, 0.48), wet);
    spec += w.z*wet*0.6;
    rough = mix(rough, 80.0, w.z*wet);
  }

  float dif = max(dot(n, L), 0.0);
  float sh = mix(1.0, vShadow, smoothstep(-0.01, 0.05, L.y));
  vec3 amb = uSkyAmb*(0.55 + 0.45*n.y) + uGroundAmb*(0.5 - 0.5*n.y);
  vec3 col = alb*(uLightCol*dif*sh + amb*(0.75 + 0.25*sh));
  vec3 Vn = V/dist;
  vec3 hv = normalize(L - Vn);
  col += uLightCol*spec*pow(max(dot(n, hv), 0.0), rough)*sh*0.6;
  col += vec3(0.8, 0.88, 1.0)*sparkle*3.0;
  col = applyFog(col, p);
  outColor = vec4(finalColor(col, gl_FragCoord.xy), 1.0);
}`;

function ringGeometry(N, hole) {
  const verts = [];
  const idx = [];
  const h = N / 2;
  for (let j = 0; j <= N; j++) for (let i = 0; i <= N; i++) verts.push(i - h, j - h);
  const inner = hole ? N / 4 - 1 : -1;
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const ci = i - h + 0.5, cj = j - h + 0.5;
      if (hole && Math.abs(ci) < inner && Math.abs(cj) < inner) continue;
      const a = j * (N + 1) + i, b = a + 1, c = a + N + 1, d = c + 1;
      // alternate the diagonal for a more even look
      if ((i + j) & 1) idx.push(a, c, b, b, c, d);
      else idx.push(a, c, d, a, d, b);
    }
  }
  return { grid: new Float32Array(verts), index: new Uint16Array(idx) };
}

export function createTerrain(gl, { N = 64, levels = 8, base = 2 } = {}) {
  const prog = createProgram(gl, VS(N), FS, 'terrain');
  const full = ringGeometry(N, false);
  const ring = ringGeometry(N, true);
  const meshFull = createMesh(gl, prog, { aGrid: { data: full.grid, size: 2 } }, full.index);
  const meshRing = createMesh(gl, prog, { aGrid: { data: ring.grid, size: 2 } }, ring.index);
  let shadowSteps = 12;

  return {
    prog,
    setQuality(q) { shadowSteps = q >= 2 ? 13 : q === 1 ? 8 : 5; },
    draw(frameUniforms, camPos) {
      gl.useProgram(prog.p);
      setUniforms(gl, prog, frameUniforms);
      for (let k = 0; k < levels; k++) {
        const s = base * Math.pow(2, k);
        const snap = 2 * s;
        const cx = Math.floor(camPos[0] / snap) * snap;
        const cz = Math.floor(camPos[2] / snap) * snap;
        setUniforms(gl, prog, {
          uCenter: [cx, cz], uScale: s,
          uOct: k <= 1 ? 7 : k <= 3 ? 6 : k <= 5 ? 5 : 4,
          uShadowSteps: k <= 3 ? shadowSteps : Math.max(5, shadowSteps - 4),
        });
        draw(gl, k === 0 ? meshFull : meshRing, gl.TRIANGLES);
      }
    },
  };
}
