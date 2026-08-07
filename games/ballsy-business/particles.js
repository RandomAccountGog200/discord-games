export class ParticleSystem {
  constructor() { this.items = []; }
  burst(x, y, color, count = 14, speed = 180) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2, s = speed * (.35 + Math.random() * .8);
      this.items.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: .35 + Math.random() * .4, max: .75, size: 2 + Math.random() * 4, color });
    }
  }
  trail(x, y, color) { this.items.push({ x, y, vx: 0, vy: 0, life: .18, max: .18, size: 10, color }); }
  update(dt) {
    for (const p of this.items) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= Math.pow(.04, dt); p.vy *= Math.pow(.04, dt); }
    this.items = this.items.filter(p => p.life > 0);
  }
  draw(ctx) {
    for (const p of this.items) { ctx.globalAlpha = Math.max(0, p.life / p.max); ctx.fillStyle = p.color; ctx.shadowColor = p.color; ctx.shadowBlur = 12; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (.5 + p.life / p.max), 0, Math.PI * 2); ctx.fill(); }
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
  }
}