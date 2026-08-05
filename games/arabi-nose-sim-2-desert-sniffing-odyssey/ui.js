// DOM UI helpers.
export const ui = {
  hud: document.getElementById('hud'),
  menu: document.getElementById('menu'),
  pauseMenu: document.getElementById('pauseMenu'),
  gameOver: document.getElementById('gameOver'),
  upgradeMenu: document.getElementById('upgradeMenu'),
  touchUI: document.getElementById('touchUI'),
  hudScore: document.getElementById('hudScore'),
  hudWave: document.getElementById('hudWave'),
  hudBest: document.getElementById('hudBest'),
  barSniff: document.getElementById('barSniff'),
  barHp: document.getElementById('barHp'),
  menuBest: document.getElementById('menuBest'),
  finalScore: document.getElementById('finalScore'),
  finalBest: document.getElementById('finalBest'),
  finalWave: document.getElementById('finalWave'),
  upgradeCards: document.getElementById('upgradeCards'),
};

export function show(el) { el.classList.remove('hidden'); }
export function hide(el) { el.classList.add('hidden'); }

export function setState(name) {
  hide(ui.menu); hide(ui.pauseMenu); hide(ui.gameOver); hide(ui.upgradeMenu); hide(ui.hud);
  if (name === 'menu') show(ui.menu);
  else if (name === 'playing') { show(ui.hud); }
  else if (name === 'paused') { show(ui.hud); show(ui.pauseMenu); }
  else if (name === 'gameover') show(ui.gameOver);
  else if (name === 'upgrade') { show(ui.hud); show(ui.upgradeMenu); }
}

export function isTouchDevice() {
  return ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
}

export function buildUpgradeCards(upgrades, onPick) {
  ui.upgradeCards.innerHTML = '';
  for (const up of upgrades) {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `<div class="icon">${up.icon}</div><div class="name">${up.name}</div><div class="desc">${up.desc}</div>`;
    card.addEventListener('click', () => onPick(up));
    ui.upgradeCards.appendChild(card);
  }
}