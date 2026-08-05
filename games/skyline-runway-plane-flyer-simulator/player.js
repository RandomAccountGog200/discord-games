export class Plane {
  constructor(x, y) {
    this.x = x; this.y = y; this.vy = 0; this.angle = 0; this.invulnerable = 0;
    this.stats = { handling: 1, hull: 3, maxFuel: 100, fuel: 100, engine: 1, magnet: 0 };
    this.health = 3;
    this.boosting = false;
  }
  resetForLevel(height) {
    this.y = height * .5; this.vy = 0; this.invulnerable = 1.1;
    this.health = this.stats.hull; this.stats.fuel = this.stats.maxFuel;
  }
  update(dt, input, height, speed) {
    const direction = input.vertical(this.y);
    const acceleration = 440 * this.stats.handling;
    this.vy += direction * acceleration * dt;
    this.vy += 24 * dt;
    this.vy *= Math.pow(.035, dt);
    this.y += this.vy * dt;
    this.angle += (Math.max(-.55, Math.min(.55, this.vy / 430)) - this.angle) * Math.min(1, dt * 8);
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    this.boosting = input.boost() && this.stats.fuel > 0;
    this.stats.fuel -= (0.7 + speed / 310 * .34 + (this.boosting ? 3.8 : 0)) * dt;
    if (this.stats.fuel <= 0) { this.stats.fuel = 0; return { empty: true }; }
    return { empty: false };
  }
  damage(amount = 1) {
    if (this.invulnerable > 0) return false;
    this.health = Math.max(0, this.health - amount);
    this.invulnerable = 1.35;
    this.vy += (Math.random() - .5) * 180;
    return true;
  }
  applyUpgrade(id) {
    if (id === 'handling') this.stats.handling += .23;
    if (id === 'hull') { this.stats.hull += 1; this.health = this.stats.hull; }
    if (id === 'fuel') { this.stats.maxFuel += 28; this.stats.fuel = this.stats.maxFuel; }
    if (id === 'engine') this.stats.engine += .11;
    if (id === 'magnet') this.stats.magnet += 16;
  }
  bounds() { return { x: this.x - 21, y: this.y - 12, w: 42, h: 24 }; }
  draw(ctx, particles) {
    if (this.invulnerable > 0 && Math.floor(this.invulnerable * 14) % 2 === 0) return;
    ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.angle);
    ctx.shadowColor = this.boosting ? '#ffbd62' : '#50e8ff'; ctx.shadowBlur = this.boosting ? 22 : 14;
    if (this.boosting) {
      ctx.fillStyle = '#ff9b35'; ctx.beginPath(); ctx.moveTo(-23, -5); ctx.lineTo(-52 - Math.random() * 12, 0); ctx.lineTo(-23, 5); ctx.fill();
    }
    const body = ctx.createLinearGradient(-22, -12, 20, 10); body.addColorStop(0, '#eafcff'); body.addColorStop(.45, '#7bd9e7'); body.addColorStop(1, '#287b99');
    ctx.fillStyle = body; ctx.beginPath(); ctx.moveTo(-25, 1); ctx.lineTo(-8, -5); ctx.lineTo(14, -5); ctx.lineTo(25, 0); ctx.lineTo(13, 5); ctx.lineTo(-12, 6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#2d879e'; ctx.beginPath(); ctx.moveTo(-5, -3); ctx.lineTo(-15, -21); ctx.lineTo(4, -8); ctx.lineTo(16, -5); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#55b8ca'; ctx.beginPath(); ctx.moveTo(-2, 4); ctx.lineTo(-10, 17); ctx.lineTo(9, 6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#092b43'; ctx.beginPath(); ctx.ellipse(9, -5, 7, 3.5, -.12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#dffcff'; ctx.fillRect(-21, 0, 7, 2);
    ctx.restore();
  }
}