import { rand, clamp, dist, drawHeart } from './utils.js';

export const TYPES = {
  texter:  { r: 16, hp: 22,  speed: 115, color: '#ff5e8a', dark: '#a3124a', score: 50,   dmg: 8,  kind: 'chase',   name: 'The Texter' },
  clingy:  { r: 12, hp: 12,  speed: 195, color: '#ff9ec7', dark: '#c14d84', score: 40,   dmg: 6,  kind: 'chase',   name: 'The Clingy' },
  jealous: { r: 15, hp: 30,  speed: 95,  color: '#c95bff', dark: '#7a1db3', score: 90,   dmg: 8,  kind: 'shooter', name: 'The Jealous' },
  ghost:   { r: 14, hp: 20,  speed: 135, color: '#8ad8ff', dark: '#3a7fae', score: 80,   dmg: 8,  kind: 'ghost',   name: 'The Ghost' },
  drama:   { r: 19, hp: 46,  speed: 85,  color: '#ffb13d', dark: '#b36a0f', score: 100,  dmg: 12, kind: 'chase',   name: 'The Drama Queen', explodes: true },
  boss:    { r: 46, hp: 950, speed: 68,  color: '#ff2d55', dark: '#8f0a2a', score: 2500, dmg: 16, kind: 'boss',    name: 'KAREN, THE FINAL GIRLFRIEND' }
};

export class Enemy {
  constructor(type, x, y, hpMul = 1) {
    const t = TYPES[type];
    this.type = type;
    this.def = t;
    this.x = x; this.y = y;
    this.r = t.r;
    this.maxhp = Math.round(t.hp * hpMul);
    this.hp = this.maxhp;
    this.speed = t.speed * rand(0.9, 1.1);
    this.color = t.color;
    this.score = t.score;
    this.dmg = t.dmg;
    this.hitFlash = 0;
    this.phase = rand(0, Math.PI * 2);
    this.shootTimer = rand(1, 2.2);
    this.ghostTimer = rand(0, 3);
    this.phased = false;
    this.spawnAnim = 0.45;
    this.burstTimer = 2.2;
    this.minionTimer = 4.5;
    this.chargeTimer = 6;
    this.charging = 0;
    this.chargeDX = 0; this.chargeDY = 0;
    this.wobble = rand(0, Math.PI * 2);
  }

