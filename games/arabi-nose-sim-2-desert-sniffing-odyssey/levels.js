// Wave definitions + upgrade pool.
export function waveConfig(wave) {
  return {
    duration: 22 + Math.min(10, wave),       // seconds to survive
    moteRate: Math.max(0.5, 1.1 - wave * 0.05),
    hazardRate: Math.max(0.4, 1.9 - wave * 0.15),
    maxHazards: Math.min(14, 3 + wave),
    targetScore: 150 + wave * 130,
    sandstorm: wave >= 4 && wave % 2 === 0,  // visual + push wind on even waves from 4
    windStrength: 40 + wave * 8,
  };
}

export const UPGRADES = [
  { id: 'nostrils', icon: '🌀', name: 'WIDER NOSTRILS', desc: '+30% sniff suction range', apply: p => { p.sniffMult += 0.3; } },
  { id: 'lungs', icon: '💨', name: 'DEEP LUNGS', desc: '+40 max sniff power, faster regen', apply: p => { p.maxSniff += 40; p.sniffRegen += 10; p.sniff = p.maxSniff; } },
  { id: 'turbo', icon: '👃', name: 'TURBO SCHNOZ', desc: '+18% movement speed', apply: p => { p.speedMult += 0.18; } },
  { id: 'armor', icon: '🛡️', name: 'CALLUSED SKIN', desc: '+35 max integrity and heal 35', apply: p => { p.maxHp += 35; p.hp = Math.min(p.maxHp, p.hp + 35); } },
  { id: 'magnet', icon: '🧲', name: 'SPICE MAGNET', desc: 'Motes slowly drift to you, always', apply: p => { p.magnet = Math.min(3, p.magnet + 1); } },
  { id: 'filter', icon: '😤', name: 'POLLEN FILTER', desc: 'Pollen deals half sneeze damage', apply: p => { p.pollenResist = (p.pollenResist || 0) + 0.5; } },
];

export function pickUpgrades(count = 3) {
  const pool = [...UPGRADES];
  const out = [];
  while (out.length < count && pool.length) {
    out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  return out;
}