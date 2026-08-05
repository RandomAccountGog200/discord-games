import { ensureAudio, sfx, startMusic, stopMusic } from './audio.js';
import { input, bindInput, pollInput } from './input.js';
import { Particles } from './particles.js';
import { Player } from './player.js';
import { TYPES, spawnMote, spawnHazard, spawnHeart, updateEntity, drawEntity } from './entities.js';
import { waveConfig, pickUpgrades } from './levels.js';
import { ui, show, hide, setState, isTouchDevice, buildUpgradeCards } from './ui.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let W = 0, H = 0, DPR = 1;

function resize() {
  DPR = Math.min(2, window.devicePixelRatio || 1);
  W = window.innerWidth; H = window.innerHeight;
  canvas.width = W * DPR; canvas.height = H * DPR;
  canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}
window.addEventListener('resize', resize);
resize();

// ---------- Game state ----------
const BEST_KEY = 'arabiNoseSim2_best';
let best = parseInt(localStorage.getItem(BEST_KEY) || '0', 10);

const G = {
  state: 'menu', // menu | playing | paused | upgrade | gameover
  score: 0, wave: 1,
  waveTime: 0, waveScoreStart: 0,
  moteTimer: 0, hazardTimer: 0, heartTimer: 0,
  entities: [],
  particles: new Particles(),
  player: new Player(),
  shake: 0, shakeX: 0, shakeY: 0,
  flash: 0,
  hitStop: 0,
  cfg: waveConfig(1),
  time: 0,
};

ui.menuBest.textContent = 'BEST SCORE: ' + best;
ui.hudBest.textContent = best;
if (isTouchDevice()) show(ui.touchUI);

// ---------- State transitions ----------
function startGame() {
  ensureAudio(); startMusic();
  G.score = 0; G.wave = 1;
  G.entities = [];
  G.particles = new Particles();
  G.player = new Player();
  G.player.reset(W, H);
  beginWave(1);
  G.state = 'playing';
  setState('playing');
}

function beginWave(n) {
  G.wave = n;
  G.cfg = waveConfig(n);
  G.waveTime = 0;
  G.waveScoreStart = G.score;
  G.moteTimer = 0; G.hazardTimer = 1.2; G.heartTimer = 14;
  ui.hudWave.textContent = n;
  sfx.wave();
  G.particles.spawn(W / 2, H / 2, { count: 30, color: '#ffd76a', speed: 260, life: 0.9 });
}

function waveCleared() {
  G.state = 'upgrade';
  setState('upgrade');
  sfx.upgrade();
  buildUpgradeCards(pickUpgrades(3), up => {
    sfx.click();
    up.apply(G.player);
    G.particles.burst(G.player.x, G.player.y, '#8ef0a0', 24);
    G.entities = G.entities.filter(e => e.kind === 'mote'); // clear hazards
    beginWave(G.wave + 1);
    G.state = 'playing';
    setState('playing');
  });
}

function gameOver() {
  G.state = 'gameover';
  stopMusic();
  sfx.over();
  const isNewBest = G.score > best;
  if (isNewBest) {
    best = G.score;
    localStorage.setItem(BEST_KEY, String(best));
  }
  ui.finalScore.textContent = G.score;
  ui.finalBest.textContent = (isNewBest ? '★ NEW BEST! ' : 'BEST: ') + best;
  ui.finalWave.textContent = 'REACHED WAVE ' + G.wave;
  ui.menuBest.textContent = 'BEST SCORE: ' + best;
  ui.hudBest.textContent = best;
  setState('gameover');
}

function togglePause() {
  if (G.state === 'playing') {
    G.state = 'paused'; setState('paused'); stopMusic(); sfx.click();
  } else if (G.state === 'paused') {
    G.state = 'playing'; setState('playing'); startMusic(); sfx.click();
  }
}

// ---------- Buttons ----------
document.getElementById('btnStart').addEventListener('click', () => { sfx.click(); startGame(); });
document.getElementById('btnRetry').addEventListener('click', () => { sfx.click(); startGame(); });
document.getElementById('btnResume').addEventListener('click', togglePause);
document.getElementById('btnPause').addEventListener('click', togglePause);
document.getElementById('btnQuit').addEventListener('click', () => {
  sfx.click(); G.state = 'menu'; stopMusic(); setState('menu');
});
document.getElementById('btnMenu').addEventListener('click', () => {
  sfx.click(); G.state = 'menu'; setState('menu');
});

bindInput(togglePause);

// ---------- Gameplay ----------
function circleHit(a, b) {
  const dx = a.x - b.x, dy = a.y - b.y;
  const r = a.r + b.radius;
  return dx * dx + dy * dy < r * r;
}

