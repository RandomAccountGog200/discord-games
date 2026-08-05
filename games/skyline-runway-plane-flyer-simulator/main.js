import { Input } from './input.js';
import { AudioEngine } from './audio.js';
import { ParticleSystem } from './particles.js';
import { Plane } from './player.js';
import { World } from './world.js';
import { UI } from './ui.js';

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const input = new Input(canvas);
const audio = new AudioEngine();
const particles = new ParticleSystem();
const ui = new UI();
const BEST_KEY = 'skyline-runway-best';
const STEP = 1 / 60;
let view = { w: 960, h: 600 };
let state = 'menu';
let level = 1;
let score = 0;
let best = Number(localStorage.getItem(BEST_KEY) || 0);
let world;
let plane;
let shake = 0;
let flash = 0;
let boostSoundCooldown = 0;
let last = performance.now();
let accumulator = 0;

const upgradePool = [
  { id: 'handling', icon: '⌁', title: 'FLIGHT CONTROL', description: 'Increase climb and dive response by 23%. Easier to thread tight gates.' },
  { id: 'hull', icon: '▣', title: 'REINFORCED HULL', description: 'Add one hull segment and repair the aircraft completely.' },
  { id: 'fuel', icon: '◒', title: 'AUXILIARY TANK', description: 'Increase fuel capacity by 28 units and refill the tank.' },
  { id: 'engine', icon: 'ϟ', title: 'TURBO INJECTOR', description: 'Increase cruise speed by 11%. Finish sectors faster.' },
  { id: 'magnet', icon: '✧', title: 'NAV BEACON', description: 'Widen the collection radius for rings and cargo by 16 pixels.' }
];

