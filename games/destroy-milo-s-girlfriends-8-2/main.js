import { clamp, rand, choice, shuffle, dist, circleHit } from './utils.js';
import { AudioSys } from './audio.js';
import { Input } from './input.js';
import { FX } from './particles.js';
import { Player } from './player.js';
import { Enemy, makeEnemy, drawEnemyBullet } from './enemies.js';
import { getWaveComp, TOTAL_WAVES, WAVE_TITLES } from './waves.js';
import { Pickups } from './pickups.js';
import { UI } from './ui.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

let VW = 0, VH = 0, DPR = 1;
function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  VW = window.innerWidth;
  VH = window.innerHeight;
  canvas.width = Math.floor(VW * DPR);
  canvas.height = Math.floor(VH * DPR);
  canvas.style.width = VW + 'px';
  canvas.style.height = VH + 'px';
}
window.addEventListener('resize', resize);
resize();

const WORLD = { w: 1700, h: 1300 };
const HS_KEY = 'dmgf8_highscore';

const UPGRADES = [
  { icon: '⚡', name: 'Rapid Texts', desc: '+25% fire rate', apply: (p) => { p.fireRate *= 1.25; } },
  { icon: '💥', name: 'Heartbreaker', desc: '+30% damage', apply: (p) => { p.dmg *= 1.3; } },
  { icon: '🔱', name: 'Double Trouble', desc: '+1 projectile per shot', maxed: (p) => p.multishot >= 5, apply: (p) => { p.multishot = Math.min(5, p.multishot + 1); } },
  { icon: '👁️', name: 'Piercing Glare', desc: 'Shots pierce +1 enemy', maxed: (p) => p.pierce >= 3, apply: (p) => { p.pierce = Math.min(3, p.pierce + 1); } },
  { icon: '👟', name: 'Sneakers', desc: '+15% move speed', apply: (p) => { p.speed *= 1.15; } },
  { icon: '🛡️', name: 'Thick Skin', desc: '+25 max HP and heal 25', apply: (p) => { p.maxhp += 25; p.hp = Math.min(p.maxhp, p.hp + 25); } },
  { icon: '💨', name: 'Quick Exit', desc: '-25% dash cooldown', maxed: (p) => p.dashCD <= 0.45, apply: (p) => { p.dashCD = Math.max(0.4, p.dashCD * 0.75); } },
  { icon: '🧲', name: 'Magnet Charm', desc: '+60% pickup radius', apply: (p) => { p.magnet *= 1.6; } }
];

