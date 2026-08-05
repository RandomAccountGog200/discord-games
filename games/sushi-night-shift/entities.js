import { CUSTOMER_COLORS, CUSTOMER_Y, SUSHI_TYPES, CUSTOMER_SLOTS } from './config.js';

export class Customer {
  constructor(config) {
    this.x = -60;
    this.y = CUSTOMER_Y;
    this.targetX = config.slot;
    this.slot = config.slot;
    this.isGhost = config.isGhost;
    this.order = config.order;
    this.state = 'entering';
    this.patience = config.patience;
    this.maxPatience = config.patience;
    this.color = CUSTOMER_COLORS[Math.floor(Math.random() * CUSTOMER_COLORS.length)];
    this.bodyColor = this.isGhost ? this.blendColor(this.color, '#8e44ad', 0.5) : this.color;
    this.enterVel = 120;
    this.leaving = false;
    this.leaveDir = 1;
    this.time = 0;
    this.floatingSeed = Math.random() * 100;
    this.wrongServes = 0;
    this.beingServedCooldown = 0;
  }

  blendColor(hex1, hex2, ratio) {
    const c1 = parseInt(hex1.slice(1), 16);
    const c2 = parseInt(hex2.slice(1), 16);
    const r = Math.round(((c1 >> 16) & 0xff) * (1 - ratio) + ((c2 >> 16) & 0xff) * ratio);
    const g = Math.round(((c1 >> 8) & 0xff) * (1 - ratio) + ((c2 >> 8) & 0xff) * ratio);
    const b = Math.round((c1 & 0xff) * (1 - ratio) + (c2 & 0xff) * ratio);
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  }

  update(dt) {
    this.time += dt;
    if (this.beingServedCooldown > 0) this.beingServedCooldown -= dt;

    if (this.state === 'entering') {
      this.x += this.enterVel * dt;
      if (this.x >= this.targetX) {
        this.x = this.targetX;
        this.state = 'waiting';
      }
    } else if (this.state === 'leaving') {
      this.x += this.leaveDir * 140 * dt;
      if (this.x < -80 || this.x > CANVAS_WIDTH + 80) {
        this.state = 'gone';
      }
    } else if (this.state === 'waiting') {
      this.patience -= dt;
      if (this.patience <= 0) {
        this.state = 'leaving';
        this.leaveDir = -1;
        this.patience = 0;
      }
    }
  }

  getPatienceRatio() {
    return Math.max(0, this.patience / this.maxPatience);
  }

  serve(sushi, isCorrect) {
    if (isCorrect) {
      this.state = 'leaving';
      this.leaveDir = 1;
      this.patience = this.maxPatience;
      this.wrongServes = 0;
    } else {
      this.wrongServes++;
      this.patience = Math.min(this.patience, this.maxPatience * 0.4);
      this.beingServedCooldown = 0.3;
      if (this.wrongServes >= 2) {
        this.state = 'leaving';
        this.leaveDir = -1;
      }
    }
  }

  isGone() {
    return this.state === 'gone';
  }

  isActive() {
    return this.state === 'waiting' || this.state === 'entering';
  }

