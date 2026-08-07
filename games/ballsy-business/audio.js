export class AudioManager {
  constructor() { this.ctx = null; this.master = null; this.musicTimer = null; this.step = 0; }
  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain(); this.master.gain.value = .16; this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }
  tone(freq, duration = .1, type = 'sine', volume = .2, delay = 0) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime + delay, osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, now); osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq * .7), now + duration);
    gain.gain.setValueAtTime(.001, now); gain.gain.exponentialRampToValueAtTime(volume, now + .008); gain.gain.exponentialRampToValueAtTime(.001, now + duration);
    osc.connect(gain); gain.connect(this.master); osc.start(now); osc.stop(now + duration + .02);
  }
  click() { this.tone(480, .07, 'square', .12); }
  pickup() { this.tone(560, .1, 'sine', .17); this.tone(840, .14, 'sine', .12, .06); }
  dash() { this.tone(130, .16, 'sawtooth', .18); this.tone(390, .1, 'triangle', .1, .04); }
  hit() { this.tone(90, .24, 'sawtooth', .24); this.tone(55, .18, 'square', .13, .03); }
  upgrade() { this.tone(440, .1, 'triangle', .14); this.tone(660, .18, 'triangle', .13, .1); }
  wave() { [330, 440, 550, 660].forEach((n, i) => this.tone(n, .16, 'triangle', .1, i * .08)); }
  fail() { this.tone(240, .3, 'sawtooth', .2); this.tone(110, .5, 'sine', .18, .18); }
  startMusic() {
    if (!this.ctx || this.musicTimer) return;
    const notes = [110, 0, 165, 0, 123, 0, 196, 0];
    this.musicTimer = setInterval(() => { const n = notes[this.step++ % notes.length]; if (n) this.tone(n, .18, 'triangle', .035); }, 280);
  }
  stopMusic() { clearInterval(this.musicTimer); this.musicTimer = null; }
}