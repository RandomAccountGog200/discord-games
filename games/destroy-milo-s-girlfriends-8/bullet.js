import { BULLET_SIZE } from './constants.js';

export class Bullet {
    constructor(x, y, vy, damage, color = '#ffff00') {
        this.x = x;
        this.y = y;
        this.vy = vy;
        this.damage = damage;
        this.color = color;
        this.radius = BULLET_SIZE;
        this.dead = false;
    }

    update(dt) {
        this.y += this.vy * dt;
        if (this.y < -20 || this.y > 780) this.dead = true;
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}