import { W, SUSHI } from './levels.js';
import { roundRect, drawSushiIcon } from './ui.js';

export class Customer {
  constructor(seat, type, patience) {
    this.seat = seat;
    this.x = seat.x;
    this.y = seat.y;
    this.type = type;
    this.maxP = patience;
    this.p = patience;
    this.state = 'waiting'; // waiting | happy | angry
    this.t = 0;
    this.bob = Math.random() * 6;
    this.hue = Math.floor(Math.random() * 360);
    this.wrongFlash = 0;
  }

  update(dt, game) {
    this.bob += dt * 3;
    if (this.wrongFlash > 0) this.wrongFlash -= dt;
    if (this.state === 'waiting') {
      this.p -= dt;
      if (this.p <= 0) {
        this.p = 0;
        this.state = 'angry';
        this.t = 0;
        game.onAngry(this);
      }
    } else {
      this.t += dt;
    }
  }

  draw(ctx) {
    const done = this.state !== 'waiting';
    const k = done ? Math.min(1, this.t / 0.8) : 0;
    const yOff = Math.sin(this.bob) * 2 + (done ? k * 90 : 0);
    const alpha = done ? 1 - k : 1;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(this.x, this.y + yOff);

    // body
    ctx.fillStyle = `hsl(${this.hue}, 45%, ${this.state === 'angry' ? 30 : 45}%)`;
    roundRect(ctx, -26, -6, 52, 46, 14);
    ctx.fill();
    // head
    ctx.fillStyle = '#ffd9b3';
    ctx.beginPath(); ctx.arc(0, -22, 18, 0, Math.PI * 2); ctx.fill();
    // hair
    ctx.fillStyle = '#2c2233';
    ctx.beginPath(); ctx.arc(0, -28, 18, Math.PI, 0); ctx.fill();
    // eyes
    ctx.fillStyle = '#222';
    if (this.state === 'happy') {
      ctx.strokeStyle = '#222'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(-6, -24, 3, Math.PI, 0); ctx.stroke();
      ctx.beginPath(); ctx.arc(6, -24, 3, Math.PI, 0); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.arc(-6, -24, 2.4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(6, -24, 2.4, 0, Math.PI * 2); ctx.fill();
    }
    // mouth
    ctx.strokeStyle = '#222'; ctx.lineWidth = 2;
    ctx.beginPath();
    if (this.state === 'happy') ctx.arc(0, -18, 5, 0, Math.PI);
    else if (this.state === 'angry' || this.p < this.maxP * 0.3) ctx.arc(0, -12, 5, Math.PI, 0);
    else { ctx.moveTo(-4, -15); ctx.lineTo(4, -15); }
    ctx.stroke();

    if (this.state === 'waiting') {
      // order bubble
      const bx = 0, by = -72;
      ctx.fillStyle = this.wrongFlash > 0 ? '#ff6b6b' : 'rgba(255,255,255,0.95)';
      ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 8;
      roundRect(ctx, bx - 26, by - 20, 52, 38, 10);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.beginPath(); ctx.moveTo(bx - 6, by + 17); ctx.lineTo(bx + 6, by + 17); ctx.lineTo(bx, by + 28); ctx.closePath(); ctx.fill();
      drawSushiIcon(ctx, this.type, bx, by, 0.95);
      // patience bar
      const pk = this.p / this.maxP;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      roundRect(ctx, -26, by + 22, 52, 6, 3); ctx.fill();
      ctx.fillStyle = pk > 0.5 ? '#6fe388' : pk > 0.25 ? '#ffc44d' : '#ff5a5a';
      roundRect(ctx, -26, by + 22, 52 * pk, 6, 3); ctx.fill();
      if (pk < 0.3) {
        ctx.fillStyle = '#ff5a5a';
        ctx.font = 'bold 16px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('!', 32, -28);
      }
    }
    ctx.restore();
  }
}

export class Plate {
  constructor(type, x, y) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.contam = false;
    this.picked = false;
    this.fly = null;
    this.pop = 0;
    this.wiggle = Math.random() * 6;
  }

  update(dt, game) {
    this.wiggle += dt * 4;
    if (this.pop > 0) this.pop -= dt;
    if (this.picked) {
      this.x += (game.pointer.x - this.x) * Math.min(1, dt * 18);
      this.y += (game.pointer.y - 30 - this.y) * Math.min(1, dt * 18);
    } else if (this.fly) {
      const f = this.fly;
      f.t += dt;
      const k = Math.min(1, f.t / f.dur);
      const e = 1 - Math.pow(1 - k, 3);
      this.x = f.fx + (f.tx - this.x) * 0 + (f.tx - f.fx) * e;
      this.y = f.fy + (f.ty - f.fy) * e - Math.sin(k * Math.PI) * 60;
      if (k >= 1) game.onServed(this, f.target);
    } else {
      this.x += game.cfg.beltSpeed * dt;
    }
  }

