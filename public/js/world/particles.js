// Soft billboards: the cloud layer the drone climbs through between night and
// morning, and drifting plumes of gulal (coloured powder) over the dunes.
import { createProgram, createMesh, setUniforms, draw, canvasTexture, updateBuffer } from './gl.js';
import { GLSL_TERRAIN, pathX, height, vnoise } from './terrain-fn.js';
import { GLSL_COMMON, GLSL_ATMOS } from './atmos.js';

const VS = /* glsl */`#version 300 es
precision highp float;
${GLSL_COMMON}
uniform vec3 uRight, uUp;
in vec2 aCorner;
in vec3 aOrigin;
in vec3 aDir;
in vec4 aParams; // size0, size1, phase, period (0 = static)
in vec4 aColor;
out vec2 vUV;
out vec4 vColor;
out vec3 vCenter;
out float vNear;
out float vRot;
void main(){
  float period = aParams.w;
  vec3 c = aOrigin;
  float size = aParams.x;
  float alpha = aColor.a;
  if (period > 0.0){
    float tt = fract((uTime + aParams.z)/period);
    float ease = 1.0 - exp(-tt*4.5);
    c += aDir*ease + vec3(4.0, 7.0, 2.0)*tt;
    size = mix(aParams.x, aParams.y, ease);
    alpha *= smoothstep(0.0, 0.04, tt)*(1.0 - smoothstep(0.45, 1.0, tt));
  }
  vec3 wp = c + (uRight*aCorner.x + uUp*aCorner.y)*size;
  float d = length(c - uCamPos);
  vNear = smoothstep(size*0.25, size*1.1, d);
  vUV = aCorner*0.5 + 0.5;
  vColor = vec4(aColor.rgb, alpha);
  vCenter = c;
  vRot = aParams.z*3.7;
  gl_Position = uViewProj*vec4(wp - uCamPos, 1.0);
}`;

const FS = /* glsl */`#version 300 es
precision highp float;
precision highp int;
${GLSL_COMMON}
${GLSL_TERRAIN}
${GLSL_ATMOS}
uniform sampler2D uTex;
uniform float uLit; // 1 = clouds (lit from the light), 0 = powder
uniform vec3 uCloudLit, uCloudShade;
in vec2 vUV;
in vec4 vColor;
in vec3 vCenter;
in float vNear;
in float vRot;
out vec4 outColor;
void main(){
  vec2 q = vUV - 0.5;
  float cr = cos(vRot), sr = sin(vRot);
  q = mat2(cr, -sr, sr, cr)*q + 0.5;
  vec4 t = texture(uTex, q);
  float a = t.a*vColor.a*vNear;
  if (a < 0.003) discard;
  vec3 col;
  if (uLit > 0.5){
    float up = clamp(vUV.y*0.9 + t.r*0.4 - 0.1, 0.0, 1.0);
    col = mix(uCloudShade, uCloudLit, up);
  } else {
    col = vColor.rgb*(uLightCol*0.35 + uSkyAmb*1.1 + 0.06)*(0.8 + 0.4*t.r);
  }
  col = applyFog(col, vCenter);
  outColor = vec4(finalColor(col, gl_FragCoord.xy)*a, a);
}`;

function puffTexture(grainy) {
  const s = 128;
  const c = document.createElement('canvas'); c.width = c.height = s;
  const x = c.getContext('2d');
  const img = x.createImageData(s, s);
  for (let j = 0; j < s; j++) for (let i = 0; i < s; i++) {
    const u = i / s - 0.5, v = j / s - 0.5;
    const r = Math.hypot(u, v) * 2;
    let n = 0, a = 0.5, fx = u * 5 + 20, fy = v * 5 + 11;
    for (let o = 0; o < 5; o++) { n += a * vnoise(fx, fy); fx *= 2.1; fy *= 2.1; a *= 0.5; }
    let al = Math.max(0, 1 - r) ** 1.6;
    al *= Math.min(1, Math.max(0, (n - 0.28) * 2.4 + (1 - r) * 0.6));
    if (grainy) al *= 0.55 + 0.45 * Math.random();
    const k = (j * s + i) * 4;
    const b = Math.round(255 * Math.min(1, n * 1.3));
    img.data[k] = b; img.data[k + 1] = b; img.data[k + 2] = b;
    img.data[k + 3] = Math.round(255 * Math.min(1, al));
  }
  x.putImageData(img, 0, 0);
  return c;
}

