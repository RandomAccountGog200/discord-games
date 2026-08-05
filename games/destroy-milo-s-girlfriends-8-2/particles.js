import { rand } from './utils.js';

export const FX = {
  parts: [],
  texts: [],

  burst(x, y, color, n = 14, spd = 190, size = 4) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = rand(spd * 0.3, spd);
      this.parts.push({
        x, y,
        vx: Math.cos(a) * v, vy: Math.sin(a) * v,
        life: rand(0.3, 0.7), maxLife: 0.7,
        size: rand(size * 0.5, size * 1.5),
        color, drag: 3.5, grav: 0, glow: true
      });
    }
  },

  trail(x, y, color, size = 3) {
    this.parts.push({
      x: x + rand(-3, 3), y: y + rand(-3, 3),
      vx: rand(-20, 20), vy: rand(-20, 20),
      life: 0.3, maxLife: 0.3, size, color, drag: 2, grav: 0, glow: true
    });
  },

  hearts(x, y, n = 6) {
    for (let i = 0; i < n; i++) {
      this.parts.push({
        x, y,
        vx: rand(-90, 90), vy: rand(-160, -40),
        life: rand(0.5, 0.9), maxLife: 0.9,
        size: rand(5, 9), color: '#ff5e9c', drag: 1, grav: 200, heart: true, glow: false
      });
    }
  },

  addText(x, y, text, color = '#fff', size = 16) {
    this.texts.push({ x, y, vy: -55, life: 0.9, text, color, size });
  },

  update(dt) {
    for (let i = this.parts.length - 1; i >= 0; i--) {
      const p = this.parts[i];
      p.life -= dt;
      if (p.life <= 0) { this.parts.splice(i, 1); continue; }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += (p.grav || 0) * dt;
      const d = Math.max(0, 1 - p.drag * dt);
      p.vx *= d; p.vy *= d;
    }
    for (let i = this.texts.length - 1; i >= 0; i--) {
      const t = this.texts[i];
      t.life -= dt;
      t.y += t.vy * dt;
      if (t.life <= 0) this.texts.splice(i, 1);
    }
  },

  draw(ctx) {
    for (const p of this.parts) {
      const a = Math.max(0, p.life / p.maxLife);
      if (p.glow) {
        ctx.globalCompositeOperation = 'lighter';
      }
      ctx.globalAlpha = a;
      if (p.heart) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.fillStyle = p.color;
        const s = p.size;
        ctx.beginPath();
        ctx.moveTo(0, s * 0.4);
        ctx.bezierCurveTo(-s * 1.1, -s * 0.3, -s * 0.55, -s * 1.15, 0, -s * 0.45);
        ctx.bezierCurveTo(s * 0.55, -s * 1.15, s * 1.1, -s * 0.3, 0, s * 0.4);
        ctx.fill();
        ctx.restore();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * a, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.textAlign = 'center';
    for (const t of this.texts) {
      ctx.globalAlpha = Math.min(1, t.life / 0.4);
      ctx.font = `bold ${t.size}px 'Segoe UI', sans-serif`;
      ctx.fillStyle = t.color;
      ctx.strokeStyle = 'rgba(0,0,0,0.6)';
      ctx.lineWidth = 3;
      ctx.strokeText(t.text, t.x, t.y);
      ctx.fillText(t.text, t.x, t.y);
    }
    ctx.globalAlpha = 1;
  },

  clear() { this.parts.length = 0; this.texts.length = 0; }
};