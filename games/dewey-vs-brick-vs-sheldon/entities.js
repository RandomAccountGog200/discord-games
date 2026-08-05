import { WORLD, clamp, circleRect, roundedRect, dist } from './utils.js';

export class Player {
  constructor(upgrades = {}) {
    this.x = 78; this.y = 300; this.vx = 0; this.vy = 0; this.radius = 19;
    this.speed = 255 + (upgrades.quick ? 48 : 0); this.accel = 1500; this.friction = 8;
    this.maxHp = 3 + (upgrades.shield ? 1 : 0); this.hp = this.maxHp; this.invuln = 0;
    this.dashCooldown = 1.05 - (upgrades.quick ? .23 : 0); this.cooldown = 0; this.dashTime = 0; this.dashDir = { x: 1, y: 0 };
    this.magnet = upgrades.magnet ? 82 : 34; this.smash = !!upgrades.smash; this.facing = 1; this.anim = 0;
  }

  tryDash(aim, move) {
    if (this.cooldown > 0 || this.dashTime > 0) return false;
    let dx = aim.x - this.x, dy = aim.y - this.y;
    if (Math.hypot(dx, dy) < 25) { dx = move.x; dy = move.y; }
    const length = Math.hypot(dx, dy) || 1;
    this.dashDir = { x: dx / length, y: dy / length };
    this.dashTime = .18; this.cooldown = this.dashCooldown; this.invuln = Math.max(this.invuln, .24);
    return true;
  }

  update(dt, move, bricks, particles) {
    this.anim += dt * 7; this.invuln = Math.max(0, this.invuln - dt); this.cooldown = Math.max(0, this.cooldown - dt);
    const hits = [];
    if (this.dashTime > 0) {
      this.dashTime -= dt; this.vx = this.dashDir.x * 700; this.vy = this.dashDir.y * 700;
      particles.trail(this.x, this.y, '#55e7ff');
    } else {
      this.vx += move.x * this.accel * dt; this.vy += move.y * this.accel * dt;
      const velocity = Math.hypot(this.vx, this.vy);
      if (velocity > this.speed) { this.vx = this.vx / velocity * this.speed; this.vy = this.vy / velocity * this.speed; }
      const drag = Math.pow(.001, dt / this.friction); this.vx *= drag; this.vy *= drag;
    }
    this.x += this.vx * dt; this.y += this.vy * dt;
    this.x = clamp(this.x, 25, WORLD.width - 25); this.y = clamp(this.y, 53, WORLD.height - 25);
    for (const brick of bricks) {
      if (brick.destroyed) continue;
      const hit = circleRect(this.x, this.y, this.radius, brick);
      if (hit.hit) {
        this.x += hit.nx * hit.depth; this.y += hit.ny * hit.depth;
        if (this.dashTime > 0 && this.smash) hits.push(brick);
        else { this.vx *= -.25; this.vy *= -.25; }
      }
    }
    return hits;
  }

