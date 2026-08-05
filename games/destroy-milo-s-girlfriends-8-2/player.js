import { clamp, rand } from './utils.js';

export class Player {
  constructor(x, y) {
    this.x = x; this.y = y;
    this.r = 15;
    this.speed = 265;
    this.maxhp = 100;
    this.hp = 100;
    this.fireRate = 4.2;
    this.dmg = 12;
    this.multishot = 1;
    this.pierce = 0;
    this.dashCD = 1.5;
    this.magnet = 70;
    this.fireTimer = 0;
    this.dashTimer = 0;
    this.dashTime = 0;
    this.dashDirX = 1; this.dashDirY = 0;
    this.invuln = 0;
    this.aimX = 1; this.aimY = 0;
    this.bullets = [];
    this.walkCycle = 0;
  }

  update(dt, input, aim, world, FX, AudioSys) {
    // aim
    this.aimX = aim.x; this.aimY = aim.y;

    // movement
    let mx = input.moveX, my = input.moveY;
    const l = Math.hypot(mx, my);
    if (l > 1) { mx /= l; my /= l; }

    this.dashTimer -= dt;
    this.invuln -= dt;

    if (input.consumeDash() && this.dashTimer <= 0 && this.dashTime <= 0) {
      const dirX = (mx || my) ? mx : this.aimX;
      const dirY = (mx || my) ? my : this.aimY;
      const m = Math.hypot(dirX, dirY) || 1;
      this.dashDirX = dirX / m; this.dashDirY = dirY / m;
      this.dashTime = 0.16;
      this.dashTimer = this.dashCD;
      this.invuln = Math.max(this.invuln, 0.22);
      AudioSys.dash();
      FX.burst(this.x, this.y, '#8ad8ff', 10, 140, 4);
    }

    let vx, vy;
    if (this.dashTime > 0) {
      this.dashTime -= dt;
      vx = this.dashDirX * this.speed * 3.4;
      vy = this.dashDirY * this.speed * 3.4;
      FX.trail(this.x, this.y, '#8ad8ff', 5);
    } else {
      vx = mx * this.speed;
      vy = my * this.speed;
    }
    this.x = clamp(this.x + vx * dt, this.r, world.w - this.r);
    this.y = clamp(this.y + vy * dt, this.r, world.h - this.r);
    if (mx || my) this.walkCycle += dt * 10;

    // shooting
    this.fireTimer -= dt;
    if (aim.firing && this.fireTimer <= 0) {
      this.fireTimer = 1 / this.fireRate;
      this.shoot(FX, AudioSys);
    }
  }

  shoot(FX, AudioSys) {
    const baseA = Math.atan2(this.aimY, this.aimX);
    const n = this.multishot;
    const spreadTotal = (n - 1) * 0.16;
    for (let i = 0; i < n; i++) {
      const a = baseA - spreadTotal / 2 + i * 0.16 + rand(-0.02, 0.02);
      const spd = 620;
      this.bullets.push({
        x: this.x + Math.cos(a) * (this.r + 6),
        y: this.y + Math.sin(a) * (this.r + 6),
        vx: Math.cos(a) * spd, vy: Math.sin(a) * spd,
        r: 5, dmg: this.dmg, pierce: this.pierce, life: 1.1
      });
    }
    AudioSys.shoot();
    FX.trail(this.x + Math.cos(baseA) * 22, this.y + Math.sin(baseA) * 22, '#ffd23d', 4);
  }

  hurt(dmg, FX, AudioSys) {
    if (this.invuln > 0 || this.dashTime > 0) return false;
    this.hp -= dmg;
    this.invuln = 0.6;
    AudioSys.hurt();
    FX.burst(this.x, this.y, '#ff3355', 16, 220, 5);
    return true;
  }

  draw(ctx, time) {
    const blink = this.invuln > 0 && Math.floor(time * 20) % 2 === 0;
    ctx.save();
    ctx.translate(this.x, this.y);

    // dash afterimage ring
    if (this.dashTime > 0) {
      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = '#8ad8ff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, this.r + 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    if (!blink) {
      // body
      const g = ctx.createRadialGradient(-4, -5, 2, 0, 0, this.r + 2);
      g.addColorStop(0, '#7ecfff');
      g.addColorStop(1, '#1c5f9e');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, this.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#bde9ff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // eyes toward aim
      const a = Math.atan2(this.aimY, this.aimX);
      const ex = Math.cos(a) * 5, ey = Math.sin(a) * 5;
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(ex - 4, ey - 2, 3.4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(ex + 4, ey - 2, 3.4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#123';
      ctx.beginPath(); ctx.arc(ex - 4 + Math.cos(a) * 1.6, ey - 2 + Math.sin(a) * 1.6, 1.6, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(ex + 4 + Math.cos(a) * 1.6, ey - 2 + Math.sin(a) * 1.6, 1.6, 0, Math.PI * 2); ctx.fill();

      // determined frown
      ctx.strokeStyle = '#0d2a44';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(ex, ey + 7, 4, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
    }
    ctx.restore();
  }
}