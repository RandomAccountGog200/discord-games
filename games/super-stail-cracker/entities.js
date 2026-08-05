import { COLORS } from './config.js';
import { clamp, circleAABB, circleHit, distance, moveCircle, normalize, rand } from './utils.js';

export class Block {
  constructor(data) { Object.assign(this, data); this.maxHp = data.maxHp || data.hp; this.flash = 0; }
  hit(damage) { this.hp -= damage; this.flash = .12; return this.hp <= 0; }
  update(dt) { this.flash = Math.max(0, this.flash - dt); }
  draw(ctx) {
    if (this.hp <= 0) return;
    const ratio = this.hp / this.maxHp;
    ctx.save(); ctx.shadowColor = 'rgba(239,131,84,.3)'; ctx.shadowBlur = 12;
    ctx.fillStyle = this.flash > 0 ? '#fff4d2' : ['#6d486f', '#5b527c', '#694e74'][this.hue];
    ctx.fillRect(this.x, this.y, this.w, this.h); ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255,244,210,.25)'; ctx.lineWidth = 2; ctx.strokeRect(this.x + 1, this.y + 1, this.w - 2, this.h - 2);
    ctx.fillStyle = 'rgba(255,200,87,.25)'; ctx.fillRect(this.x, this.y + this.h * (1 - ratio), this.w, this.h * ratio);
    ctx.strokeStyle = 'rgba(30,20,45,.48)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(this.x + this.w * .2, this.y + this.h * .15); ctx.lineTo(this.x + this.w * .48, this.y + this.h * .55); ctx.lineTo(this.x + this.w * .35, this.y + this.h * .88); ctx.moveTo(this.x + this.w * .7, this.y + this.h * .1); ctx.lineTo(this.x + this.w * .55, this.y + this.h * .45); ctx.stroke(); ctx.restore();
  }
}

