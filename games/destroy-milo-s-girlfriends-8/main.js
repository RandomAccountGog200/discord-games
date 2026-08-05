import { Game } from './game.js';

const canvas = document.getElementById('gameCanvas');
const game = new Game(canvas);

let lastTime = 0;

function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
    lastTime = timestamp;

    game.update(dt);
    game.render(game.ctx);

    requestAnimationFrame(gameLoop);
}

// Resize canvas to fit window while keeping aspect ratio
function resize() {
    const aspect = game.canvas.width / game.canvas.height;
    let w = window.innerWidth;
    let h = window.innerHeight;
    if (w / h > aspect) {
        w = h * aspect;
    } else {
        h = w / aspect;
    }
    const scale = w / game.canvas.width;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
}

window.addEventListener('resize', resize);
resize();

// Start first render
window.addEventListener('resize', resize); // already above

// Init audio context on first interaction
window.addEventListener('keydown', () => game.audio.init(), { once: true });
window.addEventListener('mousedown', () => game.audio.init(), { once: true });
window.addEventListener('touchstart', () => game.audio.init(), { once: true });

requestAnimationFrame(gameLoop);