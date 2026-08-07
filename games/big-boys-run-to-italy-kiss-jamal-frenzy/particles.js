export class ParticleSystem {
  constructor() { this.items = []; }

  burst(x, y, color, count = 14, power = 150) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = power * (.35 + Math.random() * .8);
      this.items.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: .35 + Math.random() * .5, max: .85, size: 2 + Math.random() * 4, color, gravity: 30 + Math.random() * 80, shape: Math.random() > .45 ? 'circle' : 'square' });
    }
  }

  trail(x, y, color) {
    this.items.push({ x: x + (Math.random() - .5) * 8, y: y + (Math.random() - .5) * 8, vx: 0, vy: 0, life: .22, max: .22, size: 3 + Math.random() * 3, color, gravity: 0, shape: 'circle' });
  }

  update(dt) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const p = this.items[i];
      p.life -= dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vy += p.gravity * dt;
      p.vx *= Math.pow(.08, dt);
      if (p.life <= 0) this.items.splice(i, 1);
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const p of this.items) {
      const alpha = Math.max(0, p.life / p.max);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      if (p.shape === 'square') ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      else { ctx.beginPath(); ctx.arc(p.x, p.y, p.size * (.5 + alpha), 0, Math.PI * 2); ctx.fill(); }
    }
    ctx.restore();
  }

  clear() { this.items.length = 0; }
}