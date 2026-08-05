export class UI {
  constructor() {
    this.panels = ['menu-panel', 'pause-panel', 'upgrade-panel', 'end-panel'];
    this.hud = document.getElementById('hud');
    this.touch = document.getElementById('touch-controls');
    this.toastEl = document.getElementById('toast');
    this.actionHandler = null;
    document.addEventListener('click', (e) => {
      const button = e.target.closest('[data-action]');
      if (button && this.actionHandler) this.actionHandler(button.dataset.action);
    });
  }
  onAction(fn) { this.actionHandler = fn; }
  hideAll() { this.panels.forEach(id => document.getElementById(id).classList.add('hidden')); }
  showPlaying() { this.hideAll(); this.hud.classList.remove('hidden'); this.touch.classList.remove('hidden'); }
  showMenu(best) { this.hideAll(); this.hud.classList.add('hidden'); this.touch.classList.add('hidden'); document.getElementById('menu-panel').classList.remove('hidden'); document.getElementById('menu-best').textContent = String(best).padStart(6, '0'); }
  showPause() { this.hideAll(); this.hud.classList.add('hidden'); this.touch.classList.add('hidden'); document.getElementById('pause-panel').classList.remove('hidden'); }
  showUpgrade(level, choices) {
    this.hideAll(); this.hud.classList.add('hidden'); this.touch.classList.add('hidden');
    document.getElementById('upgrade-panel').classList.remove('hidden');
    document.getElementById('upgrade-title').textContent = `SECTOR ${level} CLEARED`;
    const cards = document.getElementById('upgrade-cards'); cards.innerHTML = '';
    for (const c of choices) {
      const el = document.createElement('button'); el.className = 'upgrade-card'; el.dataset.action = `upgrade:${c.id}`;
      el.innerHTML = `<span class="card-icon">${c.icon}</span><strong>${c.title}</strong><small>${c.description}</small>`;
      cards.appendChild(el);
    }
  }
  showEnd(win, score, best, reason) {
    this.hideAll(); this.hud.classList.add('hidden'); this.touch.classList.add('hidden');
    document.getElementById('end-panel').classList.remove('hidden');
    document.getElementById('end-kicker').textContent = win ? 'AERODYNE // FLIGHT CERTIFIED' : 'AERODYNE // INCIDENT REPORT';
    document.getElementById('end-title').textContent = win ? 'FLIGHT COMPLETE' : 'AIRCRAFT DOWN';
    document.getElementById('end-reason').textContent = reason;
    document.getElementById('end-score').textContent = String(score).padStart(6, '0');
    document.getElementById('end-best').textContent = String(best).padStart(6, '0');
  }
  updateHud(level, score, progress, health, maxHealth, fuel, maxFuel) {
    document.getElementById('level-label').textContent = `SECTOR ${level} / 5`;
    document.getElementById('score-label').textContent = String(Math.floor(score)).padStart(6, '0');
    document.getElementById('distance-progress').style.width = `${Math.max(0, Math.min(100, progress * 100))}%`;
    document.getElementById('hull-gauge').style.width = `${Math.max(0, health / maxHealth * 100)}%`;
    document.getElementById('fuel-gauge').style.width = `${Math.max(0, fuel / maxFuel * 100)}%`;
  }
  toast(message) { this.toastEl.textContent = message; this.toastEl.classList.add('show'); clearTimeout(this.toastTimer); this.toastTimer = setTimeout(() => this.toastEl.classList.remove('show'), 1300); }
}