export const WAVES = [
  null,
  [{ type: 'texter', count: 6 }],
  [{ type: 'texter', count: 7 }, { type: 'clingy', count: 4 }],
  [{ type: 'clingy', count: 6 }, { type: 'jealous', count: 3 }, { type: 'texter', count: 4 }],
  [{ type: 'ghost', count: 5 }, { type: 'texter', count: 6 }, { type: 'jealous', count: 2 }],
  [{ type: 'drama', count: 3 }, { type: 'clingy', count: 8 }, { type: 'jealous', count: 3 }],
  [{ type: 'ghost', count: 6 }, { type: 'drama', count: 4 }, { type: 'jealous', count: 4 }, { type: 'texter', count: 5 }],
  [{ type: 'clingy', count: 10 }, { type: 'ghost', count: 6 }, { type: 'drama', count: 5 }, { type: 'jealous', count: 5 }],
  [{ type: 'boss', count: 1 }]
];

export const TOTAL_WAVES = WAVES.length - 1;

export function getWaveComp(n) {
  return WAVES[Math.min(n, TOTAL_WAVES)];
}

export const WAVE_TITLES = [
  '',
  'WAVE 1 — THE GROUP CHAT LEAKED',
  'WAVE 2 — THEY\'RE TEXTING EACH OTHER',
  'WAVE 3 — JEALOUSY INCOMING',
  'WAVE 4 — THE GHOSTS COME BACK',
  'WAVE 5 — DRAMA ALERT',
  'WAVE 6 — FULL CONFRONTATION',
  'WAVE 7 — THE FINAL ARGUMENT',
  'FINAL WAVE — KAREN HAS ARRIVED'
];