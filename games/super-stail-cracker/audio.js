export class AudioManager {
  constructor() { this.ctx = null; this.master = null; this.musicTimer = null; this.step = 0; }
  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain(); this.master.gain.value = .18; this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }
  tone(freq, duration, type = 'sine', volume = .12, slide = 0) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime, osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, now); osc.frequency.linearRampToValueAtTime(Math.max(30, freq + slide), now + duration);
    gain.gain.setValueAtTime(volume, now); gain.gain.exponentialRampToValueAtTime(.001, now + duration);
    osc.connect(gain); gain.connect(this.master); osc.start(now); osc.stop(now + duration + .02);
  }
  click() { this.tone(330, .07, 'square', .06, 90); }
  shoot() { this.tone(250, .055, 'triangle', .045, 150); }
  hit() { this.tone(115, .09, 'sawtooth', .08, -60); }
  pickup() { this.tone(580, .12, 'sine', .1, 260); }
  dash() { this.tone(170, .16, 'sawtooth', .08, 420); }
  hurt() { this.tone(90, .18, 'square', .11, -40); }
  wave() { this.tone(420, .12, 'triangle', .1, 170); setTimeout(() => this.tone(680, .18, 'triangle', .09, 100), 90); }
  boss() { this.tone(75, .5, 'sawtooth', .12, -25); }
  startMusic() {
    if (this.musicTimer || !this.ctx) return;
    const notes = [110, 138.6, 164.8, 123.5, 146.8, 185, 164.8, 130.8];
    this.musicTimer = setInterval(() => {
      const n = notes[this.step++ % notes.length];
      this.tone(n, .22, 'triangle', .018, 3);
      if (this.step % 4 === 0) this.tone(n / 2, .3, 'sine', .012, 0);
    }, 270);
  }
  stopMusic() { if (this.musicTimer) { clearInterval(this.musicTimer); this.musicTimer = null; } }
}