export const UI = {
  els: {},

  init(handlers) {
    const ids = [
      'overlay-menu', 'overlay-pause', 'overlay-over', 'overlay-upgrade',
      'menu-best', 'btn-start', 'btn-resume', 'btn-restart-p', 'btn-menu-p',
      'over-title', 'over-flavor', 'over-score', 'over-best', 'new-best',
      'btn-restart', 'btn-menu-o', 'upgrade-cards', 'btn-dash', 'btn-pause'
    ];
    for (const id of ids) this.els[id] = document.getElementById(id);

    this.els['btn-start'].addEventListener('click', handlers.onStart);
    this.els['btn-resume'].addEventListener('click', handlers.onResume);
    this.els['btn-restart-p'].addEventListener('click', handlers.onRestart);
    this.els['btn-menu-p'].addEventListener('click', handlers.onMenu);
    this.els['btn-restart'].addEventListener('click', handlers.onRestart);
    this.els['btn-menu-o'].addEventListener('click', handlers.onMenu);
    this.els['btn-dash'].addEventListener('touchstart', (e) => { e.preventDefault(); handlers.onDash(); }, { passive: false });
    this.els['btn-dash'].addEventListener('mousedown', (e) => { e.preventDefault(); handlers.onDash(); });
    this.els['btn-pause'].addEventListener('click', handlers.onPauseToggle);
  },

  hideAll() {
    for (const id of ['overlay-menu', 'overlay-pause', 'overlay-over', 'overlay-upgrade']) {
      this.els[id].classList.add('hidden');
    }
  },

  showMenu(best) {
    this.hideAll();
    this.els['menu-best'].textContent = best;
    this.els['overlay-menu'].classList.remove('hidden');
    document.body.classList.remove('playing');
  },

  showPlaying() {
    this.hideAll();
    document.body.classList.add('playing');
  },

  showPause() {
    this.els['overlay-pause'].classList.remove('hidden');
  },

  hidePause() {
    this.els['overlay-pause'].classList.add('hidden');
  },

  showGameOver(score, best, win, wave) {
    this.hideAll();
    this.els['over-title'].textContent = win ? '💔 YOU SURVIVED LOVE 💔' : 'GAME OVER';
    this.els['over-flavor'].textContent = win
      ? 'Milo is officially single. All 8 waves of girlfriends destroyed.'
      : `The girlfriends got Milo on wave ${wave}. He has been grounded forever.`;
    this.els['over-score'].textContent = score;
    this.els['over-best'].textContent = best;
    this.els['new-best'].classList.toggle('hidden', score < best || score === 0);
    this.els['overlay-over'].classList.remove('hidden');
    document.body.classList.remove('playing');
  },

  showUpgrade(wave, options, onPick) {
    this.hideAll();
    const container = this.els['upgrade-cards'];
    container.innerHTML = '';
    for (const opt of options) {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `<div class="icon">${opt.icon}</div><div class="name">${opt.name}</div><div class="desc">${opt.desc}</div>`;
      card.addEventListener('click', () => onPick(opt));
      container.appendChild(card);
    }
    this.els['overlay-upgrade'].classList.remove('hidden');
  }
};