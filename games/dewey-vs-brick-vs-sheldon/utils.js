export const WORLD = { width: 960, height: 600 };

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function dist(ax, ay, bx, by) {
  return Math.hypot(bx - ax, by - ay);
}

export function circleRect(cx, cy, radius, rect) {
  const closestX = clamp(cx, rect.x, rect.x + rect.w);
  const closestY = clamp(cy, rect.y, rect.y + rect.h);
  let dx = cx - closestX;
  let dy = cy - closestY;
  const d2 = dx * dx + dy * dy;
  if (d2 > 0 && d2 < radius * radius) {
    const d = Math.sqrt(d2);
    return { hit: true, nx: dx / d, ny: dy / d, depth: radius - d };
  }
  if (d2 === 0 && cx >= rect.x && cx <= rect.x + rect.w && cy >= rect.y && cy <= rect.y + rect.h) {
    const left = cx - rect.x, right = rect.x + rect.w - cx;
    const top = cy - rect.y, bottom = rect.y + rect.h - cy;
    const edge = Math.min(left, right, top, bottom);
    if (edge === left) return { hit: true, nx: -1, ny: 0, depth: radius + left };
    if (edge === right) return { hit: true, nx: 1, ny: 0, depth: radius + right };
    if (edge === top) return { hit: true, nx: 0, ny: -1, depth: radius + top };
    return { hit: true, nx: 0, ny: 1, depth: radius + bottom };
  }
  return { hit: false, nx: 0, ny: 0, depth: 0 };
}

export function seeded(seed) {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

export function roundedRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}