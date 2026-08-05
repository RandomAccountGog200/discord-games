export class UI {
  constructor() {
    this.screens = [...document.querySelectorAll('.screen')];
    this.toastEl = document.getElementById('toast');
    this.toastTimer = null;
  }
  screen(id) {
    this.screens.forEach(s => s.classList.toggle('active', s.id === id));
  }
  best(value) {
    const text = `$${Math.floor(value).toLocaleString()}`;
    document.getElementById('menuBest').textContent = text;
    document.getElementById('endBest').textContent = text;
  }
  showMenu(best) { this.best(best); this.screen('menuScreen'); this.touch(false); }
  showPlaying() { this.screen('none'); this.touch(true); }
  showPause() { this.screen('pauseScreen'); this.touch(false); }
  showUpgrade(options, callback) {
    const holder = document.getElementById('upgradeChoices'); holder.innerHTML = '';
    options.forEach((option, index) => {
      const button = document.createElement('button'); button.className = 'upgrade-choice';
      button.innerHTML = `<span class="upgrade-icon">${option.icon}</span><strong>${option.name}</strong><small>${option.description}</small>`;
      button.addEventListener('pointerdown', (event) => { event.preventDefault(); callback(index); }, { passive: false });
      holder.appendChild(button);
    });
    this.screen('upgradeScreen'); this.touch(false);
  }
  showEnd(win, score, best, wave) {
    document.getElementById('endEyebrow').textContent = win ? 'THE HOUSE IS CLOSED' : 'THE KITCHEN GOT TOO HOT';
    document.getElementById('endTitle').textContent = win ? 'LEGENDARY SERVICE' : 'ROUGH NIGHT';
    document.getElementById('endMessage').textContent = win ? `Five shifts survived. The neighborhood is talking. You finished on wave ${wave}.` : `The doors had to close on wave ${wave}. Tighten the timing and come back sharper.`;
    document.getElementById('finalScore').textContent = `$${Math.floor(score).toLocaleString()}`;
    this.best(best); this.screen('endScreen'); this.touch(false);
  }
  toast(message) {
    this.toastEl.textContent = message; this.toastEl.classList.add('show');
    clearTimeout(this.toastTimer); this.toastTimer = setTimeout(() => this.toastEl.classList.remove('show'), 1300);
  }
  touch(show) { document.getElementById('touchControls').style.display = show ? '' : 'none'; }
}