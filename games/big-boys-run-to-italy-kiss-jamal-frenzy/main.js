import { InputController } from './input.js';
import { AudioManager } from './audio.js';
import { ParticleSystem } from './particles.js';
import { Player } from './player.js';
import { Enemy, Pickup, distance, circleRectCollision } from './entities.js';
import { createLevel } from './levels.js';
import { UI } from './ui.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const input = new InputController(canvas);
const audio = new AudioManager();
const particles = new ParticleSystem();
const ui = new UI();
input.bindTouchControls(document.getElementById('joystick'), document.getElementById('joystickKnob'), document.getElementById('dashTouch'));

let state = 'menu';
let level = null;
let player = null;
let enemies = [];
let pickups = [];
let levelIndex = 0;
let score = 0;
let elapsed = 0;
let levelTime = 0;
let shake = 0;
let flash = 0;
let hitStop = 0;
let visualTime = 0;
let best = loadBest();

const upgradePool = [
  { id: 'shoes', icon: '👟', title: 'BIG SHOES', description: 'Move 16% faster. Stackable, naturally.' },
  { id: 'scarf', icon: '🧣', title: 'MAMMA’S SCARF', description: 'Gain one extra heart and heal completely.' },
  { id: 'turbo', icon: '⚡', title: 'TURBO KISS', description: 'Dash cooldown is reduced by 24%.' }
];

ui.setBest(best);
ui.bind({
  start: () => startGame(),
  resume: () => resumeGame(),
  pause: () => pauseGame(),
  menu: () => goMenu(),
  restart: () => startGame()
});
window.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    if (state === 'playing') pauseGame();
    else if (state === 'paused') resumeGame();
  }
});

