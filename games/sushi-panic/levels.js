export const W = 960;
export const H = 640;

export const SUSHI = [
  { name: 'Salmon',    color: '#ff7a59', accent: '#ffb59e', price: 10 },
  { name: 'Tuna',      color: '#e5486d', accent: '#ff8aa5', price: 12 },
  { name: 'Egg',       color: '#ffd23f', accent: '#ffe98f', price: 8 },
  { name: 'Cucumber',  color: '#59d98c', accent: '#a4f0c4', price: 8 },
];

export function dayConfig(d) {
  return {
    goal: 5 + d * 2,
    custInterval: Math.max(1.4, 4.0 - d * 0.28),
    beltSpeed: 55 + d * 9,
    patience: Math.max(13, 25 - d * 1.1),
    rats: d >= 2,
    fires: d >= 3,
    roaches: d >= 4,
    ratEvery: Math.max(5, 11 - d * 0.6),
    fireEvery: Math.max(8, 16 - d * 0.7),
    roachEvery: Math.max(6, 13 - d * 0.6),
  };
}

export const UPGRADES = [
  { id: 'patience', name: 'Comfy Seats',       desc: '+25% customer patience', cost: l => 60 + l * 40, max: 3 },
  { id: 'lucky',    name: 'Lucky Cat',         desc: '+30% bigger tips',       cost: l => 50 + l * 50, max: 3 },
  { id: 'ext',      name: 'Fire Extinguisher', desc: 'Fires die in one click', cost: () => 80,          max: 1 },
  { id: 'trap',     name: 'Rat Traps',         desc: 'Rats move much slower',  cost: () => 70,          max: 1 },
  { id: 'rice',     name: 'Bulk Rice',         desc: 'Sushi only costs $1',    cost: () => 90,          max: 1 },
];