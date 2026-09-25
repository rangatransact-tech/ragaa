// Shared atmosphere GLSL: sky (physical day/dawn scattering, twilight and a
// moonlit night), aerial fog, and the final tone curve. Every material uses
// these, so land, sea, temple and sky always agree on light and colour.

export const GLSL_COMMON = /* glsl */`
uniform vec3 uCamPos;
uniform mat4 uViewProj;
uniform float uTime;
uniform vec3 uSunDir, uMoonDir, uLightDir, uLightCol, uSkyAmb, uGroundAmb;
uniform float uNight, uSunE, uExposure;
uniform vec3 uBetaR, uBetaM;
uniform float uFogDensity, uFogFalloff, uHaze, uCloud;
uniform vec3 uHazeCol, uCloudCol;
`;

export const GLSL_ATMOS = /* glsl */`
const float PI = 3.14159265;

float hash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx)*0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y)*p3.z); }

// Preetham-style daylight scattering (after three.js Sky).
vec3 skyDay(vec3 dir){
  vec3 up = vec3(0.0, 1.0, 0.0);
  float zen = acos(max(0.0, dir.y));
  float inv = 1.0/(cos(zen) + 0.15*pow(max(93.885 - zen*57.2958, 0.01), -1.253));
  vec3 Fex = exp(-(uBetaR*8.4e3*inv + uBetaM*1.25e3*inv));
  float cosT = dot(dir, uSunDir);
  float c2 = cosT*0.5 + 0.5;
  float rPh = 0.0596831*(1.0 + c2*c2);
  float g = 0.76, g2 = g*g;
  float mPh = 0.0795775*(1.0 - g2)/pow(1.0 - 2.0*g*cosT + g2, 1.5);
  vec3 bt = (uBetaR*rPh + uBetaM*mPh)/(uBetaR + uBetaM);
  vec3 Lin = pow(uSunE*bt*(1.0 - Fex), vec3(1.5));
  Lin *= mix(vec3(1.0), pow(uSunE*bt*Fex, vec3(0.5)), clamp(pow(1.0 - uSunDir.y, 5.0), 0.0, 1.0));
  vec3 L0 = vec3(0.1)*Fex;
  float disk = smoothstep(0.99994, 0.99997, cosT);
  L0 += uSunE*19000.0*Fex*disk;
  vec3 c = (Lin + L0)*0.04 + vec3(0.0, 0.0003, 0.00075);
  return pow(c, vec3(1.0/2.4));
}

// Before sunrise: deep blue overhead, a warm band on the horizon toward the sun.
vec3 skyTwilight(vec3 dir){
  float e = uSunDir.y;
  float y = max(dir.y, 0.0);
  vec2 hz = normalize(dir.xz + 1e-5), sz = normalize(uSunDir.xz + 1e-5);
  float az = max(dot(hz, sz), 0.0);
  float light = smoothstep(-0.22, 0.02, e);
  vec3 zen = mix(vec3(0.006, 0.01, 0.035), vec3(0.05, 0.09, 0.22), light);
  vec3 band = mix(vec3(0.03, 0.03, 0.07), vec3(0.62, 0.36, 0.42), light);
  vec3 glow = mix(vec3(0.05, 0.03, 0.04), vec3(1.25, 0.52, 0.2), light);
  vec3 c = mix(band, zen, smoothstep(0.0, 0.42, y));
  c += glow*exp(-y*10.0)*(0.25 + 0.75*az*az*az);
  c += vec3(1.3, 0.65, 0.3)*pow(max(dot(dir, uSunDir), 0.0), 18.0)*light;
  return c;
}

// Night: navy sky, airglow near the horizon, the Milky Way and the moon.
vec3 skyNight(vec3 dir, bool detail){
  float y = max(dir.y, 0.0);
  vec3 c = mix(vec3(0.018, 0.028, 0.06), vec3(0.004, 0.007, 0.02), pow(y, 0.5));
  float md = max(dot(dir, uMoonDir), 0.0);
  c += vec3(0.16, 0.2, 0.3)*pow(md, 60.0) + vec3(0.04, 0.05, 0.08)*pow(md, 6.0);
  if (detail){
    vec3 bn = normalize(vec3(0.42, 0.55, -0.72));
    float band = exp(-pow(dot(dir, bn)/0.22, 2.0));
    vec2 mp = vec2(atan(dir.x, dir.z), dir.y)*3.0;
    float cl = fbm(mp*2.0 + 3.0, 4);
    float dust = fbm(mp*5.0 + 11.0, 3);
    c += vec3(0.045, 0.05, 0.07)*band*smoothstep(0.35, 0.8, cl)*(1.0 - 0.8*smoothstep(0.5, 0.7, dust))*smoothstep(0.0, 0.15, y);
    // the moon: a textured disc with a soft halo
    float R = 0.021;
    float ang = acos(clamp(dot(dir, uMoonDir), -1.0, 1.0));
    if (ang < R*1.5){
      vec3 ax = normalize(cross(uMoonDir, vec3(0.0, 1.0, 0.0)));
      vec3 ay = cross(ax, uMoonDir);
      vec2 q = vec2(dot(dir, ax), dot(dir, ay))/R;
      float r = length(q);
      float edge = 1.0 - smoothstep(0.93, 1.0, r);
      float maria = fbm(q*1.7 + 4.0, 4);
      float craters = fbm(q*6.0 + 9.0, 3);
      vec3 mc = vec3(1.0, 0.97, 0.9)*(0.55 + 0.45*smoothstep(0.38, 0.62, maria))*(0.85 + 0.3*craters);
      mc *= 0.7 + 0.3*sqrt(max(0.0, 1.0 - r*r));
      c = mix(c, mc*5.0, edge);
    }
  }
  return c;
}

vec3 skyColor(vec3 dir, bool detail){
  float e = uSunDir.y;
  vec3 day = skyDay(dir);
  float tw = 1.0 - smoothstep(-0.01, 0.07, e);
  vec3 c = mix(day, skyTwilight(dir), tw);
  if (uNight > 0.0) c = mix(c, skyNight(dir, detail), uNight);
  return c;
}

vec3 fogColor(vec3 dir){
  vec3 h = skyColor(normalize(vec3(dir.x, max(dir.y, 0.0)*0.35 + 0.02, dir.z)), false);
  h = mix(h, uHazeCol, uHaze);
  return mix(h, uCloudCol, uCloud);
}

vec3 applyFog(vec3 col, vec3 wpos){
  vec3 d = wpos - uCamPos;
  float dist = length(d);
  vec3 dir = d/dist;
  float hAvg = max(0.0, 0.5*(uCamPos.y + wpos.y));
  float dens = uFogDensity*exp(-hAvg*uFogFalloff) + uHaze*0.0011 + uCloud*0.02;
  float f = 1.0 - exp(-dist*dens);
  vec3 fc = fogColor(dir);
  // sunlit mist glows toward the sun
  fc += uLightCol*0.08*pow(max(dot(dir, uLightDir), 0.0), 6.0)*(1.0 - uNight);
  return mix(col, fc, f);
}

vec3 aces(vec3 x){ return clamp((x*(2.51*x + 0.03))/(x*(2.43*x + 0.59) + 0.14), 0.0, 1.0); }
vec3 finalColor(vec3 c, vec2 frag){
  c = aces(c*uExposure);
  c = pow(c, vec3(1.0/2.2));
  return c + (hash12(frag + fract(uTime)*61.0) - 0.5)/255.0;
}
`;

// CPU side: Preetham coefficients for a given sun direction.
export function preetham(sunDir, turbidity = 4, rayleigh = 1.6, mie = 0.004) {
  const cutoff = 1.6110731556870734, steep = 1.5;
  const zc = Math.max(-1, Math.min(1, sunDir[1]));
  const sunE = 1000 * Math.max(0, 1 - Math.exp(-((cutoff - Math.acos(zc)) / steep)));
  const totalR = [5.804542996261093e-6, 1.3562911419845635e-5, 3.0265902468824876e-5];
  const betaR = totalR.map((v) => v * rayleigh);
  const c = 0.2 * turbidity * 10e-18;
  const mieK = [1.8399918514433978e14, 2.7798023919660528e14, 4.0790479543861094e14];
  const betaM = mieK.map((v) => 0.434 * c * v * mie);
  return { sunE, betaR, betaM };
}
