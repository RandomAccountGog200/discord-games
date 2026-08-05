import { Order } from './entities.js';

const RECIPES = ['RIBEYE', 'STRIP', 'T-BONE', 'FILET'];
const CONFIGS = [
  { duration: 34, interval: 5.2, patience: 28, mix: [0, 1, 1, 2] },
  { duration: 38, interval: 4.55, patience: 25, mix: [0, 1, 1, 2, 2] },
  { duration: 41, interval: 3.95, patience: 23, mix: [0, 1, 1, 2, 2, 2] },
  { duration: 44, interval: 3.45, patience: 21, mix: [0, 1, 2, 2, 2, 2] },
  { duration: 48, interval: 3.05, patience: 19, mix: [0, 1, 1, 2, 2, 2, 2] }
];
export function waveConfig(number) { return CONFIGS[Math.min(CONFIGS.length - 1, number - 1)]; }

export class LevelDirector {
  constructor(number, mods = {}) {
    this.number = number; this.config = waveConfig(number); this.mods = mods; this.elapsed = 0; this.nextSpawn = 1.1; this.queue = []; this.counter = 0; this.ending = false;
  }
  spawn() {
    const choices = this.config.mix;
    const doneness = choices[Math.floor(Math.random() * choices.length)];
    const recipe = RECIPES[Math.floor(Math.random() * RECIPES.length)];
    const patience = this.config.patience + (this.mods.patience || 0) + Math.random() * 3;
    this.queue.push(new Order(++this.counter, recipe, doneness, patience));
  }
  update(dt, stations, onFail) {
    this.elapsed += dt;
    if (!this.ending && this.elapsed >= this.nextSpawn) {
      this.spawn();
      this.nextSpawn += this.config.interval * (.88 + Math.random() * .22);
    }
    for (let i = this.queue.length - 1; i >= 0; i--) {
      const order = this.queue[i]; order.patience -= dt;
      if (order.patience <= 0) { this.queue.splice(i, 1); onFail(order, 'ANGRY CUSTOMER'); }
    }
    for (const station of stations) {
      if (station.free && this.queue.length) station.setOrder(this.queue.shift());
    }
    if (this.elapsed >= this.config.duration) this.ending = true;
    return this.ending && this.queue.length === 0 && stations.every(s => s.free);
  }
  queueCount() { return this.queue.length; }
}