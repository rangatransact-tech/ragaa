// One raymarched fragment shader renders the whole journey:
// snowy Himalaya at night -> cloud -> desert dunes in the morning -> warm
// haze -> the coast and the Shore Temple at sunrise.
// Camera travels toward +z (east, toward the sea).

export const VERT = `
attribute vec2 aPos;
void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }
`;

export const FRAG = `
uniform vec2 uRes;
uniform float uTime;
uniform vec3 uCamPos, uCamFwd, uCamRight, uCamUp;
uniform float uFocal;
uniform vec3 uSun, uMoon;
uniform float uNight, uDawn, uDay, uHaze, uCloud, uExposure, uPix;
uniform int uSteps, uOct, uShadow;
uniform sampler2D uNoise;

#define SHORE_Z 117.5
#define TEMPLE_Z 114.0

float pathX(float z){ return 2.4*sin(z*0.08) + 1.3*sin(z*0.031 + 1.7); }

float hash1(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
vec2 hash2(vec2 p){ return fract(sin(vec2(dot(p, vec2(127.1,311.7)), dot(p, vec2(269.5,183.3)))) * 43758.5453); }

// Smooth value noise from a random texture: one fetch (hardware bilinear).
float noise(vec2 x){
  vec2 p = floor(x); vec2 f = fract(x);
  f = f*f*(3.0 - 2.0*f);
  return texture2D(uNoise, (p + f + 0.5) / 256.0).x;
}
float noise3(vec3 p){
  float fl = floor(p.y); float fr = fract(p.y); fr = fr*fr*(3.0-2.0*fr);
  return mix(noise(p.xz + fl*vec2(37.0, 17.0)), noise(p.xz + (fl+1.0)*vec2(37.0, 17.0)), fr);
}
const mat2 M2 = mat2(0.8, -0.6, 0.6, 0.8);

float fbm(vec2 p, int oct){
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 8; i++){ if (i >= oct) break; s += a*noise(p); a *= 0.5; p = M2*p*2.03; }
  return s;
}

float ridged(vec2 p, int oct){
  float s = 0.0, a = 0.5, w = 1.0;
  for (int i = 0; i < 9; i++){
    if (i >= oct) break;
    float n = 1.0 - abs(noise(p)*2.0 - 1.0);
    n = n*n*w;
    w = clamp(n*1.7, 0.0, 1.0);
    s += a*n; a *= 0.5; p = M2*p*2.02;
  }
  return s;
}

// ---------------- terrain ----------------
float mountains(vec2 p, int oct){
  float dx = abs(p.x - pathX(p.y));
  float valley = smoothstep(0.5, 6.5, dx);
  float r = ridged(p*0.11 + vec2(3.1, 1.7), oct);
  float base = 0.45 + 0.35*noise(p*0.3);
  return base + valley*valley*r*11.0*(0.6 + 0.4*smoothstep(1.0, 10.0, dx));
}

float dunes(vec2 p){
  vec2 q = vec2(dot(p, vec2(0.83, 0.55)), dot(p, vec2(-0.55, 0.83)));
  float w = q.x*0.2 + 0.9*sin(q.y*0.13 + 1.5*noise(p*0.03)) + 1.4*noise(p*0.045);
  float f = fract(w);
  float prof = f < 0.8 ? f/0.8 : (1.0 - f)/0.2;   // long windward slope, steep slip face
  prof = pow(prof, 1.4);
  float amp = 0.7 + 1.0*noise(p*0.035 + 7.0);
  float h = amp*2.1*prof;
  // a smaller cross-dune system and gentle undulation
  h += 0.3*(0.5 + 0.5*sin(dot(p, vec2(-0.3, 0.95))*0.9 + 3.0*noise(p*0.08)))*noise(p*0.06 + 3.0);
  h += 0.45*noise(p*0.11) + 0.15;
  float dx = abs(p.x - pathX(p.y));
  return h*mix(0.35, 1.0, smoothstep(0.5, 5.0, dx));
}

float beach(vec2 p){
  float shore = SHORE_Z + 0.9*sin(p.x*0.33) + 0.45*sin(p.x*0.9 + 1.0);
  float d = shore - p.y;   // > 0 on land
  float h = 0.34*smoothstep(-0.4, 6.0, d);
  h += 0.16*noise(p*0.35)*smoothstep(0.0, 6.0, d);
  h += 0.45*smoothstep(8.0, 26.0, d)*noise(p*0.12);  // low dunes inland
  h -= 0.7*smoothstep(0.0, -7.0, d);                  // sea floor
  return h - 0.05;
}

float terrainH(vec2 p, int oct){
  float z = p.y;
  float wm = 1.0 - smoothstep(38.0, 50.0, z);
  float wb = smoothstep(84.0, 94.0, z);
  float wd = clamp(1.0 - wm - wb, 0.0, 1.0);
  float h = 0.0;
  if (wm > 0.0) h += wm*mountains(p, oct);
  if (wd > 0.0) h += wd*dunes(p);
  if (wb > 0.0) h += wb*beach(p);
  return h;
}

// ---------------- Shore Temple ----------------
float sdBox(vec3 p, vec3 b){ vec3 q = abs(p) - b; return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0); }
float octa(vec2 p){ p = abs(p); return max(max(p.x, p.y), (p.x + p.y)*0.7071); }

// One stepped pyramidal vimana, base at y = 0, unit scale about 3.6 tall.
float vimana(vec3 p){
  float d = sdBox(p - vec3(0.0, 0.55, 0.0), vec3(0.62, 0.55, 0.62));
  // pilaster rhythm on the walls
  vec3 pw = p; pw.xz = abs(pw.xz);
  d = max(d, -sdBox(vec3(mod(pw.x + 0.1, 0.2) - 0.1, pw.y - 0.55, pw.z - 0.63), vec3(0.05, 0.42, 0.03)));
  d = max(d, -sdBox(vec3(pw.x - 0.63, pw.y - 0.55, mod(pw.z + 0.1, 0.2) - 0.1), vec3(0.03, 0.42, 0.05)));
  float th = 0.34;
  float yy = p.y - 1.1;
  for (int j = 0; j < 2; j++){
    float k = clamp(floor(yy/th) - float(j), 0.0, 4.0);
    float w = 0.6 - k*0.1;
    vec3 q = p - vec3(0.0, 1.1 + (k + 0.5)*th, 0.0);
    float taper = 1.0 - 0.18*clamp(q.y/(th*0.42)*0.5 + 0.5, 0.0, 1.0);
    float tier = sdBox(q, vec3(w*taper, th*0.42, w*taper))*0.9;
    // kudu niches: a row of little shrine blocks on the rim of each tier
    vec3 r = q - vec3(0.0, th*0.42 + 0.025, 0.0);
    float cell = 0.13 - k*0.01;
    vec3 rr = r; rr.xz = mod(rr.xz + cell*0.5, cell) - cell*0.5;
    // small horseshoe-topped kudu shrines rather than square battlements
    float n = length(vec3(rr.x, max(rr.y, 0.0)*1.3, rr.z)) - 0.034;
    n = min(n, sdBox(rr - vec3(0.0, -0.015, 0.0), vec3(0.03, 0.02, 0.03)));
    float rim = abs(max(abs(r.x), abs(r.z)) - (w*0.82 - 0.03)) - 0.035;
    n = max(n, rim);
    d = min(d, min(tier, n));
  }
  float topY = 1.1 + 5.0*th;
  float neck = sdBox(p - vec3(0.0, topY + 0.08, 0.0), vec3(0.17, 0.1, 0.17));
  vec3 o = p - vec3(0.0, topY + 0.16, 0.0);
  float prof = 0.25*sqrt(max(0.0, 1.0 - pow(max(o.y, 0.0)/0.36, 2.0)));
  float dome = max(octa(o.xz) - prof, max(-o.y, o.y - 0.36)) * 0.7;
  vec3 fp = p - vec3(0.0, topY + 0.52, 0.0);
  float fin = length(vec3(fp.x, max(abs(fp.y) - 0.12, 0.0), fp.z)) - 0.028;
  float knob = length(fp - vec3(0.0, 0.16, 0.0)) - 0.045;
  return min(min(d, neck), min(dome, min(fin, knob)));
}

float matId;  // 0 terrain, 1 temple

float temple(vec3 p){
  vec3 c = vec3(pathX(TEMPLE_Z), 0.26, TEMPLE_Z);
  vec3 q = p - c;
  float bound = max(length(q.xz) - 6.2, q.y - 5.2);
  if (bound > 0.4) return bound;
  float plinth = sdBox(q - vec3(0.0, -0.2, 0.0), vec3(2.3, 0.22, 3.0)) - 0.02;
  float big = vimana((q - vec3(0.25, 0.0, 1.05))/1.25)*1.25;
  float small = vimana((q - vec3(-0.85, 0.0, -1.55))/0.78)*0.78;
  // compound wall with Nandi stones
  vec3 w = q - vec3(0.0, 0.05, 0.0);
  float wall = max(sdBox(w, vec3(3.5, 0.3, 4.3)), -sdBox(w, vec3(3.38, 0.6, 4.18)));
  // small seated Nandi figures along the wall: a rounded body and a hump
  vec3 a = w - vec3(0.0, 0.345, 0.0);
  vec3 ax = a; ax.x = mod(ax.x + 0.23, 0.46) - 0.23; ax.z = abs(ax.z) - 4.24;
  vec3 az = a; az.z = mod(az.z + 0.23, 0.46) - 0.23; az.x = abs(az.x) - 3.44;
  float nx = length(max(abs(ax) - vec3(0.045, 0.0, 0.012), 0.0)) - 0.032;
  nx = min(nx, length(ax - vec3(0.03, 0.035, 0.0)) - 0.024);
  float nz = length(max(abs(az) - vec3(0.012, 0.0, 0.045), 0.0)) - 0.032;
  nz = min(nz, length(az - vec3(0.0, 0.035, 0.03)) - 0.024);
  float nandi = min(nx, nz);
  nandi = max(nandi, sdBox(w, vec3(3.6, 0.6, 4.4)));
  return min(min(plinth, min(big, small)), min(wall, nandi));
}

float map(vec3 p, int oct){
  float d = (p.y - terrainH(p.xz, oct));
  matId = 0.0;
  if (uCamPos.z > 80.0 && abs(p.z - TEMPLE_Z) < 7.0){
    float t = temple(p);
    if (t < d){ d = t; matId = 1.0; }
  }
  return d;
}

vec3 calcNormal(vec3 p, float t){
  float e = 0.002 + t*0.0015;
  int oct = uOct + 2;
  if (matId > 0.5){
    vec2 k = vec2(1.0, -1.0)*0.0025;
    return normalize(k.xyy*temple(p + k.xyy) + k.yyx*temple(p + k.yyx) + k.yxy*temple(p + k.yxy) + k.xxx*temple(p + k.xxx));
  }
  float h = terrainH(p.xz, oct);
  return normalize(vec3(h - terrainH(p.xz + vec2(e, 0.0), oct), e, h - terrainH(p.xz + vec2(0.0, e), oct)));
}

float march(vec3 ro, vec3 rd, float tmax){
  float t = 0.05, lt = t;
  for (int i = 0; i < 200; i++){
    if (i >= uSteps) break;
    vec3 p = ro + rd*t;
    float d = map(p, uOct);
    if (d < 0.0012*t){
      // refine the hit with a few bisection steps so edges stay smooth
      float a = lt, b = t;
      for (int j = 0; j < 5; j++){
        float m = 0.5*(a + b);
        if (map(ro + rd*m, uOct) < 0.0012*m) b = m; else a = m;
      }
      map(ro + rd*b, uOct);
      return b;
    }
    if (t > tmax || (p.y > 13.0 && rd.y > 0.0)) return -1.0;  // above every peak, heading up: sky
    lt = t;
    t += max(d*0.45, 0.004 + t*0.0035);
  }
  // out of steps while grazing the ground: call it a hit
  map(ro + rd*t, uOct);
  return t;
}

float softShadow(vec3 ro, vec3 rd){
  float res = 1.0, t = 0.08;
  for (int i = 0; i < 24; i++){
    if (i >= uShadow) break;
    vec3 p = ro + rd*t;
    float h = p.y - terrainH(p.xz, 3);
    if (uCamPos.z > 80.0 && abs(p.z - TEMPLE_Z) < 7.0) h = min(h, temple(p));
    res = min(res, 10.0*h/t);
    if (res < 0.02) break;
    t += clamp(h*0.6, 0.06, 1.2);
  }
  return clamp(res, 0.0, 1.0);
}

// ---------------- sky ----------------
vec3 skyBase(vec3 rd){
  float y = max(rd.y, 0.0);
  vec3 col = vec3(0.0);
  if (uNight > 0.0){
    vec3 n = mix(vec3(0.016, 0.024, 0.052), vec3(0.003, 0.005, 0.016), pow(y, 0.45));
    float md = max(dot(rd, uMoon), 0.0);
    n += vec3(0.30, 0.36, 0.5)*pow(md, 90.0)*0.35 + vec3(0.05, 0.065, 0.11)*pow(md, 6.0)*0.3;
    col += n*uNight;
  }
  if (uDawn > 0.0){
    float sd = max(dot(rd, uSun), 0.0);
    vec3 hor = vec3(0.95, 0.42, 0.16), rose = vec3(0.55, 0.3, 0.4), zen = vec3(0.035, 0.06, 0.19);
    vec3 d = mix(hor, rose, smoothstep(0.0, 0.14, y));
    d = mix(d, zen, smoothstep(0.06, 0.45, y));
    vec2 hz = normalize(rd.xz + 1e-4); vec2 sz = normalize(uSun.xz + 1e-4);
    float az = max(dot(hz, sz), 0.0);
    d *= 0.45 + 0.85*az*az*(1.0 - smoothstep(0.0, 0.45, y));
    float lift = smoothstep(-0.14, 0.06, uSun.y);      // the sky brightens as the sun comes up
    d *= 0.8 + 0.45*lift;
    d += vec3(1.0, 0.55, 0.24)*pow(sd, 10.0)*0.7*lift + vec3(1.0, 0.72, 0.42)*pow(sd, 160.0)*1.6*lift;
    col += d*uDawn;
  }
  if (uDay > 0.0){
    vec3 d = mix(vec3(0.72, 0.58, 0.42), vec3(0.035, 0.13, 0.46), pow(y, 0.38));
    float sd = max(dot(rd, uSun), 0.0);
    d += vec3(1.0, 0.86, 0.62)*pow(sd, 7.0)*0.35 + vec3(1.0, 0.9, 0.7)*pow(sd, 90.0)*0.6;
    col += d*uDay;
  }
  return col;
}

vec3 starLayer(vec3 rd, float cells, float density, float bright){
  vec2 g = vec2(atan(rd.x, rd.z), rd.y)*cells;
  vec2 id = floor(g); vec2 f = fract(g);
  float h = hash1(id);
  if (h > density) return vec3(0.0);
  vec2 o = 0.15 + 0.7*hash2(id + 4.7);
  float cellAng = 1.0/cells;
  float d = length(f - o)*cellAng;
  float r = uPix*0.75;
  float mag = pow(hash1(id + 9.2), 7.0)*0.9 + 0.1;
  float tw = 0.65 + 0.35*sin(uTime*(1.3 + 3.0*h) + h*60.0);
  float s = exp(-d*d/(r*r))*mag*tw*bright;
  vec3 tint = mix(vec3(0.75, 0.84, 1.0), vec3(1.0, 0.93, 0.82), hash1(id + 1.3));
  return tint*s;
}

vec3 sky(vec3 rd){
  vec3 col = skyBase(rd);
  if (uNight > 0.01 && rd.y > -0.02){
    float fadeLow = smoothstep(-0.02, 0.12, rd.y);
    // Milky Way
    vec3 bn = normalize(vec3(0.35, 0.52, -0.78));
    float band = exp(-pow(dot(rd, bn)/0.2, 2.0));
    vec2 mp = vec2(atan(rd.x, rd.z), rd.y)*6.0;
    float dust = fbm(mp*1.3 + 3.0, 4);
    float glow = band*(0.35 + 0.65*fbm(mp*0.6, 3))*(1.0 - 0.75*smoothstep(0.45, 0.7, dust)*band);
    col += vec3(0.05, 0.055, 0.08)*glow*fadeLow*uNight;
    vec3 st = starLayer(rd, 70.0, 0.16, 1.1) + starLayer(rd.zyx, 26.0, 0.22, 2.2);
    st += starLayer(rd, 150.0, 0.05 + 0.35*band, 0.4);
    col += st*fadeLow*uNight;
    // Moon disc
    float md = dot(rd, uMoon);
    float R = 0.042;
    if (md > cos(R*1.6)){
      vec3 ax = normalize(cross(uMoon, vec3(0.0, 1.0, 0.0)));
      vec3 ay = cross(ax, uMoon);
      vec2 q = vec2(dot(rd, ax), dot(rd, ay))/R;
      float rr = length(q);
      float edge = 1.0 - smoothstep(1.0 - uPix/R*1.2, 1.0, rr);
      float maria = fbm(q*1.6 + 11.0, 4);
      vec3 mc = vec3(1.0, 0.98, 0.93)*(0.62 + 0.5*smoothstep(0.35, 0.65, maria));
      mc *= 0.65 + 0.35*sqrt(max(0.0, 1.0 - rr*rr));
      col = mix(col, mc*2.2, edge*uNight);
    }
  }
  return col;
}

vec3 lightDir(){ return normalize(mix(uSun, uMoon, uNight)); }
vec3 lightCol(){
  vec3 L = lightDir();
  float up = smoothstep(-0.04, 0.06, L.y);
  return (uNight*vec3(0.42, 0.52, 0.8)*0.5 + uDawn*vec3(1.0, 0.5, 0.24)*1.7 + uDay*vec3(1.0, 0.87, 0.7)*1.6)*up;
}

vec3 fogColor(vec3 rd){
  vec3 f = skyBase(normalize(vec3(rd.x, max(rd.y, 0.0)*0.3 + 0.02, rd.z)));
  vec3 haze = vec3(0.92, 0.74, 0.52)*(0.55 + 0.45*uDay + 0.3*uDawn);
  return mix(f, haze, uHaze);
}

vec3 applyFog(vec3 col, float t, vec3 rd, vec3 p){
  float dens = uNight*0.028 + uDawn*0.011 + uDay*0.006 + uHaze*0.32;
  float hf = exp(-max(p.y, 0.0)*0.12);
  float f = 1.0 - exp(-t*dens*hf);
  vec3 fc = fogColor(rd);
  fc += lightCol()*pow(max(dot(rd, lightDir()), 0.0), 8.0)*0.12*(1.0 - uNight);
  return mix(col, fc, f);
}

// ---------------- clouds ----------------
vec4 clouds(vec3 ro, vec3 rd, float tEnd, vec2 frag){
  if (uCloud < 0.5) return vec4(0.0);
  float y0 = 4.4, y1 = 8.8;
  float ta, tb;
  if (abs(rd.y) < 1e-4){
    if (ro.y < y0 || ro.y > y1) return vec4(0.0);
    ta = 0.0; tb = 40.0;
  } else {
    float a = (y0 - ro.y)/rd.y, b = (y1 - ro.y)/rd.y;
    ta = max(min(a, b), 0.0); tb = max(a, b);
  }
  tb = min(tb, min(tEnd, 36.0));
  if (tb <= ta) return vec4(0.0);
  float dt = (tb - ta)/14.0;
  float t = ta + dt*hash1(frag + fract(uTime));
  vec4 acc = vec4(0.0);
  vec3 lit = mix(vec3(1.0, 0.97, 0.93), vec3(0.075, 0.09, 0.14), uNight);
  vec3 shd = mix(vec3(0.62, 0.64, 0.7), vec3(0.012, 0.017, 0.032), uNight);
  for (int i = 0; i < 14; i++){
    vec3 p = ro + rd*t;
    float zw = smoothstep(30.0, 37.0, p.z)*(1.0 - smoothstep(47.0, 53.0, p.z));
    float vh = (p.y - y0)/(y1 - y0);
    float prof = smoothstep(0.0, 0.3, vh)*(1.0 - smoothstep(0.6, 1.0, vh));
    vec3 q = p*0.33 + vec3(uTime*0.02, 0.0, uTime*0.03);
    float n = noise3(q)*0.55 + noise3(q*2.1)*0.3 + noise3(q*4.3)*0.15;
    float den = clamp((n - 0.42 + prof*0.35)*3.0, 0.0, 1.0)*zw*prof;
    if (den > 0.01){
      vec3 c = mix(shd, lit, clamp(vh*1.2 + 0.1, 0.0, 1.0));
      float a = 1.0 - exp(-den*dt*1.8);
      acc.rgb += (1.0 - acc.a)*c*a;
      acc.a += (1.0 - acc.a)*a;
      if (acc.a > 0.97) break;
    }
    t += dt;
  }
  return acc;
}

// ---------------- shading ----------------
vec3 shadeTerrain(vec3 p, vec3 n, vec3 rd, float t){
  float z = p.z;
  float wm = 1.0 - smoothstep(38.0, 50.0, z);
  float wb = smoothstep(84.0, 94.0, z);
  float wd = clamp(1.0 - wm - wb, 0.0, 1.0);
  vec3 L = lightDir();
  vec3 LC = lightCol();
  vec3 alb = vec3(0.0);
  float spec = 0.0;
  float sparkle = 0.0;

  if (wm > 0.0){
    float nz = fbm(p.xz*0.9, 3);
    float snow = smoothstep(0.52, 0.78, n.y + 0.22*nz + (p.y - 3.0)*0.035);
    vec3 rock = vec3(0.075, 0.07, 0.068)*(0.7 + 0.6*nz);
    vec3 sn = vec3(0.86, 0.9, 0.98);
    alb += wm*mix(rock, sn, snow);
    spec += wm*snow*0.25;
    // glints on nearby snow
    if (t < 9.0 && snow > 0.5){
      vec2 c = floor(p.xz*55.0);
      float h = hash1(c);
      float tw = pow(max(0.0, sin(uTime*2.0 + h*80.0)), 12.0);
      sparkle = step(0.93, h)*tw*snow*(1.0 - t/9.0)*wm;
    }
  }
  if (wd > 0.0){
    vec3 sand = vec3(0.78, 0.4, 0.16)*(0.86 + 0.24*noise(p.xz*0.6));
    alb += wd*sand;
    // fine wind ripples in the sand
    if (t < 7.0){
      float rip = sin(dot(p.xz, vec2(0.62, 0.78))*16.0 + noise(p.xz*1.6)*6.0);
      n = normalize(n + vec3(0.62, 0.0, 0.78)*rip*0.05*(1.0 - t/7.0)*(1.0 - t/7.0)*wd);
    }
  }
  if (wb > 0.0){
    float shore = SHORE_Z + 0.9*sin(p.x*0.33) + 0.45*sin(p.x*0.9 + 1.0);
    float wet = 1.0 - smoothstep(0.0, 1.1, shore - p.z);
    vec3 sand = vec3(0.76, 0.66, 0.52)*(0.9 + 0.2*noise(p.xz*1.3));
    alb += wb*mix(sand, sand*0.55, wet);
    spec += wb*wet*0.4;
  }

  float dif = max(dot(n, L), 0.0);
  float sh = 1.0;
  if (uShadow > 0 && dif > 0.0 && L.y > -0.02) sh = softShadow(p + n*0.02, L);
  vec3 skyAmb = skyBase(vec3(0.0, 1.0, 0.0));
  vec3 amb = skyAmb*(0.55 + 0.45*n.y)*0.9 + vec3(0.02, 0.025, 0.04)*uNight;
  vec3 col = alb*(LC*dif*sh + amb);
  // back/bounce light keeps shadows from going dead
  col += alb*LC*0.08*max(dot(n, normalize(vec3(-L.x, 0.0, -L.z))), 0.0);
  vec3 hv = normalize(L - rd);
  col += LC*spec*pow(max(dot(n, hv), 0.0), 40.0)*sh;
  col += vec3(0.9, 0.95, 1.0)*sparkle*2.5;
  return col;
}

vec3 shadeTemple(vec3 p, vec3 n, vec3 rd){
  vec3 L = lightDir();
  vec3 LC = lightCol();
  float g = fbm(p.xz*3.0 + p.y*2.0, 3);
  vec3 alb = vec3(0.4, 0.34, 0.29)*(0.75 + 0.45*g);
  float ao = 0.35 + 0.65*smoothstep(0.0, 0.1, temple(p + n*0.1));
  float dif = max(dot(n, L), 0.0);
  float sh = uShadow > 0 ? softShadow(p + n*0.03, L) : 1.0;
  vec3 amb = skyBase(vec3(0.0, 1.0, 0.0))*(0.5 + 0.5*n.y);
  vec3 col = alb*(LC*dif*sh + amb*ao);
  // warm rim where the sunrise wraps the silhouette
  float rim = pow(1.0 - max(dot(n, -rd), 0.0), 3.0)*max(dot(rd, L), 0.0);
  col += LC*rim*0.35;
  return col;
}

vec3 shadeSea(vec3 p, vec3 rd, float t){
  // directional swell + chop, analytic gradient
  vec2 g = vec2(0.0);
  float fade = 1.0/(1.0 + t*0.08);
  vec2 d1 = normalize(vec2(0.2, -1.0)), d2 = normalize(vec2(-0.6, -0.8)), d3 = normalize(vec2(0.7, -0.7)), d4 = normalize(vec2(-0.1, 1.0));
  g += d1*0.06*1.3*cos(dot(p.xz, d1)*1.3 + uTime*1.1);
  g += d2*0.035*2.1*cos(dot(p.xz, d2)*2.1 + uTime*1.5);
  g += d3*0.02*3.7*cos(dot(p.xz, d3)*3.7 + uTime*2.2);
  g += d4*0.012*6.3*cos(dot(p.xz, d4)*6.3 + uTime*2.8);
  vec2 np = p.xz*2.4 + vec2(uTime*0.1, -uTime*0.14);
  float e = 0.08;
  float n0 = noise(np);
  g += vec2(noise(np + vec2(e, 0.0)) - n0, noise(np + vec2(0.0, e)) - n0)/e*0.05;
  vec3 n = normalize(vec3(-g.x*fade, 1.0, -g.y*fade));

  vec3 L = lightDir();
  vec3 LC = lightCol();
  float fres = 0.02 + 0.98*pow(1.0 - max(dot(n, -rd), 0.0), 5.0);
  vec3 r = reflect(rd, n); r.y = abs(r.y);
  vec3 refl = skyBase(r);
  float depth = max(-terrainH(p.xz, 3), 0.0);
  vec3 deep = vec3(0.01, 0.045, 0.065), shallow = vec3(0.06, 0.2, 0.21);
  vec3 body = mix(shallow, deep, smoothstep(0.0, 0.5, depth));
  body *= skyBase(vec3(0.0, 1.0, 0.0))*1.6 + LC*0.25;
  vec3 col = mix(body, refl, fres);
  // sun glitter path
  float sv = smoothstep(-0.03, 0.02, L.y);
  float s = max(dot(r, L), 0.0);
  col += LC*(pow(s, 700.0)*60.0 + pow(s, 90.0)*1.2)*sv*(1.0 - uNight*0.7);
  // shore foam
  float wave = sin(p.z*3.0 - uTime*1.4 + noise(p.xz*1.5)*4.0);
  float foam = smoothstep(0.16, 0.0, depth + 0.05*wave)*smoothstep(0.35, 0.75, noise(p.xz*vec2(4.0, 9.0) + vec2(0.0, uTime*0.4)) + 0.25);
  vec3 fc = vec3(0.9, 0.9, 0.88)*(LC*0.45*max(L.y + 0.1, 0.0) + skyBase(vec3(0.0, 1.0, 0.0))*1.3);
  col = mix(col, fc, clamp(foam, 0.0, 0.85));
  return col;
}

vec3 aces(vec3 x){ return clamp((x*(2.51*x + 0.03))/(x*(2.43*x + 0.59) + 0.14), 0.0, 1.0); }

void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5*uRes)/uRes.y;
  vec3 ro = uCamPos;
  vec3 rd = normalize(uCamFwd*uFocal + uv.x*uCamRight + uv.y*uCamUp);

  float tSea = rd.y < 0.0 ? -ro.y/rd.y : 1e5;
  float tMax = min(70.0, tSea);
  float t = march(ro, rd, tMax);
  vec3 col;
  float dist = 1e5;
  if (t > 0.0){
    vec3 p = ro + rd*t;
    float mid = matId;
    vec3 n = calcNormal(p, t);
    col = mid > 0.5 ? shadeTemple(p, n, rd) : shadeTerrain(p, n, rd, t);
    col = applyFog(col, t, rd, p);
    dist = t;
  } else if (tSea < 70.0 && ro.z + rd.z*tSea > 80.0){
    vec3 p = ro + rd*tSea;
    col = shadeSea(p, rd, tSea);
    col = applyFog(col, tSea, rd, p);
    dist = tSea;
  } else {
    col = sky(rd);
    col = mix(col, fogColor(rd), uHaze*0.85);
  }

  vec4 cl = clouds(ro, rd, dist, gl_FragCoord.xy);
  col = col*(1.0 - cl.a) + cl.rgb*1.1;

  // warm haze swirl
  if (uHaze > 0.01){
    float sw = fbm(uv*2.2 + vec2(uTime*0.05, 0.0), 3);
    col = mix(col, fogColor(rd)*(0.9 + 0.25*sw), uHaze*0.35);
  }

  col = aces(col*uExposure);
  // vignette + a little film grain
  vec2 q = gl_FragCoord.xy/uRes;
  col *= 0.55 + 0.45*pow(16.0*q.x*q.y*(1.0 - q.x)*(1.0 - q.y), 0.18);
  col += (hash1(gl_FragCoord.xy + fract(uTime*7.3)*97.0) - 0.5)*0.022;
  col = pow(max(col, 0.0), vec3(1.0/2.2));
  gl_FragColor = vec4(col, 1.0);
}
`;