const Game = {
  state: 'menu', // menu | playing | upgrade | paused | over
  score: 0,
  best: parseInt(localStorage.getItem(HS_KEY) || '0', 10),
  wave: 1,
  player: null,
  enemies: [],
  ebullets: [],
  camera: { x: 0, y: 0, shake: 0 },
  hitStop: 0,
  banner: '',
  bannerTime: 0,
  flash: 0,
  time: 0,
  win: false,

  reset() {
    this.score = 0;
    this.wave = 1;
    this.player = new Player(WORLD.w / 2, WORLD.h / 2);
    this.enemies = [];
    this.ebullets = [];
    this.hitStop = 0;
    this.flash = 0;
    this.win = false;
    FX.clear();
    Pickups.clear();
    this.spawnWave();
  },

  spawnWave() {
    const comp = getWaveComp(this.wave);
    const hpMul = 1 + (this.wave - 1) * 0.13;
    for (const group of comp) {
      for (let i = 0; i < group.count; i++) {
        let x, y;
        do {
          const edge = Math.floor(rand(0, 4));
          if (edge === 0) { x = rand(60, WORLD.w - 60); y = rand(60, 120); }
          else if (edge === 1) { x = rand(60, WORLD.w - 60); y = rand(WORLD.h - 120, WORLD.h - 60); }
          else if (edge === 2) { x = rand(60, 120); y = rand(60, WORLD.h - 60); }
          else { x = rand(WORLD.w - 120, WORLD.w - 60); y = rand(60, WORLD.h - 60); }
        } while (dist(x, y, this.player.x, this.player.y) < 380);
        const e = makeEnemy(group.type, x, y, hpMul);
        e.spawnAnim += i * 0.12;
        this.enemies.push(e);
      }
    }
    this.banner = WAVE_TITLES[Math.min(this.wave, TOTAL_WAVES)];
    this.bannerTime = 2.4;
  },

  addScore(n) {
    this.score += n;
  },

  startGame() {
    AudioSys.init();
    AudioSys.click();
    this.reset();
    this.state = 'playing';
    UI.showPlaying();
    AudioSys.startMusic();
  },

  pause() {
    if (this.state !== 'playing') return;
    this.state = 'paused';
    UI.showPause();
    AudioSys.click();
  },

  resume() {
    if (this.state !== 'paused') return;
    this.state = 'playing';
    UI.hidePause();
    AudioSys.click();
  },

  toMenu() {
    this.state = 'menu';
    AudioSys.stopMusic();
    AudioSys.click();
    UI.showMenu(this.best);
  },

  gameOver(win) {
    this.win = win;
    this.state = 'over';
    AudioSys.stopMusic();
    if (win) AudioSys.waveClear(); else AudioSys.gameOver();
    const isBest = this.score > this.best;
    if (isBest) {
      this.best = this.score;
      localStorage.setItem(HS_KEY, String(this.best));
    }
    UI.showGameOver(this.score, this.best, win, this.wave);
  },

  waveCleared() {
    AudioSys.waveClear();
    this.addScore(this.wave * 200);
    if (this.wave >= TOTAL_WAVES) {
      this.gameOver(true);
      return;
    }
    this.state = 'upgrade';
    const pool = shuffle(UPGRADES.filter(u => !u.maxed || !u.maxed(this.player)).slice());
    const options = pool.slice(0, 3);
    UI.showUpgrade(this.wave, options, (opt) => {
      opt.apply(this.player);
      AudioSys.upgrade();
      this.wave++;
      this.state = 'playing';
      UI.showPlaying();
      this.spawnWave();
    });
  }
};

UI.init({
  onStart: () => Game.startGame(),
  onResume: () => Game.resume(),
  onRestart: () => Game.startGame(),
  onMenu: () => Game.toMenu(),
  onDash: () => { Input.dashQueued = true; },
  onPauseToggle: () => {
    if (Game.state === 'playing') Game.pause();
    else if (Game.state === 'paused') Game.resume();
  }
});
UI.showMenu(Game.best);
Input.init(canvas);

