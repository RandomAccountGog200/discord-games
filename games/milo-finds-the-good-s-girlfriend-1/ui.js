export class UI {
  constructor(callbacks = {}) {
    this.overlay = document.getElementById('overlay');
    this.panel = document.getElementById('panel');
    this.hud = document.getElementById('hud');
    this.message = document.getElementById('message');
    this.pauseBtn = document.getElementById('pauseBtn');
    this.callbacks = callbacks;
    this.pauseBtn.addEventListener('click', () => this.callbacks.onPause?.());
  }

  setHud(visible) { this.hud.classList.toggle('hidden', !visible); }
  hideOverlay() { this.overlay.classList.add('hidden'); }
  showOverlay() { this.overlay.classList.remove('hidden'); }

  setPanel(title, body, buttons, eyebrow = '') {
    this.panel.innerHTML = `<div class="eyebrow">${eyebrow}</div><h2>${title}</h2><p>${body}</p><div class="panel-buttons">${buttons.map((b, i) => `<button class="action-button ${b.className || ''}" data-index="${i}">${b.icon ? `<b>${b.icon}</b>` : ''}${b.label}</button>`).join('')}</div>`;
    this.panel.querySelectorAll('button').forEach((button) => button.addEventListener('click', () => {
      const buttonData = buttons[Number(button.dataset.index)];
      this.callbacks.onClick?.(buttonData.action);
    }));
    this.showOverlay();
  }

  showTitle(best) {
    this.setHud(false);
    this.setPanel("Milo Finds the Good's Girlfriend 1", 'Milo’s girlfriend Lumi has vanished into the four cozy corners of the valley. Collect enough good-star energy in every place, dodge the grumpy fuzzballs, and bring her home.', [
      { label: 'Start Adventure', action: 'start' },
    ], 'A tiny cat rescue quest');
    this.panel.insertAdjacentHTML('beforeend', `<div class="best">BEST RESCUE SCORE: ${best}</div><p class="controls-note">Move: A/D or ◀/▶ &nbsp; Jump: W/Space &nbsp; Dash: Shift/X &nbsp; Pause: P</p>`);
  }

  showPause() {
    this.setPanel('Adventure paused', 'The valley will wait right here. Take a breath, then get back to Lumi.', [
      { label: 'Resume', action: 'resume', className: 'green' },
      { label: 'Restart Run', action: 'restart', className: 'alt' },
      { label: 'Main Menu', action: 'menu', className: 'alt' }
    ], 'Paws up');
  }

  showGameOver(score, best) {
    this.setHud(false);
    this.setPanel('Milo got bonked!', `The fuzzballs were too much this time. Lumi is still waiting, and your brave run scored ${score} points.`, [
      { label: 'Try Again', action: 'restart' }, { label: 'Main Menu', action: 'menu', className: 'alt' }
    ], 'Adventure over');
    this.panel.insertAdjacentHTML('beforeend', `<div class="best">BEST RESCUE SCORE: ${best}</div>`);
  }

  showWin(score, best) {
    this.setHud(false);
    this.setPanel('Lumi is found!', 'Every star, every jump, every bonk — worth it. Milo and Lumi curl up beneath the Heartwood lights. You made the good ending happen.', [
      { label: 'Play Again', action: 'restart' }, { label: 'Main Menu', action: 'menu', className: 'alt' }
    ], 'The good ending');
    this.panel.insertAdjacentHTML('beforeend', `<div class="best">RESCUE SCORE: ${score} &nbsp; • &nbsp; BEST: ${best}</div>`);
  }

  showUpgrade(levelName, callback) {
    this.setPanel('Choose Milo’s next trick', `You cleared ${levelName}! Pick one permanent upgrade before the next place.`, [
      { label: 'Swift Paws<br><small>Faster running</small>', action: 'speed', icon: '➜', className: 'green' },
      { label: 'Spring Heart<br><small>Higher jumps</small>', action: 'jump', icon: '↑', className: 'alt' },
      { label: 'Extra Life<br><small>One more heart</small>', action: 'hp', icon: '♥' }
    ], 'A meaningful choice');
    this.callbacks.onUpgrade = callback;
  }

  toast(text) {
    this.message.textContent = text; this.message.classList.remove('hidden');
    clearTimeout(this.toastTimer); this.toastTimer = setTimeout(() => this.message.classList.add('hidden'), 1500);
  }

  updateHud(level, totalLevels, stars, totalStars, hp, maxHp, score) {
    document.getElementById('levelText').textContent = `${level} / ${totalLevels}`;
    document.getElementById('starText').textContent = `${stars} / ${totalStars}`;
    document.getElementById('heartText').textContent = '♥'.repeat(hp) + '♡'.repeat(Math.max(0, maxHp - hp));
    document.getElementById('scoreText').textContent = score;
  }
}