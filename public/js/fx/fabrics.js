// Procedural fabric textures for the "what to wear" swatches, painted once
// per fabric on a canvas: sequins, velvet, satin, zari borders and more.

const W = 440, H = 320;

// --- tiny value noise ---
const P = new Uint8Array(512);
(() => { let s = 7; const p = [...Array(256).keys()]; for (let i = 255; i > 0; i--) { s = (s * 16807) % 2147483647; const j = s % (i + 1); [p[i], p[j]] = [p[j], p[i]]; } for (let i = 0; i < 512; i++) P[i] = p[i & 255]; })();
const hv = (x, y) => P[(P[x & 255] + y) & 511] / 255;
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y); let xf = x - xi, yf = y - yi;
  xf = xf * xf * (3 - 2 * xf); yf = yf * yf * (3 - 2 * yf);
  const a = hv(xi, yi), b = hv(xi + 1, yi), c = hv(xi, yi + 1), d = hv(xi + 1, yi + 1);
  return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf;
}
function fbm(x, y, o = 4) { let s = 0, a = 0.5; for (let i = 0; i < o; i++) { s += a * vnoise(x, y); x *= 2.03; y *= 2.03; a *= 0.5; } return s; }
const rand = (() => { let s = 99; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

function pixels(ctx, fn) {
  const img = ctx.createImageData(W, H);
  const d = img.data;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const c = fn(x, y);
      const i = (y * W + x) * 4;
      d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}

// Soft drape folds: returns -1..1 across the cloth.
const fold = (x, y, f = 0.018) => Math.sin(x * f + y * 0.004 + 2.4 * fbm(x * 0.004, y * 0.006, 3));
// Plain-weave grain.
const weave = (x, y, k = 0.06) => ((x + y) & 1 ? 1 + k : 1 - k) * (1 + (vnoise(x * 0.5, y * 3) - 0.5) * k * 2);

// Silk: rich sheen bands that shift colour slightly.
function silk(base, x, y, sheen = 0.5) {
  const f = fold(x, y, 0.02);
  const lit = 0.62 + 0.38 * f;
  const spec = Math.pow(clamp(f), 16) * sheen * 0.55;
  const c = base.map((v) => v * lit * weave(x, y, 0.03));
  return c.map((v) => clamp(v + spec * 255, 0, 255));
}

// Metallic zari: fine twill with bright glints.
function zari(x, y, tone = [214, 176, 106]) {
  const tw = Math.sin((x + y * 0.5) * 1.3) * 0.5 + 0.5;
  const n = fbm(x * 0.08, y * 0.08, 3);
  const f = fold(x, y, 0.025);
  const b = 0.55 + 0.35 * tw * 0.5 + 0.35 * f + (n - 0.5) * 0.5;
  const glint = Math.pow(clamp(f * 0.5 + n * 0.8 - 0.35), 6) * 1.8;
  return tone.map((v) => clamp(v * b + glint * 255, 0, 255));
}

const PAINT = {
  sequins(ctx) {
    ctx.fillStyle = '#0d0f1a'; ctx.fillRect(0, 0, W, H);
    const r = 8.5, dx = r * 1.72, dy = r * 1.5;
    const tones = [hex('#cfd4dc'), hex('#d9b45a'), hex('#27325e')];
    for (let row = -1; row * dy < H + r; row++) {
      for (let col = -1; col * dx < W + r; col++) {
        const x = col * dx + (row & 1 ? dx / 2 : 0), y = row * dy;
        const zone = fbm(x * 0.006 + 3, y * 0.008, 2);
        const tone = tones[zone < 0.42 ? 2 : zone < 0.55 ? 0 : 1];
        const tilt = rand();
        const b = 0.35 + 0.65 * Math.pow(tilt, 2.2);
        const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, 0, x, y, r);
        const hi = mixc(tone, [255, 255, 255], Math.pow(tilt, 6) * 0.9);
        g.addColorStop(0, `rgb(${hi.map((v) => v * Math.min(1, b + 0.3) | 0)})`);
        g.addColorStop(0.7, `rgb(${tone.map((v) => v * b | 0)})`);
        g.addColorStop(1, `rgb(${tone.map((v) => v * b * 0.45 | 0)})`);
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
        ctx.beginPath(); ctx.arc(x, y - r * 0.05, r * 0.14, 0, Math.PI * 2); ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fill();
        if (tilt > 0.94) { // a sequin catching the light
          ctx.save(); ctx.globalCompositeOperation = 'lighter';
          const s = ctx.createRadialGradient(x, y, 0, x, y, r * 2.6);
          s.addColorStop(0, 'rgba(255,255,255,.9)'); s.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = s; ctx.fillRect(x - r * 3, y - r * 3, r * 6, r * 6);
          ctx.restore();
        }
      }
    }
  },
  velvet(ctx) {
    const a = hex('#3b0f4f'), b = hex('#0c3b5e');
    pixels(ctx, (x, y) => {
      const f = fold(x, y, 0.014);
      const base = mixc(a, b, clamp(fbm(x * 0.004, y * 0.004, 2) * 1.6 - 0.4));
      // velvet glows at the edges of folds, deep in the valleys
      const pile = 0.28 + 0.5 * Math.pow(Math.abs(f), 0.7) + 0.25 * Math.pow(clamp(f), 8);
      const grain = 0.9 + 0.2 * rand();
      return base.map((v) => clamp(v * pile * grain * 1.8, 0, 255));
    });
  },
  satin(ctx) {
    const base = hex('#b98f78');
    pixels(ctx, (x, y) => {
      const f = Math.sin(x * 0.016 - y * 0.006 + 3 * fbm(x * 0.003, y * 0.004, 3));
      const lit = 0.66 + 0.3 * f;
      const spec = Math.pow(clamp(f), 18) * 0.38 + Math.pow(clamp(f), 4) * 0.1;
      return base.map((v) => clamp(v * lit + spec * 255, 0, 255));
    });
  },
  metallic(ctx) {
    const tones = [hex('#d8b25c'), hex('#c9c9cf'), hex('#d49a86')];
    pixels(ctx, (x, y) => {
      const band = x / W;
      const tone = band < 0.4 ? tones[0] : band < 0.7 ? mixc(tones[0], tones[2], (band - 0.4) / 0.3) : mixc(tones[2], tones[1], clamp((band - 0.7) / 0.2));
      const n = fbm(x * 0.05, y * 0.05, 4);
      const cr = Math.abs(fbm(x * 0.02 + 5, y * 0.02, 3) - 0.5) * 2; // crinkle
      const b = 0.35 + 1.1 * Math.pow(n, 1.5) + 0.4 * (1 - cr);
      const glint = Math.pow(clamp(n * 1.3 - 0.45), 3) * 2;
      return tone.map((v) => clamp(v * b * 0.8 + glint * 255, 0, 255));
    });
  },
  glitter(ctx) {
    const base = hex('#20121f');
    pixels(ctx, (x, y) => {
      const f = fold(x, y, 0.015);
      const b = 0.7 + 0.3 * f;
      let c = base.map((v) => v * b);
      const r = rand();
      if (r > 0.9) {
        const k = (r - 0.9) * 10;
        const tint = [[255, 240, 210], [230, 220, 255], [255, 200, 230], [210, 190, 150]][(r * 1000 | 0) % 4];
        c = mixc(c, tint, Math.pow(k, 1.5) * (0.5 + 0.5 * clamp(f + 0.5)));
      }
      return c;
    });
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 26; i++) {
      const x = rand() * W, y = rand() * H, s = 3 + rand() * 7;
      ctx.strokeStyle = 'rgba(255,245,225,.8)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x - s, y); ctx.lineTo(x + s, y); ctx.moveTo(x, y - s); ctx.lineTo(x, y + s); ctx.stroke();
    }
    ctx.restore();
  },
  mul(ctx) {
    const base = hex('#f3e19b');
    pixels(ctx, (x, y) => {
      const f = fold(x, y, 0.012);
      const slub = 1 + (vnoise(x * 0.02, y * 0.9) - 0.5) * 0.12;
      const b = (0.82 + 0.18 * f) * weave(x, y, 0.07) * slub;
      return base.map((v) => clamp(v * b, 0, 255));
    });
  },
  bandhani(ctx) {
    const base = hex('#e7820f'), deep = hex('#c2410c');
    pixels(ctx, (x, y) => {
      const f = fold(x, y, 0.013);
      const grd = mixc(base, deep, clamp(fbm(x * 0.006, y * 0.006, 2) * 1.8 - 0.6));
      let c = grd.map((v) => v * (0.8 + 0.2 * f) * weave(x, y, 0.05));
      // tiny tied dots: pale ring with a dark knot centre, in diamond clusters
      const s = 13, gx = Math.floor(x / s), gy = Math.floor(y / s);
      const ox = (gy & 1) ? s / 2 : 0;
      const cx = (Math.floor((x - ox) / s) + 0.5) * s + ox, cy = (gy + 0.5) * s;
      const cluster = Math.abs(((gx + gy) % 6) - 3) + Math.abs(((gx - gy + 60) % 6) - 3);
      if (cluster <= 3) {
        const jx = (hv(gx, gy) - 0.5) * 2, jy = (hv(gy, gx) - 0.5) * 2;
        const d = Math.hypot(x - cx - jx, y - cy - jy);
        if (d < 3.4) c = mixc(c, d < 1.1 ? [120, 60, 20] : [252, 236, 200], d < 1.1 ? 0.6 : clamp(1.2 - d / 3.4));
      }
      return c;
    });
  },
  chanderi(ctx) {
    const base = hex('#f1dc98');
    pixels(ctx, (x, y) => {
      const f = fold(x, y, 0.016);
      // sheer: faint grid of threads and a soft silk lustre
      const grid = (x % 3 === 0 || y % 3 === 0) ? 0.96 : 1.03;
      let c = base.map((v) => clamp(v * (0.82 + 0.2 * f) * grid + Math.pow(clamp(f), 10) * 60, 0, 255));
      // small gold buti in a half-drop repeat
      const s = 44, gy = Math.floor(y / s), ox = gy & 1 ? s / 2 : 0;
      const cx = (Math.floor((x - ox) / s) + 0.5) * s + ox, cy = (gy + 0.5) * s;
      const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy);
      const petal = Math.abs(Math.cos(Math.atan2(dy, dx) * 3));
      if (d < 3.5 + 3.5 * petal) c = zari(x, y, [226, 180, 92]);
      return c;
    });
  },
  gota(ctx) {
    const base = hex('#f5d12a');
    pixels(ctx, (x, y) => {
      const edge = H * 0.66;
      if (y > edge) {
        // gota patti border: metallic ribbon with leaf appliqué
        const lx = (x % 36) - 18, ly = y - (edge + (H - edge) / 2);
        const leaf = (lx * lx) / 180 + (ly * ly) / 70 < 1 && Math.abs(ly) < 20;
        if (y < edge + 5 || y > H - 5) return zari(x, y, [200, 160, 80]);
        return leaf ? zari(x, y, [232, 196, 110]) : [196, 44, 58].map((v) => v * (0.85 + 0.15 * fold(x, y)));
      }
      const f = fold(x, y, 0.014);
      return base.map((v) => clamp(v * (0.8 + 0.2 * f) * weave(x, y, 0.05), 0, 255));
    });
  },
  linen(ctx) {
    const base = hex('#c99a15');
    pixels(ctx, (x, y) => {
      const slub = (vnoise(x * 0.015, y * 1.3) - 0.5) * 0.28 + (vnoise(x * 1.2, y * 0.02) - 0.5) * 0.18;
      const f = fold(x, y, 0.01);
      const b = (0.85 + 0.15 * f) * (1 + slub) * weave(x, y, 0.06);
      return base.map((v) => clamp(v * b, 0, 255));
    });
  },
  kanjivaram(ctx) {
    const red = hex('#8c0f1b');
    pixels(ctx, (x, y) => {
      const b0 = H * 0.62;
      if (y > b0) {
        const yy = y - b0;
        if (yy < 4 || (yy > 12 && yy < 15)) return zari(x, y);
        if (yy > 20 && yy < 52) { // temple-tower motifs in the zari border
          const lx = (x % 26) - 13, ty = yy - 20;
          const tri = Math.abs(lx) < (32 - ty) * 0.42;
          return tri ? zari(x, y, [226, 186, 110]) : silk(hex('#5e0a12'), x, y, 0.4);
        }
        return zari(x, y);
      }
      // body: rich silk with tiny zari checks
      const chk = (x % 22 < 1.5) || (y % 22 < 1.5);
      return chk ? zari(x, y, [190, 150, 80]) : silk(red, x, y, 0.55);
    });
  },
  pancha(ctx) {
    const cream = hex('#efe4c8');
    pixels(ctx, (x, y) => {
      const b0 = H * 0.7, yy = y - b0;
      if (yy > 0 && (yy < 6 || (yy > 12 && yy < 40) || (yy > 46 && yy < 50))) return zari(x, y);
      const f = fold(x, y, 0.012);
      return cream.map((v) => clamp(v * (0.84 + 0.16 * f) * weave(x, y, 0.05), 0, 255));
    });
  },
  halfsaree(ctx) {
    const green = hex('#1f7a3a'), pink = hex('#e0527f');
    pixels(ctx, (x, y) => {
      const b0 = H * 0.64, yy = y - b0;
      if (yy > 0) {
        if (yy < 4 || (yy > 60 && yy < 64)) return zari(x, y);
        return silk(pink, x, y, 0.5);
      }
      return silk(green, x, y, 0.55);
    });
  },
  silkkurta(ctx) {
    const maroon = hex('#6c1323');
    pixels(ctx, (x, y) => {
      const yy = y - H * 0.78;
      if (yy > 0 && yy < 26) return zari(x, y);
      return silk(maroon, x, y, 0.45);
    });
  },
  templegold(ctx) {
    // hammered gold: overlapping shallow dimples catching light
    const pts = [];
    for (let i = 0; i < 260; i++) pts.push([rand() * W, rand() * H]);
    const gold = hex('#d4a64a');
    pixels(ctx, (x, y) => {
      let d1 = 1e9, d2 = 1e9, px = 0, py = 0;
      for (let i = 0; i < pts.length; i++) {
        const dx = x - pts[i][0], dy = y - pts[i][1];
        const d = dx * dx + dy * dy;
        if (d < d1) { d2 = d1; d1 = d; px = dx; py = dy; } else if (d < d2) d2 = d;
      }
      const r = Math.sqrt(d1), e = Math.sqrt(d2) - r;
      const nx = px / (r + 8), ny = py / (r + 8);
      const lit = 0.55 + 0.45 * (-nx * 0.6 - ny * 0.8);
      const spec = Math.pow(clamp(-nx * 0.6 - ny * 0.8), 8) * 0.9;
      const ridge = clamp(1 - e / 2.2) * 0.25;
      return gold.map((v) => clamp(v * (lit + ridge) + spec * 255, 0, 255));
    });
  },
};

const made = new Map();
export function fabricURL(name) {
  if (made.has(name)) return made.get(name);
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  (PAINT[name] || PAINT.mul)(ctx);
  // gentle overall light falloff, like a swatch under a lamp
  const g = ctx.createRadialGradient(W * 0.35, H * 0.3, 0, W * 0.5, H * 0.5, W * 0.8);
  g.addColorStop(0, 'rgba(255,255,255,0.06)'); g.addColorStop(1, 'rgba(0,0,0,0.22)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const url = c.toDataURL('image/jpeg', 0.86);
  made.set(name, url);
  return url;
}
