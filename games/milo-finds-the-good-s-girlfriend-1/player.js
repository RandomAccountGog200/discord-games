import { aabb } from './entities.js';

export class Player {
  constructor(spawn, upgrades = {}) {
    this.w = 30; this.h = 42;
    this.x = spawn.x; this.y = spawn.y;
    this.vx = 0; this.vy = 0;
    this.spawn = { ...spawn };
    this.facing = 1; this.grounded = false; this.coyote = 0;
    this.dashTime = 0; this.dashCooldown = 0;
    this.invulnerable = 0;
    this.upgrades = upgrades;
    this.maxHp = 3 + (upgrades.hp || 0);
    this.hp = this.maxHp;
  }

  get speed() { return 255 + (this.upgrades.speed || 0) * 32; }
  get jumpPower() { return 485 + (this.upgrades.jump || 0) * 28; }

  resetAtSpawn() {
    this.x = this.spawn.x; this.y = this.spawn.y; this.vx = 0; this.vy = 0; this.invulnerable = 1.1;
  }

  update(dt, input, platforms, worldWidth, audio, particles) {
    const axis = input.axis;
    if (axis !== 0) { this.facing = axis; this.vx += axis * 1450 * dt; }
    else this.vx *= Math.pow(.0008, dt);
    this.vx = Math.max(-this.speed, Math.min(this.speed, this.vx));

    if (this.coyote > 0) this.coyote -= dt;
    if (this.dashCooldown > 0) this.dashCooldown -= dt;
    if (this.dashTime > 0) {
      this.dashTime -= dt;
      particles.trail(this.x + this.w / 2, this.y + this.h / 2, '#65f2df');
    }
    if (input.consumeDash() && this.dashCooldown <= 0) {
      this.dashTime = .16; this.dashCooldown = .72; this.vx = this.facing * 660; this.vy = 0;
      audio.sfx('dash'); particles.burst(this.x + this.w / 2, this.y + this.h / 2, '#65f2df', 10, 130);
    }
    if (input.consumeJump() && (this.grounded || this.coyote > 0)) {
      this.vy = -this.jumpPower; this.grounded = false; this.coyote = 0; audio.sfx('jump');
      particles.burst(this.x + this.w / 2, this.y + this.h, '#fff0a8', 7, 80);
    }

    const wasGrounded = this.grounded;
    this.vy += 1250 * dt;
    if (this.dashTime > 0) this.vy = 0;
    const previousX = this.x, previousY = this.y;
    this.x += this.vx * dt;
    for (const platform of platforms) {
      if (aabb(this, platform)) {
        if (this.vx > 0) this.x = platform.x - this.w;
        else if (this.vx < 0) this.x = platform.x + platform.w;
        this.vx = 0;
      }
    }
    this.y += this.vy * dt;
    this.grounded = false;
    for (const platform of platforms) {
      const horizontal = this.x + this.w > platform.x && this.x < platform.x + platform.w;
      if (!horizontal) continue;
      const oldBottom = previousY + this.h;
      if (this.vy >= 0 && oldBottom <= platform.y + 3 && this.y + this.h >= platform.y) {
        this.y = platform.y - this.h; this.vy = 0; this.grounded = true;
      } else if (this.vy < 0 && previousY >= platform.y + platform.h - 2 && this.y <= platform.y + platform.h) {
        this.y = platform.y + platform.h; this.vy = 0;
      }
    }
    if (this.grounded && !wasGrounded) particles.burst(this.x + this.w / 2, this.y + this.h, '#f6d5aa', 5, 45);
    this.x = Math.max(0, Math.min(worldWidth - this.w, this.x));
    if (this.invulnerable > 0) this.invulnerable -= dt;
  }

  takeDamage(direction, particles, audio) {
    if (this.invulnerable > 0) return false;
    this.hp -= 1; this.invulnerable = 1.25; this.vx = direction * 300; this.vy = -270;
    audio.sfx('hit'); particles.burst(this.x + this.w / 2, this.y + this.h / 2, '#ff6b9e', 18, 180);
    return true;
  }

  draw(ctx, time) {
    if (this.invulnerable > 0 && Math.floor(this.invulnerable * 16) % 2 === 0) return;
    const bob = this.grounded ? Math.sin(time * 8) * 1.3 : 0;
    ctx.save(); ctx.translate(this.x + this.w / 2, this.y + this.h / 2 + bob); ctx.scale(this.facing, 1);
    if (this.dashTime > 0) { ctx.shadowColor = '#65f2df'; ctx.shadowBlur = 23; }
    ctx.fillStyle = '#f49b58';
    ctx.beginPath(); ctx.moveTo(-13, -9); ctx.lineTo(-15, -23); ctx.lineTo(-4, -16); ctx.lineTo(4, -16); ctx.lineTo(15, -23); ctx.lineTo(13, -8); ctx.roundRect(-15, -17, 30, 31, 10); ctx.fill();
    ctx.fillStyle = '#ffd2a0'; ctx.beginPath(); ctx.ellipse(0, 3, 9, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#291a43'; ctx.beginPath(); ctx.arc(-6, -7, 2.1, 0, Math.PI * 2); ctx.arc(6, -7, 2.1, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e9667d'; ctx.beginPath(); ctx.arc(0, -2, 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#f49b58'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-13, 8); ctx.quadraticCurveTo(-25, 18, -15, 22); ctx.stroke();
    ctx.restore();
  }
}