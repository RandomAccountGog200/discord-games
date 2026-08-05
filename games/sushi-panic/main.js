import { Game } from './game.js';
import { W, H } from './levels.js';
import { initAudio } from './audio.js';
import { Input } from './input.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let view = { scale: 1, ox: 0, oy: 0 };

function resize() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = window.innerWidth;
  const h = window.innerHeight;
  canvas.width = Math.floor(w * dpr);
  canvas.height = Math.floor(h * dpr);
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  const s = Math.min(canvas.width / W, canvas.height / H);
  view = { scale: s, ox: (canvas.width - W * s) / 2, oy: (canvas.height - H * s) / 2 };
}
window.addEventListener('resize', resize);
resize();

const input = new Input(canvas, () => view);
const game = new Game();

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  for (const p of input.takePresses()) {
    initAudio();
    game.press(p.x, p.y);
  }
  for (const k of input.takeKeys()) {
    initAudio();
    game.key(k);
  }
  game.pointer = input.pos;
  game.update(dt);

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#0b0e1a';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(view.scale, 0, 0, view.scale, view.ox, view.oy);
  game.draw(ctx);

  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);