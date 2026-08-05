import { PLAYER_SIZE, GAME_WIDTH, GAME_HEIGHT } from './constants.js';
import { Bullet } from './bullet.js';

export class Player {
    constructor() {
        this.size = PLAYER_SIZE;
        this.x = GAME_WIDTH / 2;
        this.y = GAME_HEIGHT - this.size - 10;
        this.speed = 450;
        this.color = '#4ecdc4';
        this.lives = 3;
        this.invulnTimer = 0;
        this.cooldown = 0;
        this.fireRate = 0.25; // seconds
        this.screenShake = 0;
    }

    reset() {
        this.x = GAME_WIDTH / 2;
        this.y = GAME_HEIGHT - this.size - 10;
        this.lives = 3;
        this.invulnTimer = 0;
        this.cooldown = 0;
    }

    update(dt, input) {
        // Movement
        let dx = 0;
        if (input.isDown('ArrowLeft') || input.isDown('a') || input.keys['a']) dx -= 1;
        if (input.isDown('ArrowRight') || input.isDown('d') || input.keys['d']) dx += 1;
        // Mouse/touch movement
        let moveToX = null;
        if (input.mouseDown && !input.touchActive) {
            moveToX = input.mouseX;
        } else if (input.touchActive) {
            moveToX = input.touchX;
        }
        if (moveToX !== null) {
            const target = moveToX - this.x;
            if (Math.abs(target) > 5) this.x += target * 8 * dt;
        } else if (dx !== 0) {
            this.x += dx * this.speed * dt;
        }
        this.x = Math.max(this.size/2, Math.min(GAME_WIDTH - this.size/2, this.x));

        // Invulnerability
        if (this.invulnTimer > 0) this.invulnTimer -= dt;

        // Firing
        this.cooldown -= dt;
        let fire = input.isDown(' ') || input.mouseDown || input.touchActive;
        if (fire && this.cooldown <= 0) {
            this.cooldown = this.fireRate;
            return new Bullet(this.x, this.y - this.size, -700, 1, '#ffeb3b');
        }
        return null;
    }

    hit() {
        if (this.invulnTimer > 0) return false;
        this.lives--;
        this.invulnTimer = 1.5;
        this.screenShake = 0.5;
        return true;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        if (this.invulnTimer > 0 && Math.floor(this.invulnTimer * 10) % 2 === 0) {
            ctx.globalAlpha = 0.3;
        }
        // Player ship (a triangle)
        ctx.fillStyle = this.color;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -this.size/1.5);
        ctx.lineTo(this.size/1.5, this.size/1.5);
        ctx.lineTo(-this.size/1.5, this.size/1.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // Engines glow
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#00ffff';
        ctx.beginPath();
        ctx.arc(0, this.size/2, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.restore();
    }
}