  contains(px, py) {
    return Math.abs(px - this.x) < 30 && Math.abs(py - this.y) < 22;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    const s = this.pop > 0 ? 1 + this.pop * 1.4 : 1;
    ctx.scale(s, s);
    // plate
    ctx.fillStyle = '#e8ecf5';
    ctx.beginPath(); ctx.ellipse(0, 4, 26, 11, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#9aa5c0'; ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#cdd6ea';
    ctx.beginPath(); ctx.ellipse(0, 3, 17, 7, 0, 0, Math.PI * 2); ctx.fill();
    drawSushiIcon(ctx, this.type, 0, -4, 1.05);
    if (this.contam) {
      // roach
      const wx = Math.sin(this.wiggle) * 6;
      ctx.fillStyle = '#5a3a1a';
      ctx.beginPath(); ctx.ellipse(wx, -14, 7, 4.5, Math.sin(this.wiggle * 2) * 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#3a2510'; ctx.lineWidth = 1.5;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(wx + i * 4, -13);
        ctx.lineTo(wx + i * 6 + Math.sin(this.wiggle * 6 + i) * 3, -7);
        ctx.stroke();
      }
      ctx.strokeStyle = '#5a3a1a';
      ctx.beginPath(); ctx.moveTo(wx + 5, -17); ctx.lineTo(wx + 10, -22); ctx.stroke();
      // stink
      ctx.fillStyle = 'rgba(120,200,80,0.5)';
      ctx.font = '10px system-ui';
      ctx.fillText('~', wx - 2, -26 - (this.wiggle % 1) * 4);
    }
    ctx.restore();
  }
}

export class Rat {
  constructor(y, dir, speed) {
    this.x = dir > 0 ? -40 : W + 40;
    this.y = y;
    this.dir = dir;
    this.speed = speed;
    this.state = 'hunt';
    this.target = null;
    this.carryType = -1;
    this.step = Math.random() * 6;
  }

  update(dt, game) {
    this.step += dt * 10;
    if (this.state === 'hunt') {
      if (!this.target || this.target.picked || this.target.fly || !game.plates.includes(this.target)) {
        this.target = null;
        let best = Infinity;
        for (const p of game.plates) {
          if (p.picked || p.fly) continue;
          const d = Math.abs(p.x - this.x);
          if (d < best) { best = d; this.target = p; }
        }
      }
      if (this.target) {
        const dx = this.target.x - this.x;
        this.dir = dx >= 0 ? 1 : -1;
        this.x += this.dir * this.speed * dt;
        if (Math.abs(dx) < 16) {
          this.carryType = this.target.type;
          game.removePlate(this.target, true);
          this.state = 'flee';
          this.dir = this.x < W / 2 ? -1 : 1;
        }
      } else {
        this.x += this.dir * this.speed * 0.6 * dt;
        if (this.x < -50 || this.x > W + 50) game.removeRat(this);
      }
    } else {
      this.x += this.dir * this.speed * 1.5 * dt;
      if (this.x < -60 || this.x > W + 60) game.removeRat(this);
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(this.dir, 1);
    const hop = Math.abs(Math.sin(this.step)) * 3;
    ctx.translate(0, -hop);
    // tail
    ctx.strokeStyle = '#d48a8a'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-14, 4); ctx.quadraticCurveTo(-26, 8 + Math.sin(this.step) * 4, -34, 2); ctx.stroke();
    // body
    ctx.fillStyle = '#8a8f9e';
    ctx.beginPath(); ctx.ellipse(0, 0, 16, 10, 0, 0, Math.PI * 2); ctx.fill();
    // head
    ctx.beginPath(); ctx.ellipse(13, -4, 8, 6.5, 0, 0, Math.PI * 2); ctx.fill();
    // ear
    ctx.fillStyle = '#d48a8a';
    ctx.beginPath(); ctx.arc(9, -11, 4, 0, Math.PI * 2); ctx.fill();
    // eye
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.arc(16, -6, 1.8, 0, Math.PI * 2); ctx.fill();
    // nose
    ctx.fillStyle = '#ff7a9a';
    ctx.beginPath(); ctx.arc(21, -3, 1.8, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    if (this.carryType >= 0) {
      ctx.save();
      ctx.translate(this.x, this.y - 22 - hop);
      drawSushiIcon(ctx, this.carryType, 0, 0, 0.85);
      ctx.restore();
    }
  }
}

export class Fire {
  constructor(x, y, hp) {
    this.x = x;
    this.y = y;
    this.hp = hp;
    this.maxHp = hp;
    this.t = 0;
    this.grace = 5;
  }

  update(dt, game) {
    this.t += dt;
    if (this.t > this.grace) game.drainRep(1.6 * dt);
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    const grow = Math.min(1, this.t / 2);
    const big = this.t > this.grace ? 1.25 : 1;
    ctx.shadowColor = '#ff7a00';
    ctx.shadowBlur = 26;
    for (let i = 0; i < 5; i++) {
      const fx = (i - 2) * 11;
      const h = (26 + Math.sin(this.t * 11 + i * 1.7) * 9 + (i % 2) * 10) * grow * big;
      const grad = ctx.createLinearGradient(0, 10, 0, -h);
      grad.addColorStop(0, 'rgba(255,80,0,0.95)');
      grad.addColorStop(0.6, 'rgba(255,170,0,0.9)');
      grad.addColorStop(1, 'rgba(255,240,120,0.85)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(fx - 8, 10);
      ctx.quadraticCurveTo(fx - 6, -h * 0.4, fx + Math.sin(this.t * 7 + i) * 4, -h);
      ctx.quadraticCurveTo(fx + 6, -h * 0.4, fx + 8, 10);
      ctx.closePath();
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    // hp pips
    if (this.hp > 1 || this.maxHp > 1) {
      for (let i = 0; i < this.maxHp; i++) {
        ctx.fillStyle = i < this.hp ? '#ff5a5a' : 'rgba(255,255,255,0.25)';
        ctx.beginPath(); ctx.arc((i - (this.maxHp - 1) / 2) * 12, -52, 4, 0, Math.PI * 2); ctx.fill();
      }
    }
    ctx.restore();
  }
}