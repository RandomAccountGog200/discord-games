const ids = ['menu-screen','pause-screen','upgrade-screen','gameover-screen'];
export function showScreen(name) {
  ids.forEach(id => document.getElementById(id).classList.toggle('hidden', id !== `${name}-screen`));
  const activeGame = name === 'playing';
  document.getElementById('hud').classList.toggle('hidden', !activeGame);
  document.getElementById('touch-controls').classList.toggle('hidden', !activeGame);
}
export function setMenuStats(depth, score) {
  document.getElementById('menu-best-depth').textContent = `${Math.floor(depth).toLocaleString()} FT`;
  document.getElementById('menu-best-score').textContent = `${score.toLocaleString()} points`;
}
export function updateHUD(game, config, progress) {
  document.getElementById('depth-value').textContent = Math.floor(game.depth).toLocaleString();
  document.getElementById('zone-value').textContent = config.name;
  document.getElementById('depth-progress').style.width = `${Math.min(100, progress * 100)}%`;
  document.getElementById('health-value').textContent = game.player.hp;
  document.getElementById('score-value').textContent = game.score.toLocaleString();
}
export function showUpgrade(config, choices) {
  document.getElementById('upgrade-title').textContent = `${config.name}: CHOOSE YOUR SCOOP`;
  const holder = document.getElementById('upgrade-cards');
  holder.innerHTML = choices.map((c, i) => `<button class="upgrade-card" data-upgrade="${c.id}"><b class="card-icon">${c.icon}</b><strong>${c.name}</strong><span>${c.desc}</span></button>`).join('');
  showScreen('upgrade');
}
export function showResult(win, game) {
  document.getElementById('result-eyebrow').textContent = win ? 'THE BOTTOM IS BEAUTIFUL' : 'THE DEEP WON';
  document.getElementById('result-title').textContent = win ? '100000 FEET!' : 'SCOOP MELTED';
  document.getElementById('result-copy').textContent = win ? 'You delivered the final ice cream to the sleeping cookie shark.' : 'The pressure got to your cone. The deep keeps your sprinkles.';
  document.getElementById('result-depth').textContent = `${Math.floor(game.depth).toLocaleString()} FT`;
  document.getElementById('result-score').textContent = game.score.toLocaleString();
  document.getElementById('result-kills').textContent = game.kills;
  showScreen('gameover');
}