// ui.js — all UI rendering: HUD, menus, buttons

import { GRID_X, GRID_Y, GRID_COLS, GRID_ROWS, CELL_SIZE } from './grid.js';

const PANEL_X = 672;
const PANEL_Y = 16;
const PANEL_W = 272;
const PANEL_H = 608;

const BUTTON_BG = '#2a2a3a';
const BUTTON_HOVER = '#3a3a4a';
const BUTTON_ACTIVE = '#1a1a2a';
const BUTTON_DISABLED = '#1a1a22';
const ACCENT = '#ffb843';
const TEXT_COLOR = '#e8e8e8';
const SUBTEXT = '#8899aa';

export class UIManager {
    constructor(game) {
        this.game = game;
        this.buttons = [];
        this.hoverBtn = null;
        this.selectedBuild = null; // 'fence' | 'turret' | 'trap' | null
        this.notification = '';
        this.notificationTimer = 0;
    }

    showNotification(msg, dur = 2) {
        this.notification = msg;
        this.notificationTimer = dur;
    }

    update(dt) {
        if (this.notificationTimer > 0) {
            this.notificationTimer -= dt;
            if (this.notificationTimer <= 0) this.notification = '';
        }
    }

    // Build button list based on state
    rebuildButtons(state) {
        this.buttons = [];
        if (state === 'menu') {
            this.buttons.push({ id: 'start', x: 380, y: 400, w: 200, h: 50, label: 'START FARMING', enabled: true });
        } else if (state === 'playing' || state === 'intermission') {
            const p = this.game.player;
            // Build buttons
            const costs = { fence: 15, turret: 25, trap: 10 };
            const labels = ['FENCE', 'TURRET', 'TRAP'];
            const types = ['fence', 'turret', 'trap'];
            for (let i = 0; i < 3; i++) {
                const enabled = p.canAfford(costs[types[i]]);
                const y = PANEL_Y + 120 + i * 62;
                this.buttons.push({
                    id: 'build_' + types[i],
                    x: PANEL_X + 12, y, w: PANEL_W - 24, h: 50,
                    label: `${labels[i]}  ${costs[types[i]]}🥕`,
                    enabled,
                    selected: this.selectedBuild === types[i],
                });
            }
            // Upgrade buttons
            const upgradeKeys = [['growthSpeed', 'GROWTH'], ['harvester', 'HARVEST'], ['turretDamage', 'TURRET DMG']];
            for (let i = 0; i < 3; i++) {
                const [key, label] = upgradeKeys[i];
                const cost = p.getUpgradeCost(key);
                const canUp = p.canUpgrade(key);
                const level = p.upgrades[key];
                this.buttons.push({
                    id: 'upgrade_' + key,
                    x: PANEL_X + 12, y: PANEL_Y + 330 + i * 58, w: PANEL_W - 24, h: 48,
                    label: `↑ ${label}  ${cost}🥕  L${level}/3`,
                    enabled: canUp,
                });
            }
            // Next wave button
            if (state === 'intermission' || !this.game.waves.isWaveActive) {
                this.buttons.push({
                    id: 'next_wave',
                    x: PANEL_X + 12, y: PANEL_Y + 538, w: PANEL_W - 24, h: 48,
                    label: `START WAVE ${this.game.waves.waveNumber + 1}`,
                    enabled: true,
                    primary: true,
                });
            }
            // Pause button
            this.buttons.push({
                id: 'pause', x: PANEL_X + 12, y: PANEL_Y + 590, w: PANEL_W - 24, h: 30,
                label: 'PAUSE [P]', enabled: true, small: true,
            });
        } else if (state === 'paused') {
            this.buttons.push({ id: 'resume', x: 380, y: 330, w: 200, h: 50, label: 'RESUME', enabled: true });
            this.buttons.push({ id: 'quit', x: 380, y: 390, w: 200, h: 50, label: 'QUIT TO MENU', enabled: true });
        } else if (state === 'gameover') {
            const win = this.game.isWin;
            if (win) {
                this.buttons.push({ id: 'restart', x: 380, y: 430, w: 200, h: 50, label: 'PLAY AGAIN', enabled: true });
            } else {
                this.buttons.push({ id: 'retry', x: 350, y: 420, w: 260, h: 50, label: 'TRY AGAIN', enabled: true });
            }
            this.buttons.push({ id: 'menu', x: 350, y: 480, w: 260, h: 40, label: 'MAIN MENU', enabled: true });
        }
    }

