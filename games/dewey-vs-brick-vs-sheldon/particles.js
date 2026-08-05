import { clamp } from './utils.js';

export class ParticleSystem {
  constructor() { this.items = []; }

  burst(x, y, color, count = 12, power = 120) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = power * (.35 + Math.random() * .75);
      this.items.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: .35 + Math.random() * .5, max: .85, size: 2 + Math.random() * 4, color });
    }
  }

  trail(x, y, color) {
    this.items.push({ x, y, vx: (Math.random() - .5) * 25, vy: (Math.random() - .5) * 25, life: .18, max: .18, size: 3 + Math.random() * 4, color });
  }

  update(dt) {
    for (const p of this.items) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .96; p.vy *= .96; }
    this.items = this.items.filter(p => p.life > 0);
  }

  draw(ctx) {
    for (const p of this.items) {
      ctx.globalAlpha = clamp(p.life / p.max, 0, 1);
      ctx.fillStyle = p.color; ctx.shadowColor = p.color; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (p.life / p.max), 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
  }
}