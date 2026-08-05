import { Input } from './input.js';
import { AudioManager } from './audio.js';
import { ParticleSystem } from './particles.js';
import { LEVELS } from './levels.js';
import { Player } from './player.js';
import { Star, Enemy, Goal, aabb } from './entities.js';
import { UI } from './ui.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const VIEW_W = 960, VIEW_H = 540;
let dpr = 1;

const audio = new AudioManager();
const particles = new ParticleSystem();
let game;

class Game {
  constructor() {
    this.state = 'title';
    this.levelIndex = 0;
    this.score = 0;
    this.best = Number(localStorage.getItem('miloBestScore') || 0);
    this.upgrades = { speed: 0, jump: 0, hp: 0 };
    this.cameraX = 0;
    this.shake = 0;
    this.flash = 0;
    this.time = 0;
    this.messageCooldown = 0;
    this.loadLevel(0);
  }

  loadLevel(index) {
    this.levelIndex = index;
    this.level = LEVELS[index];
    this.player = new Player(this.level.spawn, this.upgrades);
    this.stars = this.level.stars.map(s => new Star(s.x, s.y));
    this.enemies = this.level.enemies.map(e => new Enemy(e.x, this.level.platforms[e.platform], e.range, index === 2 ? '#ac69de' : '#6955c9'));
    this.goal = new Goal(this.level.goal.x, this.level.goal.y);
    this.collected = 0;
    this.cameraX = 0;
    this.levelTime = 0;
  }

  startRun() {
    this.score = 0; this.upgrades = { speed: 0, jump: 0, hp: 0 }; this.loadLevel(0);
    this.state = 'playing'; ui.hideOverlay(); ui.setHud(true); audio.startMusic();
    ui.toast('Find the good stars for Lumi!'); audio.sfx('click');
  }

  pause() {
    if (this.state === 'playing') { this.state = 'pause'; ui.showPause(); }
    else if (this.state === 'pause') { this.state = 'playing'; ui.hideOverlay(); }
  }

  damage(direction) {
    if (this.player.takeDamage(direction, particles, audio)) {
      this.shake = .25; this.flash = .13;
      if (this.player.hp <= 0) this.end(false);
      else ui.toast('Ouch! Watch the grumpy fuzzballs.');
    }
  }

  fall() {
    this.player.hp -= 1; audio.sfx('hit'); particles.burst(this.player.x + 15, 480, '#ffb36b', 16, 170); this.shake = .25;
    if (this.player.hp <= 0) this.end(false);
    else { this.player.resetAtSpawn(); ui.toast('Mind the gaps!'); }
  }

  completeLevel() {
    this.score += 100 + this.collected * 25;
    audio.sfx('goal'); particles.burst(this.goal.x + 23, this.goal.y + 30, '#65f2df', 28, 220); this.shake = .3;
    if (this.levelIndex === LEVELS.length - 1) { this.score += 300; this.end(true); return; }
    this.state = 'upgrade';
    ui.showUpgrade(this.level.name, (choice) => {
      this.upgrades[choice] += 1;
      this.loadLevel(this.levelIndex + 1);
      this.state = 'playing'; ui.hideOverlay(); ui.setHud(true); ui.toast(`${this.level.name}: Lumi left a clue ahead!`); audio.sfx('click');
    });
  }

  end(won) {
    this.state = won ? 'win' : 'gameover';
    this.best = Math.max(this.best, this.score);
    localStorage.setItem('miloBestScore', String(this.best));
    if (won) { audio.sfx('win'); ui.showWin(this.score, this.best); }
    else ui.showGameOver(this.score, this.best);
  }

  update(dt) {
    this.time += dt; particles.update(dt);
    if (this.shake > 0) this.shake -= dt;
    if (this.flash > 0) this.flash -= dt;
    if (this.state !== 'playing') return;
    this.levelTime += dt;
    this.player.update(dt, input, this.level.platforms, this.level.width, audio, particles);
    for (const star of this.stars) {
      star.update(dt);
      if (!star.collected && star.touches(this.player)) {
        star.collected = true; this.collected += 1; this.score += 10; audio.sfx('star'); particles.burst(star.x, star.y, '#ffe27a', 14, 145); this.shake = .08;
      }
    }
    for (const enemy of this.enemies) {
      enemy.update(dt);
      if (aabb(this.player, enemy)) this.damage(this.player.x < enemy.x ? -1 : 1);
    }
    if (this.player.y > VIEW_H + 90) this.fall();
    const open = this.collected >= this.level.required;
    if (aabb(this.player, this.goal)) {
      if (open && !this.goal.welcomed) { this.goal.welcomed = true; this.completeLevel(); }
      else if (!open && this.messageCooldown <= 0) { this.messageCooldown = 1.5; ui.toast(`The heart gate needs ${this.level.required - this.collected} more star${this.level.required - this.collected === 1 ? '' : 's'}.`); audio.sfx('click'); }
    }
    if (this.messageCooldown > 0) this.messageCooldown -= dt;
    const target = Math.max(0, Math.min(this.level.width - VIEW_W, this.player.x - VIEW_W * .38));
    this.cameraX += (target - this.cameraX) * Math.min(1, dt * 7);
    ui.updateHud(this.levelIndex + 1, LEVELS.length, this.collected, this.stars.length, this.player.hp, this.player.maxHp, this.score);
  }

