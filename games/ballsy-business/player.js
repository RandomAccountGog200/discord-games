export class Player {
  constructor() { this.reset(); }
  reset() {
    this.x = 500; this.y = 325; this.vx = 0; this.vy = 0; this.radius = 18;
    this.maxSpeed = 285; this.accel = 980; this.maxHealth = 3; this.health = 3;
    this.invuln = 0; this.dashCooldown = 2.4; this.dashTimer = 0; this.pickupRadius = 0; this.scoreMultiplier = 1; this.dashPulse = false;
  }
  update(input, dt, obstacles) {
    this.invuln = Math.max(0, this.invuln - dt); this.dashTimer = Math.max(0, this.dashTimer - dt); this.dashPulse = false;
    const a = input.axis(this), moving = Math.hypot(a.x, a.y);
    if (moving > .01) { this.vx += a.x * this.accel * a.strength * dt; this.vy += a.y * this.accel * a.strength * dt; }
    if (input.consumeDash() && this.dashTimer <= 0 && moving > .1) {
      this.vx = a.x * 680; this.vy = a.y * 680; this.dashTimer = this.dashCooldown; this.invuln = .24; this.dashPulse = true;
    }
    const speed = Math.hypot(this.vx, this.vy);
    if (speed > this.maxSpeed && !this.dashPulse) { this.vx *= this.maxSpeed / speed; this.vy *= this.maxSpeed / speed; }
    const drag = Math.pow(.0009, dt); this.vx *= drag; this.vy *= drag;
    this.x += this.vx * dt; this.resolveBounds();
    for (const o of obstacles) resolveCircleRect(this, o);
    this.y += this.vy * dt; this.resolveBounds();
    for (const o of obstacles) resolveCircleRect(this, o);
  }
  resolveBounds() { const r = this.radius; if (this.x < 22 + r) { this.x = 22 + r; this.vx = Math.abs(this.vx) * .45; } if (this.x > 978 - r) { this.x = 978 - r; this.vx = -Math.abs(this.vx) * .45; } if (this.y < 22 + r) { this.y = 22 + r; this.vy = Math.abs(this.vy) * .45; } if (this.y > 628 - r) { this.y = 628 - r; this.vy = -Math.abs(this.vy) * .45; } }
  draw(ctx, time) {
    ctx.save(); ctx.translate(this.x, this.y); const flicker = this.invuln > 0 && Math.floor(time * 18) % 2 === 0; if (flicker) ctx.globalAlpha = .38;
    ctx.shadowColor = '#4de9ff'; ctx.shadowBlur = 25; const g = ctx.createRadialGradient(-6,-8,2,0,0,22); g.addColorStop(0,'#ecffff'); g.addColorStop(.35,'#4de9ff'); g.addColorStop(1,'#1680b5'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0,0,this.radius,0,Math.PI*2); ctx.fill();
    ctx.shadowBlur = 0; ctx.strokeStyle = '#d9ffff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0,0,this.radius-3,0,Math.PI*2); ctx.stroke(); ctx.fillStyle = '#06203b'; ctx.beginPath(); ctx.arc(-5,-5,3,0,Math.PI*2); ctx.arc(5,-5,3,0,Math.PI*2); ctx.fill(); ctx.restore();
  }
}
export function circleHit(a, b, extra = 0) { const dx = a.x - b.x, dy = a.y - b.y, r = (a.radius || a.r) + (b.radius || b.r) + extra; return dx * dx + dy * dy < r * r; }
export function resolveCircleRect(c, o) {
  const nx = Math.max(o.x, Math.min(c.x, o.x + o.w)), ny = Math.max(o.y, Math.min(c.y, o.y + o.h));
  let dx = c.x - nx, dy = c.y - ny, d2 = dx * dx + dy * dy;
  if (d2 < c.radius * c.radius) {
    if (d2 === 0) { const left = Math.abs(c.x - o.x), right = Math.abs(o.x + o.w - c.x), top = Math.abs(c.y - o.y), bottom = Math.abs(o.y + o.h - c.y), m = Math.min(left,right,top,bottom); if (m === left) { dx=-1; dy=0; } else if (m===right) { dx=1; dy=0; } else if (m===top) { dx=0; dy=-1; } else { dx=0; dy=1; } d2=1; }
    const d = Math.sqrt(d2), push = c.radius - d; c.x += dx / d * push; c.y += dy / d * push; if (Math.abs(dx) > Math.abs(dy)) c.vx *= -.35; else c.vy *= -.35;
  }
}