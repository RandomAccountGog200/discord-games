export function aabb(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export class Star {
  constructor(x, y) { this.x = x; this.y = y; this.r = 11; this.collected = false; this.phase = Math.random() * 6; }
  update(dt) { this.phase += dt * 4; }
  touches(player) {
    const dx = player.x + player.w / 2 - this.x, dy = player.y + player.h / 2 - this.y;
    return dx * dx + dy * dy < 31 * 31;
  }
  draw(ctx, time) {
    if (this.collected) return;
    const pulse = 1 + Math.sin(time * 5 + this.phase) * .12;
    ctx.save(); ctx.translate(this.x, this.y); ctx.scale(pulse, pulse); ctx.shadowColor = '#ffe27a'; ctx.shadowBlur = 17;
    ctx.fillStyle = '#ffe27a'; ctx.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5; const r = i % 2 ? 5 : 12; const x = Math.cos(a) * r, y = Math.sin(a) * r; if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
    ctx.closePath(); ctx.fill(); ctx.restore();
  }
}

export class Enemy {
  constructor(x, platform, range, color = '#6955c9') {
    this.x = x; this.platform = platform; this.range = range; this.w = 34; this.h = 31; this.y = platform.y - this.h; this.vx = 55; this.color = color; this.phase = Math.random() * 5;
  }
  update(dt) {
    this.phase += dt * 5; this.x += this.vx * dt;
    if (this.x < this.range[0]) { this.x = this.range[0]; this.vx = Math.abs(this.vx); }
    if (this.x + this.w > this.range[1]) { this.x = this.range[1] - this.w; this.vx = -Math.abs(this.vx); }
  }
  draw(ctx) {
    ctx.save(); ctx.translate(this.x + this.w / 2, this.y + this.h / 2); ctx.shadowColor = this.color; ctx.shadowBlur = 13;
    ctx.fillStyle = this.color; ctx.beginPath(); ctx.roundRect(-17, -14, 34, 28, 12); ctx.fill();
    ctx.fillStyle = '#1a183d'; ctx.beginPath(); ctx.arc(-7, -2, 3, 0, Math.PI * 2); ctx.arc(7, -2, 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff799f'; ctx.beginPath(); ctx.arc(0, 6, 3, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}

export class Goal {
  constructor(x, y) { this.x = x; this.y = y; this.w = 46; this.h = 66; this.welcomed = false; }
  draw(ctx, time, open, final = false) {
    const pulse = 1 + Math.sin(time * 4) * .06;
    ctx.save(); ctx.translate(this.x + this.w / 2, this.y + this.h / 2); ctx.scale(pulse, pulse);
    ctx.shadowColor = open ? '#65f2df' : '#9d8fbd'; ctx.shadowBlur = open ? 24 : 8;
    ctx.fillStyle = open ? '#65f2df' : '#756c91'; ctx.beginPath(); ctx.arc(0, 0, 24, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0; ctx.fillStyle = '#fff5d2'; ctx.beginPath(); ctx.arc(0, -7, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = final ? '#9b7aff' : '#f49b58'; ctx.beginPath(); ctx.moveTo(-11,-9); ctx.lineTo(-12,-20); ctx.lineTo(-4,-14); ctx.lineTo(4,-14); ctx.lineTo(12,-20); ctx.lineTo(11,-9); ctx.fill();
    ctx.fillStyle = '#2b2050'; ctx.beginPath(); ctx.arc(-4, -7, 2, 0, Math.PI * 2); ctx.arc(4, -7, 2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}