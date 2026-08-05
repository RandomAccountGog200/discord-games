// Particle system with pooled particles.
export class Particles {
  constructor() { this.list = []; }
  spawn(x, y, opts = {}) {
    const count = opts.count || 8;
    for (let i = 0; i < count; i++) {
      const a = opts.angle !== undefined ? opts.angle + (Math.random() - 0.5) * (opts.spread || Math.PI * 2) : Math.random() * Math.PI * 2;
      const sp = (opts.speed || 120) * (0.4 + Math.random() * 0.8);
      this.list.push({
        x, y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        life: (opts.life || 0.6) * (0.6 + Math.random() * 0.7),
        maxLife: 0, size: (opts.size || 4) * (0.6 + Math.random() * 0.8),
        color: opts.color || '#ffd76a',
        drag: opts.drag !== undefined ? opts.drag : 2.5,
        gravity: opts.gravity || 0,
        glow: opts.glow !== undefined ? opts.glow : true,
      });
      const p = this.list[this.list.length - 1];
      p.maxLife = p.life;
    }
  }
  burst(x, y, color, count = 12) { this.spawn(x, y, { count, color, speed: 180, life: 0.7, size: 5 }); }
  update(dt) {
    const L = this.list;
    for (let i = L.length - 1; i >= 0; i--) {
      const p = L[i];
      p.life -= dt;
      if (p.life <= 0) { L.splice(i, 1); continue; }
      p.vx -= p.vx * p.drag * dt; p.vy -= p.vy * p.drag * dt;
      p.vy += p.gravity * dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
    }
  }
  draw(ctx) {
    for (const p of this.list) {
      const t = p.life / p.maxLife;
      ctx.globalAlpha = t;
      if (p.glow) { ctx.shadowBlur = 12; ctx.shadowColor = p.color; }
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * t, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1;
  }
}