const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const DONENESS = ['RARE', 'MEDIUM', 'WELL DONE'];
const COLORS = ['#cf6861', '#c88750', '#8b4937'];

export class Order {
  constructor(id, recipe, doneness, patience) {
    this.id = id; this.recipe = recipe; this.doneness = doneness; this.target = [48, 64, 82][doneness];
    this.patience = patience; this.maxPatience = patience; this.station = -1;
  }
  label() { return DONENESS[this.doneness]; }
}

export class Station {
  constructor(index) {
    this.index = index; this.order = null; this.progress = 0; this.heat = .62; this.targetHeat = .62;
    this.flipped = false; this.flipAt = 0; this.flash = 0;
  }
  get free() { return this.order === null; }
  setOrder(order) {
    this.order = order; order.station = this.index; this.progress = 0; this.heat = .58; this.targetHeat = .62;
    this.flipped = false; this.flipAt = 0; this.flash = .4;
  }
  changeHeat(amount) { this.targetHeat = clamp(this.targetHeat + amount, .08, .98); }
  flip() {
    if (!this.order || this.flipped) return { kind: 'blocked' };
    this.flipped = true; this.flipAt = this.progress;
    const timing = Math.abs(this.progress - 42);
    return { kind: 'flip', perfect: timing <= 7, timing };
  }
  serve(mods = {}) {
    if (!this.order || !this.flipped || this.progress < this.order.target - 10) return { kind: 'blocked' };
    const order = this.order;
    const distance = Math.abs(this.progress - order.target);
    let quality = clamp(1 - distance / 35, 0, 1);
    quality *= clamp(1 - Math.abs(this.flipAt - 42) / 45, .48, 1);
    if (this.progress > order.target + 20) quality *= .58;
    quality = clamp(quality + (mods.quality || 0), 0, 1);
    const grade = quality >= .86 ? 'PERFECT' : quality >= .66 ? 'GREAT' : quality >= .4 ? 'GOOD' : 'TOUGH';
    const points = Math.round((65 + quality * 95) * (mods.tip || 1));
    this.order = null;
    return { kind: 'served', order, quality, grade, points };
  }
  update(dt, mods = {}) {
    if (this.flash > 0) this.flash -= dt;
    if (!this.order) return null;
    this.order.patience -= dt;
    if (this.order.patience <= 0) {
      const failed = this.order; this.order = null; return { kind: 'fail', order: failed, reason: 'COLD STEAK' };
    }
    this.heat += (this.targetHeat - this.heat) * Math.min(1, dt * 3.2);
    const rate = (1.28 + this.heat * 3.2) * (mods.speed || 1) * (this.flipped ? 1.03 : 1);
    this.progress += rate * dt;
    if (this.progress >= 100) {
      const failed = this.order; this.order = null; return { kind: 'fail', order: failed, reason: 'BURNT STEAK' };
    }
    return null;
  }
  draw(ctx, x, y, w, h, selected) {
    const o = this.order;
    ctx.save();
    ctx.shadowColor = selected ? 'rgba(232,182,92,.55)' : 'rgba(0,0,0,.35)'; ctx.shadowBlur = selected ? 24 : 12;
    ctx.fillStyle = selected ? '#3e2526' : '#2c1b21'; ctx.strokeStyle = selected ? '#e8b65c' : '#65413a'; ctx.lineWidth = selected ? 3 : 1;
    ctx.beginPath(); ctx.roundRect(x, y, w, h, 10); ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
    ctx.fillStyle = '#92745a'; ctx.font = 'bold 12px Arial'; ctx.textAlign = 'left'; ctx.fillText(`GRILL ${this.index + 1}`, x + 18, y + 25);
    ctx.textAlign = 'right'; ctx.fillStyle = selected ? '#e8b65c' : '#887468'; ctx.fillText(selected ? 'ACTIVE' : 'SELECT', x + w - 18, y + 25);
    const gx = x + 18, gy = y + 45, gw = w - 36, gh = 172;
    const grill = ctx.createLinearGradient(gx, gy, gx, gy + gh); grill.addColorStop(0, '#17151a'); grill.addColorStop(1, '#342126');
    ctx.fillStyle = grill; ctx.beginPath(); ctx.roundRect(gx, gy, gw, gh, 7); ctx.fill();
    ctx.strokeStyle = '#5b3532'; ctx.lineWidth = 3;
    for (let i = 1; i < 8; i++) { const ly = gy + i * gh / 8; ctx.beginPath(); ctx.moveTo(gx + 9, ly); ctx.lineTo(gx + gw - 9, ly); ctx.stroke(); }
    if (o) {
      const steakX = gx + gw / 2, steakY = gy + gh / 2;
      const sgrad = ctx.createRadialGradient(steakX - 13, steakY - 13, 5, steakX, steakY, 65);
      sgrad.addColorStop(0, '#e29a65'); sgrad.addColorStop(.6, COLORS[o.doneness]); sgrad.addColorStop(1, '#542c2a');
      ctx.save(); ctx.translate(steakX, steakY); ctx.rotate(-.08); ctx.fillStyle = sgrad; ctx.shadowColor = '#f06b3e'; ctx.shadowBlur = this.heat * 15;
      ctx.beginPath(); ctx.ellipse(0, 0, 72, 40, 0, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#331c20'; ctx.lineWidth = 4; ctx.stroke();
      ctx.strokeStyle = 'rgba(255,220,150,.5)'; ctx.lineWidth = 3;
      for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * 20 - 20, -26); ctx.lineTo(i * 20 + 18, 26); ctx.stroke(); }
      ctx.restore();
      ctx.fillStyle = '#fff0c5'; ctx.font = 'bold 11px Arial'; ctx.textAlign = 'center'; ctx.fillText(this.flipped ? 'FLIPPED' : 'FLIP ME', steakX, gy + gh - 12);
    } else {
      ctx.fillStyle = '#71574c'; ctx.font = 'italic 16px Georgia'; ctx.textAlign = 'center'; ctx.fillText('waiting for a ticket…', gx + gw / 2, gy + gh / 2 + 5);
    }
    const barY = y + 237;
    ctx.textAlign = 'left'; ctx.fillStyle = '#9e8872'; ctx.font = 'bold 10px Arial'; ctx.fillText('DONENESS', x + 18, barY);
    if (o) {
      ctx.textAlign = 'right'; ctx.fillStyle = COLORS[o.doneness]; ctx.fillText(`${o.recipe.toUpperCase()} · ${o.label()}`, x + w - 18, barY);
      ctx.fillStyle = '#171318'; ctx.fillRect(x + 18, barY + 9, w - 36, 12);
      const targetX = x + 18 + (w - 36) * o.target / 100;
      ctx.fillStyle = COLORS[o.doneness]; ctx.fillRect(x + 18, barY + 9, (w - 36) * this.progress / 100, 12);
      ctx.strokeStyle = '#ffe0a0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(targetX, barY + 5); ctx.lineTo(targetX, barY + 25); ctx.stroke();
      ctx.fillStyle = '#cdb894'; ctx.font = '10px Arial'; ctx.textAlign = 'left'; ctx.fillText(`${Math.floor(this.progress)}%`, x + 18, barY + 37);
      ctx.textAlign = 'right'; ctx.fillStyle = this.order.patience < 8 ? '#ed6658' : '#cdb894'; ctx.fillText(`PATIENCE ${Math.ceil(this.order.patience)}s`, x + w - 18, barY + 37);
    }
    const heatY = y + 296; ctx.textAlign = 'left'; ctx.fillStyle = '#9e8872'; ctx.font = 'bold 10px Arial'; ctx.fillText('FLAME', x + 18, heatY);
    ctx.fillStyle = '#171318'; ctx.fillRect(x + 18, heatY + 9, w - 36, 10); ctx.fillStyle = '#e06b3d'; ctx.fillRect(x + 18, heatY + 9, (w - 36) * this.heat, 10);
    ctx.fillStyle = '#d2b982'; ctx.font = '10px Arial'; ctx.textAlign = 'right'; ctx.fillText(`${Math.round(this.targetHeat * 100)}% SET`, x + w - 18, heatY);
    const by = y + h - 45, bw = (w - 48) / 4;
    const labels = ['−', 'FLIP', '+', 'SERVE'];
    for (let i = 0; i < 4; i++) { ctx.fillStyle = i === 3 ? '#a96b36' : i === 1 ? '#70303a' : '#44262a'; ctx.beginPath(); ctx.roundRect(x + 12 + i * (bw + 8), by, bw, 29, 4); ctx.fill(); ctx.fillStyle = '#f4dca9'; ctx.font = `bold ${i === 1 || i === 3 ? 9 : 20}px Arial`; ctx.textAlign = 'center'; ctx.fillText(labels[i], x + 12 + i * (bw + 8) + bw / 2, by + (i === 1 || i === 3 ? 19 : 21)); }
    ctx.restore();
  }
}