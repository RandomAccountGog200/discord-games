export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  spawn(type, x, y, amount = 1) {
    for (let i = 0; i < amount; i++) {
      let p = null;
      switch (type) {
        case 'happy':
          p = this.happy(x, y);
          break;
        case 'angry':
          p = this.angry(x, y);
          break;
        case 'ghost':
          p = this.ghost(x, y);
          break;
        case 'confetti':
          p = this.confetti(x, y);
          break;
        case 'sparkle':
          p = this.sparkle(x, y);
          break;
      }
      if (p) this.particles.push(p);
    }
    if (this.particles.length > 400) {
      this.particles.splice(0, this.particles.length - 400);
    }
  }

  happy(x, y) {
    return {
      x, y, vx: (Math.random() - 0.5) * 160, vy: -Math.random() * 160 - 40,
      life: 0.8, maxLife: 0.8, size: 4 + Math.random() * 4, color: ['#f2d63c', '#ff7a6b', '#4dc76a', '#e67e22'][Math.floor(Math.random() * 4)],
      grav: 200, glow: true
    };
  }

  angry(x, y) {
    return {
      x, y, vx: (Math.random() - 0.5) * 220, vy: -Math.random() * 80,
      life: 0.6, maxLife: 0.6, size: 5 + Math.random() * 5, color: '#e74c3c',
      grav: 300, glow: true
    };
  }

  ghost(x, y) {
    return {
      x, y, vx: (Math.random() - 0.5) * 60, vy: -Math.random() * 40 - 10,
      life: 1.2, maxLife: 1.2, size: 3 + Math.random() * 6, color: Math.random() > 0.5 ? '#8e44ad' : '#7f8c8d',
      grav: -20, glow: true
    };
  }

  confetti(x, y) {
    return {
      x: x + (Math.random() - 0.5) * 80, y: y + (Math.random() - 0.5) * 40,
      vx: (Math.random() - 0.5) * 200, vy: -Math.random() * 200 - 80,
      life: 1.5, maxLife: 1.5, size: 4 + Math.random() * 6,
      color: ['#f2d63c', '#ff7a6b', '#4dc76a', '#3498db', '#e67e22', '#e84393'][Math.floor(Math.random() * 6)],
      grav: 300, glow: false
    };
  }

  sparkle(x, y) {
    return {
      x, y, vx: (Math.random() - 0.5) * 40, vy: -Math.random() * 60,
      life: 0.9, maxLife: 0.9, size: 2 + Math.random() * 3, color: '#ffffff',
      grav: 0, glow: true
    };
  }

  update(dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.vy += (p.grav || 0) * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.98;
    }
  }

  render(ctx) {
    for (const p of this.particles) {
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      if (p.glow) {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 12;
      }
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (0.5 + alpha * 0.5), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  clear() {
    this.particles = [];
  }
}