import { SUSHI } from './levels.js';

export function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export class Button {
  constructor(x, y, w, h, label, action, opts = {}) {
    this.x = x; this.y = y; this.w = w; this.h = h;
    this.label = label;
    this.action = action;
    this.opts = opts;
  }

  contains(px, py) {
    return px >= this.x && px <= this.x + this.w && py >= this.y && py <= this.y + this.h;
  }

  isDisabled(game) {
    return this.opts.disabled ? this.opts.disabled(game) : false;
  }

  draw(ctx, hover, game) {
    const disabled = this.isDisabled(game);
    const color = this.opts.color || '#2a3560';
    ctx.save();
    if (hover && !disabled) {
      ctx.shadowColor = this.opts.glow || '#7fd4ff';
      ctx.shadowBlur = 18;
    }
    const g = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.h);
    g.addColorStop(0, disabled ? '#1a1f33' : color);
    g.addColorStop(1, disabled ? '#12152a' : shade(color, -30));
    ctx.fillStyle = g;
    roundRect(ctx, this.x, this.y, this.w, this.h, 12);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = hover && !disabled ? '#9fe6ff' : 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = disabled ? '#5a6076' : (this.opts.text || '#ffffff');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `bold ${this.opts.fontSize || 18}px system-ui, sans-serif`;
    ctx.fillText(this.label, this.x + this.w / 2, this.y + this.h / 2 - (this.opts.sub ? 8 : 0));
    if (this.opts.sub) {
      ctx.font = '12px system-ui, sans-serif';
      ctx.fillStyle = disabled ? '#4a5064' : (this.opts.subColor || '#ffd98a');
      ctx.fillText(this.opts.sub, this.x + this.w / 2, this.y + this.h / 2 + 13);
    }
    ctx.restore();
  }
}

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, (n >> 16) + amt));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 0xff) + amt));
  const b = Math.max(0, Math.min(255, (n & 0xff) + amt));
  return `rgb(${r},${g},${b})`;
}

export function drawBG(ctx, day) {
  const g = ctx.createLinearGradient(0, 0, 0, 640);
  const hue = (200 + day * 12) % 360;
  g.addColorStop(0, `hsl(${hue}, 45%, 10%)`);
  g.addColorStop(0.55, `hsl(${(hue + 40) % 360}, 40%, 16%)`);
  g.addColorStop(1, '#171226');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 960, 640);
  // wall panels
  ctx.fillStyle = 'rgba(255,255,255,0.03)';
  for (let i = 0; i < 6; i++) ctx.fillRect(80 + i * 150, 40, 60, 160);
  // paper lantern glow dots
  for (let i = 0; i < 5; i++) {
    const lx = 120 + i * 180;
    const lg = ctx.createRadialGradient(lx, 70, 4, lx, 70, 46);
    lg.addColorStop(0, 'rgba(255,170,80,0.5)');
    lg.addColorStop(1, 'rgba(255,170,80,0)');
    ctx.fillStyle = lg;
    ctx.beginPath(); ctx.arc(lx, 70, 46, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff9a4d';
    roundRect(ctx, lx - 10, 58, 20, 24, 8); ctx.fill();
  }
}

export function drawSushiIcon(ctx, type, x, y, s = 1) {
  const c = SUSHI[type];
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  // rice
  ctx.fillStyle = '#f4f1e8';
  roundRect(ctx, -14, -6, 28, 14, 6);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth = 1;
  ctx.stroke();
  // topping
  ctx.fillStyle = c.color;
  roundRect(ctx, -15, -11, 30, 9, 4);
  ctx.fill();
  ctx.strokeStyle = c.accent;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-8, -10); ctx.lineTo(-8, -3);
  ctx.moveTo(0, -10); ctx.lineTo(0, -3);
  ctx.moveTo(8, -10); ctx.lineTo(8, -3);
  ctx.stroke();
  ctx.restore();
}