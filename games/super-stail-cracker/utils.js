export function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
export function lerp(a, b, t) { return a + (b - a) * t; }
export function rand(min, max) { return min + Math.random() * (max - min); }
export function randInt(min, max) { return Math.floor(rand(min, max + 1)); }
export function distance(ax, ay, bx, by) { return Math.hypot(bx - ax, by - ay); }
export function normalize(x, y) { const d = Math.hypot(x, y); return d > 0.0001 ? { x: x / d, y: y / d } : { x: 0, y: 0 }; }
export function circleHit(a, b) { return distance(a.x, a.y, b.x, b.y) < a.r + b.r; }
export function circleAABB(circle, box) {
  const x = clamp(circle.x, box.x, box.x + box.w);
  const y = clamp(circle.y, box.y, box.y + box.h);
  return distance(circle.x, circle.y, x, y) < circle.r;
}
export function moveCircle(entity, dx, dy, blocks, width, height) {
  entity.x += dx;
  for (const block of blocks) {
    if (block.hp > 0 && circleAABB(entity, block)) {
      if (dx > 0) entity.x = block.x - entity.r;
      else if (dx < 0) entity.x = block.x + block.w + entity.r;
    }
  }
  entity.y += dy;
  for (const block of blocks) {
    if (block.hp > 0 && circleAABB(entity, block)) {
      if (dy > 0) entity.y = block.y - entity.r;
      else if (dy < 0) entity.y = block.y + block.h + entity.r;
    }
  }
  entity.x = clamp(entity.x, entity.r + 5, width - entity.r - 5);
  entity.y = clamp(entity.y, entity.r + 5, height - entity.r - 5);
}
export function choose(array) { return array[Math.floor(Math.random() * array.length)]; }