function addScore(base, x, y) {
  const p = G.player;
  p.combo++;
  p.comboTimer = 2.5;
  const mult = 1 + Math.min(4, Math.floor(p.combo / 5)) * 0.5;
  const gained = Math.round(base * mult);
  G.score += gained;
  ui.hudScore.textContent = G.score;
  if (mult > 1) {
    G.particles.spawn(x, y, { count: 4, color: '#ffffff', speed: 60, life: 0.4, size: 3 });
  }
}

function update(dt) {
  const p = G.player;
  pollInput();
  p.update(dt, input, W, H, G.particles, sfx);

  // sandstorm wind push
  if (G.cfg.sandstorm) {
    const wind = Math.sin(G.time * 0.7) * G.cfg.windStrength;
    p.x += wind * dt;
    if (Math.random() < dt * 8) {
      G.particles.spawn(Math.random() * W, Math.random() * H, {
        count: 1, color: 'rgba(220,180,120,.6)', speed: 300, life: 0.8, size: 2.5,
        angle: wind > 0 ? 0 : Math.PI, spread: 0.4, drag: 0.2,
      });
    }
  }

  // wave timer
  G.waveTime += dt;
  if (G.waveTime >= G.cfg.duration) { waveCleared(); return; }

  // spawners
  G.moteTimer -= dt;
  if (G.moteTimer <= 0 && G.entities.filter(e => e.kind === 'mote').length < 14) {
    G.entities.push(spawnMote(W, H, G.wave));
    G.moteTimer = G.cfg.moteRate;
  }
  G.hazardTimer -= dt;
  if (G.hazardTimer <= 0 && G.entities.filter(e => e.kind === 'hazard').length < G.cfg.maxHazards) {
    G.entities.push(spawnHazard(W, H, G.wave));
    G.hazardTimer = G.cfg.hazardRate;
  }
  G.heartTimer -= dt;
  if (G.heartTimer <= 0) {
    if (p.hp < p.maxHp) G.entities.push(spawnHeart(W, H));
    G.heartTimer = 16;
  }

  // entities
  for (let i = G.entities.length - 1; i >= 0; i--) {
    const e = G.entities[i];
    updateEntity(e, dt, p, W, H);
    if (e.life <= 0) { G.entities.splice(i, 1); continue; }

    if (e.kind === 'mote' && circleHit(e, p)) {
      addScore(TYPES[e.type].score, e.x, e.y);
      G.particles.burst(e.x, e.y, TYPES[e.type].color, 10);
      sfx.pickup(Math.min(3, p.combo / 4));
      G.entities.splice(i, 1);
    } else if (e.kind === 'heart' && circleHit(e, p)) {
      p.hp = Math.min(p.maxHp, p.hp + 25);
      G.particles.burst(e.x, e.y, '#ff6a8a', 14);
      sfx.upgrade();
      G.entities.splice(i, 1);
    } else if (e.kind === 'hazard' && circleHit(e, p)) {
      if (e.type === 'POLLEN') {
        const resist = Math.min(0.75, p.pollenResist || 0);
        if (p.hurt(20 * (1 - resist), G.particles, sfx)) {
          sfx.sneeze();
          G.shake = Math.max(G.shake, 14);
          G.flash = 0.35;
          G.hitStop = 0.09;
          // sneeze knockback
          const a = Math.atan2(p.y - e.y, p.x - e.x);
          p.vx += Math.cos(a) * 500; p.vy += Math.sin(a) * 500;
          G.particles.spawn(p.x, p.y, { count: 20, color: '#d97bff', speed: 300, life: 0.8 });
        }
      } else {
        if (p.hurt(15, G.particles, sfx)) {
          G.shake = Math.max(G.shake, 10);
          G.flash = 0.25;
          G.hitStop = 0.07;
        }
      }
      G.entities.splice(i, 1);
    }
  }

  if (p.hp <= 0) { gameOver(); return; }

  // update HUD bars
  ui.barSniff.style.width = (p.sniff / p.maxSniff * 100) + '%';
  ui.barHp.style.width = Math.max(0, p.hp / p.maxHp * 100) + '%';

  // decay shake/flash
  G.shake = Math.max(0, G.shake - 40 * dt);
  G.flash = Math.max(0, G.flash - dt);
  G.hitStop = Math.max(0, G.hitStop - dt);
}

// ---------- Rendering ----------
let stars = [];
for (let i = 0; i < 80; i++) stars.push({ x: Math.random(), y: Math.random() * 0.6, s: Math.random() * 1.8 + 0.4, tw: Math.random() * Math.PI * 2 });

