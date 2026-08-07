import { resolveCircleRect } from './entities.js';

export class Player {
  constructor(start) {
    this.x = start.x; this.y = start.y; this.r = 20;
    this.vx = 0; this.vy = 0;
    this.baseSpeed = 205;
    this.acceleration = 1250;
    this.maxHealth = 3;
    this.health = 3;
    this.dashCooldown = 1.45;
    this.dashReady = 0;
    this.dashTime = 0;
    this.invulnerable = 0;
    this.facing = 1;
    this.upgrades = { shoes: 0, scarf: 0, turbo: 0, gelato: 0 };
    this.walkTime = 0;
    this.lastMove = { x: 1, y: 0 };
  }

  resetForLevel(start) {
    this.x = start.x; this.y = start.y; this.vx = 0; this.vy = 0;
    this.health = Math.min(this.maxHealth, this.health + 1);
    this.dashReady = 0; this.dashTime = 0; this.invulnerable = .65;
  }

  speed() { return this.baseSpeed * (1 + this.upgrades.shoes * .16); }

  update(dt, input, obstacles, bounds, onEvent) {
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    this.dashReady = Math.max(0, this.dashReady - dt);
    const move = input.getMove(this);
    if (move.strength > .05) {
      this.lastMove.x = move.x; this.lastMove.y = move.y;
      if (Math.abs(move.x) > .1) this.facing = Math.sign(move.x);
      this.walkTime += dt * 10;
    }
    if (input.consumeDash() && this.dashReady <= 0 && move.strength > .05 && this.dashTime <= 0) {
      this.dashTime = .17;
      this.dashReady = Math.max(.38, 1.45 * Math.pow(.76, this.upgrades.turbo));
      this.invulnerable = .25;
      this.vx = move.x * 650; this.vy = move.y * 650;
      onEvent('dash');
    }
    if (this.dashTime > 0) {
      this.dashTime -= dt;
      this.x += this.vx * dt; this.y += this.vy * dt;
    } else {
      const targetX = move.x * this.speed() * move.strength;
      const targetY = move.y * this.speed() * move.strength;
      const blend = 1 - Math.exp(-this.acceleration * dt / Math.max(1, this.speed()));
      this.vx += (targetX - this.vx) * blend;
      this.vy += (targetY - this.vy) * blend;
      if (move.strength < .05) { this.vx *= Math.pow(.0008, dt); this.vy *= Math.pow(.0008, dt); }
      this.x += this.vx * dt; this.y += this.vy * dt;
    }
    for (const rect of obstacles) resolveCircleRect(this, rect);
    this.x = Math.max(this.r, Math.min(bounds.w - this.r, this.x));
    this.y = Math.max(this.r, Math.min(bounds.h - this.r, this.y));
  }

  takeDamage(knockX, knockY) {
    if (this.invulnerable > 0) return false;
    this.health -= 1;
    this.invulnerable = 1.05;
    const len = Math.hypot(knockX, knockY) || 1;
    this.vx = knockX / len * 300; this.vy = knockY / len * 300;
    return true;
  }

  applyUpgrade(id) {
    if (id === 'shoes') this.upgrades.shoes++;
    if (id === 'scarf') { this.upgrades.scarf++; this.maxHealth++; this.health = this.maxHealth; }
    if (id === 'turbo') this.upgrades.turbo++;
    if (id === 'gelato') this.upgrades.gelato++;
  }

  draw(ctx, time) {
    if (this.invulnerable > 0 && Math.floor(this.invulnerable * 16) % 2 === 0) return;
    ctx.save(); ctx.translate(this.x, this.y);
    const moving = Math.hypot(this.vx, this.vy) > 30;
    const bounce = moving ? Math.sin(this.walkTime) * 2 : 0;
    ctx.translate(0, bounce);
    ctx.shadowColor = 'rgba(36,27,54,.35)'; ctx.shadowBlur = 15; ctx.shadowOffsetY = 7;
    ctx.fillStyle = '#118ab2'; ctx.beginPath(); ctx.ellipse(0, 8, 21, 16, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffcfad'; ctx.beginPath(); ctx.arc(0, -8, 17, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#241b36'; ctx.beginPath(); ctx.arc(0, -16, 17, Math.PI, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff8e8'; ctx.beginPath(); ctx.arc(-6, -7, 3, 0, Math.PI * 2); ctx.arc(6, -7, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#241b36'; ctx.beginPath(); ctx.arc(-6, -7, 1.5, 0, Math.PI * 2); ctx.arc(6, -7, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#b94c5e'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, -1, 6, .15, Math.PI - .15); ctx.stroke();
    ctx.fillStyle = '#ff8ca5'; ctx.beginPath(); ctx.arc(-13, -1, 3, 0, Math.PI * 2); ctx.arc(13, -1, 3, 0, Math.PI * 2); ctx.fill();
    if (this.upgrades.scarf > 0) { ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(0, 6, 17, .15, Math.PI - .15); ctx.stroke(); }
    if (this.dashTime > 0) { ctx.strokeStyle = '#fff8e8'; ctx.lineWidth = 3; ctx.globalAlpha = .8; ctx.beginPath(); ctx.arc(0, 0, 28, 0, Math.PI * 2); ctx.stroke(); }
    ctx.restore();
  }
}