function update(dt) {
  Game.time += dt;

  if (Input.consumePause()) {
    if (Game.state === 'playing') Game.pause();
    else if (Game.state === 'paused') Game.resume();
  }

  FX.update(dt);

  if (Game.state !== 'playing') return;

  // hit-stop
  if (Game.hitStop > 0) {
    Game.hitStop -= dt;
    return;
  }

  if (Game.bannerTime > 0) Game.bannerTime -= dt;
  if (Game.flash > 0) Game.flash -= dt;
  Game.camera.shake = Math.max(0, Game.camera.shake - dt * 30);

  const p = Game.player;
  Input.update();
  const aim = Input.getAim(p, Game.camera);
  p.update(dt, Input, aim, WORLD, FX, AudioSys);

  // player bullets
  for (let i = p.bullets.length - 1; i >= 0; i--) {
    const b = p.bullets[i];
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
    if (b.life <= 0 || b.x < 0 || b.x > WORLD.w || b.y < 0 || b.y > WORLD.h) {
      p.bullets.splice(i, 1);
    }
  }

  // enemies
  for (const e of Game.enemies) {
    e.update(dt, p, WORLD, Game.ebullets, FX, AudioSys, Game.enemies);
  }

  // enemy bullets
  for (let i = Game.ebullets.length - 1; i >= 0; i--) {
    const b = Game.ebullets[i];
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
    if (b.life <= 0 || b.x < -20 || b.x > WORLD.w + 20 || b.y < -20 || b.y > WORLD.h + 20) {
      Game.ebullets.splice(i, 1);
      continue;
    }
    if (circleHit(b, p)) {
      if (p.hurt(b.dmg, FX, AudioSys)) {
        Game.flash = 0.3;
        Game.camera.shake = Math.max(Game.camera.shake, 12);
        Game.hitStop = 0.09;
      }
      Game.ebullets.splice(i, 1);
    }
  }

  // bullets vs enemies
  for (let i = p.bullets.length - 1; i >= 0; i--) {
    const b = p.bullets[i];
    let consumed = false;
    for (const e of Game.enemies) {
      if (e.spawnAnim > 0 || e.phased) continue;
      if (circleHit(b, e)) {
        e.takeDamage(b.dmg, FX, AudioSys);
        FX.burst(b.x, b.y, e.color, 5, 120, 3);
        if (b.pierce > 0) {
          b.pierce--;
        } else {
          consumed = true;
        }
        break;
      }
    }
    if (consumed) p.bullets.splice(i, 1);
  }

  // enemy deaths
  for (let i = Game.enemies.length - 1; i >= 0; i--) {
    const e = Game.enemies[i];
    if (e.hp <= 0) {
      e.onDeath(Game.ebullets, FX, AudioSys);
      Game.addScore(e.score);
      FX.addText(e.x, e.y, `+${e.score}`, '#fff', 16);
      Game.camera.shake = Math.max(Game.camera.shake, e.def.kind === 'boss' ? 25 : 7);
      Game.hitStop = Math.max(Game.hitStop, e.def.kind === 'boss' ? 0.25 : 0.04);
      const roll = Math.random();
      if (roll < 0.2) Pickups.spawnHeart(e.x, e.y);
      else if (roll < 0.32) Pickups.spawnCandy(e.x, e.y);
      Game.enemies.splice(i, 1);
    }
  }

  // enemy contact damage
  for (const e of Game.enemies) {
    if (e.spawnAnim > 0 || e.phased) continue;
    if (circleHit(e, p)) {
      if (p.hurt(e.dmg, FX, AudioSys)) {
        Game.flash = 0.3;
        Game.camera.shake = Math.max(Game.camera.shake, 10);
        Game.hitStop = 0.07;
        // knockback enemy slightly
        const dx = e.x - p.x, dy = e.y - p.y;
        const d = Math.hypot(dx, dy) || 1;
        e.x += dx / d * 30;
        e.y += dy / d * 30;
      }
    }
  }

  // pickups
  Pickups.update(dt, p, FX, AudioSys, (n) => Game.addScore(n));

  // death check
  if (p.hp <= 0) {
    FX.burst(p.x, p.y, '#7ecfff', 40, 300, 7);
    Game.gameOver(false);
    return;
  }

  // wave clear check
  if (Game.enemies.length === 0) {
    Game.waveCleared();
    return;
  }

  // camera follow + clamp
  const cam = Game.camera;
  const targetX = clamp(p.x - VW / 2, 0, Math.max(0, WORLD.w - VW));
  const targetY = clamp(p.y - VH / 2, 0, Math.max(0, WORLD.h - VH));
  cam.x += (targetX - cam.x) * Math.min(1, dt * 8);
  cam.y += (targetY - cam.y) * Math.min(1, dt * 8);
}

