// main.js — game entry point, game loop, state machine

import { AudioManager } from './audio.js';
import { InputManager } from './input.js';
import { ParticleSystem } from './particles.js';
import { FarmGrid, GRID_COLS, GRID_ROWS, CELL_SIZE, GRID_X, GRID_Y, screenToCell } from './grid.js';
import { Player } from './player.js';
import { EntityManager } from './entities.js';
import { WaveManager } from './waves.js';
import { UIManager } from './ui.js';

const STATES = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAMEOVER: 'gameover',
};

export class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.state = STATES.MENU;
        this.isWin = false;
        this.screenShake = 0;
        this.timeScale = 1;
        this.particles = new ParticleSystem();
        this.player = new Player();

        // Subsystems
        this.audio = new AudioManager();
        this.input = new InputManager(this.canvas);
        this.grid = new FarmGrid(this);
        this.entities = new EntityManager(this);
        this.waves = new WaveManager(this);
        this.ui = new UIManager(this);

        // Build tempo
        this.frame = 0;
        this.lastTime = 0;
        this.buildModeCost = null;

        this._setupBackground();
    }

    _setupBackground() {
        this.bgGrad = this.ctx.createLinearGradient(0, 0, 0, 640);
        this.bgGrad.addColorStop(0, '#1a0f0a');
        this.bgGrad.addColorStop(0.5, '#2a1a0e');
        this.bgGrad.addColorStop(1, '#0d0604');
    }

    init() {
        // Listen for first interaction to init audio
        const initAudio = () => {
            this.audio.init();
            this.audio.resume();
            this.audio.startMusic();
            document.removeEventListener('click', initAudio);
            document.removeEventListener('keydown', initAudio);
            document.removeEventListener('touchstart', initAudio);
        };
        document.addEventListener('click', initAudio);
        document.addEventListener('keydown', initAudio);
        document.addEventListener('touchstart', initAudio);

        this.ui.rebuildButtons(this.state);
        this.loadHighScore();
    }

    loadHighScore() {
        this.highScore = parseInt(localStorage.getItem('red_harvest_highscore') || '0', 10) || 0;
    }

    saveHighScore() {
        if (this.player.score > this.highScore) {
            this.highScore = this.player.score;
            localStorage.setItem('red_harvest_highscore', String(this.highScore));
        }
    }

    changeState(newState) {
        const wasPlaying = this.state === STATES.PLAYING || this.state === 'intermission';
        this.state = newState;
        if (newState === STATES.PLAYING) {
            this.ui.selectedBuild = null;
            this.ui.selectedBuildCost = null;
        }
        this.ui.rebuildButtons(this.state);
        if (newState === STATES.MENU) {
            this.grid.init();
            this.entities.clear();
            this.waves.reset();
        }
    }

    startGame() {
        this.player.reset();
        this.grid.init();
        this.entities.clear();
        this.waves.reset();
        this.particles.clear();
        this.screenShake = 0;
        this.isWin = false;
        this.changeState(STATES.PLAYING);
        // Give starting carrots
        this.player.addCarrots(10);
        this.ui.showNotification('Plant carrots! Click on soil.', 3);
    }

    endGame() {
        this.isWin = false;
        this.audio.gameOver();
        this.saveHighScore();
        this.changeState(STATES.GAMEOVER);
    }

    winGame() {
        this.isWin = true;
        this.audio.victory();
        this.saveHighScore();
        this.changeState(STATES.GAMEOVER);
    }

    onWaveComplete() {
        // Called when all tractors defeated
        this.ui.showNotification(`Wave ${this.waves.waveNumber} cleared! Bonus carrots granted!`, 3);
        this.ui.rebuildButtons(this.state);
    }

    // ---------- GAME LOOP ----------

    update(dt) {
        this.frame++;
        this.screenShake = Math.max(0, this.screenShake - dt * 2);
        this.ui.update(dt);

        // Poll input
        const mouse = this.input.mouse;

        if (this.state === STATES.MENU) {
            if (this.input.consumeClick()) {
                const btnId = this.ui.handleClick(mouse.x, mouse.y);
                if (btnId === 'start') {
                    this.startGame();
                }
            }
            this.ui.updateHover(mouse.x, mouse.y);
            return;
        }

        if (this.state === STATES.PLAYING) {
            // Pause key
            if (this.input.isKeyPressed('KeyP') || this.input.isKeyPressed('Escape')) {
                this.input.keyMap['KeyP'] = false;
                this.input.keyMap['Escape'] = false;
                this.changeState(STATES.PAUSED);
                return;
            }

            // Keyboard shortcuts for build selection
            if (this.input.isKeyPressed('Digit1')) {
                this.input.keyMap['Digit1'] = false;
                this.ui.selectedBuild = this.ui.selectedBuild === 'fence' ? null : 'fence';
                this.ui.rebuildButtons(this.state);
            }
            if (this.input.isKeyPressed('Digit2')) {
                this.input.keyMap['Digit2'] = false;
                this.ui.selectedBuild = this.ui.selectedBuild === 'turret' ? null : 'turret';
                this.ui.rebuildButtons(this.state);
            }
            if (this.input.isKeyPressed('Digit3')) {
                this.input.keyMap['Digit3'] = false;
                this.ui.selectedBuild = this.ui.selectedBuild === 'trap' ? null : 'trap';
                this.ui.rebuildButtons(this.state);
            }

            // Right click cancels build mode
            if (this.input.consumeRightClick()) {
                this.ui.selectedBuild = null;
                this.ui.rebuildButtons(this.state);
            }

            // Handle clicks
            if (this.input.consumeClick()) {
                // Check UI buttons first
                const btnId = this.ui.handleClick(mouse.x, mouse.y);
                if (btnId) {
                    if (btnId.startsWith('build_')) {
                        const type = btnId.substring(6);
                        const costs = { fence: 15, turret: 25, trap: 10 };
                        if (!this.player.canAfford(costs[type])) {
                            this.ui.showNotification('Not enough carrots!', 1);
                        } else {
                            this.ui.selectedBuild = this.ui.selectedBuild === type ? null : type;
                        }
                        this.ui.rebuildButtons(this.state);
                    } else if (btnId.startsWith('upgrade_')) {
                        const key = btnId.substring(8);
                        if (this.player.applyUpgrade(key)) {
                            this.ui.showNotification('Upgraded!', 1);
                        } else {
                            this.ui.showNotification(`Need ${this.player.getUpgradeCost(key)} carrots!`, 1);
                        }
                        this.ui.rebuildButtons(this.state);
                    } else if (btnId === 'next_wave') {
                        this.waves.startNextWave();
                        this.ui.rebuildButtons(this.state);
                    } else if (btnId === 'pause') {
                        this.changeState(STATES.PAUSED);
                        return;
                    } else if (btnId === 'disabled') {
                        // Already handled in ui
                    }
                } else {
                    // Clicked on grid — handle planting/building
                    const cell = screenToCell(mouse.x, mouse.y, this);
                    if (cell) {
                        const gridCell = this.grid.getCell(cell.row, cell.col);
                        if (this.ui.selectedBuild) {
                            const built = this.grid.buildDefense(cell.row, cell.col, this.ui.selectedBuild);
                            if (built) {
                                this.ui.showNotification(`${this.ui.selectedBuild.toUpperCase()} built!`, 1);
                            }
                            // Keep build mode active for multiple builds
                        } else {
                            if (gridCell.type === 'empty') {
                                this.grid.plant(cell.row, cell.col);
                            } else if (gridCell.type === 'carrot' && gridCell.growthStage >= 4) {
                                this.grid.harvest(cell.row, cell.col);
                            } else if (gridCell.type === 'carrot') {
                                // Not ripe yet
                            }
                        }
                    }
                }
            }

            // Mouse hover for build preview
            const hoverCell = screenToCell(mouse.x, mouse.y, this);
            this.hoverCell = hoverCell;

            // Update game systems
            this.grid.update(dt);
            this.entities.update(dt);
            this.waves.update(dt);
            this.particles.update(dt);

            // Auto-start first wave after a few seconds
            if (this.waves.waveNumber === 0 && this.waves.state === 'idle') {
                // Don't auto-start, player clicks Next Wave
            }

            this.ui.updateHover(mouse.x, mouse.y);

            // Check for state transitions
            if (this.waves.state === 'intermission' && !this.ui.buttons.find(b => b.id === 'next_wave')) {
                this.ui.rebuildButtons(this.state);
            }
            // Keep buttons fresh
            this.ui.rebuildButtons(this.state);
        } else if (this.state === STATES.PAUSED) {
            if (this.input.consumeClick()) {
                const btnId = this.ui.handleClick(mouse.x, mouse.y);
                if (btnId === 'resume') {
                    this.changeState(STATES.PLAYING);
                } else if (btnId === 'quit') {
                    this.changeState(STATES.MENU);
                }
            }
            if (this.input.isKeyPressed('KeyP') || this.input.isKeyPressed('Escape')) {
                this.input.keyMap['KeyP'] = false;
                this.input.keyMap['Escape'] = false;
                this.changeState(STATES.PLAYING);
            }
            this.ui.updateHover(this.input.mouse.x, this.input.mouse.y);
        } else if (this.state === STATES.GAMEOVER) {
            if (this.input.consumeClick()) {
                const btnId = this.ui.handleClick(this.input.mouse.x, this.input.mouse.y);
                if (btnId === 'retry' || btnId === 'restart') {
                    this.startGame();
                } else if (btnId === 'menu') {
                    this.changeState(STATES.MENU);
                }
            }
            this.ui.updateHover(this.input.mouse.x, this.input.mouse.y);
        }
    }

    render() {
        const ctx = this.ctx;
        ctx.save();

        // Screen shake
        if (this.screenShake > 0.01) {
            const mag = this.screenShake * 6;
            ctx.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag);
        }

        // Background
        ctx.fillStyle = this.bgGrad;
        ctx.fillRect(-10, -10, 980, 660);

        // Draw decorative background elements (fences in distance, etc.)
        this._renderBackgroundDecor(ctx);

        if (this.state === STATES.MENU) {
            this.ui.render(ctx, this.state);
        } else if (this.state === STATES.PLAYING) {
            // Draw farm grid
            this.grid.render(ctx);
            // Draw entities (tractors, projectiles)
            this.entities.render(ctx);
            // Draw particles
            this.particles.render(ctx);
            // Draw HUD
            this.ui.render(ctx, this.state);
            // Draw build preview ghost
            if (this.ui.selectedBuild && this.hoverCell) {
                this._renderBuildGhost(ctx, this.hoverCell.row, this.hoverCell.col, this.ui.selectedBuild);
            }
        } else if (this.state === STATES.PAUSED) {
            // Render game below, then pause overlay
            this.grid.render(ctx);
            this.entities.render(ctx);
            this.particles.render(ctx);
            this.ui.render(ctx, this.state);
        } else if (this.state === STATES.GAMEOVER) {
            // Render last game state, dimmed
            this.grid.render(ctx);
            this.entities.render(ctx);
            this.particles.render(ctx);
            this.ui.render(ctx, this.state);
        }

        ctx.restore();
    }

    _renderBackgroundDecor(ctx) {
        // Distant fields / grass pattern
        ctx.fillStyle = 'rgba(40, 50, 20, 0.08)';
        for (let i = 0; i < 40; i++) {
            const x = (i * 53) % 960;
            const y = (i * 37) % 640;
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        // Border frame around the farm
        ctx.strokeStyle = 'rgba(90, 60, 30, 0.4)';
        ctx.lineWidth = 4;
        ctx.strokeRect(GRID_X - 8, GRID_Y - 8, GRID_COLS * CELL_SIZE + 16, GRID_ROWS * CELL_SIZE + 16);

        // Corner decorations
        ctx.fillStyle = 'rgba(90, 60, 30, 0.3)';
        for (let corner = 0; corner < 4; corner++) {
            const cx = corner % 2 === 0 ? GRID_X - 18 : GRID_X + GRID_COLS * CELL_SIZE - 2;
            const cy = corner < 2 ? GRID_Y - 18 : GRID_Y + GRID_ROWS * CELL_SIZE - 2;
            ctx.beginPath();
            ctx.arc(cx, cy, 14, 0, Math.PI * 2);
            ctx.fill();
        }

        // Sky gradient hint at top
        const skyGrad = ctx.createLinearGradient(0, 0, 0, GRID_Y - 10);
        skyGrad.addColorStop(0, 'rgba(30, 40, 60, 0.3)');
        skyGrad.addColorStop(1, 'rgba(60, 40, 20, 0.05)');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, 960, GRID_Y - 10);
    }

    _renderBuildGhost(ctx, row, col, type) {
        const x = GRID_X + col * CELL_SIZE;
        const y = GRID_Y + row * CELL_SIZE;
        const cell = this.grid.getCell(row, col);
        // Check if valid placement
        const valid = cell.type === 'empty' && !cell.defenseType;
        ctx.save();
        ctx.globalAlpha = valid ? 0.5 : 0.25;
        if (type === 'fence') {
            ctx.fillStyle = '#8b5a2b';
            ctx.fillRect(x + 8, y + 8, CELL_SIZE - 16, CELL_SIZE - 16);
        } else if (type === 'turret') {
            ctx.fillStyle = '#4682b4';
            ctx.beginPath();
            ctx.arc(x + CELL_SIZE / 2, y + CELL_SIZE / 2, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#5a321a';
            ctx.fillRect(x + CELL_SIZE / 2 - 4, y + CELL_SIZE / 2 - 4, 8, 20);
        } else {
            ctx.fillStyle = '#556b2f';
            ctx.fillRect(x + 6, y + 6, CELL_SIZE - 12, CELL_SIZE - 12);
        }
        if (!valid) {
            ctx.fillStyle = 'rgba(255,0,0,0.3)';
            ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
        }
        ctx.restore();
    }

    loop = (t) => {
        const dt = Math.min((t - this.lastTime) / 1000, 0.05);
        this.lastTime = t;
        this.update(dt);
        this.render();
        requestAnimationFrame(this.loop);
    };

    start() {
        this.lastTime = performance.now();
        requestAnimationFrame(this.loop);
    }
}

// Boot
const game = new Game();
game.init();
game.start();

// Also export for potential debugging
export { game };