  draw(ctx) {
    if (this.invuln > 0 && Math.floor(this.invuln * 20) % 2 === 0) return;
    ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(Math.atan2(this.vy, this.vx) * .08);
    ctx.shadowColor = '#37dfff'; ctx.shadowBlur = 24;
    const glow = ctx.createRadialGradient(-5, -8, 2, 0, 0, 28); glow.addColorStop(0, '#c8fbff'); glow.addColorStop(.4, '#42d9ff'); glow.addColorStop(1, '#1651c9');
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(0, 0, this.radius, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0; ctx.strokeStyle = '#d8fbff'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#07152f'; roundedRect(ctx, -10, -8, 20, 15, 3); ctx.fill();
    ctx.fillStyle = '#6ff1ff'; ctx.font = 'bold 13px Arial'; ctx.textAlign = 'center'; ctx.fillText('D', 0, 4);
    ctx.restore();
  }
}

export class Brick {
  constructor(data) { Object.assign(this, data); }
  draw(ctx, time) {
    if (this.destroyed) return;
    const pulse = Math.sin(time * 2 + this.phase) * 1.5;
    ctx.save(); ctx.translate(0, pulse); ctx.shadowColor = '#e5485d'; ctx.shadowBlur = 13;
    const grad = ctx.createLinearGradient(this.x, this.y, this.x, this.y + this.h); grad.addColorStop(0, '#e85d63'); grad.addColorStop(1, '#8f273e'); ctx.fillStyle = grad;
    roundedRect(ctx, this.x, this.y, this.w, this.h, 6); ctx.fill(); ctx.shadowBlur = 0;
    ctx.strokeStyle = '#ff9a8e'; ctx.globalAlpha = .65; ctx.lineWidth = 2; ctx.stroke();
    ctx.strokeStyle = 'rgba(70,12,35,.55)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(this.x + this.w * .48, this.y); ctx.lineTo(this.x + this.w * .48, this.y + this.h * .48); ctx.moveTo(this.x, this.y + this.h * .55); ctx.lineTo(this.x + this.w * .28, this.y + this.h * .55); ctx.moveTo(this.x + this.w * .72, this.y + this.h * .55); ctx.lineTo(this.x + this.w, this.y + this.h * .55); ctx.stroke();
    ctx.restore();
  }
}

export class Sheldon {
  constructor(x, y, level) { this.x = x; this.y = y; this.vx = 0; this.vy = 0; this.radius = 17; this.speed = 70 + level * 12; this.stun = 0; this.hp = level >= 4 ? 2 : 1; this.phase = Math.random() * 6; }
  update(dt, player, bricks) {
    this.phase += dt * 4; this.stun = Math.max(0, this.stun - dt);
    if (this.stun > 0) { this.vx *= .9; this.vy *= .9; return; }
    const dx = player.x - this.x, dy = player.y - this.y, len = Math.hypot(dx, dy) || 1;
    const side = Math.sin(this.phase) * .25;
    this.vx += (dx / len - dy / len * side) * this.speed * dt * 2;
    this.vy += (dy / len + dx / len * side) * this.speed * dt * 2;
    const v = Math.hypot(this.vx, this.vy), max = this.speed;
    if (v > max) { this.vx = this.vx / v * max; this.vy = this.vy / v * max; }
    this.x += this.vx * dt; this.y += this.vy * dt;
    this.x = clamp(this.x, 28, WORLD.width - 28); this.y = clamp(this.y, 58, WORLD.height - 28);
    for (const brick of bricks) {
      if (brick.destroyed) continue;
      const hit = circleRect(this.x, this.y, this.radius, brick);
      if (hit.hit) { this.x += hit.nx * hit.depth; this.y += hit.ny * hit.depth; this.vx *= -.5; this.vy *= -.5; }
    }
  }
  draw(ctx) {
    ctx.save(); ctx.translate(this.x, this.y + Math.sin(this.phase) * 2); ctx.shadowColor = this.stun ? '#ffe16b' : '#ff4d9a'; ctx.shadowBlur = 20;
    const fill = ctx.createRadialGradient(-5, -6, 2, 0, 0, 23); fill.addColorStop(0, this.stun ? '#fff2a0' : '#ffabc9'); fill.addColorStop(1, this.stun ? '#d37b22' : '#8f236d'); ctx.fillStyle = fill; ctx.beginPath(); ctx.arc(0, 0, this.radius, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0; ctx.fillStyle = '#271134'; ctx.beginPath(); ctx.arc(-6, -3, 3, 0, Math.PI * 2); ctx.arc(6, -3, 3, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#351337'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 2, 8, .15, Math.PI - .15); ctx.stroke();
    ctx.fillStyle = '#ffe3ed'; ctx.font = 'bold 8px Arial'; ctx.textAlign = 'center'; ctx.fillText('S', 0, 4); ctx.restore();
  }
}

export class Book {
  constructor(data) { Object.assign(this, data); this.radius = 12; }
  update(dt, player) {
    this.phase += dt * 3;
    const d = dist(this.x, this.y, player.x, player.y);
    if (d < player.magnet && d > 1) { this.x += (player.x - this.x) * dt * 4; this.y += (player.y - this.y) * dt * 4; }
  }
  draw(ctx) {
    const y = this.y + Math.sin(this.phase) * 4;
    ctx.save(); ctx.translate(this.x, y); ctx.rotate(Math.sin(this.phase) * .12); ctx.shadowColor = '#54eaff'; ctx.shadowBlur = 18;
    ctx.fillStyle = '#e9fbff'; roundedRect(ctx, -10, -13, 20, 26, 2); ctx.fill(); ctx.shadowBlur = 0;
    ctx.fillStyle = '#42bfff'; ctx.fillRect(-7, -13, 4, 26); ctx.fillStyle = '#184c92'; ctx.fillRect(0, -6, 7, 2); ctx.fillRect(0, 0, 7, 2); ctx.fillRect(0, 6, 5, 2); ctx.restore();
  }
}