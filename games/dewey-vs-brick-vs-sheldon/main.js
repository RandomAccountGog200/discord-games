import { Input } from './input.js';
import { AudioManager } from './audio.js';
import { UI } from './ui.js';
import { GameSession } from './game.js';

const canvas = document.querySelector('#gameCanvas');
const ctx = canvas.getContext('2d');
const input = new Input(canvas);
const audio = new AudioManager();
const ui = new UI();
let game = null;
let screen = 'menu';
let best = Number(localStorage.getItem('dewey-best') || 0);
ui.showMenu(best);

function saveBest() {
  if (game && game.score > best) { best = game.score; localStorage.setItem('dewey-best', String(best)); }
}

function start() {
  audio.init(); audio.click(); game = new GameSession(audio); screen = 'play'; ui.hideAll(); ui.setPlaying(true);
}
function pause() {
  if (screen !== 'play') return;
  screen = 'pause'; ui.showPause(); audio.click();
}
function resume() {
  if (screen !== 'pause') return;
  screen = 'play'; ui.hideAll(); ui.setPlaying(true); audio.click();
}
function menu() {
  saveBest(); screen = 'menu'; ui.showMenu(best); audio.click();
}
function restart() { start(); }

ui.on('start', start); ui.on('pause', pause); ui.on('resume', resume); ui.on('restart', restart); ui.on('menu', menu);
ui.on('upgrade', id => {
  if (!game || screen !== 'upgrade') return;
  audio.click(); game.applyUpgrade(id); screen = 'play'; ui.hideAll(); ui.setPlaying(true);
});
window.addEventListener('keydown', e => {
  if ((e.code === 'KeyP' || e.code === 'Escape') && screen === 'play') pause();
  else if ((e.code === 'KeyP' || e.code === 'Escape') && screen === 'pause') resume();
});

function idleDraw(time) {
  const gradient = ctx.createLinearGradient(0, 0, 0, 600); gradient.addColorStop(0, '#0b1b3c'); gradient.addColorStop(1, '#050b1d'); ctx.fillStyle = gradient; ctx.fillRect(0, 0, 960, 600);
  ctx.strokeStyle = 'rgba(83,169,221,.1)';
  for (let x = 20; x < 960; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 600); ctx.stroke(); }
  for (let y = 20; y < 600; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(960, y); ctx.stroke(); }
  ctx.fillStyle = '#4de5ff'; ctx.shadowColor = '#4de5ff'; ctx.shadowBlur = 25; ctx.beginPath(); ctx.arc(480 + Math.cos(time * .001) * 140, 300 + Math.sin(time * .0013) * 70, 5, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
}

let previous = performance.now(), accumulator = 0;
const fixed = 1 / 60;
function frame(now) {
  const elapsed = Math.min(.1, (now - previous) / 1000); previous = now; accumulator += elapsed;
  while (accumulator >= fixed) {
    if (screen === 'play' && game) {
      game.update(fixed, input);
      if (game.phase === 'complete') { screen = 'upgrade'; ui.showUpgrade(game.getUpgradeChoices()); audio.click(); }
      else if (game.phase === 'dead') { saveBest(); screen = 'over'; ui.showOver(game.score, best); }
      else if (game.phase === 'won') { saveBest(); screen = 'win'; ui.showWin(game.score, best); }
    }
    accumulator -= fixed;
  }
  if (game) game.draw(ctx); else idleDraw(now);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);