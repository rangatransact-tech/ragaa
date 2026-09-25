// The Bay of Bengal at sunrise: a flat plane whose look comes from the pixel
// shader: layered wave normals, sky reflection with fresnel, the sun's glitter
// path, shallow turquoise near the beach and foam where waves wash in.
import { createProgram, createMesh, setUniforms, draw } from './gl.js';
import { GLSL_TERRAIN, Z } from './terrain-fn.js';
import { GLSL_COMMON, GLSL_ATMOS } from './atmos.js';

const VS = /* glsl */`#version 300 es
precision highp float;
${GLSL_COMMON}
in vec2 aPos;
out vec3 vWorld;
void main(){
  vWorld = vec3(aPos.x, 0.0, aPos.y);
  gl_Position = uViewProj*vec4(vWorld - uCamPos, 1.0);
}`;

const FS = /* glsl */`#version 300 es
precision highp float;
precision highp int;
${GLSL_COMMON}
${GLSL_TERRAIN}
${GLSL_ATMOS}
in vec3 vWorld;
out vec4 outColor;

vec2 waveGrad(vec2 p, float t){
  vec2 g = vec2(0.0);
  // long swell rolling in from the east (toward the shore = -z)
  vec2 d1 = normalize(vec2(0.15, -1.0)), d2 = normalize(vec2(-0.45, -0.9)), d3 = normalize(vec2(0.6, -0.8));
  g += d1*0.9*cos(dot(p, d1)*0.09 + t*0.9)*0.09;
  g += d2*0.5*cos(dot(p, d2)*0.21 + t*1.35)*0.21*0.5;
  g += d3*0.35*cos(dot(p, d3)*0.47 + t*2.1)*0.47*0.3;
  return g;
}

void main(){
  vec3 p = vWorld;
  vec3 V = p - uCamPos;
  float dist = length(V);
  vec3 Vn = V/dist;
  float t = uTime;

  vec2 g = waveGrad(p.xz, t);
  // choppy detail from noise, fading with distance
  float fd = 1.0 - smoothstep(60.0, 900.0, dist);
  vec2 q = p.xz*0.9 + vec2(t*0.35, -t*0.5);
  float e = 0.25;
  float n0 = vnoise(q), nx = vnoise(q + vec2(e, 0.0)), nz = vnoise(q + vec2(0.0, e));
  vec2 q2 = p.xz*3.1 + vec2(-t*0.6, -t*0.9);
  float m0 = vnoise(q2), mx = vnoise(q2 + vec2(e, 0.0)), mz = vnoise(q2 + vec2(0.0, e));
  g += (vec2(n0 - nx, n0 - nz)*0.5 + vec2(m0 - mx, m0 - mz)*0.22)*fd;
  vec3 n = normalize(vec3(-g.x, 1.0, -g.y));

  float fres = 0.02 + 0.98*pow(1.0 - max(dot(n, -Vn), 0.0), 5.0);
  vec3 r = reflect(Vn, n);
  r.y = abs(r.y);
  vec3 refl = skyColor(r, false);

  // water depth from the beach profile
  float depth = max(-beach(p.xz), 0.0);
  vec3 deep = vec3(0.004, 0.03, 0.05), shallow = vec3(0.03, 0.16, 0.16);
  vec3 body = mix(shallow, deep, smoothstep(0.2, 5.0, depth));
  body *= uSkyAmb*1.4 + uLightCol*0.18*max(uLightDir.y, 0.0) + 0.02;
  vec3 col = mix(body, refl, fres);

  // sun glitter
  float s = max(dot(r, uLightDir), 0.0);
  float vis = smoothstep(-0.03, 0.03, uLightDir.y)*(1.0 - uNight);
  col += uLightCol*(pow(s, 900.0)*40.0 + pow(s, 120.0)*0.8 + pow(s, 12.0)*0.05)*vis;

  // foam where the waves wash up the beach
  float dz = shoreZ(p.x) - p.z;
  float wash = sin(-dz*0.35 - t*1.1 + 3.0*vnoise(p.xz*0.03));
  float foamBand = smoothstep(0.55, 0.95, wash)*(1.0 - smoothstep(0.0, 2.2, depth));
  float edge = 1.0 - smoothstep(0.0, 0.35, depth);
  float speck = smoothstep(0.35, 0.8, vnoise(p.xz*vec2(1.3, 3.0) + vec2(0.0, t*0.4)));
  float foam = clamp((foamBand*0.8 + edge)*speck, 0.0, 0.9);
  vec3 fc = vec3(0.9, 0.92, 0.95)*(uSkyAmb*1.6 + uLightCol*max(uLightDir.y + 0.1, 0.0)*0.8);
  col = mix(col, fc, foam);

  col = applyFog(col, p);
  outColor = vec4(finalColor(col, gl_FragCoord.xy), 1.0);
}`;

export function createSea(gl) {
  const prog = createProgram(gl, VS, FS, 'sea');
  // one large quad covering the coast and the open sea
  const x0 = -30000, x1 = 30000, z0 = Z.shore - 900, z1 = Z.shore + 40000;
  const mesh = createMesh(gl, prog, {
    aPos: { data: new Float32Array([x0, z0, x1, z0, x0, z1, x1, z0, x1, z1, x0, z1]), size: 2 },
  });
  return {
    draw(u) {
      gl.useProgram(prog.p);
      setUniforms(gl, prog, u);
      draw(gl, mesh, gl.TRIANGLES);
    },
  };
}