function loadBest() {
  try { return Number(localStorage.getItem('bigBoysItalyBest') || 0); } catch { return 0; }
}
function saveBest() {
  if (score > best) {
    best = score;
    try { localStorage.setItem('bigBoysItalyBest', String(best)); } catch { /* storage can be unavailable */ }
  }
  ui.setBest(best);
}
function startGame() {
  audio.ensure(); audio.startMusic(); audio.sfx('click');
  state = 'playing'; levelIndex = 0; score = 0; elapsed = 0; particles.clear(); shake = 0; flash = 0;
  player = new Player({ x: 72, y: 270 });
  loadLevel(0);
  ui.show(null);
}
function loadLevel(index) {
  level = createLevel(index);
  enemies = level.enemies.map(spec => new Enemy(spec));
  pickups = level.pickups.map(point => new Pickup(point));
  levelTime = level.timeLimit;
  if (index === 0) { player.x = level.start.x; player.y = level.start.y; }
  else player.resetForLevel(level.start);
  ui.updateHUD(level.number, 0, pickups.length, score, player.health, player.maxHealth);
}
function goMenu() {
  audio.sfx('click'); state = 'menu'; input.reset(); ui.setBest(best); ui.show('menu');
}
function pauseGame() {
  if (state !== 'playing') return;
  state = 'paused'; input.reset(); audio.sfx('click'); ui.show('pause');
}
function resumeGame() {
  if (state !== 'paused') return;
  audio.ensure(); audio.sfx('click'); state = 'playing'; ui.show(null);
}
function gameOver(won) {
  state = won ? 'win' : 'gameover'; input.reset(); saveBest();
  audio.stopMusic(); audio.sfx(won ? 'win' : 'lose');
  ui.showEnd(won, score, best, Math.min(levelIndex + 1, 6));
}
function completeLevel() {
  const remainingBonus = Math.max(0, Math.floor(levelTime * 10));
  score += 250 + remainingBonus;
  audio.sfx('goal'); particles.burst(level.goal.x, level.goal.y, '#ffd166', 34, 220); shake = .35; flash = .16; hitStop = .12;
  if (levelIndex === 5) { gameOver(true); return; }
  state = 'upgrade';
  const choices = upgradePool.map(choice => ({ ...choice }));
  audio.sfx('upgrade');
  ui.showUpgrade(choices, id => {
    audio.ensure(); audio.sfx('click'); player.applyUpgrade(id); levelIndex++; state = 'playing'; loadLevel(levelIndex); ui.show(null);
  });
}
function onPlayerEvent(event) {
  if (event === 'dash') {
    audio.sfx('dash'); particles.burst(player.x - player.lastMove.x * 13, player.y - player.lastMove.y * 13, '#fff8e8', 12, 85); shake = Math.max(shake, .13);
  }
}
function update(dt) {
  visualTime += dt;
  particles.update(dt);
  shake = Math.max(0, shake - dt * 1.8);
  flash = Math.max(0, flash - dt * 2.5);
  if (hitStop > 0) { hitStop -= dt; return; }
  if (state !== 'playing') return;

  elapsed += dt; levelTime -= dt;
  player.update(dt, input, level.obstacles, level.bounds, onPlayerEvent);
  if (player.dashTime > 0 && Math.random() < .8) particles.trail(player.x, player.y, '#fff8e8');
  enemies.forEach(enemy => enemy.update(dt, player, level.obstacles, level.bounds, elapsed));
  pickups.forEach(pickup => pickup.update(dt));

  for (const pickup of pickups) {
    if (!pickup.collected && distance(player, pickup) < player.r + pickup.r + 3) {
      pickup.collected = true;
      score += 100 * (1 + player.upgrades.gelato);
      particles.burst(pickup.x, pickup.y, '#ffd166', 18, 145); audio.sfx('pickup'); flash = .06;
    }
  }
  for (const enemy of enemies) {
    if (enemy.hitCooldown <= 0 && distance(player, enemy) < player.r + enemy.r - 3) {
      const dx = player.x - enemy.x, dy = player.y - enemy.y;
      if (player.takeDamage(dx, dy)) {
        enemy.hitCooldown = .9; particles.burst(player.x, player.y, '#ef476f', 20, 170); audio.sfx('hurt'); shake = .3; flash = .18; hitStop = .08;
        if (player.health <= 0) { gameOver(false); return; }
      }
    }
  }
  const collected = pickups.filter(p => p.collected).length;
  if (collected === pickups.length && distance(player, level.goal) < player.r + 29) completeLevel();
  if (levelTime <= 0) gameOver(false);
  ui.updateHUD(level.number, collected, pickups.length, score, player.health, player.maxHealth);
}

