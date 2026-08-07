const levelNames = ['The Welcome Piazza', 'Scooter Boulevard', 'Gelato Gardens', 'The Leaning Shortcut', 'Midnight Market', 'Jamal\'s Grand Finale'];
const themes = [
  { top: '#f9c46b', bottom: '#ef476f', road: '#f9dfaa', accent: '#118ab2' },
  { top: '#7bdff2', bottom: '#118ab2', road: '#c5e9df', accent: '#ef476f' },
  { top: '#b8f2b0', bottom: '#06d6a0', road: '#e0efb2', accent: '#ff9f43' },
  { top: '#f7b2d8', bottom: '#7d5fff', road: '#ead9fa', accent: '#ffd166' },
  { top: '#30336b', bottom: '#130f35', road: '#51456d', accent: '#ff9f43' },
  { top: '#ffd166', bottom: '#ef476f', road: '#fff0c2', accent: '#06d6a0' }
];

function rngFor(seed) {
  let value = seed * 99991 + 17;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function overlaps(a, b, margin = 0) {
  return a.x < b.x + b.w + margin && a.x + a.w > b.x - margin && a.y < b.y + b.h + margin && a.y + a.h > b.y - margin;
}

export function createLevel(index) {
  const random = rngFor(index + 1);
  const start = { x: 72, y: 270 };
  const goals = [{ x: 875, y: 270 }, { x: 870, y: 105 }, { x: 875, y: 430 }, { x: 820, y: 110 }, { x: 855, y: 400 }, { x: 875, y: 270 }];
  const goal = { ...goals[index] };
  const obstacles = [];
  const targetCount = 5 + index * 2;
  let attempts = 0;
  while (obstacles.length < targetCount && attempts++ < 150) {
    const rect = { x: 170 + random() * 650, y: 58 + random() * 390, w: 48 + random() * 65, h: 26 + random() * 50 };
    if (Math.hypot(rect.x - start.x, rect.y - start.y) < 130) continue;
    if (Math.hypot(rect.x - goal.x, rect.y - goal.y) < 105) continue;
    if (obstacles.some(other => overlaps(rect, other, 20))) continue;
    obstacles.push(rect);
  }
  const pickups = [];
  let pickupAttempts = 0;
  while (pickups.length < 3 + Math.floor(index / 2) && pickupAttempts++ < 300) {
    const point = { x: 130 + random() * 730, y: 70 + random() * 400 };
    if (Math.hypot(point.x - start.x, point.y - start.y) < 95 || Math.hypot(point.x - goal.x, point.y - goal.y) < 55) continue;
    if (obstacles.some(rect => point.x > rect.x - 25 && point.x < rect.x + rect.w + 25 && point.y > rect.y - 25 && point.y < rect.y + rect.h + 25)) continue;
    if (pickups.some(p => Math.hypot(point.x - p.x, point.y - p.y) < 70)) continue;
    pickups.push(point);
  }
  const enemyCount = 2 + index;
  const enemies = [];
  for (let i = 0; i < enemyCount; i++) {
    const edge = i % 2 === 0;
    enemies.push({
      x: edge ? 390 + random() * 450 : 190 + random() * 650,
      y: edge ? 65 + random() * 410 : (i % 4 < 2 ? 52 : 488),
      type: index > 1 && i % 3 === 0 ? 'pigeon' : 'scooter',
      speed: (index > 2 ? 78 : 68) + index * 8 + random() * 18,
      r: index > 3 && i % 4 === 0 ? 20 : 17
    });
  }
  return {
    number: index + 1,
    name: levelNames[index],
    theme: themes[index],
    start, goal, obstacles, pickups,
    enemies,
    bounds: { w: 960, h: 540 },
    timeLimit: 52 + index * 4
  };
}