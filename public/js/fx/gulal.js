// Gulal powder: soft, grainy, semi-transparent clouds that burst, slow,
// drift and fade. Sizes are capped so powder never floods the screen.

const COLOURS = [
  ['#F2B705', 5], ['#F28C0F', 4], ['#FFC61A', 2], // haldi yellow, marigold, sunflower
  ['#E8457A', 1.2], ['#3FA34D', 0.8], ['#2F6FD6', 0.7], ['#C2187A', 1],
];
const MAX_PARTICLES = 360;

export function createGulal(canvas) {
  const ctx = canvas.getContext('2d');
  const sprites = new Map();
  const parts = [];
  let raf = 0, last = 0, W = 0, H = 0, dpr = 1;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize);

  // A grainy soft puff for each colour, rendered once.
  function sprite(col) {
    if (sprites.has(col)) return sprites.get(col);
    const s = 96;
    const c = document.createElement('canvas'); c.width = c.height = s;
    const x = c.getContext('2d');
    const r = parseInt(col.slice(1, 3), 16), g = parseInt(col.slice(3, 5), 16), b = parseInt(col.slice(5, 7), 16);
    // an irregular cloud built from overlapping soft blobs
    const blobs = [];
    for (let k = 0; k < 9; k++) {
      const ang = Math.random() * 6.28, dist = Math.random() * 0.28;
      blobs.push([0.5 + Math.cos(ang) * dist, 0.5 + Math.sin(ang) * dist, 0.16 + Math.random() * 0.2]);
    }
    const img = x.createImageData(s, s);
    for (let yy = 0; yy < s; yy++) {
      for (let xx = 0; xx < s; xx++) {
        const u = xx / s, v = yy / s;
        let a = 0;
        for (const [bx, by, br] of blobs) {
          const d2 = ((u - bx) ** 2 + (v - by) ** 2) / (br * br);
          a += Math.exp(-d2 * 2.2);
        }
        a = Math.min(1, a * 0.5);
        const edge = Math.max(0, 1 - Math.hypot(u - 0.5, v - 0.5) / 0.5);
        a *= edge * edge;
        // fine powder grain
        a *= 0.45 + 0.55 * Math.random();
        const i = (yy * s + xx) * 4;
        const shade = 0.9 + Math.random() * 0.16;
        img.data[i] = Math.min(255, r * shade); img.data[i + 1] = Math.min(255, g * shade); img.data[i + 2] = Math.min(255, b * shade);
        img.data[i + 3] = a * 210;
      }
    }
    x.putImageData(img, 0, 0);
    sprites.set(col, c);
    return c;
  }

  function pickColour() {
    const total = COLOURS.reduce((s, c) => s + c[1], 0);
    let r = Math.random() * total;
    for (const [c, w] of COLOURS) { if ((r -= w) <= 0) return c; }
    return COLOURS[0][0];
  }

  function burst(x, y, strength = 1) {
    const base = Math.min(W, H);
    const maxSize = base * 0.2;
    const main = pickColour();
    const n = Math.round(46 * strength);
    for (let i = 0; i < n; i++) {
      if (parts.length >= MAX_PARTICLES) parts.shift();
      const ang = Math.random() * Math.PI * 2;
      const sp = base * (0.35 + Math.random() * 1.1) * strength;
      parts.push({
        x: x + (Math.random() - 0.5) * 12, y: y + (Math.random() - 0.5) * 12,
        vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - base * 0.15,
        size: base * (0.02 + Math.random() * 0.03), grow: base * (0.05 + Math.random() * 0.09), max: maxSize * (0.5 + Math.random() * 0.5),
        rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 1.2,
        life: 0, span: 2 + Math.random() * 1.1,
        a: 0.28 + Math.random() * 0.26,
        spr: sprite(Math.random() < 0.7 ? main : pickColour()),
      });
    }
    // a few fine specks that fly further
    for (let i = 0; i < 18 * strength; i++) {
      if (parts.length >= MAX_PARTICLES) parts.shift();
      const ang = Math.random() * Math.PI * 2, sp = base * (1 + Math.random() * 1.4);
      parts.push({ x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, size: 2 + Math.random() * 3, grow: 2, max: 7, rot: 0, vr: 0, life: 0, span: 1.2 + Math.random(), a: 0.8, spr: sprite(main) });
    }
    if (!raf) { last = performance.now(); raf = requestAnimationFrame(step); }
  }

  function step(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    ctx.clearRect(0, 0, W, H);
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.life += dt;
      if (p.life > p.span) { parts.splice(i, 1); continue; }
      const drag = Math.exp(-dt * 3.6);
      p.vx *= drag; p.vy = p.vy * drag + 12 * dt; // settle gently
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.size = Math.min(p.max, p.size + p.grow * dt * (1.4 - p.life / p.span));
      p.rot += p.vr * dt;
      const k = p.life / p.span;
      const alpha = p.a * (k < 0.08 ? k / 0.08 : Math.pow(1 - (k - 0.08) / 0.92, 1.6));
      ctx.globalAlpha = alpha;
      ctx.save();
      ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.drawImage(p.spr, -p.size, -p.size, p.size * 2, p.size * 2);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    raf = parts.length ? requestAnimationFrame(step) : 0;
    if (!raf) ctx.clearRect(0, 0, W, H);
  }

  return { burst };
}