  update(dt, player, world, ebullets, FX, AudioSys, enemies) {
    if (this.spawnAnim > 0) { this.spawnAnim -= dt; return; }
    this.hitFlash -= dt;
    this.wobble += dt * 4;

    const dx = player.x - this.x, dy = player.y - this.y;
    const d = Math.hypot(dx, dy) || 1;
    const nx = dx / d, ny = dy / d;
    let vx = 0, vy = 0;

    switch (this.def.kind) {
      case 'chase': {
        const sway = Math.sin(this.wobble) * 0.35;
        vx = (nx + -ny * sway) * this.speed;
        vy = (ny + nx * sway) * this.speed;
        break;
      }
      case 'shooter': {
        // keep ~260 distance, strafe
        const want = 260;
        const toward = d > want + 30 ? 1 : (d < want - 30 ? -1 : 0);
        const strafe = Math.sin(this.wobble * 0.6) > 0 ? 1 : -1;
        vx = (nx * toward + -ny * 0.7 * strafe) * this.speed;
        vy = (ny * toward + nx * 0.7 * strafe) * this.speed;
        this.shootTimer -= dt;
        if (this.shootTimer <= 0 && d < 560) {
          this.shootTimer = rand(1.7, 2.5);
          const a = Math.atan2(dy, dx);
          for (const off of [-0.18, 0, 0.18]) {
            ebullets.push({
              x: this.x, y: this.y,
              vx: Math.cos(a + off) * 230, vy: Math.sin(a + off) * 230,
              r: 7, dmg: 10, life: 3.5, heart: true
            });
          }
          AudioSys.eshoot();
        }
        break;
      }
      case 'ghost': {
        this.ghostTimer -= dt;
        if (this.ghostTimer <= 0) {
          this.phased = !this.phased;
          this.ghostTimer = this.phased ? rand(1.2, 1.8) : rand(1.6, 2.4);
          FX.burst(this.x, this.y, '#8ad8ff', 8, 90, 3);
        }
        const spd = this.phased ? this.speed * 1.4 : this.speed;
        vx = nx * spd; vy = ny * spd;
        break;
      }
      case 'boss': {
        this.chargeTimer -= dt;
        if (this.charging > 0) {
          this.charging -= dt;
          vx = this.chargeDX * this.speed * 4.2;
          vy = this.chargeDY * this.speed * 4.2;
          FX.trail(this.x, this.y, '#ff2d55', 7);
        } else {
          vx = nx * this.speed; vy = ny * this.speed;
          if (this.chargeTimer <= 0) {
            this.chargeTimer = rand(5, 7);
            this.charging = 0.7;
            this.chargeDX = nx; this.chargeDY = ny;
            AudioSys.bossHit();
            FX.burst(this.x, this.y, '#ffd23d', 20, 200, 5);
          }
        }
        // radial bursts
        this.burstTimer -= dt;
        if (this.burstTimer <= 0) {
          this.burstTimer = 2.6;
          const n = 12;
          const off = rand(0, Math.PI * 2);
          for (let i = 0; i < n; i++) {
            const a = off + (i / n) * Math.PI * 2;
            ebullets.push({ x: this.x, y: this.y, vx: Math.cos(a) * 180, vy: Math.sin(a) * 180, r: 7, dmg: 12, life: 4, heart: true });
          }
          AudioSys.eshoot();
        }
        // spawn minions
        this.minionTimer -= dt;
        let minions = 0;
        for (const e of enemies) if (e !== this) minions++;
        if (this.minionTimer <= 0 && minions < 5) {
          this.minionTimer = 5;
          const a = rand(0, Math.PI * 2);
          const m = new Enemy(Math.random() < 0.5 ? 'clingy' : 'texter',
            clamp(this.x + Math.cos(a) * 120, 20, world.w - 20),
            clamp(this.y + Math.sin(a) * 120, 20, world.h - 20), 1);
          enemies.push(m);
          FX.burst(m.x, m.y, m.color, 12, 120, 4);
        }
        break;
      }
    }

    this.x = clamp(this.x + vx * dt, this.r, world.w - this.r);
    this.y = clamp(this.y + vy * dt, this.r, world.h - this.r);

    // separation from other enemies (soft)
    for (const o of enemies) {
      if (o === this || o.spawnAnim > 0) continue;
      const ox = this.x - o.x, oy = this.y - o.y;
      const od = Math.hypot(ox, oy);
      const min = this.r + o.r;
      if (od > 0 && od < min) {
        const push = (min - od) * 0.5;
        this.x += (ox / od) * push;
        this.y += (oy / od) * push;
      }
    }
  }

  takeDamage(dmg, FX, AudioSys) {
    if (this.phased) return false;
    this.hp -= dmg;
    this.hitFlash = 0.09;
    FX.addText(this.x, this.y - this.r - 6, Math.round(dmg), '#ffd23d', 13);
    if (this.def.kind === 'boss') AudioSys.bossHit(); else AudioSys.hit();
    return true;
  }