    handleClick(x, y) {
        for (const btn of this.buttons) {
            if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
                if (!btn.enabled) {
                    this.game.audio.uiClick();
                    return 'disabled';
                }
                this.game.audio.uiClick();
                return btn.id;
            }
        }
        return null;
    }

    updateHover(x, y) {
        this.hoverBtn = null;
        for (const btn of this.buttons) {
            if (x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h) {
                this.hoverBtn = btn;
            }
        }
    }

    render(ctx, state) {
        // Draw based on state
        if (state === 'menu') {
            this.renderMenu(ctx);
        } else if (state === 'playing' || state === 'intermission') {
            this.renderHUD(ctx);
            this.renderPanel(ctx);
        } else if (state === 'paused') {
            this.renderPause(ctx);
        } else if (state === 'gameover') {
            this.renderGameOver(ctx);
        }

        // Notification
        if (this.notification && this.notificationTimer > 0) {
            const alpha = Math.min(1, this.notificationTimer / 0.5);
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.font = '18px Georgia, serif';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#ffdd88';
            ctx.shadowColor = '#000';
            ctx.shadowBlur = 4;
            ctx.fillText(this.notification, 480, 80);
            ctx.restore();
        }
    }

    renderMenu(ctx) {
        // Background
        const grad = ctx.createLinearGradient(0, 0, 0, 640);
        grad.addColorStop(0, '#2a1a0e');
        grad.addColorStop(0.5, '#3d2617');
        grad.addColorStop(1, '#1a0f08');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 960, 640);

        // Title
        ctx.textAlign = 'center';
        ctx.shadowColor = '#ff4422';
        ctx.shadowBlur = 30;
        ctx.fillStyle = '#ff5a2a';
        ctx.font = 'bold 72px Georgia, serif';
        ctx.fillText('RED HARVEST', 480, 210);
        ctx.shadowBlur = 0;

        ctx.font = '24px Georgia, serif';
        ctx.fillStyle = '#ffb843';
        ctx.fillText('Carrot Farm Defense', 480, 250);

        // Subtitle with evil tractors
        ctx.font = '16px Georgia, serif';
        ctx.fillStyle = '#cc9977';
        ctx.fillText('Defend your carrots from the approaching', 480, 300);
        ctx.fillText('collective of EVIL RUSSIAN TRACTORS', 480, 322);

        // Decorative carot and tractors
        this.renderMenuDecor(ctx);

        // High score
        const hs = localStorage.getItem('red_harvest_highscore');
        if (hs) {
            ctx.font = '18px Georgia, serif';
            ctx.fillStyle = '#d4aa66';
            ctx.fillText(`⭐ Best Score: ${hs}`, 480, 365);
        }

        // Controls help
        ctx.font = '14px Georgia, serif';
        ctx.fillStyle = '#998877';
        ctx.fillText('Click soil to plant • Click ripe carrots to harvest', 480, 450);
        ctx.fillText('Build defenses to repel the tractor waves', 480, 472);
        ctx.fillText('1-3 select defense • P pause', 480, 494);
    }

    renderMenuDecor(ctx) {
        // Some carrots in the corner
        for (let i = 0; i < 5; i++) {
            const x = 80 + i * 50;
            const y = 500 + Math.sin(i * 1.5) * 10;
            ctx.fillStyle = '#ff6b35';
            ctx.beginPath();
            ctx.ellipse(x, y, 8, 14, i * 0.1, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#2d8a2d';
            ctx.beginPath();
            ctx.ellipse(x, y - 14, 5, 8, -0.2, 0, Math.PI * 2);
            ctx.fill();
        }
        // A tiny tractor in the corner
        const tx = 850, ty = 520;
        ctx.fillStyle = '#a02020';
        ctx.fillRect(tx - 20, ty - 8, 40, 20);
        ctx.fillStyle = '#222';
        ctx.fillRect(tx - 22, ty + 10, 44, 8);
        ctx.fillStyle = '#ffcc00';
        ctx.fillRect(tx + 8, ty - 4, 8, 8);
    }

    renderHUD(ctx) {
        // Top bar background
        ctx.fillStyle = 'rgba(20, 10, 5, 0.85)';
        ctx.fillRect(0, 0, 960, 70);
        ctx.strokeStyle = '#5a3a2a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 70);
        ctx.lineTo(960, 70);
        ctx.stroke();

        const p = this.game.player;
        const w = this.game.waves;

        // Wave info
        ctx.textAlign = 'left';
        ctx.font = 'bold 18px Georgia, serif';
        ctx.fillStyle = '#ffb843';
        ctx.fillText(`WAVE ${w.waveNumber} / ${w.totalWaves}`, 20, 30);

        // Score
        ctx.font = '14px Georgia, serif';
        ctx.fillStyle = '#ddd';
        ctx.fillText(`Score: ${p.score}`, 20, 52);

        // Hearts (carrot icons)
        ctx.textAlign = 'right';
        for (let i = 0; i < p.maxHearts; i++) {
            const x = 180 + i * 28;
            const y = 25;
            if (i < p.hearts) {
                ctx.fillStyle = '#ff6b35';
                ctx.beginPath();
                ctx.ellipse(x, y + 6, 5, 8, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#2d8a2d';
                ctx.beginPath();
                ctx.ellipse(x, y, 3, 4, -0.3, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.strokeStyle = '#666';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.ellipse(x, y + 6, 5, 8, 0, 0, Math.PI * 2);
                ctx.stroke();
            }
        }

        // Carrot count
        ctx.font = 'bold 20px Georgia, serif';
        ctx.fillStyle = '#ffb843';
        ctx.textAlign = 'right';
        ctx.fillText(`🥕 ${p.carrots}`, 940, 35);

        // Wave progress bar (if active)
        if (w.isWaveActive && w.spawnQueue.length > 0) {
            const total = 3 + w.waveNumber * 2;
            const remaining = w.spawnQueue.length + this.game.entities.tractors.length;
            const pct = 1 - (remaining / Math.max(1, total));
            ctx.fillStyle = 'rgba(255,255,255,0.1)';
            ctx.fillRect(650, 20, 210, 12);
            ctx.fillStyle = '#ff5a2a';
            ctx.fillRect(650, 20, 210 * pct, 12);
        } else if (w.isIntermission) {
            ctx.textAlign = 'right';
            ctx.font = '14px Georgia';
            ctx.fillStyle = '#88cc88';
            ctx.fillText('⚑ IN COMMAND 👉', 940, 60);
        }
    }

    renderPanel(ctx) {
        // Panel background
        ctx.fillStyle = 'rgba(20, 10, 5, 0.92)';
        roundRect(ctx, PANEL_X, PANEL_Y, PANEL_W, PANEL_H, 12);
        ctx.fill();
        ctx.strokeStyle = '#5a3a2a';
        ctx.lineWidth = 2;
        roundRect(ctx, PANEL_X, PANEL_Y, PANEL_W, PANEL_H, 12);
        ctx.stroke();

        // Section title
        ctx.fillStyle = '#ffb843';
        ctx.font = 'bold 16px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText('— DEFENSES —', PANEL_X + PANEL_W / 2, PANEL_Y + 40);

        // Buttons drawn via the button renderer
        for (const btn of this.buttons) {
            if (btn.id.startsWith('build_') || btn.id.startsWith('upgrade_') || btn.id === 'next_wave' || btn.id === 'pause') {
                this._renderButton(ctx, btn);
            }
        }

        // Title for upgrades
        ctx.fillStyle = '#ffb843';
        ctx.font = 'bold 16px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText('— UPGRADES —', PANEL_X + PANEL_W / 2, PANEL_Y + 325);

        // Help text
        ctx.font = '11px Georgia';
        ctx.fillStyle = '#887766';
        ctx.textAlign = 'center';
        ctx.fillText('Select a defense, then click a cell', PANEL_X + PANEL_W / 2, PANEL_Y + 85);
    }

    _renderButton(ctx, btn) {
        const hovered = this.hoverBtn === btn;
        let bg = btn.enabled ? (hovered ? BUTTON_HOVER : BUTTON_BG) : BUTTON_DISABLED;
        if (btn.primary) bg = '#5a2a0a';
        if (btn.selected) bg = '#3a3a5a';

        ctx.fillStyle = bg;
        roundRect(ctx, btn.x, btn.y, btn.w, btn.h, 8);
        ctx.fill();

        if (btn.primary || btn.selected) {
            ctx.strokeStyle = '#ffb843';
            ctx.lineWidth = 2;
            roundRect(ctx, btn.x, btn.y, btn.w, btn.h, 8);
            ctx.stroke();
        }

        ctx.fillStyle = btn.enabled ? TEXT_COLOR : '#666';
        ctx.font = btn.small ? '12px Georgia' : '14px Georgia';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(btn.label, btn.x + btn.w / 2, btn.y + btn.h / 2);
        ctx.textBaseline = 'alphabetic';
    }

    renderPause(ctx) {
        // Dim screen
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, 960, 640);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffb843';
        ctx.font = 'bold 56px Georgia';
        ctx.fillText('— PAUSED —', 480, 250);

        ctx.font = '18px Georgia';
        ctx.fillStyle = '#ccc';
        ctx.fillText('The tractors wait...', 480, 300);

        for (const btn of this.buttons) {
            this._renderButton(ctx, btn);
        }
    }

    renderGameOver(ctx) {
        // Dark background
        ctx.fillStyle = 'rgba(10, 5, 5, 0.92)';
        ctx.fillRect(0, 0, 960, 640);

        ctx.textAlign = 'center';
        if (this.game.isWin) {
            ctx.font = 'bold 60px Georgia';
            ctx.fillStyle = '#ffb843';
            ctx.shadowColor = '#ff8800';
            ctx.shadowBlur = 25;
            ctx.fillText('VICTORY!', 480, 240);
            ctx.shadowBlur = 0;
            ctx.font = '20px Georgia';
            ctx.fillStyle = '#ccc';
            ctx.fillText('The tractors have been repelled!', 480, 300);

            // Draw some celebratory carrots
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                ctx.fillStyle = '#ff6b35';
                ctx.beginPath();
                ctx.ellipse(480 + Math.cos(angle) * 80, 350 + Math.sin(angle) * 40, 6, 10, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        } else {
            ctx.font = 'bold 56px Georgia';
            ctx.fillStyle = '#ff3333';
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 25;
            ctx.fillText('FARM RUINED', 480, 240);
            ctx.shadowBlur = 0;
            ctx.font = '20px Georgia';
            ctx.fillStyle = '#ccc';
            ctx.fillText('The tractors have won...', 480, 290);
        }

        // Score panel
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        roundRect(ctx, 300, 310, 360, 90, 12);
        ctx.fill();
        ctx.font = '18px Georgia';
        ctx.fillStyle = '#ffb843';
        ctx.fillText(`Score: ${this.game.player.score}`, 480, 340);
        const hs = localStorage.getItem('red_harvest_highscore') || '0';
        ctx.fillStyle = '#ddaa66';
        ctx.font = '16px Georgia';
        ctx.fillText(`Best: ${hs}`, 480, 370);

        // Buttons
        for (const btn of this.buttons) {
            this._renderButton(ctx, btn);
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