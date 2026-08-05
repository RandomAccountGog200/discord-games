// grid.js — farm grid, carrot planting/harvesting logic

import { ParticleSystem } from './particles.js';

export const GRID_COLS = 10;
export const GRID_ROWS = 7;
export const CELL_SIZE = 64;
export const GRID_X = 16;
export const GRID_Y = 96;

export function cellCenter(row, col) {
    return {
        x: GRID_X + col * CELL_SIZE + CELL_SIZE / 2,
        y: GRID_Y + row * CELL_SIZE + CELL_SIZE / 2,
    };
}

export function screenToCell(sx, sy, game) {
    const col = Math.floor((sx - GRID_X) / CELL_SIZE);
    const row = Math.floor((sy - GRID_Y) / CELL_SIZE);
    if (row < 0 || row >= GRID_ROWS || col < 0 || col >= GRID_COLS) return null;
    return { row, col };
}

export class FarmGrid {
    constructor(game) {
        this.game = game;
        this.particles = new ParticleSystem();
        this.cells = [];
        this.growthTime = 8; // base seconds to grow
        this.init();
    }

    init() {
        this.cells = [];
        for (let r = 0; r < GRID_ROWS; r++) {
            const row = [];
            for (let c = 0; c < GRID_COLS; c++) {
                row.push({
                    type: 'empty',
                    growthStage: 0,    // 0-4 (4 = ripe)
                    growthProgress: 0,
                    occupied: false,
                    defenseType: null,
                    defenseHp: 0,
                    defenseCooldown: 0,
                    trapTimer: 0,
                    eatProgress: 0,
                });
            }
            this.cells.push(row);
        }
    }

    getCell(row, col) {
        if (row < 0 || row >= GRID_ROWS || col < 0 || col >= GRID_COLS) return null;
        return this.cells[row][col];
    }

    getGrowthDuration() {
        const level = this.game.player.upgrades.growthSpeed;
        return this.growthTime * Math.pow(0.85, level);
    }

    plant(row, col) {
        const cell = this.getCell(row, col);
        if (!cell || cell.type !== 'empty' || cell.defenseType) return false;
        cell.type = 'carrot';
        cell.growthStage = 0;
        cell.growthProgress = 0;
        cell.eatProgress = 0;
        const center = cellCenter(row, col);
        this.particles.dirt(center.x, center.y + 10, 6);
        this.game.audio.plant();
        return true;
    }

    harvest(row, col) {
        const cell = this.getCell(row, col);
        if (!cell || cell.type !== 'carrot' || cell.growthStage < 4) return false;
        const center = cellCenter(row, col);
        const harvestBonus = this.game.player.upgrades.harvester;
        const amount = 1 + harvestBonus;
        this.game.player.addCarrots(amount);
        this.game.player.addScore(10 * amount);
        this.particles.carrotParts(center.x, center.y, 8);
        this.particles.dirt(center.x, center.y + 12, 4);
        this.game.audio.harvest();
        cell.type = 'empty';
        cell.growthStage = 0;
        return true;
    }

    eatCarrot(row, col) {
        const cell = this.getCell(row, col);
        if (!cell || cell.type !== 'carrot') return false;
        const center = cellCenter(row, col);
        this.particles.dirt(center.x, center.y, 10);
        this.game.audio.tractorEat();
        this.game.screenShake = Math.min(0.6, this.game.screenShake + 0.15);
        const wasRipe = cell.growthStage >= 4;
        cell.type = 'empty';
        cell.growthStage = 0;
        // Deduct score & hearts
        if (wasRipe) this.game.player.addScore(-5);
        const died = this.game.player.loseHeart();
        this.game.audio.heartLost();
        if (died) {
            this.game.endGame();
            return true;
        }
        return true;
    }

    buildDefense(row, col, type) {
        const cell = this.getCell(row, col);
        if (!cell || cell.type !== 'empty' || cell.defenseType) return false;
        const center = cellCenter(row, col);
        const costs = { fence: 15, turret: 25, trap: 10 };
        if (!this.game.player.spendCarrots(costs[type])) return false;
        cell.defenseType = type;
        cell.defenseHp = type === 'fence' ? 60 : type === 'turret' ? 30 : 20;
        cell.defenseCooldown = 0;
        cell.trapTimer = 0;
        this.particles.dirt(center.x, center.y, 10);
        this.game.audio.buildDefense();
        return true;
    }

    damageDefense(row, col, dmg) {
        const cell = this.getCell(row, col);
        if (!cell || !cell.defenseType) return false;
        cell.defenseHp -= dmg;
        const center = cellCenter(row, col);
        this.particles.dirt(center.x, center.y, 3);
        if (cell.defenseHp <= 0) {
            cell.defenseType = null;
            cell.defenseHp = 0;
            this.game.audio.tractorEat();
        }
        return true;
    }

