// particles.js — lightweight particle system

export class ParticleSystem {
    constructor() {
        this.particles = [];
        this.maxParticles = 300;
    }

    spawn(type, x, y, opts = {}) {
        if (this.particles.length >= this.maxParticles) return;
        const p = {
            type,
            x, y,
            vx: opts.vx ?? (Math.random() * 60 - 30),
            vy: opts.vy ?? (Math.random() * 60 - 30),
            life: opts.life ?? 0.6,
            maxLife: opts.life ?? 0.6,
            size: opts.size ?? 3 + Math.random() * 4,
            color: opts.color ?? '#ffffff',
            gravity: opts.gravity ?? 0,
            rotation: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 8,
        };
        this.particles.push(p);
    }

    burst(type, x, y, count, opts = {}) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = opts.speed ?? (40 + Math.random() * 80);
            this.spawn(type, x, y, {
                ...opts,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
            });
        }
    }

    dirt(x, y, count = 8) {
        this.burst('dirt', x, y, count, { color: '#5a3a1a', speed: 30 + Math.random() * 60, life: 0.4, size: 2 + Math.random() * 3, gravity: 200 });
    }

    carrotParts(x, y, count = 10) {
        this.burst('carrot', x, y, count, { color: '#ff6b35', speed: 50 + Math.random() * 100, life: 0.5, size: 3 + Math.random() * 4, gravity: 300 });
    }

    explosion(x, y, count = 25) {
        this.burst('fire', x, y, count, { color: '#ff4400', speed: 80 + Math.random() * 120, life: 0.5, size: 4 + Math.random() * 5, gravity: 100 });
        this.burst('fire', x, y, count / 2, { color: '#ffaa00', speed: 50 + Math.random() * 80, life: 0.3, size: 3 + Math.random() * 4, gravity: -50 });
        this.burst('smoke', x, y, count / 2, { color: '#555555', speed: 20 + Math.random() * 40, life: 1.0, size: 6 + Math.random() * 6, gravity: -30 });
    }

    tractorExhaust(x, y) {
        this.spawn('smoke', x, y, { color: '#777', life: 0.5, size: 3 + Math.random() * 3, gravity: -20, vx: (Math.random() - 0.5) * 20, vy: -20 - Math.random() * 20 });
    }

    update(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= dt;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += p.gravity * dt;
            p.rotation += p.rotSpeed * dt;
        }
    }

    render(ctx) {
        for (const p of this.particles) {
            const alpha = Math.min(1, p.life / (p.maxLife * 0.6));
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.fillStyle = p.color;
            if (p.type === 'smoke') {
                ctx.globalAlpha = alpha * 0.4;
                ctx.beginPath();
                ctx.arc(0, 0, p.size * (1 + (1 - p.life / p.maxLife) * 0.7), 0, Math.PI * 2);
                ctx.fill();
            } else if (p.type === 'carrot') {
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size / 2, -p.size, p.size * 0.6, p.size * 1.4);
                ctx.fillStyle = '#2d8a2d';
                ctx.fillRect(-p.size * 0.7, -p.size * 1.4, p.size * 1.4, p.size * 0.3);
            } else if (p.type === 'fire') {
                ctx.beginPath();
                ctx.arc(0, 0, p.size * (1 - (1 - p.life / p.maxLife) * 0.3), 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = alpha * 0.5;
                ctx.fillStyle = '#ffff00';
                ctx.beginPath();
                ctx.arc(p.size * 0.2, -p.size * 0.2, p.size * 0.4, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.beginPath();
                ctx.arc(0, 0, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }
    }

    clear() {
        this.particles = [];
    }
}