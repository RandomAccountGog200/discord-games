import { Player, Brick, Sheldon, Book } from './entities.js';
import { createLevel } from './levels.js';
import { ParticleSystem } from './particles.js';
import { WORLD, dist, roundedRect } from './utils.js';

const UPGRADES = [
  { id: 'quick', icon: '»»', name: 'QUICK CATALOG', description: '+48 movement speed and a faster dash.' },
  { id: 'magnet', icon: '✦', name: 'LIBRARIAN MAGNET', description: 'Books are pulled from much farther away.' },
  { id: 'shield', icon: '◆', name: 'THICK GLASSES', description: 'Gain one extra hit point.' },
  { id: 'smash', icon: '✹', name: 'DASH-HARD COVER', description: 'Dashing through bricks destroys them.' }
];

export class GameSession {
  constructor(audio) { this.audio = audio; this.particles = new ParticleSystem(); this.reset(); }

  reset() {
    this.level = 1; this.score = 0; this.upgrades = {}; this.phase = 'playing'; this.shake = 0; this.flash = 0; this.damageCooldown = 0; this.clearTimer = 0; this.time = 0;
    this.loadLevel();
  }

  loadLevel() {
    const data = createLevel(this.level);
    this.bricks = data.bricks.map(b => new Brick(b));
    this.books = data.books.map(b => new Book(b));
    this.sheldons = data.sheldons.map(s => new Sheldon(s.x, s.y, this.level));
    this.player = new Player(this.upgrades);
    this.audio.level();
    this.particles.burst(80, 300, '#4de5ff', 24, 170);
  }

  getUpgradeChoices() {
    const start = (this.level * 2) % UPGRADES.length;
    return [0, 1, 2].map(i => UPGRADES[(start + i) % UPGRADES.length]);
  }

  applyUpgrade(id) {
    this.upgrades[id] = true;
    this.level++;
    this.phase = 'playing'; this.clearTimer = 0;
    this.loadLevel();
  }

  hurt(amount = 1) {
    if (this.player.invuln > 0 || this.damageCooldown > 0) return;
    this.player.hp -= amount; this.player.invuln = .85; this.damageCooldown = .3; this.shake = .35; this.flash = .18;
    this.particles.burst(this.player.x, this.player.y, '#ff537f', 18, 180); this.audio.hit();
    if (this.player.hp <= 0) { this.phase = 'dead'; this.audio.gameOver(); }
  }

  update(dt, input) {
    if (this.phase !== 'playing') return;
    this.time += dt; this.damageCooldown = Math.max(0, this.damageCooldown - dt); this.shake = Math.max(0, this.shake - dt); this.flash = Math.max(0, this.flash - dt);
    const move = input.getMove();
    if (input.consumeAction() && this.player.tryDash(input.getAim(), move)) { this.audio.dash(); this.shake = .12; }
    const smashed = this.player.update(dt, move, this.bricks, this.particles);
    for (const brick of smashed) {
      brick.destroyed = true; this.score += 35; this.particles.burst(brick.x + brick.w / 2, brick.y + brick.h / 2, '#ff727b', 16, 180); this.audio.smash(); this.shake = .16;
    }
    for (const book of this.books) {
      if (book.collected) continue;
      book.update(dt, this.player);
      if (dist(book.x, book.y, this.player.x, this.player.y) < this.player.radius + book.radius + 4) {
        book.collected = true; this.score += 100; this.particles.burst(book.x, book.y, '#68efff', 14, 130); this.audio.pickup();
      }
    }
    for (const sheldon of this.sheldons) {
      sheldon.update(dt, this.player, this.bricks);
      if (dist(sheldon.x, sheldon.y, this.player.x, this.player.y) < sheldon.radius + this.player.radius) {
        if (this.player.dashTime > 0) {
          sheldon.hp--; sheldon.stun = .8; sheldon.x += this.player.dashDir.x * 28; sheldon.y += this.player.dashDir.y * 28;
          this.score += 150; this.particles.burst(sheldon.x, sheldon.y, '#ff73ad', 20, 190); this.audio.smash(); this.shake = .18;
          if (sheldon.hp <= 0) sheldon.dead = true;
        } else this.hurt();
      }
    }
    this.sheldons = this.sheldons.filter(s => !s.dead);
    for (const brick of this.bricks) {
      if (!brick.destroyed && this.player.dashTime <= 0 && dist(this.player.x, this.player.y, brick.x + brick.w / 2, brick.y + brick.h / 2) < 35) this.hurt();
    }
    if (this.books.every(b => b.collected)) {
      this.clearTimer += dt;
      if (this.clearTimer > .65) { this.score += this.level * 500; this.phase = this.level >= 6 ? 'won' : 'complete'; this.particles.burst(this.player.x, this.player.y, '#fff27b', 35, 230); }
    }
    this.particles.update(dt);
  }

