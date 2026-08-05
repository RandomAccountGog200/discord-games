// entities.js — enemy tractors, defenses & projectiles

import { CELL_SIZE, GRID_X, GRID_Y, GRID_COLS, GRID_ROWS, cellCenter } from './grid.js';

const TRACTOR_TYPES = {
    basic: { hp: 30, speed: 42, size: 22, color: '#a02020', score: 50, armor: false },
    fast: { hp: 20, speed: 80, size: 16, color: '#c06020', score: 75, armor: false },
    armored: { hp: 80, speed: 28, size: 26, color: '#701030', score: 100, armor: true },
    boss: { hp: 200, speed: 22, size: 32, color: '#400010', score: 250, armor: true },
};

const SPAWN_POINTS = [
    { x: GRID_X - 40, y: GRID_Y + GRID_ROWS * CELL_SIZE / 2 },
    { x: GRID_X + GRID_COLS * CELL_SIZE + 40, y: GRID_Y + GRID_ROWS * CELL_SIZE / 2 },
    { x: GRID_X + GRID_COLS * CELL_SIZE / 2, y: GRID_Y - 40 },
    { x: GRID_X + GRID_COLS * CELL_SIZE / 2, y: GRID_Y + GRID_ROWS * CELL_SIZE + 40 },
];

export class Tractor {
    constructor(type, x, y, game) {
        const def = TRACTOR_TYPES[type];
        this.type = type;
        this.x = x;
        this.y = y;
        this.hp = def.hp;
        this.maxHp = def.hp;
        this.speed = def.speed * (0.9 + Math.random() * 0.3);
        this.size = def.size;
        this.color = def.color;
        this.armor = def.armor;
        this.score = def.score;
        this.game = game;
        this.target = null;
        this.state = 'seeking'; // seeking, eating, wandering, dead
        this.eatTimer = 0;
        this.trailTimer = 0;
        this.bobPhase = Math.random() * Math.PI * 2;
        this.pushX = 0;
        this.pushY = 0;
        this.flashTimer = 0;
    }

    findTarget() {
        // Find nearest carrot cell
        const carrots = this.game.grid.getCarrotCells();
        if (carrots.length === 0) return null;
        let best = null;
        let bestDist = Infinity;
        for (const c of carrots) {
            const center = cellCenter(c.row, c.col);
            const dx = center.x - this.x;
            const dy = center.y - this.y;
            const dist = dx * dx + dy * dy;
            // Slight random jitter to spread targets
            const jitter = Math.sin(c.row * 12.9898 + c.col * 78.233) * 100;
            if (dist + jitter < bestDist) {
                bestDist = dist + jitter;
                best = c;
            }
        }
        return best;
    }

    takeDamage(dmg, fromX, fromY) {
        const actualDmg = this.armor ? Math.max(1, Math.floor(dmg * 0.7)) : dmg;
        this.hp -= actualDmg;
        this.flashTimer = 0.1;
        // knockback
        const dx = this.x - fromX;
        const dy = this.y - fromY;
        const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
        this.pushX += (dx / dist) * 30;
        this.pushY += (dy / dist) * 30;
        if (this.hp <= 0) {
            this.die();
        }
        return actualDmg;
    }

    die() {
        if (this.state === 'dead') return;
        this.state = 'dead';
        const cx = this.x;
        const cy = this.y;
        this.game.particles.explosion(cx, cy, this.armor ? 35 : 20);
        this.game.audio.tractorDeath();
        this.game.screenShake = Math.min(0.8, this.game.screenShake + 0.1);
        this.game.player.addScore(this.score);
    }

