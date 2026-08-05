export class Player {
  constructor() { this.reset(400, 500); }
  reset(x, y) {
    this.x = x; this.y = y; this.vx = 0; this.radius = 22; this.maxHp = 3; this.hp = 3;
    this.maxSpeed = 280; this.accel = 980; this.fireRate = .34; this.fireCooldown = 0; this.damage = 1;
    this.shotSpeed = 570; this.shield = 0; this.magnet = 0; this.boostEnergy = 100; this.invulnerable = 0;
  }
  update(dt, input, game) {
    this.y = game.height * .7;
    const axis = input.axis();
    if (axis) this.vx += axis * this.accel * dt; else this.vx *= Math.pow(.035, dt);
    const boosting = input.boost() && this.boostEnergy > 1;
    if (boosting) { this.boostEnergy = Math.max(0, this.boostEnergy - 35 * dt); this.vx += axis * 220 * dt; }
    else this.boostEnergy = Math.min(100, this.boostEnergy + 22 * dt);
    this.vx = Math.max(-this.maxSpeed * (boosting ? 1.28 : 1), Math.min(this.maxSpeed * (boosting ? 1.28 : 1), this.vx));
    this.x += this.vx * dt;
    this.x = Math.max(30, Math.min(game.width - 30, this.x));
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    this.fireCooldown -= dt;
    if (input.fire() && this.fireCooldown <= 0) {
      game.fire(this.x, this.y - 25, this.shotSpeed, this.damage);
      this.fireCooldown = this.fireRate;
      game.audio.shoot();
    }
    game.scrollSpeed = game.baseScroll * (boosting ? 1.3 : 1);
  }
  hurt(game) {
    if (this.invulnerable > 0) return false;
    if (this.shield > 0) { this.shield--; this.invulnerable = .7; game.particles.burst(this.x, this.y, '#82f6ff', 18, 130); game.audio.hit(); return false; }
    this.hp--; this.invulnerable = 1.25; game.hitFlash = .22; game.shake = 12;
    game.particles.burst(this.x, this.y, '#ff778c', 22, 150); game.audio.hit();
    return this.hp <= 0;
  }
  draw(ctx, time) {
    ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.vx * .0008);
    if (this.invulnerable > 0 && Math.floor(this.invulnerable * 14) % 2 === 0) ctx.globalAlpha = .45;
    ctx.shadowColor = '#ffbc73'; ctx.shadowBlur = 20;
    const cone = ctx.createLinearGradient(-15, 8, 15, 48); cone.addColorStop(0, '#ffd78a'); cone.addColorStop(1, '#bd6c57');
    ctx.fillStyle = cone; ctx.beginPath(); ctx.moveTo(-16, 8); ctx.lineTo(16, 8); ctx.lineTo(0, 48); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#ffe7a7aa'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-9,15);ctx.lineTo(8,35);ctx.moveTo(9,15);ctx.lineTo(-7,35);ctx.stroke();
    ctx.shadowColor = '#fff3c5'; ctx.shadowBlur = 18;
    const scoop = ctx.createRadialGradient(-7,-11,2,0,-7,25); scoop.addColorStop(0,'#fffbe1'); scoop.addColorStop(.55,'#ffb5c6'); scoop.addColorStop(1,'#bd6a9b');
    ctx.fillStyle = scoop; ctx.beginPath(); ctx.arc(0,-8,23,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#ffdc78'; [[-10,-14],[6,-18],[10,-4],[-2,2]].forEach(p=>{ctx.beginPath();ctx.arc(p[0],p[1],2.2,0,Math.PI*2);ctx.fill()});
    ctx.fillStyle='#103348';ctx.beginPath();ctx.arc(-7,-9,2.4,0,Math.PI*2);ctx.arc(7,-9,2.4,0,Math.PI*2);ctx.fill();
    if (this.shield > 0) { ctx.strokeStyle='#81f2ff99';ctx.lineWidth=2;ctx.shadowColor='#5df5ff';ctx.shadowBlur=18;ctx.beginPath();ctx.arc(0,3,34+Math.sin(time*5)*2,0,Math.PI*2);ctx.stroke(); }
    ctx.restore();
  }
}