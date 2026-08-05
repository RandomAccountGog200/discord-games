import { ENEMY_SIZE, GAME_WIDTH, GAME_HEIGHT } from './constants.js';
import { getEnemy } from './levels.js';

export class Enemy {
    constructor(def, levelIndex) {
        this.def = def;
        this.x = GAME_WIDTH / 2;
        this.y = -ENEMY_SIZE - 10;
        this.size = ENEMY_SIZE;
        this.hp = def.hp;
        this.maxHp = def.hp;
        this.speed = def.speed * 80; // base speed
        this.color = def.color;
        this.baseX = this.x;
        this.targetX = 0;
        this.vy = 30; // initial descent speed
        this.vx = 50;
        this.fireTimer = 0;
        this.fireRate = def.fireRate;
        this.pattern = def.pattern;
        this.patternFunc = getEnemy(this.pattern);
        this.dead = false;
        this.changeT = 0;
        this.time = 0;
        this.scoreValue = def.score;
        this.levelIndex = levelIndex;
    }

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.dead = true;
        }
    }

    update(dt, game) {
        this.time += dt;
        // Move using pattern
        if (this.patternFunc) {
            this.patternFunc(this, dt, this.time);
        }

        // Handle with bounds
        this.x = Math.max(0, Math.min(GAME_WIDTH, this.x));
        this.y = Math.max(0, Math.min(GAME_HEIGHT, this.y));

        // Fire projectiles (TODO)
        this.fireTimer -= dt;
        if (this.fireTimer <= 0) {
            // Fire a bullet aimed at player
            // We'll implement later if time
            this.fireTimer = this.fireRate;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        // Draw shape: circle with jagged edges
        ctx.beginPath();
        const segments = 20;
        for (let i = 0; i < segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const radius = this.size * (1 + 0.2 * Math.sin(this.time * 3 + i * 2));
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
    }
}