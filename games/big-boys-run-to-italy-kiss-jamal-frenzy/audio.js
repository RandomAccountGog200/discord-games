export class AudioManager {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.musicGain = null;
    this.musicTimer = null;
    this.step = 0;
    this.muted = false;
  }

  ensure() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = .18;
      this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = .055;
      this.musicGain.connect(this.master);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  tone(frequency, duration, type = 'sine', volume = .15, slide = 0) {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    const oscillator = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(40, frequency + slide), now + duration);
    gain.gain.setValueAtTime(.001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + .012);
    gain.gain.exponentialRampToValueAtTime(.001, now + duration);
    oscillator.connect(gain).connect(this.master);
    oscillator.start(now);
    oscillator.stop(now + duration + .03);
  }

  sfx(name) {
    this.ensure();
    if (!this.ctx) return;
    if (name === 'click') this.tone(420, .07, 'square', .08, 80);
    if (name === 'dash') { this.tone(170, .16, 'sawtooth', .12, 480); this.tone(690, .1, 'triangle', .07, -150); }
    if (name === 'pickup') { this.tone(620, .09, 'sine', .12, 180); setTimeout(() => this.tone(920, .11, 'sine', .09, 100), 45); }
    if (name === 'hurt') { this.tone(130, .2, 'sawtooth', .16, -75); this.tone(85, .25, 'square', .08, -20); }
    if (name === 'goal') { [523, 659, 784, 1046].forEach((n, i) => setTimeout(() => this.tone(n, .18, 'sine', .1, 30), i * 75)); }
    if (name === 'upgrade') { this.tone(440, .12, 'triangle', .1, 150); setTimeout(() => this.tone(660, .18, 'triangle', .1, 120), 90); }
    if (name === 'win') { [392, 523, 659, 784, 1046].forEach((n, i) => setTimeout(() => this.tone(n, .22, 'sine', .11, 45), i * 100)); }
    if (name === 'lose') { this.tone(240, .22, 'sawtooth', .12, -100); setTimeout(() => this.tone(150, .32, 'sawtooth', .1, -50), 150); }
  }

  startMusic() {
    this.ensure();
    if (!this.ctx || this.musicTimer) return;
    const notes = [196, 246.94, 293.66, 246.94, 220, 277.18, 329.63, 277.18];
    this.musicTimer = setInterval(() => {
      if (!this.ctx || this.muted) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;
      osc.type = 'triangle';
      osc.frequency.value = notes[this.step++ % notes.length];
      gain.gain.setValueAtTime(.001, now);
      gain.gain.linearRampToValueAtTime(.7, now + .025);
      gain.gain.exponentialRampToValueAtTime(.001, now + .3);
      osc.connect(gain).connect(this.musicGain);
      osc.start(now); osc.stop(now + .34);
    }, 360);
  }

  stopMusic() {
    if (this.musicTimer) { clearInterval(this.musicTimer); this.musicTimer = null; }
  }
}