    update(dt) {
        if (this.state === 'dead') return;

        if (this.flashTimer > 0) this.flashTimer -= dt;
        this.bobPhase += dt * 3;
        this.trailTimer -= dt;
        if (this.trailTimer <= 0) {
            this.trailTimer = 0.15;
            this.game.particles.tractorExhaust(this.x - Math.cos(this.bobPhase) * 5, this.y + 12);
        }

        // Apply push/knockback
        this.x += this.pushX;
        this.y += this.pushY;
        this.pushX *= 0.8;
        this.pushY *= 0.8;

        if (this.state === 'seeking') {
            // Get target
            if (!this.target || this.isTargetGone()) {
                this.target = this.findTarget();
            }
            if (!this.target) {
                this.state = 'wandering';
                return;
            }
            const center = cellCenter(this.target.row, this.target.col);
            const dx = center.x - this.x;
            const dy = center.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Check for blocking fence in the way (simple check)
            // If close to target, start eating
            if (dist < 14) {
                this.state = 'eating';
                this.eatTimer = 0;
                return;
            }

            const step = this.speed * dt;
            const nx = dx / dist;
            const ny = dy / dist;

            // Simple obstacle avoidance: push away from fence cells
            let avoidX = 0, avoidY = 0;
            for (const d of this.game.grid.getDefenseCells()) {
                if (d.cell.defenseType !== 'fence') continue;
                const cCenter = cellCenter(d.row, d.col);
                const ox = this.x - cCenter.x;
                const oy = this.y - cCenter.y;
                const od = Math.sqrt(ox * ox + oy * oy);
                if (od < CELL_SIZE && od > 0) {
                    avoidX += (ox / od) * 0.6;
                    avoidY += (oy / od) * 0.6;
                }
            }

            const totalDx = nx + avoidX * 0.5;
            const totalDy = ny + avoidY * 0.5;
            const totalLen = Math.max(0.01, Math.sqrt(totalDx * totalDx + totalDy * totalDy));

            this.x += (totalDx / totalLen) * step;
            this.y += (totalDy / totalLen) * step;

            // Trap slow down
            for (const d of this.game.grid.getDefenseCells()) {
                if (d.cell.defenseType !== 'trap') continue;
                const cCenter = cellCenter(d.row, d.col);
                const dxT = this.x - cCenter.x;
                const dyT = this.y - cCenter.y;
                if (Math.sqrt(dxT * dxT + dyT * dyT) < CELL_SIZE * 0.6) {
                    // Already slowed
                    this.slowTimer = 0.2;
                }
            }

            // Fence attack: if near a fence, attack it
            for (const d of this.game.grid.getDefenseCells()) {
                if (d.cell.defenseType !== 'fence') continue;
                const cCenter = cellCenter(d.row, d.col);
                const ox = this.x - cCenter.x;
                const oy = this.y - cCenter.y;
                const od = Math.sqrt(ox * ox + oy * oy);
                if (od < CELL_SIZE * 0.7) {
                    // Attack fence
                    d.cell.defenseHp -= 20 * dt;
                    if (d.cell.defenseHp <= 0) {
                        d.cell.defenseType = null;
                        this.game.audio.tractorEat();
                        this.game.particles.dirt(cCenter.x, cCenter.y, 8);
                    }
                }
            }
        } else if (this.state === 'eating') {
            this.eatTimer += dt;
            // wobble while eating
            this.x += Math.sin(this.bobPhase * 5) * 0.2;
            if (this.eatTimer >= (this.type === 'boss' ? 1.5 : 0.8)) {
                if (this.target) {
                    const wasEaten = this.game.grid.eatCarrot(this.target.row, this.target.col);
                    if (wasEaten) {
                        // Tractor eats, gets a little stronger
                        this.hp = Math.min(this.maxHp * 1.5, this.hp + 5);
                    }
                }
                this.target = null;
                this.state = 'seeking';
            }
        } else if (this.state === 'wandering') {
            // Wander slowly
            this.x += Math.sin(this.bobPhase * 2) * 10 * dt;
            this.y += Math.cos(this.bobPhase * 1.5) * 10 * dt;
            // Check for carrots again
            const carrots = this.game.grid.getCarrotCells();
            if (carrots.length > 0) {
                this.state = 'seeking';
                this.target = this.findTarget();
            }
        }
    }

    isTargetGone() {
        if (!this.target) return true;
        const cell = this.game.grid.getCell(this.target.row, this.target.col);
        return !cell || cell.type !== 'carrot';
    }

