// The Shore Temple, Mahabalipuram: two stepped granite vimanas with rows of
// kudu shrines, octagonal domed tops and finials, a raised plinth and a low
// compound wall lined with small Nandi figures. The taller shrine faces the
// sea (east, +z); the smaller one faces inland.
import { createProgram, createMesh, setUniforms, draw } from './gl.js';
import { GLSL_TERRAIN, Z, pathX, height } from './terrain-fn.js';
import { GLSL_COMMON, GLSL_ATMOS } from './atmos.js';

const VS = /* glsl */`#version 300 es
precision highp float;
${GLSL_COMMON}
in vec3 aPos;
in vec3 aNormal;
in float aShade;
out vec3 vWorld;
out vec3 vNormal;
out float vShade;
void main(){
  vWorld = aPos; vNormal = aNormal; vShade = aShade;
  gl_Position = uViewProj*vec4(aPos - uCamPos, 1.0);
}`;

const FS = /* glsl */`#version 300 es
precision highp float;
precision highp int;
${GLSL_COMMON}
${GLSL_TERRAIN}
${GLSL_ATMOS}
uniform vec3 uBase;
in vec3 vWorld;
in vec3 vNormal;
in float vShade;
out vec4 outColor;
void main(){
  vec3 p = vWorld;
  vec3 n = normalize(vNormal);
  vec3 lp = p - uBase;
  // weathered granite: grain, blotches and rain streaks
  float grain = vnoise(vec2(lp.x + lp.z, lp.y)*6.0);
  float blot = fbm(vec2(lp.x*0.7 + lp.z*0.5, lp.y*0.9), 3);
  float streak = vnoise(vec2((lp.x + lp.z)*3.0, lp.y*0.25));
  vec3 alb = mix(vec3(0.24, 0.2, 0.17), vec3(0.42, 0.36, 0.3), blot);
  alb *= 0.85 + 0.25*grain;
  alb *= 0.8 + 0.2*streak;
  alb *= mix(0.55, 1.0, smoothstep(0.0, 2.5, lp.y)); // damp, darker base
  alb *= vShade;
  vec3 L = uLightDir;
  float dif = max(dot(n, L), 0.0);
  vec3 amb = uSkyAmb*(0.6 + 0.4*n.y) + uGroundAmb*(0.5 - 0.5*n.y);
  vec3 col = alb*(uLightCol*dif + amb);
  // warm rim where the sunrise wraps the silhouette
  vec3 V = normalize(p - uCamPos);
  float rim = pow(1.0 - max(dot(n, -V), 0.0), 4.0)*pow(max(dot(V, L), 0.0), 2.0);
  col += uLightCol*rim*0.4;
  col = applyFog(col, p);
  outColor = vec4(finalColor(col, gl_FragCoord.xy), 1.0);
}`;

function builder() {
  const P = [], N = [], S = [];
  const tri = (a, b, c, n, s) => { P.push(...a, ...b, ...c); N.push(...n, ...n, ...n); S.push(s, s, s); };
  const quad = (a, b, c, d, n, s) => { tri(a, b, c, n, s); tri(a, c, d, n, s); };
  return {
    P, N, S,
    box(cx, cy, cz, sx, sy, sz, s = 1) { // cy = bottom
      const x0 = cx - sx / 2, x1 = cx + sx / 2, y0 = cy, y1 = cy + sy, z0 = cz - sz / 2, z1 = cz + sz / 2;
      quad([x0, y1, z0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [0, 1, 0], s);
      quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1], s * 0.97);
      quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, -1], s * 0.97);
      quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [1, 0, 0], s * 0.97);
      quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0], s * 0.97);
    },
    // lathe of (radius, height) pairs around the y axis; seg = 8 gives an octagon
    lathe(cx, cy, cz, prof, seg, s = 1) {
      for (let i = 0; i < prof.length - 1; i++) {
        const [r0, y0] = prof[i], [r1, y1] = prof[i + 1];
        for (let k = 0; k < seg; k++) {
          const a0 = (k / seg) * Math.PI * 2 + Math.PI / seg, a1 = ((k + 1) / seg) * Math.PI * 2 + Math.PI / seg;
          const am = (a0 + a1) / 2;
          const p00 = [cx + Math.cos(a0) * r0, cy + y0, cz + Math.sin(a0) * r0];
          const p01 = [cx + Math.cos(a1) * r0, cy + y0, cz + Math.sin(a1) * r0];
          const p10 = [cx + Math.cos(a0) * r1, cy + y1, cz + Math.sin(a0) * r1];
          const p11 = [cx + Math.cos(a1) * r1, cy + y1, cz + Math.sin(a1) * r1];
          const dr = r0 - r1, dy = y1 - y0, l = Math.hypot(dr, dy) || 1;
          const n = [Math.cos(am) * dy / l, dr / l, Math.sin(am) * dy / l];
          quad(p00, p10, p11, p01, n, s);
        }
      }
    },
  };
}

