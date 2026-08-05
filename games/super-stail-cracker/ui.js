export class UI {
  constructor() {
    this.menu = document.querySelector('#menu-screen'); this.hud = document.querySelector('#hud'); this.pause = document.querySelector('#pause-screen'); this.upgrade = document.querySelector('#upgrade-screen'); this.result = document.querySelector('#result-screen'); this.touch = document.querySelector('#touch-controls');
    this.best = document.querySelector('#menu-best'); this.wave = document.querySelector('#wave-value'); this.score = document.querySelector('#score-value'); this.hp = document.querySelector('#hp-value'); this.hpFill = document.querySelector('#hp-fill'); this.dash = document.querySelector('#dash-status');
    this.cards = document.querySelector('#upgrade-cards'); this.resultTitle = document.querySelector('#result-title'); this.resultEyebrow = document.querySelector('#result-eyebrow'); this.resultMessage = document.querySelector('#result-message'); this.resultScore = document.querySelector('#result-score'); this.resultWave = document.querySelector('#result-wave'); this.resultBest = document.querySelector('#result-best');
  }
  bind(actions) {
    document.querySelector('#start-button').onclick = actions.start; document.querySelector('#resume-button').onclick = actions.resume; document.querySelector('#pause-restart-button').onclick = actions.restart; document.querySelector('#pause-menu-button').onclick = actions.menu; document.querySelector('#retry-button').onclick = actions.restart; document.querySelector('#result-menu-button').onclick = actions.menu; document.querySelector('#pause-button').onclick = actions.pause;
  }
  hideScreens() { [this.menu, this.pause, this.upgrade, this.result].forEach(s => s.classList.add('hidden')); }
  showMenu(best) { this.hideScreens(); this.menu.classList.remove('hidden'); this.hud.classList.add('hidden'); this.touch.classList.add('hidden'); this.best.textContent = best; }
  showPlaying(mobile) { this.hideScreens(); this.hud.classList.remove('hidden'); if (mobile) this.touch.classList.remove('hidden'); }
  showPause() { this.pause.classList.remove('hidden'); }
  closePause() { this.pause.classList.add('hidden'); }
  update(game) {
    this.wave.textContent = game.wave; this.score.textContent = game.score;
    const p1 = game.players[0], p2 = game.players[1];
    this.hp.textContent = `P1 ${Math.max(0, Math.ceil(p1.hp))} · P2 ${Math.max(0, Math.ceil(p2.hp))}`;
    this.hpFill.style.width = `${Math.max(0, (p1.hp + p2.hp) / (p1.maxHp + p2.maxHp) * 100)}%`;
    const d1 = p1.dashCooldown <= 0 ? 'READY' : `${p1.dashCooldown.toFixed(1)}s`, d2 = p2.dashCooldown <= 0 ? 'READY' : `${p2.dashCooldown.toFixed(1)}s`;
    this.dash.textContent = `P1 ${d1} · P2 ${d2}`;
  }
  showUpgrade(options, wave, choose) {
    this.hideScreens(); this.upgrade.classList.remove('hidden'); this.cards.innerHTML = '';
    options.forEach(option => { const card = document.createElement('button'); card.className = 'upgrade-card'; card.innerHTML = `<div class="upgrade-icon">${option.icon}</div><h3>${option.name}</h3><p>${option.description}</p>`; card.onclick = () => choose(option.id); this.cards.appendChild(card); });
  }
  showResult(win, score, wave, best) {
    this.hideScreens(); this.result.classList.remove('hidden'); this.resultTitle.textContent = win ? 'THE ULTIMATE CRUNCH' : 'RUN OVER'; this.resultEyebrow.textContent = win ? 'THE STAIL KING IS TOAST' : 'THE COUNTER IS QUIET'; this.resultMessage.textContent = win ? 'Eight waves. Two legendary crackers.' : 'Both crackers went soft. The pantry claims another crew.'; this.resultScore.textContent = score; this.resultWave.textContent = wave; this.resultBest.textContent = best;
  }
}