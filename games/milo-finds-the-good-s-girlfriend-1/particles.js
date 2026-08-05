export class ParticleSystem {
  constructor() { this.items = []; }

  burst(x, y, color, count = 12, power = 120) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = power * (.35 + Math.random() * .75);
      this.items.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: .35 + Math.random() * .4, max: .75, size: 2 + Math.random() * 4, color });
    }
  }

  trail(x, y, color) {
    this.items.push({ x, y, vx: (Math.random() - .5) * 35, vy: (Math.random() - .5) * 35, life: .2, max: .2, size: 2 + Math.random() * 3, color });
  }

  update(dt) {
    for (const p of this.items) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= Math.pow(.06, dt);
      p.vy = p.vy * Math.pow(.2, dt) + 210 * dt;
    }
    this.items = this.items.filter(p => p.life > 0);
  }

  draw(ctx) {
    for (const p of this.items) {
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}