function roundedRect(context, x, y, w, h, r) {
  context.beginPath(); context.moveTo(x + r, y); context.arcTo(x + w, y, x + w, y + h, r); context.arcTo(x + w, y + h, x, y + h, r); context.arcTo(x, y + h, x, y, r); context.arcTo(x, y, x + w, y, r); context.closePath();
}
function drawBackground() {
  const t = level?.theme || { top: '#f9c46b', bottom: '#ef476f', road: '#f9dfaa', accent: '#118ab2' };
  const gradient = ctx.createLinearGradient(0, 0, 0, 540); gradient.addColorStop(0, t.top); gradient.addColorStop(1, t.bottom);
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, 960, 540);
  ctx.globalAlpha = .13; ctx.fillStyle = '#fff8e8';
  for (let x = -80; x < 1040; x += 96) { ctx.beginPath(); ctx.arc(x + Math.sin(x) * 4, 45, 34, 0, Math.PI * 2); ctx.fill(); }
  ctx.globalAlpha = .24; ctx.fillStyle = t.road;
  for (let x = 0; x < 960; x += 42) for (let y = 0; y < 540; y += 42) { ctx.save(); ctx.translate(x + (y % 84 ? 20 : 0), y); ctx.rotate(-.05); ctx.fillRect(0, 0, 34, 2); ctx.restore(); }
  ctx.globalAlpha = 1;
  ctx.fillStyle = 'rgba(36,27,54,.15)';
  for (let x = 20; x < 960; x += 130) { const h = 25 + ((x * 7) % 36); ctx.fillRect(x, 530 - h, 82, h); ctx.fillStyle = 'rgba(255,248,232,.22)'; for (let wy = 540 - h + 12; wy < 528; wy += 17) ctx.fillRect(x + 13, wy, 7, 6); ctx.fillStyle = 'rgba(36,27,54,.15)'; }
  ctx.fillStyle = 'rgba(255,248,232,.5)'; ctx.font = '900 12px Arial'; ctx.fillText(level ? level.name.toUpperCase() : 'ITALIA', 22, 31);
}
function drawObstacles() {
  const accent = level.theme.accent;
  for (const rect of level.obstacles) {
    ctx.save(); ctx.shadowColor = 'rgba(36,27,54,.3)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 5;
    roundedRect(ctx, rect.x, rect.y, rect.w, rect.h, 9); ctx.fillStyle = '#fff8e8'; ctx.fill();
    ctx.shadowColor = 'transparent'; ctx.fillStyle = accent; ctx.globalAlpha = .9; roundedRect(ctx, rect.x, rect.y, rect.w, 8, 5); ctx.fill();
    ctx.globalAlpha = .17; ctx.fillStyle = '#241b36'; ctx.fillRect(rect.x + 12, rect.y + 15, 9, rect.h - 22); ctx.fillRect(rect.x + 30, rect.y + 15, 9, rect.h - 22);
    ctx.restore();
  }
}
function drawGoal() {
  const goal = level.goal; const ready = pickups.every(p => p.collected); const pulse = 1 + Math.sin(visualTime * 4) * .08;
  ctx.save(); ctx.translate(goal.x, goal.y); ctx.scale(pulse, pulse);
  ctx.globalAlpha = .22; ctx.fillStyle = ready ? '#06d6a0' : '#fff8e8'; ctx.beginPath(); ctx.arc(0, 0, 42, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = ready ? '#06d6a0' : '#fff8e8'; ctx.lineWidth = 4; ctx.setLineDash([7, 6]); ctx.beginPath(); ctx.arc(0, 0, 30, visualTime, visualTime + Math.PI * 1.7); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = '#ffcfad'; ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#241b36'; ctx.beginPath(); ctx.arc(-6, -3, 2, 0, Math.PI * 2); ctx.arc(6, -3, 2, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#ef476f'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 3, 7, 0, Math.PI); ctx.stroke();
  ctx.fillStyle = '#06d6a0'; ctx.beginPath(); ctx.arc(0, -14, 17, Math.PI, Math.PI * 2); ctx.fill();
  ctx.fillStyle = ready ? '#06d6a0' : '#fff8e8'; ctx.font = '900 11px Arial'; ctx.textAlign = 'center'; ctx.fillText(ready ? 'KISS!' : 'JAMAL', 0, 50);
  ctx.restore();
}
function render() {
  drawBackground();
  if (!level || !player) return;
  const offsetX = shake > 0 ? (Math.random() - .5) * shake * 28 : 0;
  const offsetY = shake > 0 ? (Math.random() - .5) * shake * 28 : 0;
  ctx.save(); ctx.translate(offsetX, offsetY);
  drawObstacles(); drawGoal(); pickups.forEach(p => p.draw(ctx)); enemies.forEach(e => e.draw(ctx, visualTime)); player.draw(ctx, visualTime); particles.draw(ctx); ctx.restore();
  if (flash > 0) { ctx.fillStyle = `rgba(255,248,232,${flash})`; ctx.fillRect(0, 0, 960, 540); }
}

let previous = performance.now();
let accumulator = 0;
function frame(now) {
  const delta = Math.min(.1, (now - previous) / 1000); previous = now; accumulator += delta;
  while (accumulator >= 1 / 60) { update(1 / 60); accumulator -= 1 / 60; }
  render(); requestAnimationFrame(frame);
}
requestAnimationFrame(frame);