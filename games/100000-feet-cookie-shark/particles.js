export class ParticleSystem {
  constructor() { this.items = []; }
  burst(x, y, color, count = 12, power = 100) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const speed = power * (.35 + Math.random() * .8);
      this.items.push({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, life: .35 + Math.random() * .5, max: .85, size: 2 + Math.random() * 4, color, gravity: 25 });
    }
  }
  sparkle(x, y, color = '#ffe18a') { this.burst(x, y, color, 5, 55); }
  update(dt) {
    for (const p of this.items) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.gravity * dt; p.vx *= .985; }
    this.items = this.items.filter(p => p.life > 0);
  }
  draw(ctx) {
    for (const p of this.items) {
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.color; ctx.shadowColor = p.color; ctx.shadowBlur = 10;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
  }
}