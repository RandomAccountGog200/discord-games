import { Star, Crystal, Comet } from './entities.js';

function seeded(seed) {
  let value = seed >>> 0;
  return () => { value = (value * 1664525 + 1013904223) >>> 0; return value / 4294967296; };
}

export function stageLength(stage) { return 2300 + stage * 180; }

export function generateStage(stage, origin) {
  const random = seeded(9871 + stage * 4417);
  const entities = [];
  const length = stageLength(stage);
  const spacing = Math.max(178, 265 - stage * 10);
  const lanes = [100, 190, 290, 390, 465];
  let index = 0;
  for (let x = origin + 500; x < origin + length - 80; x += spacing) {
    const lane = Math.floor(random() * lanes.length);
    const y = lanes[lane] + (random() - .5) * 25;
    const pattern = index % 5;
    if (pattern !== 1 || stage > 2) {
      const radius = 21 + random() * (8 + stage * 1.8);
      entities.push(new Comet(x, y, radius, random() * 6, stage * .35));
      if (stage >= 3 && pattern === 4) entities.push(new Comet(x + 58, lanes[(lane + 2) % lanes.length], 19 + random() * 8, random() * 6, stage * .4));
    }
    const starY = Math.max(70, Math.min(470, y + (random() - .5) * 130));
    entities.push(new Star(x + 65, starY));
    if (index % 3 === 0) entities.push(new Star(x + 105, Math.max(65, Math.min(475, starY + (random() - .5) * 90))));
    if (index % 5 === 3) entities.push(new Crystal(x + 120, lanes[(lane + 1) % lanes.length]));
    index++;
  }
  // A visible reward trail marks the approach to every sector exit.
  for (let i = 0; i < 5; i++) entities.push(new Star(origin + length - 300 + i * 42, 180 + i * 42));
  return entities;
}