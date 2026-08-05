import { Input } from './input.js';
import { AudioSystem } from './audio.js';
import { ParticleSystem } from './particles.js';
import { Station } from './entities.js';
import { LevelDirector } from './levels.js';
import { UI } from './ui.js';

const W = 1280, H = 720;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rectHit = (x, y, r) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
const money = n => `$${Math.floor(n).toLocaleString()}`;

class SteakhouseGame {
  constructor(canvas, ui, input, audio) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d'); this.ui = ui; this.input = input; this.audio = audio;
    this.particles = new ParticleSystem(); this.stations = [new Station(0), new Station(1), new Station(2)];
    this.state = 'menu'; this.awaitingUpgrade = false; this.selected = 0; this.wave = 1; this.score = 0; this.combo = 0; this.best = Number(localStorage.getItem('kingVonSteakhouseBest') || 0);
    this.maxHearts = 3; this.hearts = 3; this.mods = { speed: 1, tip: 1, patience: 0, quality: 0 };
    this.shake = 0; this.flash = 0; this.elapsed = 0; this.message = 'The dinner rush is coming.';
    this.director = null;
    input.onCanvasTap((x, y) => this.canvasTap(x, y));
    this.bindUI();
  }
  bindUI() {
    const bind = (id, fn) => this.input.bindButton(document.getElementById(id), fn);
    bind('startButton', () => { this.audio.unlock(); this.audio.click(); this.start(); });
    bind('resumeButton', () => { this.audio.click(); this.resume(); });
    bind('quitButton', () => { this.audio.click(); this.toMenu(); });
    bind('againButton', () => { this.audio.unlock(); this.audio.click(); this.start(); });
    bind('endMenuButton', () => { this.audio.click(); this.toMenu(); });
    bind('touchPause', () => { this.audio.click(); this.pause(); });
    document.querySelectorAll('[data-action]').forEach(button => {
      this.input.bindButton(button, () => this.action(button.dataset.action));
    });
  }
  start() {
    this.state = 'playing'; this.awaitingUpgrade = false; this.wave = 1; this.score = 0; this.combo = 0; this.maxHearts = 3; this.hearts = 3;
    this.mods = { speed: 1, tip: 1, patience: 0, quality: 0 }; this.selected = 0; this.particles.items = []; this.elapsed = 0;
    this.startWave(); this.ui.showPlaying(); this.ui.toast('SHIFT 1 · FIRE UP THE GRILLS');
  }
  startWave() {
    this.director = new LevelDirector(this.wave, this.mods);
    this.message = `Wave ${this.wave}: keep the tickets moving.`;
    this.stations.forEach(s => { s.order = null; });
  }
  toMenu() { this.state = 'menu'; this.awaitingUpgrade = false; this.ui.showMenu(this.best); }
  pause() { if (this.state === 'playing' && !this.awaitingUpgrade) { this.state = 'paused'; this.ui.showPause(); } }
  resume() { if (this.state === 'paused') { this.state = 'playing'; this.ui.showPlaying(); } }
  end(win) {
    this.state = win ? 'win' : 'gameover';
    if (this.score > this.best) { this.best = this.score; localStorage.setItem('kingVonSteakhouseBest', String(Math.floor(this.best))); }
    this.audio[win ? 'upgrade' : 'miss'](); this.ui.showEnd(win, this.score, this.best, this.wave);
  }
  fail(order, reason) {
    this.hearts--; this.combo = 0; this.shake = .35; this.flash = .16; this.message = `${reason} — a customer walked.`; this.audio.miss();
    this.particles.burst(640, 390, '#d94b3d', 20, 1); this.particles.text(640, 330, '− CUSTOMER', '#ed6658');
    if (this.hearts <= 0) this.end(false);
  }
  action(action) {
    if (this.state !== 'playing' || this.awaitingUpgrade) return;
    if (action.startsWith('select:')) { this.selected = Number(action.split(':')[1]); this.audio.select(); return; }
    const station = this.stations[this.selected];
    if (action === 'heatDown') { station.changeHeat(-.1); this.audio.click(); }
    if (action === 'heatUp') { station.changeHeat(.1); this.audio.click(); }
    if (action === 'flip') this.doFlip(station);
    if (action === 'serve') this.doServe(station);
  }
  doFlip(station) {
    const result = station.flip();
    if (result.kind === 'flip') {
      this.audio.flip(); this.shake = .1;
      const color = result.perfect ? '#e8b65c' : '#e5a082';
      this.particles.burst(640 + (station.index - 1) * 420, 340, color, result.perfect ? 25 : 12, .75);
      this.message = result.perfect ? 'Perfect flip — keep that rhythm.' : 'Flipped. Watch the finish line.';
      if (result.perfect) this.score += 10;
    } else this.ui.toast('THAT STEAK HAS ALREADY BEEN FLIPPED');
  }
  doServe(station) {
    const result = station.serve(this.mods);
    if (result.kind === 'blocked') { this.ui.toast(!station.order ? 'NO TICKET ON THIS GRILL' : !station.flipped ? 'FLIP IT FIRST' : 'NOT READY YET'); return; }
    this.combo++; const comboBonus = this.combo > 1 ? Math.min(100, this.combo * 8) : 0; const gained = result.points + comboBonus; this.score += gained;
    const px = 640 + (station.index - 1) * 420; this.particles.burst(px, 320, result.quality > .7 ? '#e8b65c' : '#d99a62', 25, 1); this.particles.text(px, 280, `+${gained} ${result.grade}`, result.quality > .7 ? '#ffe3a0' : '#e5b386');
    this.shake = result.quality > .75 ? .14 : .05; this.flash = result.quality > .85 ? .12 : 0; this.audio.serve(result.quality > .75);
    this.message = `${result.order.recipe} ${result.order.label()} served ${result.grade.toLowerCase()}.`;
  }
  canvasTap(x, y) {
    if (this.state !== 'playing' || this.awaitingUpgrade) return;
    const xs = [40, 460, 880], sy = 145, sw = 360, sh = 430;
    for (let i = 0; i < 3; i++) {
      if (rectHit(x, y, { x: xs[i], y: sy, w: sw, h: sh })) {
        this.selected = i;
        const by = sy + sh - 45, bw = (sw - 48) / 4;
        if (y >= by && y <= by + 35) {
          const local = x - xs[i] - 12, slot = Math.floor(local / (bw + 8));
          if (slot === 0) this.action('heatDown'); else if (slot === 1) this.action('flip'); else if (slot === 2) this.action('heatUp'); else if (slot === 3) this.action('serve');
        } else this.audio.select();
        return;
      }
    }
  }
  chooseUpgrade(index) {
    const options = this.upgradeOptions(); const chosen = options[index]; if (!chosen) return;
    chosen.apply(); this.audio.upgrade(); this.awaitingUpgrade = false; this.wave++;
    if (this.wave > 5) { this.end(true); return; }
    this.ui.showPlaying(); this.startWave(); this.ui.toast(`${chosen.name.toUpperCase()} INSTALLED`);
  }
  upgradeOptions() {
    const all = [
      { icon: '⚡', name: 'TURBO GRILL', description: 'Every steak cooks 18% faster. More plates, more momentum.', apply: () => this.mods.speed *= 1.18 },
      { icon: '◷', name: 'PATIENT GUESTS', description: 'Customers wait 7 extra seconds before taking their business elsewhere.', apply: () => this.mods.patience += 7 },
      { icon: '$', name: 'GOLDEN FORK', description: 'All serving tips increase by 25%. Quality still matters.', apply: () => this.mods.tip *= 1.25 },
      { icon: '♥', name: 'FRESH CREW', description: 'Add one mistake to the night before the doors close.', apply: () => { this.maxHearts++; this.hearts++; } },
      { icon: '✦', name: 'CHEF’S FOCUS', description: 'A precise kitchen adds a small quality bonus to every plate.', apply: () => this.mods.quality += .08 }
    ];
    const shuffled = all.sort(() => Math.random() - .5); return shuffled.slice(0, 3);
  }
  update(dt) {
    if (this.state === 'playing' && !this.awaitingUpgrade) {
      if (this.input.consume('Escape') || this.input.consume('KeyP')) { this.pause(); return; }
      if (this.input.consume('Digit1')) this.action('select:0'); if (this.input.consume('Digit2')) this.action('select:1'); if (this.input.consume('Digit3')) this.action('select:2');
      if (this.input.consume('ArrowLeft')) this.action('heatDown'); if (this.input.consume('ArrowRight')) this.action('heatUp');
      if (this.input.consume('KeyF')) this.action('flip'); if (this.input.consume('Space') || this.input.consume('Enter')) this.action('serve');
      const finishedSpawning = this.director.update(dt, this.stations, (o, reason) => this.fail(o, reason));
      for (const station of this.stations) { const result = station.update(dt, this.mods); if (result?.kind === 'fail') this.fail(result.order, result.reason); }
      if (finishedSpawning && this.state === 'playing') {
        if (this.wave >= 5) this.end(true);
        else { this.awaitingUpgrade = true; this.message = 'Shift complete. Upgrade the house.'; this.ui.showUpgrade(this.upgradeOptions(), i => this.chooseUpgrade(i)); }
      }
      this.elapsed += dt;
    }
    this.particles.update(dt); this.shake = Math.max(0, this.shake - dt); this.flash = Math.max(0, this.flash - dt);
  }
  drawBackground(ctx) {
    const bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#130c13'); bg.addColorStop(.52, '#24151c'); bg.addColorStop(1, '#100a10'); ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(128,31,35,.08)'; for (let i = 0; i < 12; i++) ctx.fillRect(i * 130, 100, 1, 580);
    ctx.fillStyle = '#321c22'; ctx.fillRect(0, 104, W, 3); ctx.fillStyle = '#825134'; ctx.fillRect(0, 108, W, 2);
  }
  drawHUD(ctx) {
    ctx.textAlign = 'left'; ctx.fillStyle = '#f6dc9b'; ctx.font = 'bold 22px Georgia'; ctx.fillText("KING VON'S", 40, 42); ctx.fillStyle = '#d94b3d'; ctx.font = 'bold 14px Arial'; ctx.fillText('STEAKHOUSE', 42, 62);
    ctx.fillStyle = '#9d8777'; ctx.font = 'bold 11px Arial'; ctx.fillText(`WAVE ${this.wave} / 5`, 310, 36); ctx.fillStyle = '#3b2529'; ctx.fillRect(310, 46, 240, 8); const duration = this.director ? this.director.config.duration : 1; const progress = this.director ? clamp(this.director.elapsed / duration, 0, 1) : 0; ctx.fillStyle = '#d0944b'; ctx.fillRect(310, 46, 240 * progress, 8);
    ctx.textAlign = 'right'; ctx.fillStyle = '#e8b65c'; ctx.font = 'bold 24px Georgia'; ctx.fillText(money(this.score), 1240, 43); ctx.fillStyle = '#9d8777'; ctx.font = '10px Arial'; ctx.fillText('TONIGHT’S TAKE', 1240, 61);
    ctx.textAlign = 'left'; ctx.fillStyle = '#d94b3d'; ctx.font = '20px Georgia'; ctx.fillText('♥'.repeat(this.hearts), 650, 45); ctx.fillStyle = '#55313a'; ctx.fillText('♥'.repeat(Math.max(0, this.maxHearts - this.hearts)), 650 + this.hearts * 18, 45);
    ctx.fillStyle = '#cdb894'; ctx.font = 'bold 11px Arial'; ctx.fillText(`TICKETS WAITING: ${this.director ? this.director.queueCount() : 0}`, 930, 62);
  }
  draw(ctx) {
    ctx.save(); this.drawBackground(ctx); if (this.state === 'menu') { ctx.restore(); return; }
    const sx = (Math.random() - .5) * this.shake * 22, sy = (Math.random() - .5) * this.shake * 22; ctx.translate(sx, sy);
    this.drawHUD(ctx);
    ctx.fillStyle = '#94755e'; ctx.font = 'italic 14px Georgia'; ctx.textAlign = 'center'; ctx.fillText(this.message, W / 2, 124);
    const xs = [40, 460, 880]; for (let i = 0; i < 3; i++) this.stations[i].draw(ctx, xs[i], 145, 360, 430, i === this.selected);
    ctx.fillStyle = '#3b2528'; ctx.fillRect(40, 605, 1200, 1); ctx.fillStyle = '#96765f'; ctx.font = '11px Arial'; ctx.textAlign = 'left'; ctx.fillText('SELECT A GRILL  ·  LOWER HEAT TO SLOW THE COOK  ·  SERVE INSIDE THE GOLD TARGET MARKER', 40, 628);
    if (this.combo > 1) { ctx.textAlign = 'right'; ctx.fillStyle = '#e8b65c'; ctx.font = 'bold 15px Georgia'; ctx.fillText(`SERVICE STREAK ×${this.combo}`, 1240, 628); }
    this.particles.draw(ctx); ctx.restore();
    if (this.flash > 0) { ctx.fillStyle = `rgba(255,230,170,${this.flash * 2})`; ctx.fillRect(0, 0, W, H); }
  }
}

const canvas = document.getElementById('gameCanvas');
const ui = new UI();
const input = new Input(canvas);
const audio = new AudioSystem();
const game = new SteakhouseGame(canvas, ui, input, audio);
ui.showMenu(game.best);
let last = performance.now(), accumulator = 0;
function frame(now) {
  const dt = Math.min(.1, (now - last) / 1000); last = now; accumulator += dt;
  while (accumulator >= 1 / 60) { game.update(1 / 60); accumulator -= 1 / 60; }
  game.draw(game.ctx); requestAnimationFrame(frame);
}
requestAnimationFrame(frame);