export class Bullet {
  constructor(x, y, dx, dy, damage, friendly = true, size = 5, color = null) {
    this.x = x; this.y = y; this.dx = dx; this.dy = dy; this.damage = damage; this.friendly = friendly; this.r = size; this.life = 1.2; this.color = color;
  }
  update(dt) { this.x += this.dx * dt; this.y += this.dy * dt; this.life -= dt; }
  draw(ctx) {
    ctx.save(); const color = this.color || (this.friendly ? COLORS.gold : COLORS.pink); ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 15; ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
}

export class Pickup {
  constructor(x, y) { this.x = x; this.y = y; this.r = 10; this.t = rand(0, 6); this.life = 12; }
  update(dt, game) {
    this.t += dt * 4; this.life -= dt;
    let closest = null, closestDistance = Infinity;
    for (const player of game.players) {
      if (!player.alive) continue;
      const d = distance(this.x, this.y, player.x, player.y);
      if (d < closestDistance) { closestDistance = d; closest = player; }
    }
    if (closest && closestDistance < closest.pickupRadius) {
      const n = normalize(closest.x - this.x, closest.y - this.y), force = closestDistance < 50 ? 230 : 110;
      this.x += n.x * force * dt; this.y += n.y * force * dt;
    }
    for (const player of game.players) {
      if (player.alive && circleHit(this, player)) {
        player.hp = clamp(player.hp + 14, 0, player.maxHp); game.score += 100; game.audio.pickup(); game.fx.burst(this.x, this.y, COLORS.gold, 16, 150); this.life = 0; break;
      }
    }
  }
  draw(ctx) { const bob = Math.sin(this.t) * 3; ctx.save(); ctx.translate(this.x, this.y + bob); ctx.rotate(Math.PI / 4); ctx.fillStyle = COLORS.gold; ctx.shadowColor = COLORS.gold; ctx.shadowBlur = 17; ctx.fillRect(-8, -8, 16, 16); ctx.rotate(-Math.PI / 4); ctx.fillStyle = '#fff4d2'; ctx.font = 'bold 13px Arial'; ctx.textAlign = 'center'; ctx.fillText('+', 0, 5); ctx.restore(); }
}

export class Player {
  constructor(x, y, index = 0) {
    this.x = x; this.y = y; this.index = index; this.r = 18; this.vx = 0; this.vy = 0; this.hp = 100; this.maxHp = 100; this.speed = 245; this.damage = 18; this.fireRate = .2; this.fireTimer = 0; this.bulletSpeed = 720; this.bulletSize = 5; this.pickupRadius = 78; this.dashCooldown = 0; this.invulnerable = 0; this.recoil = 0; this.angle = 0; this.alive = true;
  }
  update(dt, input, game) {
    if (!this.alive) return;
    const move = input.getMove(this.index); this.angle = Math.atan2(input.getAim(this.x, this.y, this.index, game.enemies).y, input.getAim(this.x, this.y, this.index, game.enemies).x);
    this.fireTimer -= dt; this.dashCooldown -= dt; this.invulnerable -= dt; this.recoil = Math.max(0, this.recoil - dt * 8);
    if (input.consumeDash(this.index) && this.dashCooldown <= 0) {
      const aim = input.getAim(this.x, this.y, this.index, game.enemies);
      const d = move.x || move.y ? move : aim;
      moveCircle(this, d.x * 100, d.y * 100, game.blocks, game.width, game.height); this.dashCooldown = 1.5; this.invulnerable = .28; game.shake = Math.max(game.shake, 8); game.audio.dash(); game.fx.burst(this.x, this.y, this.index ? COLORS.blue : COLORS.gold, 20, 250);
    }
    const targetVx = move.x * this.speed, targetVy = move.y * this.speed;
    this.vx += (targetVx - this.vx) * Math.min(1, dt * 10); this.vy += (targetVy - this.vy) * Math.min(1, dt * 10);
    if (!move.x && !move.y) { this.vx *= .84; this.vy *= .84; }
    moveCircle(this, this.vx * dt, this.vy * dt, game.blocks, game.width, game.height);
    if (input.isFiring(this.index) && this.fireTimer <= 0) {
      const aim = input.getAim(this.x, this.y, this.index, game.enemies), bx = this.x + aim.x * 22, by = this.y + aim.y * 22;
      const color = this.index ? COLORS.blue : COLORS.gold;
      game.bullets.push(new Bullet(bx, by, aim.x * this.bulletSpeed, aim.y * this.bulletSpeed, this.damage, true, this.bulletSize, color)); this.fireTimer = this.fireRate; this.recoil = 1; game.audio.shoot(); game.fx.trail(bx, by, color);
    }
  }
  hurt(amount, game) {
    if (!this.alive || this.invulnerable > 0) return;
    this.hp -= amount; this.invulnerable = .55; game.flash = .26; game.shake = Math.max(game.shake, 10); game.audio.hurt(); game.fx.burst(this.x, this.y, COLORS.pink, 14, 180);
    if (this.hp <= 0) { this.hp = 0; this.alive = false; this.vx = 0; this.vy = 0; game.fx.burst(this.x, this.y, this.index ? COLORS.blue : COLORS.gold, 25, 210); if (game.players.every(player => !player.alive)) game.end(false); }
  }
  draw(ctx) {
    if (!this.alive) {
      ctx.save(); ctx.translate(this.x, this.y); ctx.strokeStyle = this.index ? COLORS.blue : COLORS.gold; ctx.globalAlpha = .35 + Math.sin(performance.now() * .006) * .1; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 22, 0, Math.PI * 2); ctx.stroke(); ctx.font = 'bold 10px Arial'; ctx.textAlign = 'center'; ctx.fillStyle = COLORS.cream; ctx.fillText('DOWN', 0, -28); ctx.restore(); return;
    }
    const main = this.index ? COLORS.blue : COLORS.gold;
    ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.angle); const blink = this.invulnerable > 0 && Math.floor(this.invulnerable * 18) % 2 === 0; ctx.globalAlpha = blink ? .48 : 1;
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(0, 15, 23, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = main; ctx.shadowColor = main; ctx.shadowBlur = 18; ctx.beginPath(); ctx.roundRect(-18 - this.recoil * 3, -15, 36, 30, 8); ctx.fill(); ctx.shadowBlur = 0;
    ctx.strokeStyle = this.index ? '#267f9e' : '#c96847'; ctx.lineWidth = 2; ctx.stroke(); ctx.fillStyle = this.index ? COLORS.cream : COLORS.purple; ctx.beginPath(); ctx.arc(-7, -5, 3, 0, 6.28); ctx.arc(8, 6, 3, 0, 6.28); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.65)'; ctx.beginPath(); ctx.moveTo(-9, 5); ctx.lineTo(11, -5); ctx.stroke();
    ctx.fillStyle = COLORS.orange; ctx.fillRect(12, -5, 16, 10); ctx.fillStyle = COLORS.cream; ctx.fillRect(27, -3, 4, 6); ctx.restore();
  }
}

