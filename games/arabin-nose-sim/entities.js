import { rand, pick, TAU, circlesOverlap, dist, lerp } from './utils.js';

export const SPICE_TYPES = [
  { name: 'Cinnamon', color: '#e0a83a', glow: '#ffe8a0', points: 10, radius: 13 },
  { name: 'Saffron', color: '#e05d3e', glow: '#ffa080', points: 25, radius: 11 },
  { name: 'Cardamom', color: '#3aa07a', glow: '#90e0c0', points: 50, radius: 10 },
  { name: 'Rose', color: '#ff5e8a', glow: '#ffb0c0', points: 15, radius: 12 }
];

export const BAD_TYPES = [
  { name: 'Rotten', color: '#6fbf44', dark: '#3f7a24', radius: 15 },
  { name: 'Stinky', color: '#8a63b0', dark: '#523a7a', radius: 17 }
];

export const POWER_TYPES = [
  { name: 'Shield', color: '#4cc9f0', desc: 'SHIELD!' },
  { name: 'Speed', color: '#f4a261', desc: 'SPEED!' },
  { name: 'Magnet', color: '#e76f51', desc: 'MAGNET!' }
];

export class Spice {
  constructor(typeIdx, x, y, w, h) {
    this.typeIdx = typeIdx;
    this.x = x;
    this.y = y;
    this.radius = SPICE_TYPES[typeIdx].radius;
    this.vx = rand(-12, 12);
    this.vy = rand(-12, 12);
    this.phase = rand(0, TAU);
    this.dead = false;
  }

  update(dt, w, h) {
    this.phase += dt * 2;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (this.x < 18) { this.x = 18; this.vx = Math.abs(this.vx); }
    if (this.x > w - 18) { this.x = w - 18; this.vx = -Math.abs(this.vx); }
    if (this.y < 18) { this.y = 18; this.vy = Math.abs(this.vy); }
    if (this.y > h - 18) { this.y = h - 18; this.vy = -Math.abs(this.vy); }
  }

  draw(ctx, t) {
    const type = SPICE_TYPES[this.typeIdx];
    const bob = Math.sin(this.phase) * 3;
    const x = this.x;
    const y = this.y + bob;
    const pulse = 1 + Math.sin(this.phase * 1.5) * 0.1;

    const grad = ctx.createRadialGradient(x, y, 0, x, y, this.radius * 2.5);
    grad.addColorStop(0, type.glow + '44');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, this.radius * 2.5, 0, TAU);
    ctx.fill();

    ctx.fillStyle = type.color;
    ctx.beginPath();
    ctx.arc(x, y, this.radius * pulse, 0, TAU);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.beginPath();
    ctx.arc(x - this.radius * 0.25, y - this.radius * 0.3, this.radius * 0.32, 0, TAU);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 1.2;
    const s = this.radius * 0.5;
    ctx.beginPath();
    ctx.moveTo(x, y - s);
    ctx.lineTo(x, y + s);
    ctx.moveTo(x - s, y);
    ctx.lineTo(x + s, y);
    ctx.stroke();
  }
}

export class BadSmell {
  constructor(typeIdx, kind, x, y, speedRange) {
    this.typeIdx = typeIdx;
    this.kind = kind;
    this.x = x;
    this.y = y;
    this.radius = BAD_TYPES[typeIdx].radius;
    this.speed = rand(speedRange[0], speedRange[1]);
    this.phase = rand(0, TAU);
    this.dead = false;
    if (kind === 'fast') {
      const a = rand(0, TAU);
      this.vx = Math.cos(a) * this.speed * 1.6;
      this.vy = Math.sin(a) * this.speed * 1.6;
    } else {
      this.vx = rand(-40, 40);
      this.vy = rand(-40, 40);
    }
  }

  update(dt, player, w, h) {
    this.phase += dt * 3;
    if (this.kind === 'wander') {
      if (Math.random() < dt * 0.35) {
        this.vx += rand(-50, 50);
        this.vy += rand(-50, 50);
      }
      const sp = Math.hypot(this.vx, this.vy);
      const max = this.speed;
      if (sp > max) { this.vx = (this.vx / sp) * max; this.vy = (this.vy / sp) * max; }
      this.x += this.vx * dt;
      this.y += this.vy * dt;
    } else if (this.kind === 'seek') {
      const dx = player.x - this.x;
      const dy = player.y - this.y;
      const d = Math.hypot(dx, dy) || 1;
      this.vx = lerp(this.vx, (dx / d) * this.speed, 0.03);
      this.vy = lerp(this.vy, (dy / d) * this.speed, 0.03);
      this.x += this.vx * dt;
      this.y += this.vy * dt;
    } else if (this.kind === 'fast') {
      this.x += this.vx * dt;
      this.y += this.vy * dt;
    }

    if (this.x < 12 || this.x > w - 12) this.vx = -this.vx;
    if (this.y < 12 || this.y > h - 12) this.vy = -this.vy;
    this.x = Math.max(12, Math.min(w - 12, this.x));
    this.y = Math.max(12, Math.min(h - 12, this.y));
  }

