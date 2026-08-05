export class AudioManager {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.muted = false;
    this.musicTimer = null;
    this.musicStep = 0;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.16;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  tone(frequency, duration = .12, type = 'sine', volume = .16, when = 0) {
    if (!this.ctx || this.muted) return;
    const start = this.ctx.currentTime + when;
    const oscillator = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(.001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + .012);
    gain.gain.exponentialRampToValueAtTime(.001, start + duration);
    oscillator.connect(gain).connect(this.master);
    oscillator.start(start);
    oscillator.stop(start + duration + .03);
  }

  sfx(kind) {
    this.init();
    if (kind === 'click') this.tone(410, .07, 'sine', .11);
    if (kind === 'jump') { this.tone(410, .09, 'triangle', .13); this.tone(620, .1, 'triangle', .09, .045); }
    if (kind === 'star') { this.tone(720, .09, 'sine', .13); this.tone(980, .16, 'sine', .1, .07); }
    if (kind === 'hit') { this.tone(120, .16, 'sawtooth', .18); this.tone(72, .18, 'square', .09, .04); }
    if (kind === 'dash') this.tone(180, .16, 'sawtooth', .12);
    if (kind === 'goal') { this.tone(520, .18, 'triangle', .13); this.tone(780, .3, 'triangle', .1, .12); }
    if (kind === 'win') { [523, 659, 784, 1046].forEach((note, i) => this.tone(note, .24, 'triangle', .12, i * .11)); }
  }

  startMusic() {
    this.init();
    if (this.musicTimer || !this.ctx) return;
    const notes = [261.6, 329.6, 392, 329.6, 293.7, 349.2, 440, 349.2];
    this.musicTimer = window.setInterval(() => {
      if (!this.muted) this.tone(notes[this.musicStep++ % notes.length], .2, 'triangle', .035);
    }, 330);
  }

  stopMusic() {
    if (this.musicTimer) window.clearInterval(this.musicTimer);
    this.musicTimer = null;
  }
}