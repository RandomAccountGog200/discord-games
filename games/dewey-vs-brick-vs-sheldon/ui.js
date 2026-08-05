export class UI {
  constructor() {
    this.screens = [...document.querySelectorAll('.screen')];
    this.pauseButton = document.querySelector('#pause-btn');
    this.callbacks = {};
    this.bind('start-btn', 'start'); this.bind('resume-btn', 'resume'); this.bind('pause-restart-btn', 'restart'); this.bind('pause-menu-btn', 'menu');
    this.bind('over-restart-btn', 'restart'); this.bind('over-menu-btn', 'menu'); this.bind('win-restart-btn', 'restart'); this.bind('win-menu-btn', 'menu');
    this.pauseButton.addEventListener('click', () => this.callbacks.pause?.());
    document.querySelectorAll('.upgrade-card').forEach(button => button.addEventListener('click', () => this.callbacks.upgrade?.(Number(button.dataset.upgrade))));
  }
  bind(id, event) { document.querySelector(`#${id}`).addEventListener('click', () => this.callbacks[event]?.()); }
  on(event, callback) { this.callbacks[event] = callback; }
  hideAll() { this.screens.forEach(s => s.classList.remove('visible')); }
  show(name) { this.hideAll(); document.querySelector(`#${name}-screen`)?.classList.add('visible'); }
  setPlaying(active) { this.pauseButton.style.display = active ? 'block' : 'none'; }
  setBest(score) { document.querySelector('#menu-best').textContent = score.toLocaleString(); }
  showMenu(best) { this.setBest(best); this.setPlaying(false); this.show('menu'); }
  showPause() { this.setPlaying(false); this.show('pause'); }
  showOver(score, best) { document.querySelector('#over-summary').innerHTML = `Score <strong>${score.toLocaleString()}</strong><br>Best score <strong>${best.toLocaleString()}</strong>`; this.setPlaying(false); this.show('over'); }
  showWin(score, best) { document.querySelector('#win-summary').innerHTML = `Final score <strong>${score.toLocaleString()}</strong><br>Best score <strong>${best.toLocaleString()}</strong>`; this.setPlaying(false); this.show('win'); }
  showUpgrade(choices) {
    const cards = document.querySelectorAll('.upgrade-card');
    cards.forEach((card, i) => {
      const choice = choices[i];
      card.dataset.upgrade = choice.id;
      card.innerHTML = `<span class="card-icon">${choice.icon}</span><strong>${choice.name}</strong><small>${choice.description}</small>`;
    });
    this.setPlaying(false); this.show('upgrade');
  }
}