  draw(ctx, t) {
    const type = BAD_TYPES[this.typeIdx];
    const wob = Math.sin(this.phase * 3) * 2;
    const x = this.x;
    const y = this.y;

    const grad = ctx.createRadialGradient(x, y, 0, x, y, this.radius * 2.2);
    grad.addColorStop(0, type.color + '30');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, this.radius * 2.2, 0, TAU);
    ctx.fill();

    ctx.fillStyle = type.color;
    ctx.beginPath();
    ctx.arc(x, y, this.radius + wob, 0, TAU);
    ctx.arc(x - 6, y + 4, this.radius * 0.6 + wob, 0, TAU);
    ctx.arc(x + 7, y - 3, this.radius * 0.5 + wob, 0, TAU);
    ctx.fill();

    ctx.fillStyle = type.dark;
    ctx.beginPath();
    ctx.arc(x, y, this.radius * 0.45, 0, TAU);
    ctx.fill();

    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(x - 4, y - 2, 2.8, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 4, y - 2, 2.8, 0, TAU);
    ctx.fill();
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(x - 3.5, y - 1.5, 1.4, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 4.5, y - 1.5, 1.4, 0, TAU);
    ctx.fill();
  }
}

export class PowerUp {
  constructor(typeIdx, x, y) {
    this.typeIdx = typeIdx;
    this.x = x;
    this.y = y;
    this.radius = 13;
    this.phase = rand(0, TAU);
    this.dead = false;
    this.life = 12;
  }

  update(dt, w, h) {
    this.phase += dt * 2;
    this.life -= dt;
    if (this.life <= 0) this.dead = true;
    this.x += Math.sin(this.phase * 0.7) * 0.3;
    this.y += Math.cos(this.phase * 0.5) * 0.3;
  }

  draw(ctx) {
    const type = POWER_TYPES[this.typeIdx];
    const x = this.x;
    const y = this.y + Math.sin(this.phase) * 3;
    const c = ctx.createRadialGradient(x, y, 0, x, y, this.radius * 2);
    c.addColorStop(0, type.color + '66');
    c.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(x, y, this.radius * 2, 0, TAU);
    ctx.fill();

    ctx.fillStyle = type.color;
    ctx.beginPath();
    ctx.arc(x, y, this.radius, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    ctx.fillStyle = 'white';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(type.name[0], x, y + 1);
  }
}

export class World {
  constructor() {
    this.spices = [];
    this.bads = [];
    this.powers = [];
  }

  clear() {
    this.spices = [];
    this.bads = [];
    this.powers = [];
  }

  update(dt, player, w, h) {
    const events = { spices: [], bads: [], powers: [] };

    for (const s of this.spices) s.update(dt, w, h);
    for (const b of this.bads) b.update(dt, player, w, h);
    for (const p of this.powers) p.update(dt, w, h);

    if (player.magnetTimer > 0) {
      for (const s of this.spices) {
        if (s.dead) continue;
        const d = dist(player.x, player.y, s.x, s.y);
        if (d < player.magnetRadius && d > 5) {
          const pull = (1 - d / player.magnetRadius) * 700;
          s.vx += ((player.x - s.x) / d) * pull * dt;
          s.vy += ((player.y - s.y) / d) * pull * dt;
        }
      }
    }

    for (const s of this.spices) {
      if (s.dead) continue;
      if (circlesOverlap(player.x, player.y, player.radius, s.x, s.y, s.radius)) {
        s.dead = true;
        events.spices.push(s);
      }
    }

    for (const b of this.bads) {
      if (b.dead) continue;
      if (circlesOverlap(player.x, player.y, player.radius * 0.8, b.x, b.y, b.radius)) {
        b.dead = true;
        events.bads.push(b);
      }
    }

    for (const p of this.powers) {
      if (p.dead) continue;
      if (circlesOverlap(player.x, player.y, player.radius + 5, p.x, p.y, p.radius)) {
        p.dead = true;
        events.powers.push(p);
      }
    }

    this.spices = this.spices.filter((s) => !s.dead);
    this.bads = this.bads.filter((b) => !b.dead);
    this.powers = this.powers.filter((p) => !p.dead);

    return events;
  }

  draw(ctx, t) {
    for (const s of this.spices) s.draw(ctx, t);
    for (const p of this.powers) p.draw(ctx);
    for (const b of this.bads) b.draw(ctx, t);
  }
}