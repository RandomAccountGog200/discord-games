import { seeded, dist, WORLD } from './utils.js';

function freeSpot(x, y, bricks, padding = 30) {
  if (dist(x, y, 80, 300) < 115) return false;
  return !bricks.some(b => x > b.x - padding && x < b.x + b.w + padding && y > b.y - padding && y < b.y + b.h + padding);
}

export function createLevel(number) {
  const random = seeded(9217 + number * 7711);
  const bricks = [];
  const target = 5 + number * 2;
  let attempts = 0;
  while (bricks.length < target && attempts++ < 500) {
    const w = 42 + Math.floor(random() * 20), h = 38 + Math.floor(random() * 25);
    const x = 150 + Math.floor(random() * (WORLD.width - 205 - w));
    const y = 70 + Math.floor(random() * (WORLD.height - 135 - h));
    const candidate = { x, y, w, h, phase: random() * 6.28, destroyed: false };
    if (!bricks.some(b => x < b.x + b.w + 18 && x + w + 18 > b.x && y < b.y + b.h + 18 && y + h + 18 > b.y)) bricks.push(candidate);
  }
  const books = [];
  attempts = 0;
  while (books.length < 4 + Math.ceil(number / 2) && attempts++ < 800) {
    const x = 115 + random() * 790, y = 58 + random() * 480;
    if (freeSpot(x, y, bricks, 19) && !books.some(b => dist(x, y, b.x, b.y) < 62)) books.push({ x, y, phase: random() * 6.28, collected: false });
  }
  const sheldons = [];
  attempts = 0;
  while (sheldons.length < 1 + Math.floor((number + 1) / 2) && attempts++ < 800) {
    const x = 150 + random() * 700, y = 70 + random() * 450;
    if (freeSpot(x, y, bricks, 35) && dist(x, y, 80, 300) > 280 && !sheldons.some(s => dist(x, y, s.x, s.y) < 100)) sheldons.push({ x, y });
  }
  return { number, bricks, books, sheldons };
}