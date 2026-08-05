import { NIGHT_CONFIG, SUSHI_TYPES, CUSTOMER_SLOTS } from './config.js';
import { Customer, makeSushi } from './entities.js';

export class LevelManager {
  constructor() {
    this.nightIndex = 0;
    this.customersServed = 0;
    this.totalCustomers = 0;
    this.spawnQueue = [];
    this.spawnTimer = 0;
    this.nightState = 'intro'; // intro, spawning, done
    this.introTimer = 0;
    this.ghostRevealed = false;
  }

  getConfig() {
    const idx = Math.min(this.nightIndex, NIGHT_CONFIG.length - 1);
    return NIGHT_CONFIG[idx];
  }

  startNight(nightIndex) {
    this.nightIndex = nightIndex;
    const cfg = this.getConfig();
    this.totalCustomers = cfg.customerCount;
    this.customersServed = 0;
    this.nightState = 'intro';
    this.introTimer = 2.5;
    this.ghostRevealed = false;

    // Build spawn queue
    this.spawnQueue = [];
    for (let i = 0; i < cfg.customerCount; i++) {
      const isGhost = Math.random() < cfg.ghostChance;
      const sushiTypes = [...cfg.sushiTypes];
      const sushiType = sushiTypes[Math.floor(Math.random() * sushiTypes.length)];
      const useCursed = isGhost && cfg.cursedTypes.length > 0 && sushiTypes.includes(sushiType);
      const order = makeSushi(sushiType, useCursed || (isGhost && cfg.cursedTypes.includes(sushiType)));
      // If ghost and cursed not available, pick a cursed type
      if (isGhost && cfg.cursedTypes.length > 0 && !order.isCursed) {
        const cursedType = cfg.cursedTypes[Math.floor(Math.random() * cfg.cursedTypes.length)];
        order.type = cursedType;
        order.isCursed = true;
      }
      this.spawnQueue.push({
        isGhost,
        order,
        patience: 10 * cfg.patienceMult + Math.random() * 4,
      });
    }
    // Randomize spawn order
    this.spawnQueue.sort(() => Math.random() - 0.5);
    this.spawnTimer = 0.8;
  }

  update(dt, customers) {
    if (this.nightState === 'intro') {
      this.introTimer -= dt;
      if (this.introTimer <= 0) {
        this.nightState = 'spawning';
        if (this.nightIndex >= 1 && !this.ghostRevealed) {
          this.ghostRevealed = true;
        }
      }
      return;
    }

    if (this.nightState !== 'spawning') return;

    if (this.spawnQueue.length > 0 && customers.length < 3) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        const data = this.spawnQueue.shift();
        const emptySlots = CUSTOMER_SLOTS.filter(slot =>
          !customers.some(c => c.targetX === slot && c.isActive())
        );
        if (emptySlots.length > 0) {
          const slot = emptySlots[Math.floor(Math.random() * emptySlots.length)];
          customers.push(new Customer({ ...data, slot }));
          this.spawnTimer = Math.max(0.4, 1.2 - this.nightIndex * 0.15);
        } else {
          // Put back and wait
          this.spawnQueue.unshift(data);
          this.spawnTimer = 0.3;
        }
      }
    }

    // Check if all customers done
    if (this.spawnQueue.length === 0 && customers.filter(c => !c.isGone()).length === 0) {
      this.nightState = 'done';
    }
  }

  isDone() {
    return this.nightState === 'done';
  }

  getNightTitle() {
    const cfg = this.getConfig();
    return cfg.title;
  }

  getAvailableSushi() {
    const cfg = this.getConfig();
    const items = [];
    for (const t of cfg.sushiTypes) {
      items.push(makeSushi(t, false));
    }
    for (const t of cfg.cursedTypes) {
      items.push(makeSushi(t, true));
    }
    return items;
  }

  getGhostChance() {
    return this.getConfig().ghostChance;
  }

  getNightNumber() {
    return this.nightIndex + 1;
  }
}