// Entities: spice motes (collect), pollen (sneeze hazards), debris (damage), wind gusts.
export const TYPES = {
  CUMIN:   { color: '#ffd76a', score: 10, r: 7 },
  SAFFRON: { color: '#ff9a3b', score: 25, r: 8 },
  CARDAMOM:{ color: '#8ef0a0', score: 50, r: 9 },
  POLLEN:  { color: '#d97bff', r: 10 },
  DEBRIS:  { color: '#a08870', r: 12 },
  HEART:   { color: '#ff6a8a', r: 9 },
};

let idCounter = 0;

export function spawnMote(w, h, wave) {
  const roll = Math.random();
  let type = 'CUMIN';
  if (roll > 0.93 && wave >= 3) type = 'CARDAMOM';
  else if (roll > 0.75) type = 'SAFFRON';
  return {
    id: idCounter++, kind: 'mote', type,
    x: Math.random() * w, y: Math.random() * h,
    vx: (Math.random() - 0.5) * 30, vy: (Math.random() - 0.5) * 30,
    r: TYPES[type].r, phase: Math.random() * Math.PI * 2,
    life: 14 + Math.random() * 8,
  };
}

export function spawnHazard(w, h, wave) {
  const edge = Math.floor(Math.random() * 4);
  let x, y;
  if (edge === 0) { x = -20; y = Math.random() * h; }
  else if (edge === 1) { x = w + 20; y = Math.random() * h; }
  else if (edge === 2) { x = Math.random() * w; y = -20; }
  else { x = Math.random() * w; y = h + 20; }
  const tx = w / 2 + (Math.random() - 0.5) * w * 0.6;
  const ty = h / 2 + (Math.random() - 0.5) * h * 0.6;
  const a = Math.atan2(ty - y, tx - x);
  const isDebris = wave >= 2 && Math.random() < 0.4;
  const type = isDebris ? 'DEBRIS' : 'POLLEN';
  const speed = (isDebris ? 130 : 90) + wave * 14 + Math.random() * 40;
  return {
    id: idCounter++, kind: 'hazard', type,
    x, y,
    vx: Math.cos(a) * speed, vy: Math.sin(a) * speed,
    r: TYPES[type].r + Math.min(6, wave),
    phase: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 6,
    life: 20,
  };
}

export function spawnHeart(w, h) {
  return {
    id: idCounter++, kind: 'heart', type: 'HEART',
    x: 60 + Math.random() * (w - 120), y: 60 + Math.random() * (h - 120),
    vx: 0, vy: 0, r: TYPES.HEART.r, phase: 0, life: 12,
  };
}

export function updateEntity(e, dt, player, w, h) {
  e.phase += dt * 3;
  e.life -= dt;

  if (e.kind === 'mote' || e.kind === 'heart') {
    // drift
    e.x += (e.vx + Math.sin(e.phase) * 14) * dt;
    e.y += (e.vy + Math.cos(e.phase * 0.8) * 14) * dt;
    // sniff suction / magnet
    const dx = player.x - e.x, dy = player.y - e.y;
    const d = Math.hypot(dx, dy);
    const range = player.sniffing ? player.sniffRange : player.magnet * 40;
    if (d < range && d > 1) {
      const pull = player.sniffing ? 620 * (1 - d / range) + 120 : 150;
      e.x += (dx / d) * pull * dt;
      e.y += (dy / d) * pull * dt;
    }
    if (e.x < -30) e.x = w + 30; if (e.x > w + 30) e.x = -30;
    if (e.y < -30) e.y = h + 30; if (e.y > h + 30) e.y = -30;
  } else if (e.kind === 'hazard') {
    e.x += e.vx * dt; e.y += e.vy * dt;
    // sniffing pollen pulls it toward you — risky!
    if (player.sniffing && e.type === 'POLLEN') {
      const dx = player.x - e.x, dy = player.y - e.y;
      const d = Math.hypot(dx, dy);
      if (d < player.sniffRange && d > 1) {
        e.x += (dx / d) * 200 * dt;
        e.y += (dy / d) * 200 * dt;
      }
    }
    if (e.x < -60 || e.x > w + 60 || e.y < -60 || e.y > h + 60) e.life = 0;
  }
}

export function drawEntity(ctx, e) {
  const t = TYPES[e.type];
  ctx.save();
  ctx.translate(e.x, e.y);
  const fade = e.life < 2 ? Math.max(0.2, e.life / 2) : 1;
  ctx.globalAlpha = fade;

  if (e.kind === 'mote') {
    const pulse = 1 + Math.sin(e.phase * 2) * 0.15;
    ctx.shadowBlur = 16; ctx.shadowColor = t.color;
    ctx.fillStyle = t.color;
    ctx.beginPath();
    // diamond spice shape
    const r = e.r * pulse;
    ctx.moveTo(0, -r); ctx.lineTo(r * 0.7, 0); ctx.lineTo(0, r); ctx.lineTo(-r * 0.7, 0);
    ctx.closePath(); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,.7)';
    ctx.beginPath(); ctx.arc(-r * 0.15, -r * 0.25, r * 0.22, 0, Math.PI * 2); ctx.fill();
  } else if (e.type === 'POLLEN') {
    ctx.rotate(e.phase * 0.5);
    ctx.shadowBlur = 14; ctx.shadowColor = t.color;
    ctx.fillStyle = t.color;
    for (let i = 0; i < 6; i++) {
      ctx.rotate(Math.PI / 3);
      ctx.beginPath();
      ctx.ellipse(e.r * 0.8, 0, e.r * 0.55, e.r * 0.28, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#8a3bb0';
    ctx.beginPath(); ctx.arc(0, 0, e.r * 0.5, 0, Math.PI * 2); ctx.fill();
  } else if (e.type === 'DEBRIS') {
    ctx.rotate(e.phase * 2);
    ctx.fillStyle = t.color;
    ctx.strokeStyle = '#6a5a48'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-e.r, -e.r * 0.4); ctx.lineTo(-e.r * 0.2, -e.r); ctx.lineTo(e.r, -e.r * 0.3);
    ctx.lineTo(e.r * 0.5, e.r); ctx.lineTo(-e.r * 0.6, e.r * 0.7);
    ctx.closePath(); ctx.fill(); ctx.stroke();
  } else if (e.kind === 'heart') {
    const pulse = 1 + Math.sin(e.phase * 4) * 0.2;
    ctx.scale(pulse, pulse);
    ctx.shadowBlur = 18; ctx.shadowColor = t.color;
    ctx.fillStyle = t.color;
    const r = e.r;
    ctx.beginPath();
    ctx.moveTo(0, r * 0.9);
    ctx.bezierCurveTo(-r * 1.4, -r * 0.2, -r * 0.7, -r * 1.1, 0, -r * 0.35);
    ctx.bezierCurveTo(r * 0.7, -r * 1.1, r * 1.4, -r * 0.2, 0, r * 0.9);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
  ctx.restore();
}