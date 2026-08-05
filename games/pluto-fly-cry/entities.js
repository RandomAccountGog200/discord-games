export function collidesCircle(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const radius = a.radius + b.radius;
  return dx * dx + dy * dy <= radius * radius;
}

export class Star {
  constructor(x, y, value = 1) { this.kind = 'star'; this.x = x; this.y = y; this.radius = 11; this.value = value; this.phase = Math.random() * 6; this.collected = false; }
  update(dt) { this.phase += dt * 4; }
  draw(ctx, camera, time) {
    const x = this.x - camera, pulse = 1 + Math.sin(this.phase + time * 2) * .1;
    ctx.save(); ctx.translate(x, this.y); ctx.rotate(time * .7 + this.phase); ctx.scale(pulse, pulse); ctx.globalCompositeOperation = 'lighter';
    ctx.shadowColor = '#ffe994'; ctx.shadowBlur = 16; ctx.fillStyle = '#fff4ae';
    ctx.beginPath();
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 5 : 13; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
    ctx.closePath(); ctx.fill(); ctx.restore();
  }
}

export class Crystal {
  constructor(x, y) { this.kind = 'crystal'; this.x = x; this.y = y; this.radius = 15; this.phase = Math.random() * 5; this.collected = false; }
  update(dt) { this.phase += dt * 3; }
  draw(ctx, camera) {
    ctx.save(); ctx.translate(this.x - camera, this.y); ctx.rotate(Math.sin(this.phase) * .12); ctx.globalCompositeOperation = 'lighter';
    ctx.shadowColor = '#64eaff'; ctx.shadowBlur = 22; ctx.fillStyle = '#b7f8ff'; ctx.strokeStyle = '#5adfff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(12, -3); ctx.lineTo(6, 15); ctx.lineTo(-8, 11); ctx.lineTo(-13, -5); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.moveTo(0, -13); ctx.lineTo(4, 4); ctx.lineTo(-4, 1); ctx.closePath(); ctx.fill(); ctx.restore();
  }
}

export class Comet {
  constructor(x, y, radius, phase = 0, strength = 1) { this.kind = 'comet'; this.x = x; this.y = y; this.baseY = y; this.radius = radius; this.phase = phase; this.strength = strength; this.age = 0; this.destroyed = false; this.rotation = Math.random() * 6; }
  update(dt) { this.age += dt; this.y = this.baseY + Math.sin(this.age * (1.2 + this.strength * .2) + this.phase) * (16 + this.strength * 8); this.rotation += dt * (1 + this.strength); }
  draw(ctx, camera) {
    const x = this.x - camera, y = this.y;
    ctx.save(); ctx.translate(x, y); ctx.rotate(this.rotation); ctx.globalCompositeOperation = 'lighter';
    const tail = ctx.createLinearGradient(-this.radius * 3, 0, 0, 0); tail.addColorStop(0, 'rgba(255,104,197,0)'); tail.addColorStop(1, 'rgba(255,117,213,.65)');
    ctx.fillStyle = tail; ctx.beginPath(); ctx.moveTo(-this.radius * 3, -7); ctx.lineTo(5, -this.radius * .55); ctx.lineTo(5, this.radius * .55); ctx.closePath(); ctx.fill();
    const rock = ctx.createRadialGradient(-this.radius*.3, -this.radius*.35, 2, 0, 0, this.radius); rock.addColorStop(0, '#ffc2e8'); rock.addColorStop(.3, '#da75be'); rock.addColorStop(1, '#592b83');
    ctx.fillStyle = rock; ctx.shadowColor = '#ff65bf'; ctx.shadowBlur = 17; ctx.beginPath(); ctx.arc(0, 0, this.radius, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(77,26,107,.55)'; ctx.beginPath(); ctx.arc(-7, -5, 5, 0, 6.28); ctx.arc(8, 7, 4, 0, 6.28); ctx.fill(); ctx.restore();
  }
}