export class AudioManager {
  constructor() { this.ctx = null; this.musicTimer = null; this.note = 0; }
  init() {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }
  tone(freq, duration, type = 'sine', volume = .045, delay = 0) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime + delay;
    const oscillator = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    oscillator.type = type; oscillator.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + .012);
    gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
    oscillator.connect(gain).connect(this.ctx.destination); oscillator.start(now); oscillator.stop(now + duration + .03);
  }
  click() { this.init(); this.tone(420, .07, 'square', .035); this.tone(680, .08, 'sine', .025, .035); }
  shoot() { this.tone(230, .07, 'triangle', .025); }
  pickup() { this.tone(740, .12, 'sine', .05); this.tone(1040, .16, 'sine', .035, .07); }
  hit() { this.tone(90, .2, 'sawtooth', .07); this.tone(55, .25, 'square', .04, .03); }
  enemyDown() { this.tone(170, .09, 'square', .045); this.tone(390, .18, 'triangle', .04, .07); }
  upgrade() { this.tone(330, .11, 'triangle', .04); this.tone(495, .14, 'triangle', .04, .09); this.tone(660, .2, 'sine', .05, .18); }
  win() { [440,554,659,880].forEach((n,i) => this.tone(n,.28,'sine',.055,i*.12)); }
  startMusic() {
    this.init();
    if (this.musicTimer) clearInterval(this.musicTimer);
    const notes = [110,138,165,138,98,123,147,123];
    this.note = 0;
    this.musicTimer = setInterval(() => {
      if (this.ctx && this.ctx.state === 'running') this.tone(notes[this.note++ % notes.length], .34, 'triangle', .012);
    }, 470);
  }
  stopMusic() { if (this.musicTimer) { clearInterval(this.musicTimer); this.musicTimer = null; } }
}