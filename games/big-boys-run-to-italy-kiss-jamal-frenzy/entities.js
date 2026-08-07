export function distance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

export function circleRectCollision(circle, rect) {
  const nearestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.w));
  const nearestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.h));
  const dx = circle.x - nearestX;
  const dy = circle.y - nearestY;
  return dx * dx + dy * dy < circle.r * circle.r;
}

export function resolveCircleRect(entity, rect) {
  const nearestX = Math.max(rect.x, Math.min(entity.x, rect.x + rect.w));
  const nearestY = Math.max(rect.y, Math.min(entity.y, rect.y + rect.h));
  let dx = entity.x - nearestX;
  let dy = entity.y - nearestY;
  let d2 = dx * dx + dy * dy;
  if (d2 >= entity.r * entity.r) return false;
  if (d2 === 0) {
    const left = Math.abs(entity.x - rect.x), right = Math.abs(rect.x + rect.w - entity.x);
    const top = Math.abs(entity.y - rect.y), bottom = Math.abs(rect.y + rect.h - entity.y);
    const min = Math.min(left, right, top, bottom);
    if (min === left) { entity.x = rect.x - entity.r; entity.vx = 0; }
    else if (min === right) { entity.x = rect.x + rect.w + entity.r; entity.vx = 0; }
    else if (min === top) { entity.y = rect.y - entity.r; entity.vy = 0; }
    else { entity.y = rect.y + rect.h + entity.r; entity.vy = 0; }
    return true;
  }
  const d = Math.sqrt(d2);
  const push = entity.r - d;
  entity.x += dx / d * push;
  entity.y += dy / d * push;
  if (Math.abs(dx) > Math.abs(dy)) entity.vx = 0;
  else entity.vy = 0;
  return true;
}

export class Enemy {
  constructor(spec) {
    Object.assign(this, spec);
    this.r = spec.r || 17;
    this.vx = 0; this.vy = 0;
    this.phase = Math.random() * Math.PI * 2;
    this.hitCooldown = 0;
  }

  update(dt, player, obstacles, bounds, time) {
    this.hitCooldown = Math.max(0, this.hitCooldown - dt);
    const dx = player.x - this.x, dy = player.y - this.y;
    const length = Math.hypot(dx, dy) || 1;
    let tx = dx / length, ty = dy / length;
    if (this.type === 'pigeon') {
      const side = Math.sin(time * 3 + this.phase) * .65;
      tx += -ty * side; ty += (dx / length) * side;
    }
    const accel = this.type === 'scooter' ? 260 : 190;
    this.vx += tx * accel * dt;
    this.vy += ty * accel * dt;
    const max = this.speed;
    const current = Math.hypot(this.vx, this.vy);
    if (current > max) { this.vx *= max / current; this.vy *= max / current; }
    this.x += this.vx * dt; this.y += this.vy * dt;
    for (const rect of obstacles) resolveCircleRect(this, rect);
    this.x = Math.max(this.r, Math.min(bounds.w - this.r, this.x));
    this.y = Math.max(this.r, Math.min(bounds.h - this.r, this.y));
  }

  draw(ctx, time) {
    ctx.save();
    ctx.translate(this.x, this.y);
    const tilt = Math.atan2(this.vy, this.vx) * .15;
    ctx.rotate(tilt);
    ctx.shadowColor = 'rgba(36,27,54,.3)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 5;
    if (this.type === 'scooter') {
      ctx.fillStyle = '#ef476f'; ctx.beginPath(); ctx.ellipse(0, 3, 24, 11, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffd166'; ctx.beginPath(); ctx.arc(0, -7, 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#241b36'; ctx.beginPath(); ctx.arc(-15, 9, 5, 0, Math.PI * 2); ctx.arc(15, 9, 5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#241b36'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(8, -7); ctx.lineTo(15, -18); ctx.lineTo(22, -18); ctx.stroke();
    } else {
      ctx.fillStyle = '#7d5fff'; ctx.beginPath(); ctx.ellipse(0, 1, 17, 13, Math.sin(time * 5 + this.phase) * .15, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#d9c6ff'; ctx.beginPath(); ctx.arc(0, -5, 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#241b36'; ctx.beginPath(); ctx.arc(-4, -6, 2, 0, Math.PI * 2); ctx.arc(4, -6, 2, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#241b36'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-8, 10); ctx.lineTo(-14, 16); ctx.moveTo(8, 10); ctx.lineTo(14, 16); ctx.stroke();
    }
    ctx.restore();
  }
}

export class Pickup {
  constructor(spec) { Object.assign(this, spec); this.r = 13; this.collected = false; this.phase = Math.random() * 6; }
  update(dt) { this.phase += dt * 3; }
  draw(ctx) {
    if (this.collected) return;
    const y = this.y + Math.sin(this.phase) * 4;
    ctx.save(); ctx.translate(this.x, y); ctx.rotate(Math.sin(this.phase) * .12);
    ctx.shadowColor = '#ffd166'; ctx.shadowBlur = 16;
    ctx.fillStyle = '#fff8e8'; ctx.fillRect(-12, -9, 24, 18);
    ctx.fillStyle = '#ef476f'; ctx.fillRect(-12, -9, 24, 5);
    ctx.fillStyle = '#118ab2'; ctx.font = '900 13px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('★', 0, 2);
    ctx.restore();
  }
}