  onDeath(ebullets, FX, AudioSys) {
    FX.burst(this.x, this.y, this.color, this.def.kind === 'boss' ? 60 : 20, 260, 6);
    FX.hearts(this.x, this.y, this.def.kind === 'boss' ? 24 : 6);
    AudioSys.explode();
    if (this.def.explodes) {
      const n = 8;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        ebullets.push({ x: this.x, y: this.y, vx: Math.cos(a) * 170, vy: Math.sin(a) * 170, r: 6, dmg: 10, life: 2.5, heart: true });
      }
    }
  }

  draw(ctx, time) {
    if (this.spawnAnim > 0) {
      const t = 1 - this.spawnAnim / 0.45;
      ctx.globalAlpha = t * 0.7;
      ctx.strokeStyle = this.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r * (2 - t), 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
      return;
    }

    ctx.save();
    ctx.translate(this.x, this.y);
    const alpha = this.phased ? 0.28 : 1;
    ctx.globalAlpha = alpha;

    const isBoss = this.def.kind === 'boss';
    const bob = Math.sin(time * 5 + this.phase) * 2;

    // body
    const g = ctx.createRadialGradient(-this.r * 0.3, -this.r * 0.3 + bob, 2, 0, bob, this.r + 2);
    g.addColorStop(0, this.hitFlash > 0 ? '#ffffff' : this.color);
    g.addColorStop(1, this.def.dark);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, bob, this.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2;
    ctx.stroke();

    // bow
    ctx.fillStyle = this.hitFlash > 0 ? '#fff' : '#ffd23d';
    const bx = 0, by = -this.r - 2 + bob;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx - 8, by - 6); ctx.lineTo(bx - 8, by + 6); ctx.closePath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + 8, by - 6); ctx.lineTo(bx + 8, by + 6); ctx.closePath();
    ctx.fill();
    ctx.beginPath(); ctx.arc(bx, by, 3, 0, Math.PI * 2); ctx.fill();

    // angry eyes
    const ey = bob - this.r * 0.15;
    const exOff = this.r * 0.38;
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(-exOff, ey, this.r * 0.22, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(exOff, ey, this.r * 0.22, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1a0510';
    ctx.beginPath(); ctx.arc(-exOff, ey + 1, this.r * 0.11, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(exOff, ey + 1, this.r * 0.11, 0, Math.PI * 2); ctx.fill();
    // angry brows
    ctx.strokeStyle = '#1a0510';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-exOff - this.r * 0.2, ey - this.r * 0.3);
    ctx.lineTo(-exOff + this.r * 0.18, ey - this.r * 0.14);
    ctx.moveTo(exOff + this.r * 0.2, ey - this.r * 0.3);
    ctx.lineTo(exOff - this.r * 0.18, ey - this.r * 0.14);
    ctx.stroke();

    // mouth: open yell
    ctx.fillStyle = '#5a0a28';
    ctx.beginPath();
    ctx.ellipse(0, bob + this.r * 0.42, this.r * 0.22, this.r * 0.15 + (isBoss ? Math.sin(time * 10) * 2 : 0), 0, 0, Math.PI * 2);
    ctx.fill();

    // boss crown
    if (isBoss) {
      ctx.fillStyle = '#ffd23d';
      ctx.beginPath();
      const cw = this.r * 0.9, cy = -this.r - 10 + bob;
      ctx.moveTo(-cw / 2, cy);
      ctx.lineTo(-cw / 2, cy - 12); ctx.lineTo(-cw / 4, cy - 5);
      ctx.lineTo(0, cy - 16); ctx.lineTo(cw / 4, cy - 5);
      ctx.lineTo(cw / 2, cy - 12); ctx.lineTo(cw / 2, cy);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();

    // hp bar for tougher enemies
    if (this.hp < this.maxhp && this.def.kind !== 'boss') {
      const w = this.r * 2;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(this.x - w / 2, this.y - this.r - 14, w, 4);
      ctx.fillStyle = '#6dffb8';
      ctx.fillRect(this.x - w / 2, this.y - this.r - 14, w * Math.max(0, this.hp / this.maxhp), 4);
    }
  }
}

export function makeEnemy(type, x, y, hpMul) {
  return new Enemy(type, x, y, hpMul);
}

export function drawEnemyBullet(ctx, b, time) {
  if (b.heart) {
    const pulse = 1 + Math.sin(time * 12) * 0.15;
    drawHeart(ctx, b.x, b.y, b.r * pulse, '#ff77b0');
    ctx.globalAlpha = 0.4;
    drawHeart(ctx, b.x, b.y, b.r * pulse * 1.6, '#ff2d77');
    ctx.globalAlpha = 1;
  } else {
    ctx.fillStyle = '#ff77b0';
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
  }
}