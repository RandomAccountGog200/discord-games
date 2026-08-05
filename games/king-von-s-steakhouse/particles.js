export class ParticleSystem {
  constructor() { this.items = []; }
  burst(x, y, color, count = 18, power = 1) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const speed = (40 + Math.random() * 190) * power;
      this.items.push({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed - 35 * power, life: .45 + Math.random() * .55, max: .9, size: 2 + Math.random() * 4, color });
    }
  }
  text(x, y, value, color = '#f8d27d') {
    this.items.push({ x, y, vx: 0, vy: -35, life: 1.05, max: 1.05, size: 17, color, label: value });
  }
  update(dt) {
    for (const p of this.items) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 90 * dt; p.vx *= Math.pow(.02, dt); }
    this.items = this.items.filter(p => p.life > 0);
  }
  draw(ctx) {
    for (const p of this.items) {
      const alpha = Math.max(0, p.life / p.max);
      ctx.globalAlpha = alpha;
      if (p.label) { ctx.font = `bold ${p.size}px Georgia`; ctx.fillStyle = p.color; ctx.textAlign = 'center'; ctx.fillText(p.label, p.x, p.y); }
      else { ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2); ctx.fill(); }
    }
    ctx.globalAlpha = 1;
  }
}