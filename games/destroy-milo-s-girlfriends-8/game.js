import { GAME_WIDTH, GAME_HEIGHT, PLAYER_SIZE, ENEMY_SIZE } from './constants.js';
import { Player } from './player.js';
import { Enemy } from './enemy.js'; // We'll implement enemy.js separately
import { Bullet } from './bullet.js';
import { ParticleSystem } from './particles.js';
import { AudioManager } from './audio.js';
import { InputManager } from './input.js';
import { LEVELS, getEnemy } from './levels.js';

// We'll import enemy.js but not yet written; we'll write it later.
// For now we'll assume enemy.js exists.

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.canvas.width = GAME_WIDTH;
        this.canvas.height = GAME_HEIGHT;

        this.input = new InputManager(canvas);
        this.audio = new AudioManager();
        this.particles = new ParticleSystem();

        this.player = new Player();
        this.bullets = [];
        this.enemies = [];

        this.state = 'MENU'; // MENU, PLAYING, PAUSED, GAME_OVER, WIN, LEVEL_TRANSITION
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('dmgo8')) || 0;
        this.levelIndex = 0;
        this.levelTimer = 0;
        this.enemy = null;
        this.enemyDef = null;
        this.bulletCooldown = 0;
        this.screenShake = 0;
        this.lives = 3;
        this.pauseTimer = 0;

        this.levelTransitionTimer = 0;
        this.newLevel = false;

        this.gameTime = 0;
    }

    resetGame() {
        this.score = 0;
        this.levelIndex = 0;
        this.player.reset();
        this.bullets = [];
        this.enemies = [];
        this.particles.clear();
        this.enemy = null;
        this.levelTimer = 0;
        this.screenShake = 0;
        this.levelTransitionTimer = 0;
        this.newLevel = false;
        this.startLevel(0);
    }

    startLevel(i) {
        this.levelIndex = i;
        if (i >= LEVELS.length) {
            this.state = 'WIN';
            return;
        }
        const def = LEVELS[i];
        this.enemy = new Enemy(def, i); // we'll pass def and index
        this.enemyDef = def;
        this.levelTimer = 0;
        this.levelTransitionTimer = 1.5; // Show intro
        this.newLevel = true;
    }

    update(dt) {
        this.gameTime += dt;

        switch (this.state) {
            case 'MENU':
                this.updateMenu(dt);
                break;
            case 'PLAYING':
                this.updatePlaying(dt);
                break;
            case 'PAUSED':
                break;
            case 'GAME_OVER':
                this.updateGameOver(dt);
                break;
            case 'WIN':
                this.updateWin(dt);
                break;
            case 'LEVEL_TRANSITION':
                this.updateTransition(dt);
                break;
        }
        this.particles.update(dt);
        this.screenShake = Math.max(0, this.screenShake - dt);
    }

    updatePlaying(dt) {
        this.input.update();

        // Player movement and shooting
        let bullet = this.player.update(dt, this.input);
        if (bullet) this.bullets.push(bullet);

        // Update player invulnerability and screen shake
        if (this.player.invulnTimer > 0) this.player.invulnTimer -= dt;
        if (this.screenShake > 0) this.screenShake -= dt;

        // Update enemy
        if (this.enemy && !this.enemy.dead) {
            this.enemy.update(dt, this);
            // Collision with enemy
        }

        // Update bullets
        for (let i = this.bullets.length-1; i >= 0; i--) {
            const b = this.bullets[i];
            b.update(dt);
            if (b.dead) {
                this.bullets.splice(i,1);
                continue;
            }
            // Bullet-fire check
            if (this.enemy && !this.enemy.dead) {
                if (circleRectCollision(b, this.enemy)) {
                    this.enemy.takeDamage(b.damage);
                    this.particles.addExplosion(b.x, b.y, this.enemyDef.color, 5);
                    this.audio.hit();
                    this.screenShake = Math.min(this.screenShake + 0.1, 0.5);
                    b.dead = true;
                    this.bullets.splice(i,1);
                    continue;
                }
            }
        }

        // Check enemy death
        if (this.enemy && this.enemy.hp <= 0) {
            this.enemy.dead = true;
            this.particles.addExplosion(this.enemy.x, this.enemy.y, this.enemyDef.color, 40);
            this.audio.explosion();
            this.score += this.enemyDef.score;
            this.screenShake = 0.8;
            this.levelDone();
        }

        // Collision with player
        if (this.enemy && !this.enemy.dead && !this.enemy.disappear) {
            // Simple distance check
            if (circleRectCollision(this.enemy, this.player)) {
                this.player.hit();
                this.audio.playerHit();
                this.particles.addExplosion(this.player.x, this.player.y, '#ff0000', 20);
                this.screenShake = 0.6;
                this.lives--; // Actually player.hit already decrements lives? We'll sync.
                if (this.player.lives <= 0) {
                    this.gameOver();
                }
            } else if (this.enemy.y > GAME_HEIGHT - 20) {
                // enemy escaped
                this.player.hit();
                this.audio.playerHit();
                this.screenShake = 0.5;
                if (this.player.lives <= 0) this.gameOver();
                this.enemy.dead = true;
                this.levelReset(); // restart level
            }
        }

        // Camera shake effect: we'll use in draw

        // Update particles
        this.particles.update(dt);
    }

    gameOver() {
        this.state = 'GAME_OVER';
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('dmgoHigh', this.highScore.toString());
        }
        this.audio.gameOver();
        this.player.reset();
    }

    levelDone() {
        this.levelIndex++;
        if (this.levelIndex >= LEVELS.length) {
            this.state = 'WIN';
            if (this.score > this.highScore) {
                this.highScore = this.score;
                localStorage.setItem('dmgoHigh', this.highScore.toString());
            }
            this.audio.levelUp();
        } else {
            this.state = 'LEVEL_TRANSITION';
            this.levelTransitionTimer = 1.5;
            this.audio.levelUp();
        }
    }

    updateMenu(dt) {
        // handle menu interactions
        if (this.input.isJustPressed('Enter') || this.input.mouseDown) {
            this.audio.click();
            this.state = 'PLAYING';
            this.resetGame();
        }
    }

    updateTransition(dt) {
        this.levelTransitionTimer -= dt;
        if (this.levelTransitionTimer <= 0) {
            this.startLevel(this.levelIndex);
            this.state = 'PLAYING';
        } else {
            // Allow early skip
            if (this.input.isDown('Enter') || this.input.mouseDown) {
                this.levelTransitionTimer = 0;
            }
        }
    }

    updateWin(dt) {
        if (this.input.isDown('Enter') || this.input.mouseDown) {
            this.state = 'MENU';
            this.score = 0;
        }
    }

    updateGameOver(dt) {
        if (this.input.isDown('Enter') || this.input.mouseDown) {
            this.state = 'MENU';
            this.score = 0;
            this.resetGame();
        }
    }

    render(ctx) {
        const camX = 0;
        const camY = 0;
        if (this.screenShake > 0) {
            const dx = (Math.random()-0.5)*this.screenShake*10;
            const dy = (Math.random()-0.5)*this.screenShake*10;
            ctx.save();
            ctx.translate(dx, dy);
        }
        // Clear with gradient
        const gradient = ctx.createLinearGradient(0,0,0,GAME_HEIGHT);
        gradient.addColorStop(0, '#0b0b1a');
        gradient.addColorStop(0.5, '#16162d');
        gradient.addColorStop(1, '#0b1b2a');
        ctx.fillStyle = gradient;
        ctx.fillRect(-10,-10,GAME_WIDTH+20,GAME_HEIGHT+20);

        switch (this.state) {
            case 'MENU':
                this.drawMenu(ctx);
                break;
            case 'PLAYING':
                this.drawGame(ctx);
                break;
            case 'PAUSED':
                this.drawGame(ctx);
                this.drawPauseMenu(ctx);
                break;
            case 'GAME_OVER':
            case 'WIN':
                this.drawGame(ctx);
                this.drawGameOver(ctx);
                break;
            case 'LEVEL_TRANSITION':
                this.drawGame(ctx);
                this.drawLevelTransition(ctx);
                break;
        }

        // UI elements
        if (this.state !== 'MENU') this.drawHUD(ctx);

        // particles draw
        this.particles.draw(ctx);

        if (this.screenShake > 0) ctx.restore();
    }

    drawGame(ctx) {
        // Draw player
        if (this.player) this.player.draw(ctx);
        // Draw bullets
        this.bullets.forEach(b => b.draw(ctx));
        // Draw enemy
        if (this.enemy && !this.enemy.dead) this.enemy.draw(ctx);
    }

    drawHUD(ctx) {
        // score
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`SCORE: ${this.score}`, 10, 30);
        ctx.textAlign = 'right';
        ctx.fillText(`HI: ${this.highScore}`, GAME_WIDTH-10, 30);
        // lives
        ctx.fillText(`LIVES: ${this.player.lives}`, GAME_WIDTH-10, 60);
        // level
        ctx.textAlign = 'center';
        ctx.fillText(`LVL ${this.levelIndex+1}/${LEVELS.length}`, GAME_WIDTH/2, 30);
        // enemy HP
        if (this.enemy && !this.enemy.dead) {
            const hpPercent = this.enemy.hp / this.enemyDef.hp;
            const barW = 200;
            const barH = 10;
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.fillRect(GAME_WIDTH/2 - barW/2, 50, barW, barH);
            ctx.fillStyle = this.enemyDef.color;
            ctx.fillRect(GAME_WIDTH/2 - barW/2, 50, barW * hpPercent, barH);
            ctx.strokeStyle = '#fff';
            ctx.strokeRect(GAME_WIDTH/2 - barW/2, 50, barW, barH);
        }
    }

    drawMenu(ctx) {
        // Title
        ctx.font = 'bold 50px monospace';
        ctx.fillStyle = '#f39c12';
        ctx.shadowColor = '#f39c12';
        ctx.shadowBlur = 10;
        ctx.textAlign = 'center';
        ctx.fillText("DESTROY MILO'S GIRLFRIENDS", GAME_WIDTH/2, 120);
        ctx.shadowBlur = 0;
        ctx.font = 'italic 24px monospace';
        ctx.fillStyle = '#ecf0f1';
        ctx.fillText("8! (Count them)", GAME_WIDTH/2, 160);

        // Instructions
        ctx.font = '20px monospace';
        ctx.fillStyle = '#bdc3c7';
        ctx.fillText('Use Arrow Keys / A-D / Mouse to move', GAME_WIDTH/2, 240);
        ctx.fillText('Auto-fire! Survive all 8.', GAME_WIDTH/2, 280);

        // Start button
        ctx.fillStyle = '#2ecc71';
        ctx.strokeStyle = '#27ae60';
        ctx.lineWidth = 3;
        const btnW = 200;
        const btnH = 60;
        const btnX = GAME_WIDTH/2 - btnW/2;
        const btnY = 350;
        ctx.fillRect(btnX, btnY, btnW, btnH);
        ctx.strokeRect(btnX, btnY, btnW, btnH);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 30px monospace';
        ctx.fillText('PLAY', GAME_WIDTH/2, btnY + 42);

        // High score
        ctx.fillStyle = '#f1c40f';
        ctx.font = '22px monospace';
        ctx.fillText(`HIGH SCORE: ${this.highScore}`, GAME_WIDTH/2, 450);
    }

    drawPauseMenu(ctx) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0,0,GAME_WIDTH,GAME_HEIGHT);
        ctx.font = 'bold 40px monospace';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', GAME_WIDTH/2, 200);
        ctx.font = '20px monospace';
        ctx.fillText('Press P to resume', GAME_WIDTH/2, 300);
        ctx.fillText('Press Q to quit', GAME_WIDTH/2, 340);
    }

    drawGameOver(ctx) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0,0,GAME_WIDTH,GAME_HEIGHT);
        ctx.font = 'bold 50px monospace';
        ctx.fillStyle = '#e74c3c';
        ctx.textAlign = 'center';
        if (this.state === 'WIN') {
            ctx.fillStyle = '#2ecc71';
            ctx.fillText('YOU WIN!', GAME_WIDTH/2, 200);
        } else {
            ctx.fillText('GAME OVER', GAME_WIDTH/2, 200);
        }
        ctx.fillStyle = '#fff';
        ctx.font = '30px monospace';
        ctx.fillText(`Score: ${this.score}`, GAME_WIDTH/2, 270);
        ctx.fillText(`High Score: ${this.highScore}`, GAME_WIDTH/2, 310);
        ctx.font = '20px monospace';
        ctx.fillText('Press Enter or click to restart', GAME_WIDTH/2, 400);
    }

    drawLevelTransition(ctx) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(0,0,GAME_WIDTH,GAME_HEIGHT);
        if (this.levelIndex < LEVELS.length) {
            const def = LEVELS[this.levelIndex];
            ctx.fillStyle = def.color;
            ctx.font = 'bold 50px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(def.name, GAME_WIDTH/2, 200);
            ctx.font = '24px monospace';
            ctx.fillStyle = '#fff';
            ctx.fillText(def.desc, GAME_WIDTH/2, 260);
            ctx.fillText(`Press Enter to skip`, GAME_WIDTH/2, 320);
        }
    }

    resize() {
        this.canvas.width = GAME_WIDTH;
        this.canvas.height = GAME_HEIGHT;
    }
}