    render(ctx) {
        if (this.state === 'dead') return;
        const x = this.x;
        const y = this.y;
        const size = this.size;
        const bob = Math.sin(this.bobPhase) * 1.5;

        ctx.save();
        ctx.translate(x, y + bob);

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(0, size * 0.8, size * 0.9, size * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Tracks (caterpillar tracks)
        ctx.fillStyle = '#222';
        roundRect(ctx, -size, size * 0.3, size * 2, size * 0.4, 4);
        ctx.fill();
        // Track treads
        ctx.fillStyle = '#333';
        for (let i = -size; i < size; i += 5) {
            ctx.fillRect(i, size * 0.3, 3, size * 0.4);
        }

        // Body
        ctx.fillStyle = this.color;
        roundRect(ctx, -size * 0.9, -size * 0.4, size * 1.8, size * 0.9, 6);
        ctx.fill();

        // Hood (front)
        ctx.fillStyle = this.armor ? '#4a1010' : '#c04040';
        roundRect(ctx, -size * 0.9, -size * 0.4, size * 0.7, size * 0.5, 4);
        ctx.fill();

        // Cab (back)
        ctx.fillStyle = this.armor ? '#350808' : '#a03030';
        roundRect(ctx, size * 0.1, -size * 0.8, size * 0.7, size * 0.8, 3);
        ctx.fill();

        // Cab windows
        ctx.fillStyle = '#ffcc00';
        roundRect(ctx, size * 0.15, -size * 0.75, size * 0.2, size * 0.35, 2);
        ctx.fill();

        // Red star (evil soviet symbol)
        drawStar(ctx, size * 0.5, size * 0.2, size * 0.22, '#cc0000');

        // Exhaust pipe
        ctx.fillStyle = '#555';
        ctx.fillRect(-size * 0.7, -size * 0.6, 4, size * 0.3);

        // Menacing eyes (headlights)
        const excited = this.state === 'eating' ? 1 : 0;
        ctx.fillStyle = `rgba(255, 80, 40, ${0.7 + excited * 0.3})`;
        ctx.beginPath();
        ctx.arc(-size * 0.8, -size * 0.1, 3 + excited, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(-size * 0.45, -size * 0.1, 3 + excited, 0, Math.PI * 2);
        ctx.fill();

        // Armor plate for armored
        if (this.armor) {
            ctx.strokeStyle = '#555';
            ctx.lineWidth = 2;
            roundRect(ctx, -size * 0.95, -size * 0.45, size * 1.9, size * 0.95, 8);
            ctx.stroke();
            // Rivets
            ctx.fillStyle = '#777';
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.arc(-size + i * size * 0.9 + 8, -size * 0.4 + 6, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // Damage flash
        if (this.flashTimer > 0) {
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = '#ffffff';
            roundRect(ctx, -size, -size * 0.8, size * 2, size * 1.3, 6);
            ctx.fill();
            ctx.globalAlpha = 1;
        }

        // Boss has a special crown
        if (this.type === 'boss') {
            ctx.fillStyle = '#ffaa00';
            ctx.beginPath();
            ctx.moveTo(-size * 0.4, -size * 0.8);
            ctx.lineTo(-size * 0.4, -size * 1.1);
            ctx.lineTo(-size * 0.2, -size * 0.9);
            ctx.lineTo(0, -size * 1.2);
            ctx.lineTo(size * 0.2, -size * 0.9);
            ctx.lineTo(size * 0.4, -size * 1.1);
            ctx.lineTo(size * 0.4, -size * 0.8);
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore();

        // Health bar
        if (this.hp < this.maxHp) {
            const barW = this.size * 2;
            const barH = 4;
            const bx = this.x - barW / 2;
            const by = this.y - this.size - 10;
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(bx, by, barW, barH);
            ctx.fillStyle = '#ff3333';
            ctx.fillRect(bx, by, barW * (this.hp / this.maxHp), barH);
        }
    }
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function drawStar(ctx, x, y, r, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
        const angle = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
        const px = x + Math.cos(angle) * r;
        const py = y + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
}

export class EntityManager {
    constructor(game) {
        this.game = game;
        this.tractors = [];
        this.projectiles = [];
    }

    spawnTractor(type) {
        const points = [...SPAWN_POINTS];
        // Choose a spawn point away from center
        const bestPoint = points[Math.floor(Math.random() * points.length)];
        const t = new Tractor(type, bestPoint.x, bestPoint.y, this.game);
        this.tractors.push(t);
        return t;
    }

    spawnTractorAt(type, x, y) {
        const t = new Tractor(type, x, y, this.game);
        this.tractors.push(t);
        return t;
    }

    update(dt) {
        for (const t of this.tractors) {
            t.update(dt);
        }
        // Remove dead tractors
        this.tractors = this.tractors.filter(t => t.state !== 'dead');

        // Projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;
            if (p.life <= 0) {
                this.projectiles.splice(i, 1);
                continue;
            }
            // Check collision with tractors
            let hit = false;
            for (const t of this.tractors) {
                const dx = t.x - p.x;
                const dy = t.y - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < t.size * 0.8 + p.radius) {
                    t.takeDamage(p.damage, p.x, p.y);
                    this.game.particles.spawn('fire', p.x, p.y, { color: '#ffaa00', size: 3, life: 0.2 });
                    hit = true;
                    break;
                }
            }
            if (hit) this.projectiles.splice(i, 1);
        }
    }

    clear() {
        this.tractors = [];
        this.projectiles = [];
    }

    render(ctx) {
        for (const t of this.tractors) {
            t.render(ctx);
        }
        // Projectiles
        for (const p of this.projectiles) {
            ctx.fillStyle = '#ffdd44';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius * 0.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}