function vimana(b, x, y, z, w) {
  const u = w / 7; // proportions of the main shrine
  // shrine walls with pilasters and a heavy cornice
  b.box(x, y, z, w, 5 * u, w, 0.95);
  for (const side of [-1, 1]) {
    for (const k of [-0.36, 0, 0.36]) {
      b.box(x + k * w, y, z + side * (w / 2 + 0.08 * u), 0.5 * u, 4.6 * u, 0.25 * u, 1.05);
      b.box(x + side * (w / 2 + 0.08 * u), y, z + k * w, 0.25 * u, 4.6 * u, 0.5 * u, 1.05);
    }
  }
  b.box(x, y + 4.6 * u, z, w * 1.1, 0.55 * u, w * 1.1, 1.0);
  // stepped tiers, each crowned by a row of small kudu shrines
  let yy = y + 5.15 * u;
  const tiers = 4;
  for (let i = 0; i < tiers; i++) {
    const tw = w * (0.86 - 0.15 * i), th = 1.85 * u;
    b.box(x, yy, z, tw, th, tw, 0.9);
    b.box(x, yy + th - 0.3 * u, z, tw * 1.08, 0.32 * u, tw * 1.08, 1.0);
    const n = Math.max(3, Math.round(tw / (1.05 * u)));
    const step = (tw * 1.02) / n;
    for (let k = 0; k < n; k++) {
      const off = -tw * 0.51 + step * (k + 0.5);
      const kw = step * 0.62, kh = 0.75 * u, ky = yy + th + 0.02 * u;
      for (const side of [-1, 1]) {
        b.box(x + off, ky, z + side * tw * 0.5, kw, kh, kw, 1.08);
        b.box(x + side * tw * 0.5, ky, z + off, kw, kh, kw, 1.08);
        b.lathe(x + off, ky + kh, z + side * tw * 0.5, [[kw * 0.55, 0], [kw * 0.5, kw * 0.3], [0.001, kw * 0.55]], 6, 1.1);
        b.lathe(x + side * tw * 0.5, ky + kh, z + off, [[kw * 0.55, 0], [kw * 0.5, kw * 0.3], [0.001, kw * 0.55]], 6, 1.1);
      }
    }
    yy += th + 0.2 * u;
  }
  // octagonal neck, dome (shikhara) and finial (stupi)
  const r = w * 0.3;
  b.lathe(x, yy, z, [[r * 0.75, 0], [r * 0.72, 0.9 * u], [r * 0.95, 1.0 * u]], 8, 0.95);
  const dome = [];
  for (let i = 0; i <= 8; i++) {
    const a = (i / 8) * Math.PI * 0.5;
    dome.push([r * 1.12 * Math.cos(a) * (1 - 0.1 * Math.sin(a * 2)), 1.0 * u + Math.sin(a) * r * 1.2]);
  }
  b.lathe(x, yy, z, dome, 8, 1.05);
  const fy = yy + 1.0 * u + r * 1.2;
  b.lathe(x, fy, z, [[0.28 * u, 0], [0.34 * u, 0.3 * u], [0.12 * u, 0.55 * u], [0.24 * u, 0.9 * u], [0.02, 1.6 * u]], 8, 1.1);
}

export function templeSite() {
  const z = Z.templeZ, x = pathX(z);
  return { x, z, y: Math.max(height(x, z), 0.6) };
}

export function createTemple(gl) {
  const prog = createProgram(gl, VS, FS, 'temple');
  const site = templeSite();
  const b = builder();
  const { x, z } = site;
  const y = site.y - 0.3;
  // compound wall with Nandi figures
  const wx = 12, wz = 19, wh = 2.1, wt = 0.55;
  b.box(x, y, z - wz, wx * 2, wh, wt, 0.9); b.box(x, y, z + wz, wx * 2, wh, wt, 0.9);
  b.box(x - wx, y, z, wt, wh, wz * 2, 0.9); b.box(x + wx, y, z, wt, wh, wz * 2, 0.9);
  const nandi = (nx, nz, along) => {
    const ny = y + wh;
    if (along === 'x') {
      b.box(nx, ny, nz, 0.75, 0.42, 0.34, 1.05); b.box(nx + 0.36, ny + 0.2, nz, 0.26, 0.34, 0.24, 1.05);
      b.box(nx + 0.12, ny + 0.42, nz, 0.2, 0.14, 0.2, 1.05);
    } else {
      b.box(nx, ny, nz, 0.34, 0.42, 0.75, 1.05); b.box(nx, ny + 0.2, nz + 0.36, 0.24, 0.34, 0.26, 1.05);
      b.box(nx, ny + 0.42, nz + 0.12, 0.2, 0.14, 0.2, 1.05);
    }
  };
  for (let t = -wx + 1; t <= wx - 1; t += 1.5) { nandi(x + t, z - wz, 'x'); nandi(x + t, z + wz, 'x'); }
  for (let t = -wz + 1; t <= wz - 1; t += 1.5) { nandi(x - wx, z + t, 'z'); nandi(x + wx, z + t, 'z'); }
  // plinth and the two shrines
  b.box(x, y, z, 17, 1.3, 30, 0.85);
  b.box(x + 0.5, y + 1.3, z + 6.5, 12, 0.6, 12, 0.9);
  vimana(b, x + 0.5, y + 1.9, z + 6.5, 9.4);
  b.box(x - 3.2, y + 1.3, z - 9, 8.4, 0.5, 8.4, 0.9);
  vimana(b, x - 3.2, y + 1.8, z - 9, 6.2);
  // a small mandapa between them
  b.box(x - 0.8, y + 1.3, z - 0.8, 5, 2.6, 5, 0.9);
  b.box(x - 0.8, y + 3.9, z - 0.8, 5.6, 0.4, 5.6, 1.0);

  const mesh = createMesh(gl, prog, {
    aPos: { data: new Float32Array(b.P), size: 3 },
    aNormal: { data: new Float32Array(b.N), size: 3 },
    aShade: { data: new Float32Array(b.S), size: 1 },
  });
  return {
    site,
    draw(u) {
      gl.useProgram(prog.p);
      setUniforms(gl, prog, u);
      setUniforms(gl, prog, { uBase: [x, y, z] });
      draw(gl, mesh, gl.TRIANGLES);
    },
  };
}
