// waves.js — wave definitions and spawning logic

const TRACTOR_POOL = ['basic', 'basic', 'basic', 'fast', 'fast', 'armored', 'boss'];

export class WaveManager {
    constructor(game) {
        this.game = game;
        this.waveNumber = 0;
        this.state = 'idle'; // idle, wave, intermission
        this.spawnQueue = [];
        this.spawnTimer = 0;
        this.spawnInterval = 1.5;
        this.intermissionTimer = 0;
        this.totalWaves = 10;
    }

    get isWaveActive() {
        return this.state === 'wave';
    }

    get isIntermission() {
        return this.state === 'intermission';
    }

    startNextWave() {
        if (this.state !== 'idle' && this.state !== 'intermission') return false;
        this.waveNumber++;
        this.composeWave();
        this.state = 'wave';
        this.spawnTimer = 0;
        this.spawnInterval = Math.max(0.4, 1.5 - this.waveNumber * 0.07);
        this.game.audio.waveHorn();
        this.game.screenShake = Math.min(0.4, this.game.screenShake + 0.08);
        return true;
    }

    composeWave() {
        const w = this.waveNumber;
        const count = Math.min(30, 3 + w * 2);
        this.spawnQueue = [];

        for (let i = 0; i < count; i++) {
            let type = 'basic';
            if (w >= 3 && (i % 4 === 1 || i % 4 === 2)) type = 'fast';
            if (w >= 5 && i % 5 === 3) type = 'armored';
            if (w >= 7 && i % 7 === 5) type = 'armored';
            if (w === 10 && i === count - 1) type = 'boss';
            if (w >= 8 && i % 9 === 7) type = 'boss';
            this.spawnQueue.push(type);
        }

        // Shuffle slightly
        for (let i = this.spawnQueue.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.spawnQueue[i], this.spawnQueue[j]] = [this.spawnQueue[j], this.spawnQueue[i]];
        }
    }

    update(dt) {
        if (this.state === 'wave') {
            this.spawnTimer += dt;
            if (this.spawnTimer >= this.spawnInterval && this.spawnQueue.length > 0) {
                this.spawnTimer = 0;
                const type = this.spawnQueue.shift();
                this.game.entities.spawnTractor(type);
            }

            // Check wave completion
            if (this.spawnQueue.length === 0 && this.game.entities.tractors.length === 0) {
                this.state = 'intermission';
                this.intermissionTimer = 0;
                const bonus = 25 + this.waveNumber * 10;
                this.game.player.addCarrots(bonus);
                this.game.player.addScore(bonus * 2);
                if (this.waveNumber >= this.totalWaves) {
                    this.game.winGame();
                }
            }
        } else if (this.state === 'intermission') {
            this.intermissionTimer += dt;
        }
    }

    reset() {
        this.waveNumber = 0;
        this.state = 'idle';
        this.spawnQueue = [];
        this.spawnTimer = 0;
        this.intermissionTimer = 0;
    }
}