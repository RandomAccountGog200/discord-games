export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.r = 12;
    this.lives = 3;
    this.invincible = 0;
    this.angle = -Math.PI / 2;
  }

  update(dt, mx, my, bounds, overdrive) {
    const accel = overdrive ? 2400 : 1600;
    const drag = overdrive ? 5 : 8;

    if (mx !== 0 || my !== 0) {
      let len = Math.hypot(mx, my);
      if (len > 1) {
        mx /= len;
        my /= len;
      }
      this.vx += mx * accel * dt;
      this.vy += my * accel * dt;
    }

    const damp = Math.exp(-drag * dt);
    this.vx *= damp;
    this.vy *= damp;

    const maxSpeed = overdrive ? 420 : 300;
    const sp2 = this.vx * this.vx + this.vy * this.vy;
    const max2 = maxSpeed * maxSpeed;
    if (sp2 > max2) {
      const s = Math.sqrt(sp2);
      this.vx = (this.vx / s) * maxSpeed;
      this.vy = (this.vy / s) * maxSpeed;
    }

    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.x = Math.max(bounds.x + this.r, Math.min(bounds.x + bounds.w - this.r, this.x));
    this.y = Math.max(bounds.y + this.r, Math.min(bounds.y + bounds.h - this.r, this.y));

    if (this.invincible > 0) this.invincible -= dt;

    if (Math.hypot(this.vx, this.vy) > 40) {
      this.angle = Math.atan2(this.vy, this.vx);
    }
  }

  takeHit() {
    if (this.invincible > 0) return false;
    this.lives--;
    this.invincible = 2;
    return true;
  }

  draw(ctx, time) {
    if (this.invincible > 0 && Math.floor(time * 10) % 2 === 0) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle + Math.PI / 2);

    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 25;
    ctx.fillStyle = '#00f0ff';
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.lineTo(-9, 10);
    ctx.lineTo(-3, 6);
    ctx.lineTo(0, 11);
    ctx.lineTo(3, 6);
    ctx.lineTo(9, 10);
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#e0ffff';
    ctx.beginPath();
    ctx.moveTo(0, -9);
    ctx.lineTo(-4, 7);
    ctx.lineTo(0, 4);
    ctx.lineTo(4, 7);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }
}

export class Orb {
  constructor(x, y, value = 10, color = '#00f0ff', phase = Math.random() * Math.PI * 2) {
    this.x = x;
    this.y = y;
    this.value = value;
    this.color = color;
    this.phase = phase;
    this.r = 8;
  }

  draw(ctx, time) {
    const bob = Math.sin(time * 2.5 + this.phase) * 3;
    const pulse = 1 + Math.sin(time * 4 + this.phase) * 0.12;
    const r = this.r * pulse;

    ctx.save();
    ctx.translate(this.x, this.y + bob);

    ctx.shadowColor = this.color;
    ctx.shadowBlur = 18;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.arc(-r * 0.2, -r * 0.2, r * 0.35, 0, Math.PI * 2);
    ctx.fill();

    ctx.rotate(time * 2 + this.phase);
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 2;
    ctx.strokeRect(-r * 0.8, -r * 0.8, r * 1.6, r * 1.6);

    ctx.restore();
  }
}

export class SpinnerBeam {
  constructor(x, y, length = 200, speed = 0.6, angle = Math.random() * Math.PI * 2, thickness = 3) {
    this.x = x;
    this.y = y;
    this.length = length;
    this.speed = speed;
    this.angle = angle;
    this.thickness = thickness;
  }

  update(dt) {
    this.angle += this.speed * dt;
  }

  intersects(px, py, r) {
    const dx = Math.cos(this.angle);
    const dy = Math.sin(this.angle);
    const ex = this.x + dx * this.length;
    const ey = this.y + dy * this.length;
    const vx = ex - this.x;
    const vy = ey - this.y;
    const lenSq = vx * vx + vy * vy;
    if (lenSq === 0) return false;

    const t = Math.max(0, Math.min(1, ((px - this.x) * vx + (py - this.y) * vy) / lenSq));
    const cx = this.x + t * vx;
    const cy = this.y + t * vy;
    const d2 = (px - cx) ** 2 + (py - cy) ** 2;
    const rr = r + this.thickness;
    return d2 <= rr * rr;
  }

  draw(ctx) {
    const dx = Math.cos(this.angle);
    const dy = Math.sin(this.angle);
    const ex = this.x + dx * this.length;
    const ey = this.y + dy * this.length;

    ctx.save();
    const grad = ctx.createLinearGradient(this.x, this.y, ex, ey);
    grad.addColorStop(0, 'rgba(255,50,136,0.9)');
    grad.addColorStop(1, 'rgba(255,100,50,0.4)');

    ctx.shadowColor = '#ff2e88';
    ctx.shadowBlur = 20;
    ctx.strokeStyle = grad;
    ctx.lineWidth = this.thickness * 2;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(ex, ey);
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(ex, ey);
    ctx.stroke();

    ctx.shadowColor = '#ff2e88';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#ff5090';
    ctx.beginPath();
    ctx.arc(this.x, this.y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

export class Drone {
  constructor(x, y, bulletSpeed = 150, fireRate = 1.5, phase = Math.random() * Math.PI * 2) {
    this.x = x;
    this.y = y;
    this.r = 14;
    this.bulletSpeed = bulletSpeed;
    this.fireRate = fireRate;
    this.fireTimer = Math.random() * fireRate * 0.6;
    this.phase = phase;
    this.angle = Math.random() * Math.PI * 2;
    this.time = 0;
  }

  update(dt, player) {
    this.time += dt;
    this.x += Math.sin(this.time * 0.6 + this.phase) * 8 * dt;
    this.y += Math.cos(this.time * 0.5 + this.phase) * 8 * dt;

    const target = Math.atan2(player.y - this.y, player.x - this.x);
    this.angle += (target - this.angle) * 3 * dt;

    this.fireTimer -= dt;
    if (this.fireTimer <= 0) {
      this.fireTimer = this.fireRate * (0.8 + Math.random() * 0.4);
      return true;
    }
    return false;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    ctx.shadowColor = '#ff6a00';
    ctx.shadowBlur = 20;
    ctx.strokeStyle = '#ff6a00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, this.r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.rotate(this.angle);
    ctx.fillStyle = '#ff6a00';
    ctx.beginPath();
    ctx.moveTo(this.r + 4, 0);
    ctx.lineTo(-this.r, -8);
    ctx.lineTo(-this.r, 8);
    ctx.closePath();
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#330a00';
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export class Bullet {
  constructor(x, y, angle, speed) {
    this.x = x;
    this.y = y;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.r = 5;
    this.life = 6;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
  }

  draw(ctx) {
    ctx.save();
    const speed = Math.hypot(this.vx, this.vy) || 1;
    const nx = this.vx / speed;
    const ny = this.vy / speed;
    const len = 14;

    ctx.shadowColor = '#ff2e88';
    ctx.shadowBlur = 12;
    ctx.strokeStyle = '#ff2e88';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - nx * len, this.y - ny * len);
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}