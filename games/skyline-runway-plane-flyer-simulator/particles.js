export class ParticleSystem {
  constructor() { this.items = []; }
  burst(x, y, color, count = 18, power = 120) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = power * (.25 + Math.random() * .8);
      this.items.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: .35 + Math.random() * .5, max: .85, size: 1.5 + Math.random() * 3.5, color, gravity: 45 });
    }
  }
  trail(x, y, color = '#78ecff', boost = false) {
    this.items.push({ x, y, vx: -25 - Math.random() * 35, vy: (Math.random() - .5) * 18, life: .22 + Math.random() * .16, max: .4, size: boost ? 4 + Math.random() * 3 : 2 + Math.random() * 2, color, gravity: 0 });
  }
  update(dt) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const p = this.items[i]; p.life -= dt;
      if (p.life <= 0) { this.items.splice(i, 1); continue; }
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.gravity * dt; p.vx *= Math.pow(.04, dt);
    }
  }
  draw(ctx) {
    ctx.save();
    for (const p of this.items) {
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.color; ctx.shadowColor = p.color; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (.5 + p.life / p.max), 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
}