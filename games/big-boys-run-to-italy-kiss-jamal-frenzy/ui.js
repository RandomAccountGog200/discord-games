export class UI {
  constructor() {
    this.screens = {
      menu: document.getElementById('menuScreen'),
      pause: document.getElementById('pauseScreen'),
      upgrade: document.getElementById('upgradeScreen'),
      end: document.getElementById('endScreen')
    };
    this.hud = document.getElementById('hud');
    this.touchControls = document.getElementById('touchControls');
    this.levelValue = document.getElementById('levelValue');
    this.stampValue = document.getElementById('stampValue');
    this.scoreValue = document.getElementById('scoreValue');
    this.healthValue = document.getElementById('healthValue');
    this.menuBest = document.getElementById('menuBest');
    this.upgradeChoices = document.getElementById('upgradeChoices');
  }

  bind(callbacks) {
    document.getElementById('startBtn').addEventListener('click', callbacks.start);
    document.getElementById('resumeBtn').addEventListener('click', callbacks.resume);
    document.getElementById('pauseBtn').addEventListener('click', callbacks.pause);
    document.getElementById('pauseMenuBtn').addEventListener('click', callbacks.menu);
    document.getElementById('restartBtn').addEventListener('click', callbacks.restart);
    document.getElementById('endMenuBtn').addEventListener('click', callbacks.menu);
  }

  setBest(value) { this.menuBest.textContent = value.toLocaleString(); }

  show(name) {
    Object.values(this.screens).forEach(screen => screen.classList.remove('active'));
    if (name && this.screens[name]) this.screens[name].classList.add('active');
    const gameplay = name === null || name === 'pause';
    this.hud.classList.toggle('hidden', !gameplay);
    this.touchControls.classList.toggle('hidden', name !== null);
  }

  updateHUD(level, stamps, total, score, health, maxHealth) {
    this.levelValue.textContent = level;
    this.stampValue.textContent = `${stamps}/${total}`;
    this.scoreValue.textContent = score.toLocaleString();
    this.healthValue.textContent = '♥'.repeat(Math.max(0, health)) + '♡'.repeat(Math.max(0, maxHealth - health));
  }

  showUpgrade(choices, choose) {
    this.upgradeChoices.innerHTML = '';
    choices.forEach(choice => {
      const button = document.createElement('button');
      button.className = 'upgrade-card';
      button.innerHTML = `<b class="upgrade-icon">${choice.icon}</b><strong>${choice.title}</strong><span>${choice.description}</span>`;
      button.addEventListener('click', () => choose(choice.id), { once: true });
      this.upgradeChoices.appendChild(button);
    });
    this.show('upgrade');
  }

  showEnd(won, score, best, reached) {
    document.getElementById('endEyebrow').textContent = won ? 'THE KISS HAS LANDED' : 'THE RUN IS OVER';
    document.getElementById('endTitle').textContent = won ? 'JAMAL FRENZY!' : 'SCOOTERED OUT';
    document.getElementById('endSummary').textContent = won ? `Six piazzas. One legendary kiss. You reached Jamal with ${score.toLocaleString()} points.` : `You reached piazza ${reached}. The traffic was simply too spicy.`;
    document.getElementById('endScore').textContent = score.toLocaleString();
    document.getElementById('endBest').textContent = `${won || score >= best ? 'NEW ' : ''}BEST RUN: ${best.toLocaleString()}`;
    this.show('end');
  }
}