function drawBackground() {
  // gradient backdrop
  const g = ctx.createLinearGradient(0, 0, WORLD.w, WORLD.h);
  g.addColorStop(0, '#1d0716');
  g.addColorStop(0.5, '#2a0a20');
  g.addColorStop(1, '#160510');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, WORLD.w, WORLD.h);

  // grid
  ctx.strokeStyle = 'rgba(255, 94, 156, 0.07)';
  ctx.lineWidth = 1;
  const step = 80;
  ctx.beginPath();
  for (let x = 0; x <= WORLD.w; x += step) { ctx.moveTo(x, 0); ctx.lineTo(x, WORLD.h); }
  for (let y = 0; y <= WORLD.h; y += step) { ctx.moveTo(0, y); ctx.lineTo(WORLD.w, y); }
  ctx.stroke();

  // ambient floating hearts (decorative)
  ctx.globalAlpha = 0.06;
  for (let i = 0; i < 12; i++) {
    const hx = (i * 397 + Game.time * 12) % WORLD.w;
    const hy = (i * 271 + Math.sin(Game.time * 0.7 + i) * 40 + WORLD.h) % WORLD.h;
    ctx.fillStyle = '#ff5e9c';
    ctx.beginPath();
    const s = 14;
    ctx.moveTo(hx, hy + s * 0.4);
    ctx.bezierCurveTo(hx - s * 1.1, hy - s * 0.3, hx - s * 0.55, hy - s * 1.15, hx, hy - s * 0.45);
    ctx.bezierCurveTo(hx + s * 0.55, hy - s * 1.15, hx + s * 1.1, hy - s * 0.3, hx, hy + s * 0.4);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // border walls
  ctx.strokeStyle = '#ff2d77';
  ctx.lineWidth = 6;
  ctx.shadowColor = '#ff2d77';
  ctx.shadowBlur = 18;
  ctx.strokeRect(3, 3, WORLD.w - 6, WORLD.h - 6);
  ctx.shadowBlur = 0;
}

function drawHUD() {
  const p = Game.player;
  ctx.save();

  // HP bar
  const hpW = 200, hpH = 16, hx = 18, hy = 18;
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(hx - 2, hy - 2, hpW + 4, hpH + 4);
  ctx.fillStyle = '#3a0a22';
  ctx.fillRect(hx, hy, hpW, hpH);
  const hpFrac = Math.max(0, p.hp / p.maxhp);
  const hpGrad = ctx.createLinearGradient(hx, 0, hx + hpW, 0);
  hpGrad.addColorStop(0, hpFrac > 0.3 ? '#6dffb8' : '#ff3355');
  hpGrad.addColorStop(1, hpFrac > 0.3 ? '#2ecc8a' : '#ff7744');
  ctx.fillStyle = hpGrad;
  ctx.fillRect(hx, hy, hpW * hpFrac, hpH);
  ctx.strokeStyle = '#ff7eb0';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(hx, hy, hpW, hpH);
  ctx.fillStyle = '#fff';
  ctx.font = "bold 12px 'Segoe UI', sans-serif";
  ctx.textAlign = 'left';
  ctx.fillText(`${Math.ceil(Math.max(0, p.hp))} / ${p.maxhp}`, hx + 6, hy + 12.5);

  // dash cooldown
  const dx2 = hx, dy2 = hy + 30;
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(dx2 - 2, dy2 - 2, 104, 14);
  const dashFrac = p.dashTimer <= 0 ? 1 : 1 - p.dashTimer / p.dashCD;
  ctx.fillStyle = dashFrac >= 1 ? '#8ad8ff' : '#2a5a78';
  ctx.fillRect(dx2, dy2, 100 * clamp(dashFrac, 0, 1), 10);
  ctx.fillStyle = '#dff4ff';
  ctx.font = "bold 9px 'Segoe UI', sans-serif";
  ctx.fillText(dashFrac >= 1 ? 'DASH READY' : 'DASH...', dx2 + 4, dy2 + 8.5);

  // Score
  ctx.textAlign = 'right';
  ctx.font = "bold 22px 'Segoe UI', sans-serif";
  ctx.fillStyle = '#ffd23d';
  ctx.shadowColor = 'rgba(255,210,61,0.6)';
  ctx.shadowBlur = 8;
  ctx.fillText(String(Game.score).padStart(6, '0'), VW - 20, 36);
  ctx.shadowBlur = 0;
  ctx.font = "12px 'Segoe UI', sans-serif";
  ctx.fillStyle = '#b87a9e';
  ctx.fillText(`BEST ${Game.best}`, VW - 20, 54);

  // Wave + remaining
  ctx.textAlign = 'center';
  ctx.font = "bold 16px 'Segoe UI', sans-serif";
  ctx.fillStyle = '#ff5e9c';
  ctx.fillText(`WAVE ${Game.wave} / ${TOTAL_WAVES}`, VW / 2, 28);
  ctx.font = "12px 'Segoe UI', sans-serif";
  ctx.fillStyle = '#e8a8c8';
  ctx.fillText(`${Game.enemies.length} girlfriend${Game.enemies.length === 1 ? '' : 's'} left`, VW / 2, 46);

  // Boss HP bar
  const boss = Game.enemies.find(e => e.def.kind === 'boss');
  if (boss) {
    const bw = Math.min(520, VW - 80), bh = 18;
    const bx = (VW - bw) / 2, by = VH - 40;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(bx - 3, by - 3, bw + 6, bh + 6);
    ctx.fillStyle = '#3a0a22';
    ctx.fillRect(bx, by, bw, bh);
    const bg = ctx.createLinearGradient(bx, 0, bx + bw, 0);
    bg.addColorStop(0, '#ff2d55');
    bg.addColorStop(1, '#b3125a');
    ctx.fillStyle = bg;
    ctx.fillRect(bx, by, bw * Math.max(0, boss.hp / boss.maxhp), bh);
    ctx.strokeStyle = '#ff7eb0';
    ctx.lineWidth = 2;
    ctx.strokeRect(bx, by, bw, bh);
    ctx.fillStyle = '#fff';
    ctx.font = "bold 12px 'Segoe UI', sans-serif";
    ctx.fillText(boss.def.name, VW / 2, by - 8);
  }

  ctx.restore();
}

