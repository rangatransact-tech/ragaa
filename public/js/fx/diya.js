// A polished brass diya drawn on a canvas: bowl, dark oil, wick, and a
// flickering teardrop flame with a warm glow once lit.

const lamps = new Set();
let raf = 0;

export class Diya {
  constructor(canvas) {
    this.c = canvas;
    this.ctx = canvas.getContext('2d');
    this.lit = 0;           // 0..1 flame growth
    this.on = false;
    this.seed = Math.random() * 100;
    this.visible = true;
    this.fit();
    this.draw(0);
    lamps.add(this);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((es) => { this.visible = es[0].isIntersecting; if (this.visible) kick(); }).observe(canvas);
    }
  }
  fit() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const s = Math.round((this.c.clientWidth || 72) * dpr);
    if (this.c.width !== s) { this.c.width = s; this.c.height = s; }
  }
  light() { if (this.on) return; this.on = true; this.litAt = performance.now(); kick(); }

  draw(now) {
    const { ctx } = this;
    const S = this.c.width;
    ctx.clearRect(0, 0, S, S);
    const cx = S * 0.47, rimY = S * 0.64, rx = S * 0.33, ry = S * 0.085;
    const lit = this.lit;

    // warm glow around the lamp
    if (lit > 0) {
      const g = ctx.createRadialGradient(S * 0.8, S * 0.45, 0, S * 0.8, S * 0.45, S * 0.55);
      g.addColorStop(0, `rgba(255,190,90,${0.38 * lit})`);
      g.addColorStop(0.4, `rgba(255,140,40,${0.12 * lit})`);
      g.addColorStop(1, 'rgba(255,120,30,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
    }

    // foot
    ctx.beginPath();
    ctx.ellipse(cx, S * 0.86, S * 0.13, S * 0.035, 0, 0, Math.PI * 2);
    const fg = ctx.createLinearGradient(cx - S * 0.13, 0, cx + S * 0.13, 0);
    fg.addColorStop(0, '#3e270b'); fg.addColorStop(0.45, '#a8792b'); fg.addColorStop(0.6, '#e2bd6e'); fg.addColorStop(1, '#4a300e');
    ctx.fillStyle = fg; ctx.fill();
    ctx.fillStyle = '#5b3c12';
    ctx.fillRect(cx - S * 0.05, S * 0.76, S * 0.1, S * 0.1);

    // bowl body with a pinched spout to the right
    ctx.beginPath();
    ctx.moveTo(cx - rx, rimY);
    ctx.bezierCurveTo(cx - rx * 0.98, rimY + S * 0.14, cx - rx * 0.4, rimY + S * 0.19, cx, rimY + S * 0.19);
    ctx.bezierCurveTo(cx + rx * 0.55, rimY + S * 0.19, cx + rx * 0.95, rimY + S * 0.1, cx + rx * 1.28, rimY - S * 0.075);
    ctx.bezierCurveTo(cx + rx * 1.05, rimY - S * 0.02, cx + rx * 0.9, rimY - ry * 0.4, cx + rx * 0.6, rimY - ry * 0.9);
    ctx.lineTo(cx - rx, rimY);
    ctx.closePath();
    const bg = ctx.createLinearGradient(cx - rx, 0, cx + rx * 1.3, 0);
    bg.addColorStop(0, '#3a2408'); bg.addColorStop(0.18, '#8a5f1e'); bg.addColorStop(0.36, '#d9ad55');
    bg.addColorStop(0.44, '#f6dc97'); bg.addColorStop(0.52, '#c9983c'); bg.addColorStop(0.78, '#7d541a'); bg.addColorStop(1, '#4b300c');
    ctx.fillStyle = bg; ctx.fill();
    // vertical falloff for roundness
    const vg = ctx.createLinearGradient(0, rimY - ry, 0, rimY + S * 0.2);
    vg.addColorStop(0, 'rgba(255,240,200,0.12)'); vg.addColorStop(0.5, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(20,10,0,0.55)');
    ctx.fillStyle = vg; ctx.fill();
    // specular streak
    ctx.save();
    ctx.clip();
    ctx.beginPath();
    ctx.ellipse(cx - rx * 0.28, rimY + S * 0.07, S * 0.035, S * 0.09, -0.25, 0, Math.PI * 2);
    const sg = ctx.createRadialGradient(cx - rx * 0.28, rimY + S * 0.06, 0, cx - rx * 0.28, rimY + S * 0.06, S * 0.09);
    sg.addColorStop(0, 'rgba(255,250,230,0.75)'); sg.addColorStop(1, 'rgba(255,250,230,0)');
    ctx.fillStyle = sg; ctx.fill();
    if (lit > 0) { // firelight on the brass
      const lg = ctx.createRadialGradient(S * 0.78, rimY - S * 0.12, 0, S * 0.78, rimY - S * 0.12, S * 0.4);
      lg.addColorStop(0, `rgba(255,190,90,${0.45 * lit})`); lg.addColorStop(1, 'rgba(255,160,60,0)');
      ctx.fillStyle = lg; ctx.fillRect(0, 0, S, S);
    }
    ctx.restore();

    // rim and oil
    ctx.beginPath();
    ctx.ellipse(cx, rimY, rx, ry, 0, 0, Math.PI * 2);
    ctx.lineWidth = Math.max(1, S * 0.012);
    const rg = ctx.createLinearGradient(cx - rx, 0, cx + rx, 0);
    rg.addColorStop(0, '#7a5218'); rg.addColorStop(0.45, '#fbe3a0'); rg.addColorStop(1, '#8e6420');
    ctx.strokeStyle = rg; ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(cx, rimY + S * 0.006, rx * 0.9, ry * 0.72, 0, 0, Math.PI * 2);
    const og = ctx.createRadialGradient(cx - rx * 0.2, rimY - ry * 0.2, 0, cx, rimY, rx);
    og.addColorStop(0, lit > 0 ? '#5a3a14' : '#3b2610'); og.addColorStop(0.6, '#20140a'); og.addColorStop(1, '#120b05');
    ctx.fillStyle = og; ctx.fill();
    // a sliver of reflection on the oil
    ctx.beginPath();
    ctx.ellipse(cx - rx * 0.15, rimY - ry * 0.15, rx * 0.35, ry * 0.18, 0, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,220,160,${0.08 + 0.2 * lit})`; ctx.fill();

    // wick resting in the spout
    const wx = cx + rx * 1.1, wy = rimY - S * 0.07;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#e9dcc0'; ctx.lineWidth = S * 0.022;
    ctx.beginPath(); ctx.moveTo(cx + rx * 0.62, rimY - S * 0.005); ctx.lineTo(wx, wy); ctx.stroke();
    ctx.strokeStyle = '#2a1b10'; ctx.lineWidth = S * 0.02;
    ctx.beginPath(); ctx.moveTo(wx - S * 0.012, wy + S * 0.007); ctx.lineTo(wx + S * 0.004, wy - S * 0.006); ctx.stroke();
    ctx.restore();

    if (lit > 0) this.flame(now, wx + S * 0.004, wy - S * 0.008, S);
  }

  flame(now, x, y, S) {
    const { ctx } = this;
    const t = now / 1000 + this.seed;
    const flick = 0.92 + 0.06 * Math.sin(t * 13.1) + 0.04 * Math.sin(t * 7.3 + 1.2) + 0.03 * Math.sin(t * 23.7);
    const sway = (Math.sin(t * 3.1) * 0.5 + Math.sin(t * 5.7 + 2.0) * 0.3) * S * 0.012;
    const h = S * 0.3 * flick * this.lit, w = S * 0.07 * (0.9 + 0.1 * this.lit);
    // halo
    const hg = ctx.createRadialGradient(x, y - h * 0.45, 0, x, y - h * 0.45, h * 1.2);
    hg.addColorStop(0, 'rgba(255,214,140,0.45)'); hg.addColorStop(0.5, 'rgba(255,150,50,0.12)'); hg.addColorStop(1, 'rgba(255,120,30,0)');
    ctx.fillStyle = hg; ctx.fillRect(x - h * 1.3, y - h * 1.7, h * 2.6, h * 2.6);
    const tear = (hh, ww) => {
      ctx.beginPath();
      ctx.moveTo(x, y + ww * 0.25);
      ctx.bezierCurveTo(x - ww, y, x - ww * 0.6, y - hh * 0.55, x + sway, y - hh);
      ctx.bezierCurveTo(x + ww * 0.6, y - hh * 0.55, x + ww, y, x, y + ww * 0.25);
      ctx.closePath();
    };
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    tear(h, w);
    let g = ctx.createLinearGradient(0, y, 0, y - h);
    g.addColorStop(0, 'rgba(120,150,255,0.35)'); g.addColorStop(0.15, 'rgba(255,150,40,0.85)'); g.addColorStop(0.6, 'rgba(255,120,20,0.6)'); g.addColorStop(1, 'rgba(255,90,10,0)');
    ctx.fillStyle = g; ctx.fill();
    tear(h * 0.72, w * 0.55);
    g = ctx.createLinearGradient(0, y, 0, y - h * 0.72);
    g.addColorStop(0, 'rgba(255,255,255,0.2)'); g.addColorStop(0.2, 'rgba(255,248,215,0.95)'); g.addColorStop(0.75, 'rgba(255,215,120,0.7)'); g.addColorStop(1, 'rgba(255,200,90,0)');
    ctx.fillStyle = g; ctx.fill();
    ctx.restore();
  }
}

function tick(now) {
  raf = 0;
  let any = false;
  lamps.forEach((d) => {
    if (!d.on || !d.visible) return;
    d.lit = Math.min(1, (now - d.litAt) / 700);
    d.draw(now);
    any = true;
  });
  if (any) raf = requestAnimationFrame(tick);
}
function kick() { if (!raf) raf = requestAnimationFrame(tick); }

window.addEventListener('resize', () => lamps.forEach((d) => { d.fit(); d.draw(performance.now()); }));