  drawBackground(ctx) {
    const bg = ctx.createLinearGradient(0, 0, 0, WORLD.height); bg.addColorStop(0, '#0b1b3c'); bg.addColorStop(1, '#050b1d'); ctx.fillStyle = bg; ctx.fillRect(0, 0, WORLD.width, WORLD.height);
    ctx.strokeStyle = 'rgba(83, 169, 221, .08)'; ctx.lineWidth = 1;
    for (let x = 20; x < WORLD.width; x += 40) { ctx.beginPath(); ctx.moveTo(x, 42); ctx.lineTo(x, WORLD.height); ctx.stroke(); }
    for (let y = 60; y < WORLD.height; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WORLD.width, y); ctx.stroke(); }
    ctx.strokeStyle = '#255176'; ctx.lineWidth = 2; roundedRect(ctx, 13, 42, WORLD.width - 26, WORLD.height - 55, 13); ctx.stroke();
    ctx.fillStyle = 'rgba(77,229,255,.08)'; ctx.fillRect(20, 48, 220, 3);
  }

  drawHud(ctx) {
    ctx.save(); ctx.fillStyle = '#dff7ff'; ctx.font = 'bold 15px Arial'; ctx.textAlign = 'left'; ctx.fillText(`DEWEY  /  SECTION ${this.level}`, 28, 27);
    ctx.fillStyle = '#89abc0'; ctx.font = '12px Arial'; ctx.fillText(`BOOKS ${this.books.filter(b => b.collected).length}/${this.books.length}`, 285, 27);
    ctx.textAlign = 'right'; ctx.fillStyle = '#fff'; ctx.font = 'bold 16px Arial'; ctx.fillText(this.score.toLocaleString(), 900, 27); ctx.fillStyle = '#7794a9'; ctx.font = '10px Arial'; ctx.fillText('SCORE', 900, 40);
    ctx.textAlign = 'left'; ctx.fillStyle = '#ff6e9e'; ctx.font = 'bold 12px Arial'; ctx.fillText('VITALS', 28, 575);
    for (let i = 0; i < this.player.maxHp; i++) { ctx.fillStyle = i < this.player.hp ? '#ff5d9b' : '#29354f'; ctx.shadowColor = i < this.player.hp ? '#ff5d9b' : 'transparent'; ctx.shadowBlur = 8; ctx.beginPath(); ctx.arc(84 + i * 19, 571, 6, 0, Math.PI * 2); ctx.fill(); }
    ctx.shadowBlur = 0; ctx.fillStyle = this.player.cooldown <= 0 ? '#67f0ff' : '#5e718c'; ctx.font = 'bold 11px Arial'; ctx.fillText(this.player.cooldown <= 0 ? 'DASH READY' : `DASH ${this.player.cooldown.toFixed(1)}s`, 170, 575);
    ctx.textAlign = 'right'; ctx.fillStyle = '#7897ad'; ctx.fillText('COLLECT EVERY BOOK TO ADVANCE', 900, 575); ctx.restore();
  }

  draw(ctx) {
    ctx.save(); this.drawBackground(ctx);
    const intensity = this.shake * 18; ctx.translate((Math.random() - .5) * intensity, (Math.random() - .5) * intensity);
    for (const brick of this.bricks) brick.draw(ctx, this.time);
    for (const book of this.books) if (!book.collected) book.draw(ctx);
    for (const sheldon of this.sheldons) sheldon.draw(ctx);
    this.player.draw(ctx); this.particles.draw(ctx); ctx.restore();
    this.drawHud(ctx);
    if (this.flash > 0) { ctx.fillStyle = `rgba(255,75,120,${this.flash * 1.8})`; ctx.fillRect(0, 0, WORLD.width, WORLD.height); }
  }
}