    isBlocking(row, col) {
        const cell = this.getCell(row, col);
        return cell && cell.defenseType === 'fence';
    }

    getCarrotCells() {
        const list = [];
        for (let r = 0; r < GRID_ROWS; r++) {
            for (let c = 0; c < GRID_COLS; c++) {
                if (this.cells[r][c].type === 'carrot') {
                    list.push({ row: r, col: c });
                }
            }
        }
        return list;
    }

    getDefenseCells() {
        const list = [];
        for (let r = 0; r < GRID_ROWS; r++) {
            for (let c = 0; c < GRID_COLS; c++) {
                if (this.cells[r][c].defenseType) {
                    list.push({ row: r, col: c, cell: this.cells[r][c] });
                }
            }
        }
        return list;
    }

    update(dt) {
        const growthDur = this.getGrowthDuration();
        for (let r = 0; r < GRID_ROWS; r++) {
            for (let c = 0; c < GRID_COLS; c++) {
                const cell = this.cells[r][c];

                // Carrot growth
                if (cell.type === 'carrot') {
                    cell.growthProgress += dt / growthDur;
                    cell.growthStage = Math.min(4, Math.floor(cell.growthProgress * 5));
                    // Ripe carrots gently pulse — handled in render
                }

                // Turret cooldown
                if (cell.defenseType === 'turret') {
                    cell.defenseCooldown -= dt;
                    // Turret auto-fire
                    if (cell.defenseCooldown <= 0) {
                        const center = cellCenter(r, c);
                        const target = this.findTractorInRange(center.x, center.y, 150);
                        if (target) {
                            const dmg = 10 + this.game.player.upgrades.turretDamage * 4;
                            target.takeDamage(dmg, center.x, center.y);
                            cell.defenseCooldown = 0.8;
                            this.game.audio.turretShot();
                            this.game.particles.spawn('fire', center.x, center.y - 10, { color: '#ffaa00', size: 3, life: 0.2, vx: (target.x - center.x > 0 ? 1 : -1) * 60, vy: -20 });
                        }
                    }
                }

                // Trap reset
                if (cell.defenseType === 'trap') {
                    cell.trapTimer = Math.max(0, cell.trapTimer - dt);
                }
            }
        }
        this.particles.update(dt);
    }

