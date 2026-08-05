export class AudioManager {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.musicTimer = null;
    this.step = 0;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = .16;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    this.startMusic();
  }

  tone(freq, duration = .1, type = 'sine', volume = .18, slide = 0) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, now);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), now + duration);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(.001, now + duration);
    osc.connect(gain); gain.connect(this.master); osc.start(now); osc.stop(now + duration + .02);
  }

  click() { this.tone(420, .06, 'square', .08, 100); }
  pickup() { this.tone(620, .08, 'sine', .12, 260); this.tone(930, .12, 'sine', .08, 120); }
  dash() { this.tone(150, .18, 'sawtooth', .16, 480); }
  hit() { this.tone(95, .2, 'square', .18, -35); }
  smash() { this.tone(180, .12, 'square', .16, -100); this.tone(70, .22, 'sawtooth', .1, -25); }
  level() { [0, 3, 7].forEach((n, i) => this.tone(390 * Math.pow(2, n / 12), .2, 'triangle', .1, 70)); }
  gameOver() { this.tone(300, .3, 'sawtooth', .13, -220); this.tone(170, .45, 'sine', .11, -100); }

  startMusic() {
    if (this.musicTimer || !this.ctx) return;
    const notes = [196, 246.9, 293.7, 246.9, 220, 277.2, 329.6, 277.2];
    this.musicTimer = setInterval(() => {
      if (!this.ctx) return;
      this.tone(notes[this.step % notes.length], .18, 'triangle', .025, 2);
      this.step++;
    }, 310);
  }

  stopMusic() {
    if (this.musicTimer) { clearInterval(this.musicTimer); this.musicTimer = null; }
  }
}