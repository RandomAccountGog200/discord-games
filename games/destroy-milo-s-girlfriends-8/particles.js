export class Particle {
    constructor(x, y, vx, vy, life, maxLife, size, color, type = 'circle') {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.life = life;
        this.maxLife = life;
        this.size = size;
        this.color = color;
        this.type = type;
        this.gravity = 0;
    }

    update(dt) {
        this.life -= dt;
        this.vy += this.gravity * dt;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.vx *= 0.98;
        this.vy *= 0.98;
    }

    draw(ctx) {
        const alpha = Math.max(0, this.life / this.maxLife);
        ctx.globalAlpha = alpha;
        if (this.type === 'circle') {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * alpha, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'spark') {
            ctx.strokeStyle = this.color;
            ctx.lineWidth = this.size * alpha;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x - this.vx * 2, this.y - this.vy * 2);
            ctx.stroke();
        } else if (this.type === 'text') {
            ctx.font = `${this.size}px monospace`;
            ctx.fillStyle = this.color;
            ctx.fillText(this.value, this.x, this.y);
        }
    }
}

export class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    addExplosion(x, y, color, count = 15) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 200 + 100;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            const life = Math.random() * 0.5 + 0.2;
            const size = Math.random() * 8 + 2;
            this.particles.push(new Particle(x, y, vx, vy, life, life, size, color, Math.random() < 0.3 ? 'spark' : 'circle'));
        }
    }

    addTrail(x, y, color) {
        this.particles.push(new Particle(x + (Math.random() - 0.5) * 10, y + (Math.random() - 0.5) * 10,
            Math.random() * 40 - 20, Math.random() * 40 - 20, 0.3, 0.3, 3, color, 'circle'));
    }

    addText(x, y, text, color) {
        this.particles.push(new Particle(x, y, 0, -50, 0.8, 0.8, 24, color, 'text'));
        this.particles[this.particles.length-1].value = text;
    }

    update(dt) {
        this.particles.forEach(p => p.update(dt));
        this.particles = this.particles.filter(p => p.life > 0);
    }

    draw(ctx) {
        this.particles.forEach(p => p.draw(ctx));
        ctx.globalAlpha = 1;
    }

    clear() {
        this.particles = [];
    }
}