function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function circleHit(ax, ay, ar, bx, by, br) { const dx = ax - bx, dy = ay - by; return dx * dx + dy * dy <= (ar + br) * (ar + br); }
function rectHit(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }

export class World {
  constructor(level, width, height, seed = 12345) {
    this.level = level; this.width = width; this.height = height; this.seed = seed >>> 0;
    this.distance = 0; this.length = 3900 + level * 430; this.baseSpeed = 178 + level * 19;
    this.gates = []; this.obstacles = []; this.pickups = []; this.clouds = [];
    this.generate();
  }
  random() { this.seed = (1664525 * this.seed + 1013904223) >>> 0; return this.seed / 4294967296; }
  generate() {
    const top = 75, bottom = this.height - 80;
    for (let i = 0, x = 420; x < this.length - 250; i++, x += 315 + this.random() * 130) {
      const y = top + this.random() * Math.max(80, bottom - top);
      this.gates.push({ x, y, radius: 45, passed: false, scored: false, spin: this.random() * 6 });
      if (i % 2 === 0 || this.random() < .6) {
        const ox = x + 100 + this.random() * 95;
        const w = 35 + this.random() * 42;
        const h = 54 + this.random() * (35 + levelSafe(this.level) * 8);
        const topObstacle = this.random() < .5;
        const oy = topObstacle ? 48 : this.height - 48 - h;
        this.obstacles.push({ x: ox, y: clamp(oy, 40, this.height - h - 44), w, h, hit: false, kind: topObstacle ? 'tower' : 'buoy' });
      }
      if (this.level >= 2 && this.random() < .5) {
        this.obstacles.push({ x: x + 190 + this.random() * 55, y: top + 20 + this.random() * (bottom - top - 40), r: 17, hit: false, kind: 'bird', phase: this.random() * 8 });
      }
      if (i % 2 === 1 || this.random() < .4) this.pickups.push({ x: x + 120 + this.random() * 80, y: top + this.random() * (bottom - top), r: 11, taken: false, type: this.random() < .24 ? 'fuel' : 'coin' });
    }
    for (let i = 0; i < 18; i++) this.clouds.push({ x: this.random() * this.length * 1.2, y: 35 + this.random() * (this.height * .5), s: .5 + this.random() * 1.2, depth: .1 + this.random() * .3 });
  }
  update(dt, plane, input, particles) {
    const speed = this.baseSpeed * plane.stats.engine * (plane.boosting ? 1.27 : 1);
    this.distance += speed * dt;
    const events = { gate: 0, pickup: null, damage: null, complete: false };
    const px = plane.x;
    for (const gate of this.gates) {
      const sx = gate.x - this.distance + px;
      if (!gate.scored && circleHit(px, plane.y, 17 + plane.stats.magnet, sx, gate.y, gate.radius)) {
        gate.scored = true; gate.passed = true; events.gate = 1;
        particles.burst(sx, gate.y, '#5beaff', 24, 145);
      } else if (!gate.passed && sx < px - 58) gate.passed = true;
    }
    const bounds = plane.bounds();
    for (const item of this.pickups) {
      const sx = item.x - this.distance + px;
      if (!item.taken && circleHit(px, plane.y, 18 + plane.stats.magnet, sx, item.y, item.r)) {
        item.taken = true; events.pickup = item;
        particles.burst(sx, item.y, item.type === 'fuel' ? '#ffb95e' : '#f8f28a', 14, 90);
      }
    }
    for (const obstacle of this.obstacles) {
      const sx = obstacle.x - this.distance + px;
      if (obstacle.hit || sx < -100 || sx > this.width + 100) continue;
      let hit = false;
      if (obstacle.kind === 'bird') {
        const by = obstacle.y + Math.sin(this.distance * .018 + obstacle.phase) * 18;
        hit = circleHit(px, plane.y, 15, sx, by, obstacle.r);
      } else hit = rectHit(bounds, { x: sx, y: obstacle.y, w: obstacle.w, h: obstacle.h });
      if (hit) { obstacle.hit = true; events.damage = { x: sx, y: obstacle.y + (obstacle.h || 0) / 2 }; particles.burst(px, plane.y, '#ff7180', 20, 130); }
    }
    if (this.distance >= this.length) events.complete = true;
    return { events, speed };
  }
  drawBackground(ctx, w, h) {
    const sky = ctx.createLinearGradient(0, 0, 0, h); sky.addColorStop(0, '#071a39'); sky.addColorStop(.5, '#125777'); sky.addColorStop(1, '#f3a46f');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);
    const glow = ctx.createRadialGradient(w * .72, h * .33, 4, w * .72, h * .33, h * .52); glow.addColorStop(0, 'rgba(255,219,142,.55)'); glow.addColorStop(1, 'rgba(255,170,100,0)'); ctx.fillStyle = glow; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(231,249,255,.72)';
    for (let i = 0; i < 20; i++) { const x = (i * 149 + this.distance * .015) % (w + 40) - 20; const y = 25 + (i * 71) % Math.max(50, h * .35); ctx.globalAlpha = .18 + (i % 3) * .1; ctx.fillRect(x, y, 2, 2); }
    ctx.globalAlpha = 1;
    this.drawMountainRange(ctx, w, h, h * .73, '#153b57', .018);
    this.drawMountainRange(ctx, w, h, h * .82, '#0c2b43', .035);
    for (const c of this.clouds) {
      const x = c.x - this.distance * c.depth + w * .25;
      const sx = ((x % (w + 260)) + w + 260) % (w + 260) - 130;
      ctx.fillStyle = `rgba(223,246,248,${.08 + c.s * .035})`; ctx.beginPath(); ctx.ellipse(sx, c.y, 70 * c.s, 15 * c.s, 0, 0, Math.PI * 2); ctx.ellipse(sx + 28 * c.s, c.y - 8 * c.s, 38 * c.s, 21 * c.s, 0, 0, Math.PI * 2); ctx.ellipse(sx - 24 * c.s, c.y - 5 * c.s, 28 * c.s, 16 * c.s, 0, 0, Math.PI * 2); ctx.fill();
    }
  }
  drawMountainRange(ctx, w, h, base, color, motion) {
    ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, h);
    for (let x = -40; x <= w + 80; x += 80) { const peak = base - 30 - ((x * .73 + this.distance * motion) % 130 + 130) % 130; ctx.lineTo(x, peak); ctx.lineTo(x + 58, base); }
    ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
  }
  draw(ctx, planeX, w, h) {
    const horizon = h - 43;
    ctx.save();
    ctx.fillStyle = 'rgba(4,22,36,.72)'; ctx.fillRect(0, horizon, w, h - horizon);
    ctx.fillStyle = 'rgba(93,210,216,.42)'; ctx.fillRect(0, horizon, w, 2);
    ctx.strokeStyle = 'rgba(113,226,228,.16)'; ctx.lineWidth = 1;
    const dash = (this.distance * 1.2) % 80;
    for (let x = -80 + dash; x < w; x += 80) { ctx.beginPath(); ctx.moveTo(x, horizon + 21); ctx.lineTo(x + 38, horizon + 21); ctx.stroke(); }
    for (const gate of this.gates) {
      const sx = gate.x - this.distance + planeX;
      if (sx < -90 || sx > w + 90) continue;
      ctx.save(); ctx.translate(sx, gate.y); ctx.rotate(this.distance * .001 + gate.spin);
      ctx.shadowColor = '#56eaff'; ctx.shadowBlur = 20; ctx.strokeStyle = gate.scored ? 'rgba(124,255,236,.25)' : '#6ceeff'; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(0, 0, gate.radius, 0, Math.PI * 2); ctx.stroke();
      ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(222,255,255,.9)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, gate.radius + 7, -.7, .7); ctx.stroke(); ctx.restore();
    }
    for (const item of this.pickups) {
      if (item.taken) continue; const sx = item.x - this.distance + planeX; if (sx < -40 || sx > w + 40) continue;
      const color = item.type === 'fuel' ? '#ffb45c' : '#fff18a'; ctx.save(); ctx.translate(sx, item.y); ctx.rotate(this.distance * .003); ctx.shadowColor = color; ctx.shadowBlur = 16; ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(0, -item.r); ctx.lineTo(item.r, 0); ctx.lineTo(0, item.r); ctx.lineTo(-item.r, 0); ctx.closePath(); ctx.fill(); ctx.restore();
    }
    for (const o of this.obstacles) {
      const sx = o.x - this.distance + planeX; if (sx < -120 || sx > w + 120) continue;
      if (o.kind === 'bird') {
        const by = o.y + Math.sin(this.distance * .018 + o.phase) * 18; ctx.save(); ctx.translate(sx, by); ctx.strokeStyle = '#efc391'; ctx.lineWidth = 3; ctx.shadowColor = '#ff9f71'; ctx.shadowBlur = 8; ctx.beginPath(); ctx.moveTo(-17, 3); ctx.quadraticCurveTo(-8, -9, 0, 0); ctx.quadraticCurveTo(8, -9, 17, 3); ctx.stroke(); ctx.restore();
      } else {
        const grad = ctx.createLinearGradient(sx, o.y, sx + o.w, o.y + o.h); grad.addColorStop(0, '#d56e65'); grad.addColorStop(.5, '#783e50'); grad.addColorStop(1, '#241e3b'); ctx.fillStyle = grad; ctx.shadowColor = 'rgba(255,102,92,.4)'; ctx.shadowBlur = 12; ctx.fillRect(sx, o.y, o.w, o.h); ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(255,220,164,.55)'; ctx.setLineDash([7,6]); ctx.strokeRect(sx + 5, o.y + 5, o.w - 10, o.h - 10); ctx.setLineDash([]);
      }
    }
    ctx.restore();
  }
}
function levelSafe(level) { return Number(level) || 1; }