// The legendary Nose.
export class Player {
  constructor() {
    this.x = 0; this.y = 0;
    this.vx = 0; this.vy = 0;
    this.radius = 26;
    this.baseSpeed = 260;
    this.speedMult = 1;
    this.sniffRadius = 130;
    this.sniffMult = 1;
    this.maxSniff = 100;
    this.sniff = 100;
    this.sniffRegen = 26;
    this.maxHp = 100;
    this.hp = 100;
    this.sniffing = false;
    this.invuln = 0;
    this.wobble = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.magnet = 0; // passive pull level
  }
  reset(w, h) {
    this.x = w / 2; this.y = h / 2;
    this.vx = 0; this.vy = 0;
    this.hp = this.maxHp; this.sniff = this.maxSniff;
    this.invuln = 0; this.combo = 0; this.comboTimer = 0;
  }
  get sniffRange() { return this.sniffRadius * this.sniffMult; }
  update(dt, input, w, h, particles, sfx) {
    const spd = this.baseSpeed * this.speedMult;
    const accel = 1800;
    this.vx += (input.moveX * spd - this.vx) * Math.min(1, accel / spd * dt);
    this.vy += (input.moveY * spd - this.vy) * Math.min(1, accel / spd * dt);
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.x = Math.max(this.radius, Math.min(w - this.radius, this.x));
    this.y = Math.max(this.radius, Math.min(h - this.radius, this.y));

    this.wasSniffing = this.sniffing;
    this.sniffing = input.sniffHeld && this.sniff > 2;
    if (this.sniffing) {
      this.sniff = Math.max(0, this.sniff - 30 * dt);
      if (!this.wasSniffing) sfx.sniff();
    } else {
      this.sniff = Math.min(this.maxSniff, this.sniff + this.sniffRegen * dt);
    }
    this.invuln = Math.max(0, this.invuln - dt);
    this.wobble += dt * (this.sniffing ? 14 : 6);
    this.comboTimer -= dt;
    if (this.comboTimer <= 0) this.combo = 0;
  }
  hurt(dmg, particles, sfx) {
    if (this.invuln > 0) return false;
    this.hp -= dmg;
    this.invuln = 1.0;
    this.combo = 0;
    particles.burst(this.x, this.y, '#ff5c7a', 18);
    sfx.hurt();
    return true;
  }
  draw(ctx) {
    const r = this.radius;
    const wob = Math.sin(this.wobble) * (this.sniffing ? 3.5 : 1.5);
    ctx.save();
    ctx.translate(this.x, this.y);
    if (this.invuln > 0 && Math.floor(this.invuln * 12) % 2 === 0) ctx.globalAlpha = 0.45;

    // sniff cone visualization
    if (this.sniffing) {
      const grad = ctx.createRadialGradient(0, 0, r, 0, 0, this.sniffRange);
      grad.addColorStop(0, 'rgba(120,220,255,0.25)');
      grad.addColorStop(1, 'rgba(120,220,255,0)');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(0, 0, this.sniffRange, 0, Math.PI * 2); ctx.fill();
    }

    // nose body
    const g = ctx.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.2, 0, 0, r * 1.15);
    g.addColorStop(0, '#ffd9b0');
    g.addColorStop(0.6, '#e8a06a');
    g.addColorStop(1, '#b06a3e');
    ctx.fillStyle = g;
    ctx.shadowBlur = 20; ctx.shadowColor = 'rgba(255,170,100,.5)';
    ctx.beginPath();
    ctx.ellipse(0, wob * 0.3, r * 0.95, r * 1.05, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // nostrils
    ctx.fillStyle = '#5a2e18';
    const flare = this.sniffing ? 1.35 : 1;
    ctx.beginPath(); ctx.ellipse(-r * 0.36, r * 0.42 + wob * 0.3, r * 0.2 * flare, r * 0.14 * flare, -0.3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(r * 0.36, r * 0.42 + wob * 0.3, r * 0.2 * flare, r * 0.14 * flare, 0.3, 0, Math.PI * 2); ctx.fill();

    // shine
    ctx.fillStyle = 'rgba(255,255,255,.35)';
    ctx.beginPath(); ctx.ellipse(-r * 0.3, -r * 0.45, r * 0.22, r * 0.14, -0.5, 0, Math.PI * 2); ctx.fill();

    ctx.restore();
  }
}