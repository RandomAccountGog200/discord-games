import { rand } from './utils.js';

export class ParticleSystem {
  constructor() { this.items = []; }
  burst(x, y, color, count = 10, power = 130) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2, speed = rand(power * .35, power), life = rand(.25, .62);
      this.items.push({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, life, max: life, size: rand(2, 6), color, spin: rand(-5, 5), angle: rand(0, 6) });
    }
  }
  trail(x, y, color) { this.items.push({ x, y, vx: rand(-18, 18), vy: rand(-18, 18), life: .18, max: .18, size: rand(2, 4), color, spin: 0, angle: 0 }); }
  update(dt) {
    for (const p of this.items) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .96; p.vy *= .96; p.angle += p.spin * dt; }
    this.items = this.items.filter(p => p.life > 0);
  }
  draw(ctx) {
    for (const p of this.items) { const alpha = Math.max(0, p.life / p.max); ctx.save(); ctx.globalAlpha = alpha; ctx.translate(p.x, p.y); ctx.rotate(p.angle); ctx.fillStyle = p.color; ctx.shadowColor = p.color; ctx.shadowBlur = 9; ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size); ctx.restore(); }
    ctx.globalAlpha = 1;
  }
}