  render(ctx, isNight) {
    if (this.state === 'gone') return;
    const bob = this.isGhost ? Math.sin(this.time * 3 + this.floatingSeed) * 5 : Math.sin(this.time * 2 + this.floatingSeed) * 2;
    const y = this.y + bob - (this.state === 'leaving' ? 0 : 0);

    ctx.save();

    if (this.isGhost) {
      ctx.globalAlpha = 0.82;
      ctx.shadowColor = '#8e44ad';
      ctx.shadowBlur = 18;
    }

    // Shadow
    ctx.shadowBlur = 0;
    ctx.globalAlpha = this.isGhost ? 0.3 : 0.2;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(this.x, CUSTOMER_Y + 70, 28, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = this.isGhost ? 0.82 : 1;

    if (this.isGhost) {
      ctx.shadowColor = '#8e44ad';
      ctx.shadowBlur = 18;
    }

    // Body
    ctx.fillStyle = this.bodyColor;
    ctx.beginPath();
    ctx.roundRect(this.x - 20, y + 15, 40, 55, 10);
    ctx.fill();

    // Apron/chef uniform
    ctx.fillStyle = this.isGhost ? '#2d2d4a' : '#f5f0e8';
    ctx.beginPath();
    ctx.roundRect(this.x - 12, y + 22, 24, 48, 6);
    ctx.fill();

    // Head
    ctx.fillStyle = this.isGhost ? this.blendColor('#d4a574', '#8e44ad', 0.3) : '#d4a574';
    ctx.beginPath();
    ctx.arc(this.x, y + 5, 18, 0, Math.PI * 2);
    ctx.fill();

    // Hair / hat
    if (this.isGhost) {
      ctx.fillStyle = '#2d2d4a';
      ctx.beginPath();
      ctx.arc(this.x, y, 18, Math.PI, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#382217';
      ctx.beginPath();
      ctx.arc(this.x, y, 18, Math.PI, Math.PI * 2);
      ctx.fill();
    }

    // Eyes
    ctx.fillStyle = this.isGhost ? '#a0e0ff' : '#222';
    ctx.shadowBlur = this.isGhost ? 8 : 0;
    ctx.shadowColor = '#a0e0ff';
    ctx.beginPath();
    ctx.ellipse(this.x - 7, y + 4, 4, this.isGhost ? 5 : 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(this.x + 7, y + 4, 4, this.isGhost ? 5 : 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Pupils for normal, glowing for ghost
    if (!this.isGhost) {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(this.x - 7, y + 3, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(this.x + 7, y + 3, 1.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#c8f0ff';
      ctx.beginPath();
      ctx.arc(this.x - 7, y + 5, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(this.x + 7, y + 5, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Mouth
    ctx.strokeStyle = this.isGhost ? '#8e44ad' : '#222';
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (this.patience < this.maxPatience * 0.3 && this.state === 'waiting') {
      // Frowning
      ctx.arc(this.x, y + 16, 6, Math.PI, Math.PI * 1.5);
    } else {
      ctx.arc(this.x, y + 14, 6, 0.1, Math.PI - 0.1);
    }
    ctx.stroke();

    // Order bubble
    this.renderOrderBar(ctx, y);

    if (this.isGhost) {
      ctx.globalAlpha = 0.82;
    }

    ctx.restore();
  }

  renderOrderBar(ctx, y) {
    if (this.state !== 'waiting') return;
    const bx = this.x;
    const by = y - 50;

    // Bubble
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.roundRect(bx - 30, by - 18, 60, 36, 12);
    ctx.fill();
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Sushi icon
    const sushi = this.order;
    if (sushi) {
      ctx.save();
      ctx.shadowColor = sushi.isCursed ? '#8e44ad' : 'transparent';
      ctx.shadowBlur = sushi.isCursed ? 8 : 0;
      drawSushiIcon(ctx, bx, by + 2, sushi, 14);
      ctx.restore();
    }

    // Patience bar
    const barW = 50;
    const barH = 5;
    const pct = this.getPatienceRatio();
    ctx.fillStyle = '#e0e0e0';
    ctx.fillRect(bx - barW / 2, by + 22, barW, barH);
    ctx.fillStyle = pct > 0.5 ? '#4dc76a' : pct > 0.25 ? '#f2d63c' : '#e74c3c';
    ctx.fillRect(bx - barW / 2, by + 22, barW * pct, barH);
  }

  getBBox() {
    return { x: this.x - 30, y: this.y - 60, w: 60, h: 135 };
  }
}

const CANVAS_WIDTH = 960;

function drawSushiIcon(ctx, x, y, sushi, r) {
  ctx.fillStyle = sushi.isCursed ? '#1a1a2e' : '#2d3a2d';
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();

  const type = SUSHI_TYPES[sushi.type];
  if (!type) return;
  const fillColor = sushi.isCursed ? type.cursedColor : type.color;
  ctx.fillStyle = fillColor;
  ctx.beginPath();
  ctx.ellipse(x, y, r * 0.45, r * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();

  if (sushi.isCursed) {
    ctx.fillStyle = '#8e44ad';
    ctx.beginPath();
    ctx.arc(x - r * 0.3, y - r * 0.1, r * 0.15, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function makeSushi(type, isCursed) {
  return { type, isCursed };
}