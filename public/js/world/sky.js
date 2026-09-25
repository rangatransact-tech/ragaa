// Sky dome (a full-screen pass) and a star field.
import { createProgram, createMesh, setUniforms, draw } from './gl.js';
import { GLSL_TERRAIN } from './terrain-fn.js';
import { GLSL_COMMON, GLSL_ATMOS } from './atmos.js';

const SKY_VS = /* glsl */`#version 300 es
in vec2 aPos;
out vec2 vNdc;
void main(){ vNdc = aPos; gl_Position = vec4(aPos, 1.0, 1.0); }`;

const SKY_FS = /* glsl */`#version 300 es
precision highp float;
precision highp int;
${GLSL_COMMON}
${GLSL_TERRAIN}
${GLSL_ATMOS}
uniform mat4 uInvViewProj;
in vec2 vNdc;
out vec4 outColor;
void main(){
  vec4 w = uInvViewProj*vec4(vNdc, 1.0, 1.0);
  vec3 dir = normalize(w.xyz/w.w);
  vec3 c = skyColor(dir, true);
  // below the horizon (rarely seen): continue the fog colour
  c = mix(c, fogColor(dir), max(uHaze*0.85, uCloud));
  if (dir.y < 0.0) c = mix(c, fogColor(dir), smoothstep(0.0, -0.05, dir.y));
  outColor = vec4(finalColor(c, gl_FragCoord.xy), 1.0);
}`;

const STAR_VS = /* glsl */`#version 300 es
precision highp float;
uniform mat4 uViewProj;
uniform float uTime, uNight, uPx, uFade;
in vec4 aStar; // xyz direction, w magnitude 0..1
out float vA;
out vec3 vTint;
void main(){
  vec3 d = aStar.xyz;
  vec4 p = uViewProj*vec4(d*9000.0, 1.0);
  gl_Position = p;
  gl_Position.z = p.w*0.99999;
  float m = aStar.w;
  float tw = 0.7 + 0.3*sin(uTime*(1.1 + 3.0*fract(m*91.7)) + m*400.0);
  float above = smoothstep(-0.02, 0.1, d.y);
  vA = uNight*uFade*above*tw*(0.25 + 0.75*m);
  vTint = mix(vec3(0.72, 0.82, 1.0), vec3(1.0, 0.92, 0.78), fract(m*57.3));
  gl_PointSize = uPx*(1.0 + 2.2*m*m);
}`;

const STAR_FS = /* glsl */`#version 300 es
precision mediump float;
in float vA;
in vec3 vTint;
out vec4 outColor;
void main(){
  vec2 q = gl_PointCoord*2.0 - 1.0;
  float r = dot(q, q);
  float a = exp(-r*4.0)*vA;
  outColor = vec4(vTint*a, a);
}`;

export function createSky(gl) {
  const prog = createProgram(gl, SKY_VS, SKY_FS, 'sky');
  const mesh = createMesh(gl, prog, { aPos: { data: new Float32Array([-1, -1, 3, -1, -1, 3]), size: 2 } });

  const sprog = createProgram(gl, STAR_VS, STAR_FS, 'stars');
  const N = 2600;
  const data = new Float32Array(N * 4);
  let s = 1234567;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const band = [0.42, 0.55, -0.72];
  const bl = Math.hypot(...band);
  for (let i = 0; i < N; i++) {
    let x, y, z, d;
    do {
      x = rnd() * 2 - 1; y = rnd() * 2 - 1; z = rnd() * 2 - 1; d = x * x + y * y + z * z;
    } while (d > 1 || d < 0.01);
    d = Math.sqrt(d); x /= d; y /= d; z /= d;
    // more faint stars along the Milky Way
    const nearBand = Math.abs((x * band[0] + y * band[1] + z * band[2]) / bl);
    if (nearBand > 0.3 && rnd() < 0.35) { i--; continue; }
    data.set([x, Math.abs(y) * 0.98 + 0.02 * y, z, Math.pow(rnd(), 5)], i * 4);
  }
  const smesh = createMesh(gl, sprog, { aStar: { data, size: 4 } });

  return {
    draw(u, invVP, px) {
      gl.disable(gl.DEPTH_TEST);
      gl.depthMask(false);
      gl.useProgram(prog.p);
      setUniforms(gl, prog, u);
      setUniforms(gl, prog, { uInvViewProj: invVP });
      draw(gl, mesh, gl.TRIANGLES);
      if (u.uNight > 0.01) {
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.useProgram(sprog.p);
        setUniforms(gl, sprog, { uViewProj: u.uViewProj, uTime: u.uTime, uNight: u.uNight, uPx: px, uFade: 1 - Math.max(u.uCloud, u.uHaze) });
        draw(gl, smesh, gl.POINTS);
        gl.disable(gl.BLEND);
      }
      gl.depthMask(true);
      gl.enable(gl.DEPTH_TEST);
    },
  };
}

// 4x4 inverse (general), for the sky pass.
export function invert(m) {
  const a = m, o = new Float32Array(16);
  const b00 = a[0] * a[5] - a[1] * a[4], b01 = a[0] * a[6] - a[2] * a[4], b02 = a[0] * a[7] - a[3] * a[4];
  const b03 = a[1] * a[6] - a[2] * a[5], b04 = a[1] * a[7] - a[3] * a[5], b05 = a[2] * a[7] - a[3] * a[6];
  const b06 = a[8] * a[13] - a[9] * a[12], b07 = a[8] * a[14] - a[10] * a[12], b08 = a[8] * a[15] - a[11] * a[12];
  const b09 = a[9] * a[14] - a[10] * a[13], b10 = a[9] * a[15] - a[11] * a[13], b11 = a[10] * a[15] - a[11] * a[14];
  let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
  if (!det) return o;
  det = 1 / det;
  o[0] = (a[5] * b11 - a[6] * b10 + a[7] * b09) * det;
  o[1] = (a[2] * b10 - a[1] * b11 - a[3] * b09) * det;
  o[2] = (a[13] * b05 - a[14] * b04 + a[15] * b03) * det;
  o[3] = (a[10] * b04 - a[9] * b05 - a[11] * b03) * det;
  o[4] = (a[6] * b08 - a[4] * b11 - a[7] * b07) * det;
  o[5] = (a[0] * b11 - a[2] * b08 + a[3] * b07) * det;
  o[6] = (a[14] * b02 - a[12] * b05 - a[15] * b01) * det;
  o[7] = (a[8] * b05 - a[10] * b02 + a[11] * b01) * det;
  o[8] = (a[4] * b10 - a[5] * b08 + a[7] * b06) * det;
  o[9] = (a[1] * b08 - a[0] * b10 - a[3] * b06) * det;
  o[10] = (a[12] * b04 - a[13] * b02 + a[15] * b00) * det;
  o[11] = (a[9] * b02 - a[8] * b04 - a[11] * b00) * det;
  o[12] = (a[5] * b07 - a[4] * b09 - a[6] * b06) * det;
  o[13] = (a[0] * b09 - a[1] * b07 + a[2] * b06) * det;
  o[14] = (a[13] * b01 - a[12] * b03 - a[14] * b00) * det;
  o[15] = (a[8] * b03 - a[9] * b01 + a[10] * b00) * det;
  return o;
}