export function createParticles(gl) {
  const prog = createProgram(gl, VS, FS, 'particles');
  const corners = new Float32Array([-1, -1, 1, -1, -1, 1, 1, -1, 1, 1, -1, 1]);
  let s = 424242;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);

  // --- cloud layer ---
  const NC = 170;
  const cOrigin = new Float32Array(NC * 3), cParams = new Float32Array(NC * 4), cColor = new Float32Array(NC * 4);
  const cDir = new Float32Array(NC * 3);
  const clouds = [];
  for (let i = 0; i < NC; i++) {
    const z = 4300 + rnd() * 3300;
    const x = pathX(z) + (rnd() - 0.5) * 3600;
    const y = 1680 + rnd() * 620;
    const size = 260 + rnd() * 520;
    clouds.push({ x, y, z, size, a: 0.55 + rnd() * 0.35, ph: rnd() * 10 });
  }
  const cMesh = createMesh(gl, prog, {
    aCorner: { data: corners, size: 2 },
    aOrigin: { data: cOrigin, size: 3, divisor: 1, dynamic: true },
    aDir: { data: cDir, size: 3, divisor: 1 },
    aParams: { data: cParams, size: 4, divisor: 1, dynamic: true },
    aColor: { data: cColor, size: 4, divisor: 1, dynamic: true },
  });

  // --- gulal plumes over the desert ---
  const COLS = [[0.95, 0.66, 0.02], [0.95, 0.5, 0.05], [1.0, 0.76, 0.1], [0.9, 0.24, 0.45], [0.2, 0.62, 0.3], [0.2, 0.42, 0.85], [0.78, 0.1, 0.48]];
  const W = [5, 4, 2.5, 1.3, 0.8, 0.7, 1];
  const pick = () => { let r = rnd() * W.reduce((a, b) => a + b, 0); for (let i = 0; i < W.length; i++) { if ((r -= W[i]) <= 0) return COLS[i]; } return COLS[0]; };
  const plumes = [];
  for (let z = 7600; z < 10800; z += 260 + rnd() * 220) {
    const side = rnd() < 0.5 ? -1 : 1;
    const x = pathX(z) + side * (25 + rnd() * 70);
    plumes.push({ x, z, y: height(x, z) + 6 + rnd() * 10, col: pick(), ph: rnd() * 9 });
  }
  const PER = 16;
  const NG = plumes.length * PER;
  const gOrigin = new Float32Array(NG * 3), gDir = new Float32Array(NG * 3), gParams = new Float32Array(NG * 4), gColor = new Float32Array(NG * 4);
  plumes.forEach((pl, pi) => {
    for (let k = 0; k < PER; k++) {
      const i = pi * PER + k;
      const th = rnd() * Math.PI * 2, ph = rnd() * 0.9 - 0.2;
      const sp = 18 + rnd() * 34;
      gOrigin.set([pl.x, pl.y, pl.z], i * 3);
      gDir.set([Math.cos(th) * Math.cos(ph) * sp, Math.abs(Math.sin(ph)) * sp * 0.8 + 4, Math.sin(th) * Math.cos(ph) * sp], i * 3);
      const col = rnd() < 0.72 ? pl.col : pick();
      gParams.set([3 + rnd() * 3, 16 + rnd() * 20, pl.ph + rnd() * 0.5, 7.5], i * 4);
      gColor.set([col[0], col[1], col[2], 0.45 + rnd() * 0.3], i * 4);
    }
  });
  const gMesh = createMesh(gl, prog, {
    aCorner: { data: corners, size: 2 },
    aOrigin: { data: gOrigin, size: 3, divisor: 1 },
    aDir: { data: gDir, size: 3, divisor: 1 },
    aParams: { data: gParams, size: 4, divisor: 1 },
    aColor: { data: gColor, size: 4, divisor: 1 },
  });

  const texCloud = canvasTexture(gl, puffTexture(false));
  const texPowder = canvasTexture(gl, puffTexture(true));

  function sortClouds(cam) {
    clouds.sort((a, b) => ((b.x - cam[0]) ** 2 + (b.y - cam[1]) ** 2 + (b.z - cam[2]) ** 2) - ((a.x - cam[0]) ** 2 + (a.y - cam[1]) ** 2 + (a.z - cam[2]) ** 2));
    clouds.forEach((c, i) => {
      cOrigin.set([c.x, c.y, c.z], i * 3);
      cParams.set([c.size, c.size, c.ph, 0], i * 4);
      cColor.set([1, 1, 1, c.a], i * 4);
    });
    updateBuffer(gl, cMesh, 'aOrigin', cOrigin);
    updateBuffer(gl, cMesh, 'aParams', cParams);
    updateBuffer(gl, cMesh, 'aColor', cColor);
  }

  return {
    draw(u, extra, cam) {
      const showClouds = cam[2] > 1500 && cam[2] < 9500;
      const showGulal = cam[2] > 6800 && cam[2] < 11400;
      if (!showClouds && !showGulal) return;
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.depthMask(false);
      gl.useProgram(prog.p);
      setUniforms(gl, prog, u);
      setUniforms(gl, prog, extra);
      gl.activeTexture(gl.TEXTURE1);
      if (showClouds) {
        sortClouds(cam);
        gl.bindTexture(gl.TEXTURE_2D, texCloud);
        setUniforms(gl, prog, { uTex: 1, uLit: 1 });
        draw(gl, cMesh, gl.TRIANGLES, NC, 6);
      }
      if (showGulal) {
        gl.bindTexture(gl.TEXTURE_2D, texPowder);
        setUniforms(gl, prog, { uTex: 1, uLit: 0 });
        draw(gl, gMesh, gl.TRIANGLES, NG, 6);
      }
      gl.activeTexture(gl.TEXTURE0);
      gl.depthMask(true);
      gl.disable(gl.BLEND);
    },
  };
}
