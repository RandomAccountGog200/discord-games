// player.js — player resources & upgrades

export class Player {
    constructor() {
        this.carrots = 0;
        this.hearts = 5;
        this.maxHearts = 5;
        this.score = 0;
        this.upgrades = {
            growthSpeed: 0, // 0-3
            harvester: 0,   // 0-3
            turretDamage: 0, // 0-3
        };
    }

    loseHeart() {
        if (this.hearts > 0) this.hearts--;
        return this.hearts <= 0;
    }

    addCarrots(n) {
        this.carrots += n;
        return this.carrots;
    }

    spendCarrots(n) {
        if (this.carrots < n) return false;
        this.carrots -= n;
        return true;
    }

    canAfford(n) {
        return this.carrots >= n;
    }

    addScore(n) {
        this.score += n;
    }

    getUpgradeCost(key) {
        const base = { growthSpeed: 25, harvester: 30, turretDamage: 35 };
        const mult = { growthSpeed: 1.4, harvester: 1.5, turretDamage: 1.5 };
        const level = this.upgrades[key];
        return Math.floor(base[key] * Math.pow(mult[key], level));
    }

    canUpgrade(key) {
        return this.upgrades[key] < 3 && this.canAfford(this.getUpgradeCost(key));
    }

    applyUpgrade(key) {
        if (!this.canUpgrade(key)) return false;
        const cost = this.getUpgradeCost(key);
        if (!this.spendCarrots(cost)) return false;
        this.upgrades[key]++;
        return true;
    }

    reset() {
        this.carrots = 10;
        this.hearts = 5;
        this.score = 0;
        this.upgrades = { growthSpeed: 0, harvester: 0, turretDamage: 0 };
    }
}