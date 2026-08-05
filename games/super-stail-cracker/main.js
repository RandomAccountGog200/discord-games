import { COLORS, FIXED_STEP, MAX_WAVE } from './config.js';
import { clamp, circleAABB, circleHit, distance, choose } from './utils.js';
import { AudioManager } from './audio.js';
import { Input } from './input.js';
import { ParticleSystem } from './particles.js';
import { generateLevel, findSpawn } from './levels.js';
import { Block, Bullet, Enemy, Pickup, Player } from './entities.js';
import { UI } from './ui.js';

class Game {
  constructor(canvas, ui, input, audio, fx) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.ui = ui; this.input = input; this.audio = audio; this.fx = fx; this.width = 900; this.height = 600; this.state = 'menu'; this.wave = 1; this.score = 0; this.best = Number(localStorage.getItem('stailCrackerBest') || 0); this.blocks = []; this.enemies = []; this.bullets = []; this.enemyBullets = []; this.pickups = []; this.player = new Player(100, 300); this.shake = 0; this.flash = 0; this.clearTimer = 0; this.clearQueued = false; this.upgrades = { damage: 0, armor: 0, speed: 0, fire: 0, magnet: 0, size: 0 };
    this.upgradePool = [
      { id: 'damage', icon: '✹', name: 'EXTRA CRUNCH', description: '+8 cracker-bit damage.' },
      { id: 'armor', icon: '◆', name: 'BUTTER ARMOR', description: '+25 maximum integrity and heal 25.' },
      { id: 'speed', icon: '➜', name: 'SUGAR RUSH', description: '+32 movement speed.' },
      { id: 'fire', icon: '⚡', name: 'RAPID CRACK', description: 'Fire 18% faster.' },
      { id: 'magnet', icon: '◎', name: 'CRUMB MAGNET', description: 'Pickup range grows by 55.' },
      { id: 'size', icon: '●', name: 'THICK AMMO', description: 'Bigger bits that hit harder.' }
    ];
  }
  resize(w, h) { this.width = w; this.height = h; if (this.player) { this.player.x = clamp(this.player.x, this.player.r + 5, w - this.player.r - 5); this.player.y = clamp(this.player.y, this.player.r + 5, h - this.player.r - 5); } }
  start() { this.audio.init(); this.audio.startMusic(); this.wave = 1; this.score = 0; this.upgrades = { damage: 0, armor: 0, speed: 0, fire: 0, magnet: 0, size: 0 }; this.player = new Player(100, this.height / 2); this.startWave(); this.state = 'playing'; this.ui.showPlaying(matchMedia('(pointer: coarse)').matches); this.audio.click(); }
  startWave() {
    const level = generateLevel(this.wave, this.width, this.height); this.blocks = level.blocks.map(b => new Block(b)); this.enemies = []; this.bullets = []; this.enemyBullets = []; this.pickups = []; this.player.x = 100; this.player.y = this.height / 2; this.player.hp = Math.min(this.player.maxHp, this.player.hp + 12); this.clearQueued = false;
    for (const spec of level.specs) { const pos = findSpawn(spec, this.blocks, this.width, this.height, this.player); this.enemies.push(new Enemy(pos.x, pos.y, spec.type, this.wave)); }
    this.audio.wave(); if (this.wave === MAX_WAVE) this.audio.boss();
  }
  togglePause() { if (this.state === 'playing') { this.state = 'pause'; this.ui.showPause(); this.audio.click(); } else if (this.state === 'pause') this.resume(); }
  resume() { this.state = 'playing'; this.ui.closePause(); this.audio.click(); }
  menu() { this.state = 'menu'; this.audio.stopMusic(); this.ui.showMenu(this.best); }
  applyUpgrade(id) {
    this.upgrades[id]++;
    if (id === 'damage') this.player.damage += 8;
    if (id === 'armor') { this.player.maxHp += 25; this.player.hp = Math.min(this.player.maxHp, this.player.hp + 25); }
    if (id === 'speed') this.player.speed += 32;
    if (id === 'fire') this.player.fireRate *= .82;
    if (id === 'magnet') this.player.pickupRadius += 55;
    if (id === 'size') { this.player.bulletSize += 1.4; this.player.damage += 4; }
    this.wave++; this.startWave(); this.state = 'playing'; this.ui.showPlaying(matchMedia('(pointer: coarse)').matches); this.audio.click();
  }
  end(win) { if (this.state === 'gameover' || this.state === 'win') return; this.state = win ? 'win' : 'gameover'; this.audio.stopMusic(); this.fx.burst(this.player.x, this.player.y, win ? COLORS.gold : COLORS.pink, 35, 250); if (this.score > this.best) { this.best = this.score; localStorage.setItem('stailCrackerBest', String(this.best)); } this.ui.showResult(win, this.score, this.wave, this.best); }
  update(dt) {
    if (this.state !== 'playing') return;
    this.player.update(dt, this.input, this); for (const b of this.blocks) b.update(dt); for (const e of this.enemies) e.update(dt, this); for (const b of this.bullets) b.update(dt); for (const b of this.enemyBullets) b.update(dt); for (const p of this.pickups) p.update(dt, this);
    this.resolveBullets(); this.enemies = this.enemies.filter(e => e.hp > 0); this.bullets = this.bullets.filter(b => b.life > 0); this.enemyBullets = this.enemyBullets.filter(b => b.life > 0); this.pickups = this.pickups.filter(p => p.life > 0); this.blocks = this.blocks.filter(b => b.hp > 0);
    this.fx.update(dt); this.shake = Math.max(0, this.shake - dt * 22); this.flash = Math.max(0, this.flash - dt);
    if (!this.enemies.length && !this.clearQueued) { this.clearQueued = true; this.clearTimer = .9; this.audio.wave(); this.score += 500 * this.wave; }
    if (this.clearQueued) { this.clearTimer -= dt; if (this.clearTimer <= 0) { if (this.wave >= MAX_WAVE) this.end(true); else this.openUpgrade(); } }
    this.ui.update(this);
  }
  resolveBullets() {
    for (const bullet of this.bullets) {
      if (bullet.life <= 0) continue;
      if (bullet.x < -30 || bullet.x > this.width + 30 || bullet.y < -30 || bullet.y > this.height + 30) { bullet.life = 0; continue; }
      for (const block of this.blocks) if (block.hp > 0 && circleAABB(bullet, block)) { const dead = block.hit(bullet.damage); bullet.life = 0; this.fx.burst(bullet.x, bullet.y, COLORS.orange, dead ? 12 : 4, 90); this.score += dead ? 50 : 5; this.shake = Math.max(this.shake, dead ? 4 : 1); break; }
      if (bullet.life <= 0) continue;
      for (const enemy of this.enemies) if (enemy.hp > 0 && circleHit(bullet, enemy)) { const dead = enemy.damage(bullet.damage); bullet.life = 0; this.fx.burst(bullet.x, bullet.y, enemy.type === 'boss' ? COLORS.pink : COLORS.orange, dead ? 17 : 5, dead ? 180 : 80); this.audio.hit(); this.shake = Math.max(this.shake, dead ? 7 : 2); if (dead) { this.score += enemy.type === 'boss' ? 5000 : enemy.type === 'beetle' ? 300 : 150; if (Math.random() < .55 || enemy.type === 'boss') this.pickups.push(new Pickup(enemy.x, enemy.y)); } break; }
    }
    for (const bullet of this.enemyBullets) {
      if (bullet.life <= 0) continue;
      if (bullet.x < -20 || bullet.x > this.width + 20 || bullet.y < -20 || bullet.y > this.height + 20) { bullet.life = 0; continue; }
      for (const block of this.blocks) if (block.hp > 0 && circleAABB(bullet, block)) { bullet.life = 0; break; }
      if (bullet.life > 0 && circleHit(bullet, this.player)) { bullet.life = 0; this.player.hurt(bullet.damage, this); }
    }
  }
  openUpgrade() { this.state = 'upgrade'; const options = [...this.upgradePool].sort(() => Math.random() - .5).slice(0, 3); this.ui.showUpgrade(options, this.wave, id => this.applyUpgrade(id)); }
  draw() {
    const ctx = this.ctx; ctx.clearRect(0, 0, this.width, this.height); const grad = ctx.createLinearGradient(0, 0, this.width, this.height); grad.addColorStop(0, '#17142d'); grad.addColorStop(1, '#292044'); ctx.fillStyle = grad; ctx.fillRect(0, 0, this.width, this.height);
    ctx.save(); const sx = this.shake ? (Math.random() - .5) * this.shake : 0, sy = this.shake ? (Math.random() - .5) * this.shake : 0; ctx.translate(sx, sy);
    ctx.strokeStyle = COLORS.grid; ctx.lineWidth = 1; const grid = 42; for (let x = 0; x < this.width; x += grid) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, this.height); ctx.stroke(); } for (let y = 0; y < this.height; y += grid) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(this.width, y); ctx.stroke(); }
    for (const b of this.blocks) b.draw(ctx); for (const p of this.pickups) p.draw(ctx); for (const b of this.bullets) b.draw(ctx); for (const b of this.enemyBullets) b.draw(ctx); for (const e of this.enemies) e.draw(ctx); this.player.draw(ctx); this.fx.draw(ctx); ctx.restore();
    if (this.enemies.some(e => e.type === 'boss')) { const boss = this.enemies.find(e => e.type === 'boss'); ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(this.width * .25, this.height - 28, this.width * .5, 8); ctx.fillStyle = COLORS.pink; ctx.fillRect(this.width * .25, this.height - 28, this.width * .5 * boss.hp / boss.maxHp, 8); ctx.fillStyle = COLORS.cream; ctx.font = 'bold 10px Arial'; ctx.textAlign = 'center'; ctx.fillText('STAIL KING', this.width / 2, this.height - 35); }
    if (this.clearQueued && this.state === 'playing') { ctx.fillStyle = COLORS.gold; ctx.font = '900 25px Arial'; ctx.textAlign = 'center'; ctx.fillText('WAVE CRUNCHED', this.width / 2, this.height / 2); }
    if (this.flash > 0) { ctx.fillStyle = `rgba(255,80,100,${this.flash})`; ctx.fillRect(0, 0, this.width, this.height); }
  }
}

const canvas = document.querySelector('#game-canvas');
const ui = new UI();
const audio = new AudioManager();
const fx = new ParticleSystem();
const input = new Input(canvas, document.querySelector('#joystick'), document.querySelector('#joystick-knob'), document.querySelector('#dash-button'));
const game = new Game(canvas, ui, input, audio, fx);
ui.bind({ start: () => game.start(), resume: () => game.resume(), restart: () => game.start(), menu: () => game.menu(), pause: () => game.togglePause() });
window.addEventListener('keydown', e => { if (e.code === 'Escape') game.togglePause(); });
function resize() { const r = canvas.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1); canvas.width = Math.floor(r.width * dpr); canvas.height = Math.floor(r.height * dpr); game.ctx.setTransform(dpr, 0, 0, dpr, 0, 0); game.resize(r.width, r.height); }
window.addEventListener('resize', resize); resize(); ui.showMenu(game.best);
let last = performance.now(), accumulator = 0;
function frame(now) { const delta = Math.min(.1, (now - last) / 1000); last = now; accumulator += delta; while (accumulator >= FIXED_STEP) { game.update(FIXED_STEP); accumulator -= FIXED_STEP; } game.draw(); requestAnimationFrame(frame); }
requestAnimationFrame(frame);