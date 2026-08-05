import { Game } from './game.js';
import { Audio } from './audio.js';
import { setupInput } from './input.js';
import { Renderer } from './renderer.js';

const canvas = document.getElementById('game-canvas');
const renderer = new Renderer(canvas);
const audio = new Audio();
const game = new Game();

let state = 'menu';

const startGame = () => {
  audio.init();
  game.reset();
  state = 'playing';
  audio.click();
};

const returnToMenu = () => {
  state = 'menu';
  audio.click();
};

game.events.onGameOver = () => {
  audio.gameOver();
  state = 'gameover';
};
game.events.onEat = () => audio.eat();
game.events.onBonus = () => audio.bonus();
game.events.onLevelUp = () => audio.levelUp();

// –— input –—
setupInput(canvas, {
  onDirection: (dir) => {
    if (state === 'playing') game.snake.setDirection(dir);
    else if (state === 'menu' || state === 'gameover') {
      startGame();
      game.snake.setDirection(dir);
    }
  },
  onAction: () => {
    if (state === 'menu' || state === 'gameover') startGame();
    else if (state === 'paused') { state = 'playing'; audio.click(); }
  },
  onPause: () => {
    if (state === 'playing') { state = 'paused'; audio.click(); }
    else if (state === 'paused') { state = 'playing'; audio.click(); }
  },
  onMenu: () => {
    if (state === 'paused' || state === 'gameover') returnToMenu();
  }
});

// main loop
let last = performance.now();
let rafId = null;

function frame(now) {
  const dt = Math.min(now - last, 100);
  last = now;

  if (state === 'playing') {
    game.update(dt);
  }

  audio.updateMusic();
  renderer.draw(state, game, now, dt);
  rafId = requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// screen resize
window.addEventListener('resize', () => renderer.resize());