function drawBanner() {
  if (Game.bannerTime <= 0) return;
  const t = Game.bannerTime;
  const a = t > 2 ? (2.4 - t) / 0.4 : Math.min(1, t / 0.5);
  ctx.save();
  ctx.globalAlpha = clamp(a, 0, 1);
  ctx.textAlign = 'center';
  ctx.font = `bold ${Math.min(34, VW / 18)}px 'Segoe UI', sans-serif`;
  ctx.fillStyle = '#ff5e9c';
  ctx.shadowColor = '#ff2d77';
  ctx.shadowBlur = 24;
  ctx.fillText(Game.banner, VW / 2, VH * 0.3);
  ctx.restore();
}

function drawTouchSticks() {
  if (!Input.isTouch) return;
  for (const s of [Input.moveStick, Input.aimStick]) {
    if (!s) continue;
    ctx.save();
    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = '#ff7eb0';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(s.sx, s.sy, 55, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = '#ff5e9c';
    ctx.beginPath(); ctx.arc(s.sx + s.dx, s.sy + s.dy, 24, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}

function render() {
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.clearRect(0, 0, VW, VH);

  const cam = Game.camera;
  const shakeX = cam.shake > 0 ? rand(-cam.shake, cam.shake) : 0;
  const shakeY = cam.shake > 0 ? rand(-cam.shake, cam.shake) : 0;

  ctx.save();
  ctx.translate(-cam.x + shakeX, -cam.y + shakeY);

  drawBackground();

  Pickups.draw(ctx, Game.time);

  if (Game.player && Game.state !== 'menu') {
    // player bullets
    for (const b of Game.player.bullets) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = 'rgba(255, 210, 61, 0.35)';
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r * 2.2, 0, Math.PI * 2); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#ffe98a';
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#ffb13d';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    for (const b of Game.ebullets) drawEnemyBullet(ctx, b, Game.time);
    for (const e of Game.enemies) e.draw(ctx, Game.time);
    if (Game.state !== 'over' || Game.win) Game.player.draw(ctx, Game.time);
  }

  FX.draw(ctx);
  ctx.restore();

  if (Game.state === 'playing' || Game.state === 'paused' || Game.state === 'upgrade') {
    drawHUD();
    drawBanner();
  }

  // red damage flash
  if (Game.flash > 0) {
    ctx.fillStyle = `rgba(255, 20, 60, ${Game.flash * 0.5})`;
    ctx.fillRect(0, 0, VW, VH);
  }

  drawTouchSticks();
}

// --- Main loop (delta-time, clamped) ---
let last = performance.now();
function frame(now) {
  let dt = (now - last) / 1000;
  last = now;
  if (dt > 0.05) dt = 0.05;
  AudioSys.update();
  update(dt);
  render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);