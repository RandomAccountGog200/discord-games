import { rand, randInt, distance } from './utils.js';

export function generateLevel(wave, width, height) {
  const blocks = [];
  const count = Math.min(15, 4 + Math.floor(wave * 1.35));
  for (let attempt = 0; attempt < 100 && blocks.length < count; attempt++) {
    const w = rand(48, 100), h = rand(34, 70), x = rand(45, width - w - 45), y = rand(90, height - h - 45);
    if (distance(x + w / 2, y + h / 2, 100, height / 2) < 155) continue;
    const overlaps = blocks.some(b => x < b.x + b.w + 22 && x + w + 22 > b.x && y < b.y + b.h + 22 && y + h + 22 > b.y);
    if (!overlaps) blocks.push({ x, y, w, h, hp: 32 + wave * 7, maxHp: 32 + wave * 7, hue: randInt(0, 2) });
  }
  const specs = [];
  const amount = 4 + wave * 2;
  if (wave === 8) specs.push({ type: 'boss' });
  for (let i = 0; i < amount + (wave === 8 ? 4 : 0); i++) {
    let type = 'mite';
    const roll = Math.random();
    if (wave > 2 && roll > .68) type = 'beetle';
    if (wave > 3 && roll > .88) type = 'spore';
    specs.push({ type });
  }
  return { blocks, specs };
}

export function findSpawn(spec, blocks, width, height, player) {
  for (let i = 0; i < 80; i++) {
    const edge = Math.floor(Math.random() * 4), pad = 34;
    let x = edge === 0 ? pad : edge === 1 ? width - pad : rand(pad, width - pad);
    let y = edge === 2 ? pad + 40 : edge === 3 ? height - pad : rand(80, height - pad);
    const r = spec.type === 'boss' ? 38 : spec.type === 'beetle' ? 21 : 16;
    const blocked = blocks.some(b => x + r > b.x && x - r < b.x + b.w && y + r > b.y && y - r < b.y + b.h);
    if (!blocked && distance(x, y, player.x, player.y) > 260) return { x, y };
  }
  return { x: width - 55, y: height / 2 };
}