function resize() {
  const rect = canvas.getBoundingClientRect();
  view.w = Math.max(320, rect.width); view.h = Math.max(260, rect.height);
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.floor(view.w * dpr); canvas.height = Math.floor(view.h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (plane) { plane.x = view.w * .24; plane.y = Math.min(plane.y, view.h - 70); }
}
window.addEventListener('resize', resize);
resize();
plane = new Plane(view.w * .24, view.h * .5);
world = new World(1, view.w, view.h, Math.random() * 0xffffffff);
ui.showMenu(best);

function beginFlight() {
  audio.unlock(); audio.play('click');
  level = 1; score = 0; shake = 0; flash = 0;
  plane = new Plane(view.w * .24, view.h * .5);
  world = new World(level, view.w, view.h, (Date.now() ^ Math.floor(Math.random() * 999999)) >>> 0);
  particles.items.length = 0; state = 'playing'; ui.showPlaying(); ui.toast('SECTOR 1 // LIFT OFF');
}
function beginSector() {
  plane.resetForLevel(view.h);
  world = new World(level, view.w, view.h, (Date.now() + level * 99991) >>> 0);
  state = 'playing'; ui.showPlaying(); audio.play('level'); ui.toast(`SECTOR ${level} // CLEAR SKIES`);
}
function chooseUpgrades() {
  const shuffled = [...upgradePool].sort(() => Math.random() - .5);
  ui.showUpgrade(level, shuffled.slice(0, 3));
  audio.play('level');
}
function finish(win, reason) {
  state = win ? 'win' : 'gameover';
  if (score > best) { best = Math.floor(score); localStorage.setItem(BEST_KEY, best); }
  ui.showEnd(win, Math.floor(score), best, reason);
  audio.play(win ? 'level' : 'crash');
}
function handleAction(action) {
  audio.unlock();
  if (action === 'start' || action === 'restart') { beginFlight(); return; }
  if (action === 'menu') { state = 'menu'; ui.showMenu(best); audio.play('click'); return; }
  if (action === 'resume') { state = 'playing'; ui.showPlaying(); audio.play('click'); return; }
  if (action === 'pause') { if (state === 'playing') { state = 'pause'; ui.showPause(); audio.play('click'); } return; }
  if (action.startsWith('upgrade:') && state === 'upgrade') {
    const id = action.split(':')[1]; plane.applyUpgrade(id); level++;
    audio.play('click'); beginSector();
  }
}
ui.onAction(handleAction);

function damageAt(x, y) {
  if (plane.damage()) {
    score = Math.max(0, score - 25);
    shake = .42; flash = .28; audio.play('damage');
    particles.burst(x, y, '#ff806e', 27, 180);
    ui.toast(`HULL HIT // ${plane.health} SEGMENTS REMAIN`);
    if (plane.health <= 0) finish(false, 'The aircraft sustained critical hull damage.');
  }
}
function fixedUpdate(dt) {
  if (input.consumePause()) {
    if (state === 'playing') handleAction('pause'); else if (state === 'pause') handleAction('resume');
  }
  if (state !== 'playing') { particles.update(dt); return; }
  const speedEstimate = world.baseSpeed * plane.stats.engine * (plane.boosting ? 1.27 : 1);
  const pilot = plane.update(dt, input, view.h, speedEstimate);
  if (pilot.empty) { finish(false, 'The aircraft ran dry before reaching the next runway.'); return; }
  if (plane.y < 42 || plane.y > view.h - 58) {
    plane.y = Math.max(42, Math.min(view.h - 58, plane.y));
    damageAt(plane.x, plane.y);
    plane.vy *= -.42;
  }
  const result = world.update(dt, plane, input, particles);
  if (result.events.gate) { score += 100 * level; audio.play('gate'); shake = Math.max(shake, .08); ui.toast(`GATE CLEARED // +${100 * level}`); }
  if (result.events.pickup) {
    if (result.events.pickup.type === 'fuel') { plane.stats.fuel = Math.min(plane.stats.maxFuel, plane.stats.fuel + 24); score += 35 * level; ui.toast('FUEL CELL // +24'); }
    else { score += 60 * level; ui.toast('NAV CARGO // BONUS'); }
    audio.play('pickup');
  }
  if (result.events.damage) damageAt(result.events.damage.x, result.events.damage.y);
  if (state !== 'playing') return;
  if (plane.boosting && boostSoundCooldown <= 0) { audio.play('boost'); boostSoundCooldown = .45; }
  boostSoundCooldown -= dt;
  if (Math.random() < dt * (plane.boosting ? 35 : 13)) particles.trail(plane.x - 22, plane.y + 3, plane.boosting ? '#ffb45c' : '#70e9ff', plane.boosting);
  if (result.events.complete) {
    score += 250 * level;
    if (level >= 5) { finish(true, 'All five air corridors cleared. The skyline is yours.'); return; }
    state = 'upgrade'; chooseUpgrades();
  }
  particles.update(dt);
  shake = Math.max(0, shake - dt * 2.6); flash = Math.max(0, flash - dt * 1.8);
  ui.updateHud(level, score, world.distance / world.length, plane.health, plane.stats.hull, plane.stats.fuel, plane.stats.maxFuel);
}

function drawAttract() {
  world.drawBackground(ctx, view.w, view.h); world.draw(ctx, plane.x, view.w, view.h); plane.draw(ctx, particles);
}
function render() {
  ctx.save();
  const sx = shake > 0 ? (Math.random() - .5) * shake * 18 : 0;
  const sy = shake > 0 ? (Math.random() - .5) * shake * 12 : 0;
  ctx.translate(sx, sy);
  world.drawBackground(ctx, view.w, view.h);
  if (state !== 'menu' || world) world.draw(ctx, plane.x, view.w, view.h);
  plane.draw(ctx, particles);
  particles.draw(ctx);
  ctx.restore();
  if (flash > 0) { ctx.fillStyle = `rgba(255,245,220,${flash * .32})`; ctx.fillRect(0, 0, view.w, view.h); }
}
function frame(now) {
  let delta = Math.min(.1, (now - last) / 1000); last = now; accumulator += delta;
  while (accumulator >= STEP) { fixedUpdate(STEP); accumulator -= STEP; }
  render(); requestAnimationFrame(frame);
}
requestAnimationFrame(frame);