function drawBackground() {
  // night desert sky
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#160b2e');
  sky.addColorStop(0.55, '#3a1a52');
  sky.addColorStop(0.8, '#8a4a3a');
  sky.addColorStop(1, '#c98a4a');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  // stars
  for (const s of stars) {
    const a = 0.4 + 0.6 * Math.abs(Math.sin(G.time * 1.5 + s.tw));
    ctx.globalAlpha = a;
    ctx.fillStyle = '#ffe9c9';
    ctx.fillRect(s.x * W, s.y * H, s.s, s.s);
  }
  ctx.globalAlpha = 1;

  // moon
  ctx.shadowBlur = 40; ctx.shadowColor = '#ffe9c9';
  ctx.fillStyle = '#f7e8c9';
  ctx.beginPath(); ctx.arc(W * 0.82, H * 0.16, 34, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#e0cfa8';
  ctx.beginPath(); ctx.arc(W * 0.8, H * 0.15, 8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(W * 0.84, H * 0.18, 5, 0, Math.PI * 2); ctx.fill();

  // dunes (parallax sine layers)
  const layers = [
    { base: 0.78, amp: 26, col: '#a86a3a', speed: 0.01 },
    { base: 0.86, amp: 34, col: '#8a5228', speed: 0.02 },
    { base: 0.94, amp: 40, col: '#6a3c1c', speed: 0.035 },
  ];
  for (const L of layers) {
    ctx.fillStyle = L.col;
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 12) {
      const y = H * L.base + Math.sin(x * 0.006 + G.time * L.speed * 60) * L.amp + Math.sin(x * 0.002 + 2) * L.amp * 0.6;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W, H);
    ctx.closePath(); ctx.fill();
  }

  // wave progress bar at bottom
  const prog = Math.min(1, G.waveTime / G.cfg.duration);
  ctx.fillStyle = 'rgba(0,0,0,.4)';
  ctx.fillRect(0, H - 6, W, 6);
  const pg = ctx.createLinearGradient(0, 0, W, 0);
  pg.addColorStop(0, '#ffd76a'); pg.addColorStop(1, '#ff8c3b');
  ctx.fillStyle = pg;
  ctx.fillRect(0, H - 6, W * prog, 6);
}

function draw() {
  ctx.save();
  if (G.shake > 0) {
    G.shakeX = (Math.random() - 0.5) * G.shake;
    G.shakeY = (Math.random() - 0.5) * G.shake;
    ctx.translate(G.shakeX, G.shakeY);
  }

  drawBackground();

  if (G.state !== 'menu') {
    for (const e of G.entities) drawEntity(ctx, e);
    G.player.draw(ctx);
    G.particles.draw(ctx);

    // combo indicator
    if (G.player.combo >= 5) {
      const mult = 1 + Math.min(4, Math.floor(G.player.combo / 5)) * 0.5;
      ctx.font = '900 22px Trebuchet MS';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffd76a';
      ctx.shadowBlur = 12; ctx.shadowColor = '#ff8c3b';
      ctx.fillText('COMBO x' + mult.toFixed(1), G.player.x, G.player.y - G.player.radius - 18);
      ctx.shadowBlur = 0;
    }

    // sniff ripples
    if (G.player.sniffing && Math.random() < 0.4) {
      const a = Math.random() * Math.PI * 2;
      const d = G.player.sniffRange * (0.5 + Math.random() * 0.5);
      G.particles.spawn(G.player.x + Math.cos(a) * d, G.player.y + Math.sin(a) * d, {
        count: 1, color: 'rgba(126,240,255,.8)', speed: 0, life: 0.35, size: 3, drag: 0,
      });
    }
  }

  if (G.flash > 0) {
    ctx.fillStyle = `rgba(255,90,120,${G.flash * 0.8})`;
    ctx.fillRect(-20, -20, W + 40, H + 40);
  }
  ctx.restore();
}

// ---------- Main loop (fixed timestep) ----------
const STEP = 1 / 120;
let last = performance.now(), acc = 0;

function frame(now) {
  requestAnimationFrame(frame);
  let dt = (now - last) / 1000;
  last = now;
  if (dt > 0.25) dt = 0.25;
  G.time += dt;

  if (G.state === 'playing') {
    if (G.hitStop > 0) {
      G.hitStop -= dt;
      G.particles.update(dt * 0.2);
    } else {
      acc += dt;
      let steps = 0;
      while (acc >= STEP && steps < 8) {
        update(STEP);
        acc -= STEP;
        steps++;
        if (G.state !== 'playing') { acc = 0; break; }
      }
      G.particles.update(dt);
    }
  } else if (G.state === 'menu' || G.state === 'gameover' || G.state === 'upgrade' || G.state === 'paused') {
    G.particles.update(dt);
  }

  draw();
}
requestAnimationFrame(frame);