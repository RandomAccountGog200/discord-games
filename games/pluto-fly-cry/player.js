export class Player {
  constructor() {
    this.radius = 24;
    this.reset();
  }
  reset() {
    this.x = 230;
    this.y = 270;
    this.vy = 0;
    this.gravity = 560;
    this.thrustPower = 820;
    this.invulnerable = 0;
    this.crying = 0;
    this.flapPulse = 0;
  }
  update(dt, isThrusting) {
    if (isThrusting) {
      this.vy -= this.thrustPower * dt;
      this.flapPulse = Math.min(1, this.flapPulse + dt * 10);
    } else this.flapPulse = Math.max(0, this.flapPulse - dt * 4);
    this.vy += this.gravity * dt;
    this.vy *= Math.pow(.82, dt * 8);
    this.vy = Math.max(-390, Math.min(390, this.vy));
    this.y += this.vy * dt;
    if (this.y < 35) { this.y = 35; this.vy = Math.max(30, this.vy * -.25); }
    if (this.y > 505) { this.y = 505; this.vy = Math.min(-30, this.vy * -.25); }
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    this.crying = Math.max(0, this.crying - dt);
  }
  draw(ctx, camera, time) {
    if (this.invulnerable > 0 && Math.floor(this.invulnerable * 14) % 2 === 0) return;
    const x = this.x - camera;
    ctx.save();
    ctx.translate(x, this.y);
    ctx.rotate(Math.max(-.25, Math.min(.25, this.vy / 1100)));
    ctx.globalCompositeOperation = 'lighter';
    const aura = ctx.createRadialGradient(0, 0, 10, 0, 0, 47);
    aura.addColorStop(0, 'rgba(212,160,255,.38)'); aura.addColorStop(1, 'rgba(112,63,255,0)');
    ctx.fillStyle = aura; ctx.beginPath(); ctx.arc(0, 0, 47, 0, Math.PI * 2); ctx.fill();
    if (this.crying > 0) {
      ctx.strokeStyle = 'rgba(106,231,255,.9)'; ctx.lineWidth = 3; ctx.shadowColor = '#61eaff'; ctx.shadowBlur = 14;
      ctx.beginPath(); ctx.arc(0, 0, 34 + Math.sin(time * 24) * 3, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over';
    const body = ctx.createRadialGradient(-7, -9, 2, 0, 0, 28);
    body.addColorStop(0, '#f0d6ff'); body.addColorStop(.24, '#bc8be8'); body.addColorStop(.7, '#7044a8'); body.addColorStop(1, '#291557');
    ctx.fillStyle = body; ctx.shadowColor = '#a66bff'; ctx.shadowBlur = 16;
    ctx.beginPath(); ctx.arc(0, 0, this.radius, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(50,23,96,.5)';
    ctx.beginPath(); ctx.arc(-8, -8, 5, 0, Math.PI * 2); ctx.arc(10, 8, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#19102f';
    ctx.beginPath(); ctx.arc(-8, -2, 3, 0, Math.PI * 2); ctx.arc(9, -2, 3, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#38205f'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(0, 4, 8, .25, Math.PI - .25); ctx.stroke();
    const wing = 7 + this.flapPulse * 6 + Math.sin(time * 12) * 2;
    ctx.fillStyle = '#d5a9ff';
    ctx.beginPath(); ctx.ellipse(-25, 8, 9, wing, -.35, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(25, 8, 9, wing, .35, 0, Math.PI * 2); ctx.fill();
    if (this.crying > 0) {
      ctx.fillStyle = '#6eeaff'; ctx.shadowColor = '#6eeaff'; ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.ellipse(-8, 7, 3, 7, -.2, 0, Math.PI * 2); ctx.ellipse(9, 7, 3, 7, .2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
}