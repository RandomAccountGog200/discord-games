// shop.js - Upgrades system
export const UPGRADES = {
    waterCapacity: {
        name: 'Water Capacity +',
        desc: 'Expand water can capacity by 50.',
        cost: 50,
        level: 0,
        maxLevel: 5,
        effect: 50,
    },
    seedCost: {
        name: 'Cheaper Seeds',
        desc: 'Reduce seed cost by 1.',
        cost: 30,
        level: 0,
        maxLevel: 3,
        effect: 1,
    },
    growthSpeed: {
        name: 'Fast Growth',
        desc: 'Carrots grow 20% faster.',
        cost: 80,
        level: 0,
        maxLevel: 3,
        effect: 0.2,
    },
    scarecrow: {
        name: 'Scarecrow',
        desc: 'Reduce pest spawn rate by 30%.',
        cost: 100,
        level: 0,
        maxLevel: 2,
        effect: 0.3,
    },
    sprinkler: {
        name: 'Sprinkler',
        desc: 'Auto-water nearby tiles.',
        cost: 200,
        level: 0,
        maxLevel: 1,
        effect: true,
    }
};

export class ShopManager {
    constructor(game) {
        this.game = game;
        this.upgrades = this.loadUpgrades();
    }

    loadUpgrades() {
        const saved = localStorage.getItem('carrot_farmer_upgrades');
        if (saved) {
            return JSON.parse(saved);
        }
        // Initialize defaults
        const up = {};
        for (const key in UPGRADES) {
            up[key] = { level: 0 };
        }
        return up;
    }

    save() {
        localStorage.setItem('carrot_farmer_upgrades', JSON.stringify(this.upgrades));
    }

    getTotalCost(key) {
        const def = UPGRADES[key];
        return def.cost * (this.upgrades[key].level + 1);
    }

    purchase(key) {
        const def = UPGRADES[key];
        if (this.upgrades[key].level >= def.maxLevel) return false;
        const cost = this.getTotalCost(key);
        if (this.game.money >= cost) {
            this.game.money -= cost;
            this.upgrades[key].level++;
            this.save();
            this.game.audio.playClick();
            return true;
        }
        return false;
    }

    getEffect(key) {
        const def = UPGRADES[key];
        return def.effect * this.upgrades[key].level;
    }
}