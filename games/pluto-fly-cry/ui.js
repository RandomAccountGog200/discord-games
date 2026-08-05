export class UI {
  constructor() {
    this.screens = {
      title: document.getElementById('title-screen'),
      pause: document.getElementById('pause-screen'),
      upgrade: document.getElementById('upgrade-screen'),
      result: document.getElementById('gameover-screen')
    };
    this.hud = document.getElementById('hud');
    this.score = document.getElementById('score-value');
    this.best = document.getElementById('best-value');
    this.stage = document.getElementById('stage-value');
    this.meter = document.getElementById('meter-fill');
    this.combo = document.getElementById('combo-value');
    this.cryButton = document.getElementById('cry-button');
    this.thrustButton = document.getElementById('thrust-button');
    this.upgradeOptions = document.getElementById('upgrade-options');
    this.onUpgradeChoice = null;
  }
  hideScreens() { Object.values(this.screens).forEach(screen => screen.classList.add('hidden')); }
  showTitle(best) { this.hideScreens(); this.screens.title.classList.remove('hidden'); this.hud.classList.add('hidden'); document.getElementById('menu-best').textContent = best.toLocaleString(); }
  showPlaying() { this.hideScreens(); this.hud.classList.remove('hidden'); }
  showPause() { this.hideScreens(); this.screens.pause.classList.remove('hidden'); }
  showUpgrade(stage, offers, callback) {
    this.hideScreens(); this.hud.classList.add('hidden'); this.screens.upgrade.classList.remove('hidden');
    document.getElementById('upgrade-eyebrow').textContent = `SECTOR ${stage} CLEARED · NEW HORIZONS`;
    this.upgradeOptions.innerHTML = '';
    this.onUpgradeChoice = callback;
    offers.forEach((offer, index) => {
      const button = document.createElement('button');
      button.className = 'upgrade-card';
      button.innerHTML = `<div class="upgrade-icon">${offer.icon}</div><strong>${offer.name}</strong><small>${offer.description}</small>`;
      button.addEventListener('click', () => this.onUpgradeChoice?.(offer));
      this.upgradeOptions.appendChild(button);
    });
  }
  showResult(score, best, won) {
    this.hideScreens(); this.screens.result.classList.remove('hidden');
    document.getElementById('result-eyebrow').textContent = won ? 'THE LITTLE PLANET MADE IT' : 'THE DARK GOT HEAVY';
    document.getElementById('result-title').textContent = won ? 'PLUTO SOARS' : 'JOURNEY ENDED';
    document.getElementById('result-orbit').textContent = won ? '✧' : '✦';
    document.getElementById('final-score').textContent = score.toLocaleString();
    document.getElementById('final-best').textContent = best.toLocaleString();
  }
  updateHUD(game) {
    this.score.textContent = Math.floor(game.score).toLocaleString();
    this.best.textContent = game.best.toLocaleString();
    this.stage.textContent = `${Math.min(game.stage, game.maxStage)} / ${game.maxStage}`;
    this.meter.style.width = `${Math.min(100, game.cryMeter / game.cryMax * 100)}%`;
    this.combo.textContent = `COMBO x${Math.max(1, game.combo)}`;
    this.cryButton.disabled = game.cryMeter < game.cryMax || game.state !== 'playing';
    this.cryButton.innerHTML = game.cryMeter >= game.cryMax ? 'CRY <span>C</span>' : `CRY ${Math.floor(game.cryMeter)}%`;
  }
}