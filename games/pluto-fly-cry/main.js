import { Input } from './input.js';
import { AudioManager } from './audio.js';
import { ParticleSystem } from './particles.js';
import { Player } from './player.js';
import { generateStage, stageLength } from './levels.js';
import { collidesCircle } from './entities.js';
import { UI } from './ui.js';

const WORLD_W = 960;
const WORLD_H = 540;
const FIXED_DT = 1 / 120;
const MAX_STAGE = 5;

const UPGRADES = [
  { id: 'gravity', icon: '◒', name: 'SOFT ORBIT', description: 'Gravity is reduced by 18%. Float through tight spaces with grace.' },
  { id: 'thrust', icon: '✦', name: 'SUNWIND', description: 'Fly thrust is 20% stronger. Rise fast, fall on your terms.' },
  { id: 'cry', icon: '❄', name: 'DEEP FEELINGS', description: 'Cryometer capacity drops by 18%, so your super-cry arrives sooner.' },
  { id: 'armor', icon: '◇', name: 'ICE ARMOR', description: 'Gain one protective shield. A comet impact will not end the journey.' },
  { id: 'score', icon: '∞', name: 'LUCID HEART', description: 'All star and comet scores are increased by 25% from now on.' }
];

class Game {
  constructor(canvas, input, audio, ui) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d');
    this.input = input; this.audio = audio; this.ui = ui;
    this.particles = new ParticleSystem(); this.player = new Player();
    this.state = 'menu'; this.time = 0; this.camera = 0; this.distance = 0;
    this.stage = 1; this.stageStartDistance = 0; this.maxStage = MAX_STAGE;
    this.entities = []; this.score = 0; this.best = this.readBest(); this.combo = 1; this.comboTimer = 0;
    this.cryMeter = 0; this.cryMax = 100; this.scoreMult = 1; this.shield = 0;
    this.scrollSpeed = 150; this.shake = 0; this.flash = 0; this.hitStop = 0; this.cryPulse = 0; this.offers = [];
  }
  readBest() { return Number(localStorage.getItem('plutoFlyCryBest') || 0); }
  saveBest() { if (this.score > this.best) { this.best = Math.floor(this.score); localStorage.setItem('plutoFlyCryBest', this.best); } }
  start() {
    this.audio.resume(); this.audio.startMusic(); this.input.clear();
    this.state = 'playing'; this.time = 0; this.distance = 0; this.camera = 0; this.stage = 0;
    this.score = 0; this.combo = 1; this.comboTimer = 0; this.cryMeter = 0; this.cryMax = 100; this.scoreMult = 1; this.shield = 0;
    this.scrollSpeed = 150; this.shake = 0; this.flash = 0; this.hitStop = 0; this.player.reset(); this.entities = [];
    this.startStage(1); this.ui.showPlaying();
  }
  startStage(stage) {
    this.stage = stage; this.stageStartDistance = this.distance; this.scrollSpeed = 145 + stage * 16;
    this.entities = generateStage(stage, this.distance); this.player.y = 270; this.player.vy = 0;
    this.ui.showPlaying();
  }
  toMenu() { this.state = 'menu'; this.audio.stopMusic(); this.input.clear(); this.ui.showTitle(this.best); }
  pause() { if (this.state !== 'playing') return; this.state = 'paused'; this.audio.stopMusic(); this.ui.showPause(); }
  resume() { if (this.state !== 'paused') return; this.state = 'playing'; this.audio.startMusic(); this.ui.showPlaying(); }
  enterUpgrade() {
    if (this.stage >= MAX_STAGE) { this.finish(true); return; }
    this.state = 'upgrade'; this.audio.stopMusic();
    const pool = [...UPGRADES];
    this.offers = [];
    while (this.offers.length < 3) this.offers.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
    this.ui.showUpgrade(this.stage, this.offers, (offer) => this.chooseUpgrade(offer));
  }
  chooseUpgrade(offer) {
    if (this.state !== 'upgrade') return;
    this.audio.click();
    if (offer.id === 'gravity') this.player.gravity *= .82;
    if (offer.id === 'thrust') this.player.thrustPower *= 1.2;
    if (offer.id === 'cry') { this.cryMax = Math.max(55, this.cryMax * .82); this.cryMeter = Math.min(this.cryMeter, this.cryMax); }
    if (offer.id === 'armor') this.shield++;
    if (offer.id === 'score') this.scoreMult *= 1.25;
    this.startStage(this.stage + 1); this.audio.startMusic();
  }
  activateCry() {
    if (this.state !== 'playing' || this.cryMeter < this.cryMax) return;
    this.cryMeter -= this.cryMax; this.player.crying = .9; this.cryPulse = .6; this.audio.cry();
    this.shake = Math.max(this.shake, 7); this.flash = Math.max(this.flash, .18);
    let destroyed = 0;
    for (const entity of this.entities) {
      if (entity.kind === 'comet' && !entity.destroyed && Math.abs(entity.x - this.player.x) < 215 && Math.abs(entity.y - this.player.y) < 190) {
        entity.destroyed = true; destroyed++; this.particles.burst(entity.x, entity.y, 16, '#75eaff', 150, 3, .7);
      }
    }
    this.score += destroyed * 35 * this.scoreMult;
    this.combo = Math.min(9, this.combo + destroyed);
  }
  hitComet(entity) {
    if (this.player.invulnerable > 0 || entity.destroyed) return;
    entity.destroyed = true; this.particles.burst(entity.x, entity.y, 25, '#ff73c8', 180, 4, .75);
    this.shake = 14; this.flash = .3; this.hitStop = .12;
    if (this.shield > 0) {
      this.shield--; this.player.invulnerable = 1.5; this.audio.shield();
      this.particles.burst(this.player.x, this.player.y, 18, '#8defff', 130, 3, .55);
    } else { this.audio.hit(); this.finish(false); }
  }
  finish(won) {
    if (this.state === 'gameover' || this.state === 'win') return;
    this.state = won ? 'win' : 'gameover'; this.saveBest(); this.audio.stopMusic();
    if (won) this.audio.win();
    this.ui.showResult(Math.floor(this.score), this.best, won);
  }
  fixedStep(dt) {
    this.time += dt;
    if (this.flash > 0) this.flash = Math.max(0, this.flash - dt * 2);
    this.shake = Math.max(0, this.shake - dt * 25);
    this.cryPulse = Math.max(0, this.cryPulse - dt);
    if (this.hitStop > 0) { this.hitStop -= dt; return; }
    if (this.state === 'playing') {
      if (this.input.consumePause()) { this.pause(); return; }
      if (this.input.consumeCry()) this.activateCry();
      this.distance += this.scrollSpeed * dt; this.camera = this.distance;
      this.player.x = this.distance + 230;
      this.player.update(dt, this.input.thrust);
      if (this.input.thrust && Math.random() < dt * 14) { this.particles.stream(this.player.x - 22, this.player.y + 5, '#bd9cff'); this.audio.flap(); }
      for (const entity of this.entities) {
        entity.update(dt);
        if (entity.kind === 'star' || entity.kind === 'crystal') {
          if (!entity.collected && collidesCircle(this.player, entity)) {
            entity.collected = true;
            const amount = entity.kind === 'crystal' ? 35 : 18;
            this.cryMeter = Math.min(this.cryMax, this.cryMeter + amount);
            this.combo = Math.min(9, this.combo + 1); this.comboTimer = 3;
            this.score += (entity.kind === 'crystal' ? 80 : 20) * this.scoreMult * (1 + (this.combo - 1) * .08);
            this.particles.burst(entity.x, entity.y, entity.kind === 'crystal' ? 22 : 10, entity.kind === 'crystal' ? '#68eaff' : '#fff0a0', 120, 3, .65);
            entity.kind === 'crystal' ? this.audio.crystal() : this.audio.collect();
          }
        } else if (entity.kind === 'comet' && !entity.destroyed && collidesCircle(this.player, entity)) this.hitComet(entity);
      }
      this.entities = this.entities.filter(entity => !entity.collected && !entity.destroyed && entity.x > this.camera - 160);
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) this.combo = 1;
      if (this.distance - this.stageStartDistance >= stageLength(this.stage)) this.enterUpgrade();
      this.particles.update(dt);
      this.ui.updateHUD(this);
    } else if (this.state === 'paused' && this.input.consumePause()) this.resume();
  }
  drawBackdrop() {
    const ctx = this.ctx;
    const gradient = ctx.createLinearGradient(0, 0, 0, WORLD_H);
    const hues = [['#08051d','#160b3b'], ['#0b0824','#24104d'], ['#120820','#3a124f'], ['#180721','#4e164b'], ['#21091b','#631d40']];
    const pair = hues[Math.min(this.stage - 1, hues.length - 1)]; gradient.addColorStop(0, pair[0]); gradient.addColorStop(1, pair[1]); ctx.fillStyle = gradient; ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    const nebula = ctx.createRadialGradient(720 - this.camera * .08, 180, 10, 720 - this.camera * .08, 180, 380);
    nebula.addColorStop(0, `rgba(${110 + this.stage * 10},60,190,.18)`); nebula.addColorStop(1, 'rgba(20,5,60,0)'); ctx.fillStyle = nebula; ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 90; i++) {
      const x = ((i * 137.31 - this.camera * (i % 3 ? .11 : .2)) % 1040 + 1040) % 1040;
      const y = (i * 71.7) % 510 + 10; const r = (i % 4) * .45 + .55;
      ctx.globalAlpha = .25 + (i % 5) * .1; ctx.fillStyle = i % 7 === 0 ? '#e8baff' : '#a9cfff'; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.28); ctx.fill();
    }
    ctx.restore();
    ctx.strokeStyle = 'rgba(198,151,255,.09)'; ctx.lineWidth = 1; ctx.setLineDash([3, 12]); ctx.beginPath(); ctx.moveTo(0, 65); ctx.lineTo(WORLD_W, 65); ctx.moveTo(0, 490); ctx.lineTo(WORLD_W, 490); ctx.stroke(); ctx.setLineDash([]);
  }
  render() {
    const ctx = this.ctx; ctx.setTransform(this.canvas.width / WORLD_W, 0, 0, this.canvas.height / WORLD_H, 0, 0);
    ctx.clearRect(0, 0, WORLD_W, WORLD_H); this.drawBackdrop();
    const sx = this.shake ? (Math.random() - .5) * this.shake : 0, sy = this.shake ? (Math.random() - .5) * this.shake : 0;
    ctx.save(); ctx.translate(sx, sy);
    for (const entity of this.entities) if (!entity.collected && !entity.destroyed) entity.draw(ctx, this.camera, this.time);
    if (this.cryPulse > 0) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(112,235,255,${this.cryPulse * 1.5})`; ctx.lineWidth = 4; ctx.shadowColor = '#6beaff'; ctx.shadowBlur = 20;
      ctx.beginPath(); ctx.arc(this.player.x - this.camera, this.player.y, 30 + (1 - this.cryPulse) * 230, 0, 6.28); ctx.stroke(); ctx.restore();
    }
    this.player.draw(ctx, this.camera, this.time); this.particles.draw(ctx, this.camera); ctx.restore();
    if (this.flash > 0) { ctx.fillStyle = `rgba(220,190,255,${this.flash})`; ctx.fillRect(0, 0, WORLD_W, WORLD_H); }
  }
}

const canvas = document.getElementById('game-canvas');
const input = new Input(canvas); const audio = new AudioManager(); const ui = new UI(); const game = new Game(canvas, input, audio, ui);

function resize() {
  const rect = canvas.getBoundingClientRect(); const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(rect.width * ratio); canvas.height = Math.floor(rect.height * ratio);
}
window.addEventListener('resize', resize); resize();
input.bindHoldButton(ui.thrustButton);

document.getElementById('start-button').addEventListener('click', () => game.start());
document.getElementById('retry-button').addEventListener('click', () => game.start());
document.getElementById('result-menu-button').addEventListener('click', () => game.toMenu());
document.getElementById('resume-button').addEventListener('click', () => game.resume());
document.getElementById('pause-menu-button').addEventListener('click', () => game.toMenu());
document.getElementById('pause-button').addEventListener('click', () => game.pause());
ui.cryButton.addEventListener('click', () => { audio.click(); input.requestCry(); });
document.addEventListener('click', (event) => { if (event.target.closest('button')) audio.resume(); }, { passive: true });
window.addEventListener('keydown', (event) => {
  if (game.state === 'upgrade' && ['Digit1', 'Digit2', 'Digit3'].includes(event.code)) {
    const index = Number(event.code.slice(-1)) - 1; if (game.offers[index]) game.chooseUpgrade(game.offers[index]);
  }
});

game.toMenu();
let last = performance.now(); let accumulator = 0;
function loop(now) {
  const delta = Math.min(.1, (now - last) / 1000); last = now; accumulator += delta;
  while (accumulator >= FIXED_DT) { game.fixedStep(FIXED_DT); accumulator -= FIXED_DT; }
  game.render(); requestAnimationFrame(loop);
}
requestAnimationFrame(loop);