    findTractorInRange(x, y, range) {
        let closest = null;
        let bestDist = range;
        for (const t of this.game.entities.tractors) {
            const dx = t.x - x;
            const dy = t.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < bestDist) {
                bestDist = dist;
                closest = t;
            }
        }
        return closest;
    }

    render(ctx) {
        // Draw soil base
        for (let r = 0; r < GRID_ROWS; r++) {
            for (let c = 0; c < GRID_COLS; c++) {
                const x = GRID_X + c * CELL_SIZE;
                const y = GRID_Y + r * CELL_SIZE;
                const cell = this.cells[r][c];

                // Soil background
                const soilColor = (r + c) % 2 === 0 ? '#3d2617' : '#452b1c';
                ctx.fillStyle = soilColor;
                ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);

                // Subtle soil texture
                ctx.fillStyle = 'rgba(0,0,0,0.08)';
                for (let i = 0; i < 3; i++) {
                    const px = x + ((r * 13 + c * 7 + i * 23) % 53) + 5;
                    const py = y + ((c * 17 + r * 11 + i * 31) % 47) + 5;
                    ctx.beginPath();
                    ctx.arc(px, py, 1.5 + (i % 3), 0, Math.PI * 2);
                    ctx.fill();
                }

                // Cell border
                ctx.strokeStyle = 'rgba(0,0,0,0.15)';
                ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE);

                // Carrot
                if (cell.type === 'carrot') {
                    this.renderCarrot(ctx, x, y, r, c, cell);
                }

                // Defenses
                if (cell.defenseType) {
                    this.renderDefense(ctx, x, y, r, c, cell);
                }
            }
        }
        // Render particles here too
        this.particles.render(ctx);
    }

    renderCarrot(ctx, x, y, r, c, cell) {
        const cx = x + CELL_SIZE / 2;
        const cy = y + CELL_SIZE / 2;
        const stage = cell.growthStage;

        if (stage === 0) {
            // Sprout — tiny green tip
            ctx.fillStyle = '#3a8a3a';
            ctx.fillRect(cx - 2, cy, 4, 6);
        } else if (stage === 1) {
            ctx.fillStyle = '#2d6b2d';
            ctx.beginPath();
            ctx.ellipse(cx, cy - 4, 6, 8, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#4a9a4a';
            ctx.fillRect(cx - 1, cy - 8, 2, 10);
        } else if (stage === 2) {
            // Small carrot peeking above ground
            ctx.fillStyle = '#3a8a3a';
            ctx.beginPath();
            ctx.ellipse(cx, cy - 6, 10, 12, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ff6b35';
            ctx.beginPath();
            ctx.ellipse(cx, cy + 4, 6, 10, 0, Math.PI, Math.PI * 2);
            ctx.fill();
        } else if (stage === 3) {
            ctx.fillStyle = '#2d7a2d';
            ctx.beginPath();
            ctx.ellipse(cx, cy - 8, 13, 14, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ff7733';
            ctx.beginPath();
            ctx.ellipse(cx, cy, 8, 14, 0, Math.PI, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#cc5520';
            ctx.beginPath();
            ctx.ellipse(cx - 2, cy + 6, 3, 6, 0, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Ripe carrot with glow
            const pulse = 0.8 + Math.sin(Date.now() / 300 + r * 5 + c * 3) * 0.2;
            ctx.fillStyle = `rgba(255, 180, 60, ${0.1 * pulse})`;
            ctx.beginPath();
            ctx.arc(cx, cy, 24 * pulse, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#1d6b1d';
            ctx.beginPath();
            ctx.ellipse(cx, cy - 10, 16, 16, 0.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#2d8a2d';
            ctx.beginPath();
            ctx.ellipse(cx - 6, cy - 16, 6, 10, -0.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(cx + 7, cy - 17, 5, 9, 0.4, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ff7733';
            ctx.beginPath();
            ctx.ellipse(cx, cy + 4, 10, 18, 0, Math.PI, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#cc5520';
            ctx.beginPath();
            ctx.ellipse(cx - 3, cy + 10, 4, 8, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ff8833';
            ctx.beginPath();
            ctx.ellipse(cx + 3, cy - 2, 3, 5, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    renderDefense(ctx, x, y, r, c, cell) {
        const cx = x + CELL_SIZE / 2;
        const cy = y + CELL_SIZE / 2;

        if (cell.defenseType === 'fence') {
            const hpRatio = cell.defenseHp / 60;
            ctx.fillStyle = '#6b3a1f';
            ctx.fillRect(x + 4, y + 4, CELL_SIZE - 8, CELL_SIZE - 8);
            ctx.fillStyle = '#8b5a2b';
            ctx.fillRect(x + 8, y + 8, CELL_SIZE - 16, CELL_SIZE - 16);
            // Cross bar
            ctx.fillStyle = '#5a321a';
            ctx.fillRect(x + CELL_SIZE / 2 - 3, y + 8, 6, CELL_SIZE - 16);
            ctx.fillRect(x + 8, y + CELL_SIZE / 2 - 3, CELL_SIZE - 16, 6);
            // Planks
            for (let i = 0; i < 3; i++) {
                ctx.fillStyle = '#7a4a24';
                ctx.fillRect(x + 10 + i * 16, y + 10 + i * 8, 6, 20);
            }
            // Damage tint
            if (hpRatio < 0.5) {
                ctx.fillStyle = 'rgba(255,0,0,0.15)';
                ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
            }
        } else if (cell.defenseType === 'turret') {
            // Scarecrow-style turret on wooden post
            ctx.fillStyle = '#5a321a';
            ctx.fillRect(cx - 4, cy - 4, 8, 20);
            // Turret head — rotating gun plate
            const angle = Date.now() / 500;
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(Math.sin(angle) * 0.5);
            ctx.fillStyle = '#4682b4';
            ctx.beginPath();
            ctx.arc(0, 0, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#5a9abe';
            ctx.beginPath();
            ctx.arc(0, 0, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#333';
            ctx.fillRect(4, -3, 14, 6);
            ctx.fillStyle = '#ffdd44';
            ctx.beginPath();
            ctx.arc(-2, -2, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            // Straw on top (scarecrow hat)
            ctx.fillStyle = '#d4a63a';
            ctx.fillRect(cx - 12, cy - 18, 24, 5);
        } else if (cell.defenseType === 'trap') {
            // Trap spikes / mud
            ctx.fillStyle = '#3a4a2a';
            ctx.fillRect(x + 6, y + 6, CELL_SIZE - 12, CELL_SIZE - 12);
            ctx.fillStyle = '#556b2f';
            for (let i = 0; i < 4; i++) {
                for (let j = 0; j < 4; j++) {
                    ctx.beginPath();
                    ctx.moveTo(x + 12 + i * 13, y + 14 + j * 13);
                    ctx.lineTo(x + 18 + i * 13, y + 12 + j * 13);
                    ctx.lineTo(x + 15 + i * 13, y + 24 + j * 13);
                    ctx.fill();
                }
            }
        }
    }
}