export class Enemy {
  constructor(x, y, type, wave) {
    this.x = x; this.y = y; this.type = type; this.wave = wave; this.flash = 0; this.hitCooldown = 0; this.phase = rand(0, 6);
    if (type === 'boss') { this.r = 40; this.hp = 420; this.maxHp = 420; this.speed = 56; this.contact = 25; this.shootTimer = 1.2; }
    else if (type === 'beetle') { this.r = 22; this.hp = 65 + wave * 8; this.maxHp = this.hp; this.speed = 72 + wave * 2; this.contact = 18; this.shootTimer = 99; }
    else if (type === 'spore') { this.r = 17; this.hp = 42 + wave * 5; this.maxHp = this.hp; this.speed = 62; this.contact = 12; this.shootTimer = rand(.5, 1.4); }
    else { this.r = 15; this.hp = 27 + wave * 4; this.maxHp = this.hp; this.speed = 104 + wave * 4; this.contact = 9; this.shootTimer = 99; }
  }
  update(dt, game) {
    this.flash = Math.max(0, this.flash - dt); this.hitCooldown -= dt; this.phase += dt * 3;
    const p = game.getNearestPlayer(this.x, this.y); if (!p) return;
    const toP = normalize(p.x - this.x, p.y - this.y), d = distance(this.x, this.y, p.x, p.y); let dx = toP.x, dy = toP.y;
    if (this.type === 'spore' && d < 330) { const side = Math.sin(this.phase) > 0 ? 1 : -1; dx = toP.x * (d > 245 ? 1 : -1) - toP.y * side * .45; dy = toP.y * (d > 245 ? 1 : -1) + toP.x * side * .45; }
    if (this.type === 'boss') { this.shootTimer -= dt; if (this.shootTimer <= 0) { this.shootTimer = 1.25; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + this.phase * .15; game.enemyBullets.push(new Bullet(this.x, this.y, Math.cos(a) * 210, Math.sin(a) * 210, 12, false, 6)); } game.fx.burst(this.x, this.y, COLORS.pink, 12, 100); game.audio.boss(); } }
    else if (this.type === 'spore') { this.shootTimer -= dt; if (this.shootTimer <= 0 && d < 440) { this.shootTimer = 2.1; game.enemyBullets.push(new Bullet(this.x, this.y, toP.x * 250, toP.y * 250, 10, false, 5)); } }
    moveCircle(this, dx * this.speed * dt, dy * this.speed * dt, game.blocks, game.width, game.height);
    if (circleHit(this, p) && this.hitCooldown <= 0) { this.hitCooldown = .7; p.hurt(this.contact, game); const push = normalize(p.x - this.x, p.y - this.y); moveCircle(p, push.x * 16, push.y * 16, game.blocks, game.width, game.height); }
  }
  damage(amount) { this.hp -= amount; this.flash = .1; return this.hp <= 0; }
  draw(ctx) {
    ctx.save(); ctx.translate(this.x, this.y); const pulse = 1 + Math.sin(this.phase) * .06; ctx.scale(pulse, pulse); ctx.fillStyle = this.flash > 0 ? '#fff4d2' : this.type === 'boss' ? '#ef476f' : this.type === 'beetle' ? '#9b5de5' : this.type === 'spore' ? '#83d483' : '#ef8354'; ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = this.type === 'boss' ? 24 : 13;
    ctx.beginPath(); const points = this.type === 'boss' ? 10 : this.type === 'beetle' ? 8 : 7; for (let i = 0; i < points; i++) { const a = i * Math.PI * 2 / points; const rr = this.r * (i % 2 ? .82 : 1); ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0;
    ctx.fillStyle = '#241b31'; ctx.beginPath(); ctx.arc(-this.r * .28, -3, this.type === 'boss' ? 5 : 3, 0, 6.28); ctx.arc(this.r * .28, -3, this.type === 'boss' ? 5 : 3, 0, 6.28); ctx.fill(); ctx.strokeStyle = '#241b31'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 4, this.r * .3, 0, Math.PI); ctx.stroke(); ctx.restore();
    if (this.type === 'boss' || this.hp < this.maxHp) { ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(this.x - this.r, this.y - this.r - 12, this.r * 2, 4); ctx.fillStyle = this.type === 'boss' ? COLORS.pink : COLORS.gold; ctx.fillRect(this.x - this.r, this.y - this.r - 12, this.r * 2 * Math.max(0, this.hp / this.maxHp), 4); }
  }
}