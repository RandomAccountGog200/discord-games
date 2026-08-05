export function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }
export function lerp(a, b, t) { return a + (b - a) * t; }
export function rand(a, b) { return a + Math.random() * (b - a); }
export function randInt(a, b) { return Math.floor(rand(a, b + 1)); }
export function choice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
export function dist(x1, y1, x2, y2) { return Math.hypot(x2 - x1, y2 - y1); }
export function circleHit(a, b) {
  const dx = a.x - b.x, dy = a.y - b.y, r = a.r + b.r;
  return dx * dx + dy * dy < r * r;
}
export function drawHeart(ctx, x, y, s, color, alpha = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, s * 0.4);
  ctx.bezierCurveTo(-s * 1.1, -s * 0.3, -s * 0.55, -s * 1.15, 0, -s * 0.45);
  ctx.bezierCurveTo(s * 0.55, -s * 1.15, s * 1.1, -s * 0.3, 0, s * 0.4);
  ctx.fill();
  ctx.restore();
}
export function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}