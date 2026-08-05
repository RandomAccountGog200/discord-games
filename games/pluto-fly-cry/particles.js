export class ParticleSystem {
  constructor() { this.items = []; }

  burst(x, y, count, color, speed = 120, size = 3, life = .65) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const velocity = speed * (.35 + Math.random() * .9);
      this.items.push({ x, y, vx: Math.cos(angle) * velocity, vy: Math.sin(angle) * velocity, life: life * (.65 + Math.random() * .55), max: life, size: size * (.55 + Math.random() * .9), color, drag: .94 + Math.random() * .04 });
    }
  }

  stream(x, y, color) {
    for (let i = 0; i < 2; i++) this.items.push({ x: x + (Math.random() - .5) * 9, y: y + (Math.random() - .5) * 9, vx: -30 - Math.random() * 30, vy: (Math.random() - .5) * 35, life: .4 + Math.random() * .25, max: .55, size: 2 + Math.random() * 2, color, drag: .98 });
  }

  update(dt) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const p = this.items[i];
      p.life -= dt;
      if (p.life <= 0) { this.items.splice(i, 1); continue; }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= Math.pow(p.drag, dt * 60);
      p.vy *= Math.pow(p.drag, dt * 60);
    }
  }

  draw(ctx, camera) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const p of this.items) {
      const alpha = Math.min(1, p.life / Math.min(.25, p.max));
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(p.x - camera, p.y, p.size * (0.65 + alpha * .35), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}