  draw() {
    drawSky(ctx, this.level, this.cameraX, this.time);
    const sx = this.shake > 0 ? (Math.random() - .5) * this.shake * 28 : 0;
    const sy = this.shake > 0 ? (Math.random() - .5) * this.shake * 20 : 0;
    ctx.save(); ctx.translate(-this.cameraX + sx, sy);
    drawWorldDecor(ctx, this.level, this.time);
    for (const p of this.level.platforms) drawPlatform(ctx, p, this.levelIndex);
    for (const star of this.stars) star.draw(ctx, this.time);
    const open = this.collected >= this.level.required;
    this.goal.draw(ctx, this.time, open, this.levelIndex === LEVELS.length - 1);
    for (const enemy of this.enemies) enemy.draw(ctx);
    this.player.draw(ctx, this.time);
    particles.draw(ctx);
    ctx.restore();
    if (this.flash > 0) { ctx.fillStyle = `rgba(255,100,130,${this.flash * 2})`; ctx.fillRect(0, 0, VIEW_W, VIEW_H); }
  }
}

function drawSky(context, level, camera, time) {
  const gradient = context.createLinearGradient(0, 0, 0, VIEW_H);
  gradient.addColorStop(0, level.theme[0]); gradient.addColorStop(1, level.theme[1]);
  context.fillStyle = gradient; context.fillRect(0, 0, VIEW_W, VIEW_H);
  context.globalAlpha = .18;
  for (let i = 0; i < 8; i++) {
    const x = ((i * 173 - camera * (.08 + i * .012)) % 1100 + 1100) % 1100 - 70;
    const y = 70 + (i * 47) % 200 + Math.sin(time * .25 + i) * 10;
    context.fillStyle = i % 2 ? '#fff5d0' : '#c4aaff'; context.beginPath(); context.arc(x, y, 22 + i * 4, 0, Math.PI * 2); context.fill();
  }
  context.globalAlpha = 1;
}

function drawWorldDecor(context, level, time) {
  context.globalAlpha = .27;
  for (let x = 40; x < level.width; x += 170) {
    const y = 450 + Math.sin(x * .04) * 6;
    context.fillStyle = '#fff1bd'; context.beginPath(); context.arc(x, y, 3 + Math.sin(time * 2 + x) * 1.5, 0, Math.PI * 2); context.fill();
    context.fillStyle = '#73e0bd'; context.fillRect(x - 1, y + 4, 2, 18);
  }
  context.globalAlpha = 1;
}

function drawPlatform(context, p, index) {
  const colors = [['#5e4a9e','#403374'],['#b85e83','#7c3d77'],['#403e92','#26275c'],['#3e9b96','#286076']][index];
  const gradient = context.createLinearGradient(0, p.y, 0, p.y + p.h); gradient.addColorStop(0, colors[0]); gradient.addColorStop(1, colors[1]);
  context.fillStyle = gradient; context.shadowColor = 'rgba(20,10,55,.28)'; context.shadowBlur = 12; context.shadowOffsetY = 6;
  context.beginPath(); context.roundRect(p.x, p.y, p.w, p.h, 7); context.fill(); context.shadowColor = 'transparent'; context.shadowBlur = 0; context.shadowOffsetY = 0;
  context.fillStyle = '#74e0c0'; context.fillRect(p.x + 5, p.y, Math.max(0, p.w - 10), 4);
  for (let x = p.x + 18; x < p.x + p.w - 8; x += 28) { context.fillStyle = 'rgba(255,255,255,.08)'; context.fillRect(x, p.y + 10, 4, Math.min(24, p.h - 13)); }
}

function resize() {
  dpr = Math.min(2, window.devicePixelRatio || 1); canvas.width = VIEW_W * dpr; canvas.height = VIEW_H * dpr; canvas.style.aspectRatio = `${VIEW_W}/${VIEW_H}`; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

const ui = new UI({
  onPause: () => { audio.sfx('click'); game.pause(); },
  onClick: (action) => {
    audio.init(); audio.sfx('click');
    if (action === 'start' || action === 'restart') game.startRun();
    if (action === 'resume') { game.state = 'playing'; ui.hideOverlay(); ui.setHud(true); }
    if (action === 'menu') { game.state = 'title'; ui.showTitle(game.best); }
    if (['speed', 'jump', 'hp'].includes(action)) ui.callbacks.onUpgrade?.(action);
  }
});
const input = new Input({ onPause: () => game.pause() });
game = new Game();
ui.showTitle(game.best);
resize(); window.addEventListener('resize', resize);

let previous = performance.now(), accumulator = 0;
function frame(now) {
  const delta = Math.min(.1, (now - previous) / 1000); previous = now; accumulator += delta;
  const fixed = 1 / 60;
  while (accumulator >= fixed) { game.update(fixed); accumulator -= fixed; }
  game.draw(); requestAnimationFrame(frame);
}
requestAnimationFrame(frame);