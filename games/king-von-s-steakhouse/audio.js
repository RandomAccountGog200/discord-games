export class AudioSystem {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.musicGain = null;
    this.musicTimer = null;
    this.step = 0;
  }
  unlock() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.18;
      this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.035;
      this.musicGain.connect(this.master);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    this.startMusic();
  }
  tone(freq, duration, type = 'sine', volume = .3, slide = 0) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), now + duration);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(.001, now + duration);
    osc.connect(gain).connect(this.master);
    osc.start(now);
    osc.stop(now + duration + .02);
  }
  click() { this.tone(420, .055, 'square', .16, 90); }
  select() { this.tone(270, .08, 'triangle', .16, 60); }
  flip() { this.tone(180, .08, 'square', .24, 240); this.tone(520, .1, 'triangle', .12, -50); }
  serve(great = false) {
    if (great) { this.tone(540, .1, 'triangle', .22, 180); setTimeout(() => this.tone(810, .14, 'triangle', .18, 100), 65); }
    else this.tone(330, .1, 'triangle', .18, 100);
  }
  miss() { this.tone(130, .25, 'sawtooth', .22, -70); }
  upgrade() { this.tone(440, .1, 'triangle', .18, 160); setTimeout(() => this.tone(660, .16, 'triangle', .18, 110), 90); }
  startMusic() {
    if (this.musicTimer || !this.ctx) return;
    const notes = [110, 0, 130.8, 146.8, 0, 98, 0, 123.5];
    this.musicTimer = setInterval(() => {
      if (!this.ctx || !this.musicGain) return;
      const n = notes[this.step++ % notes.length];
      if (!n) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle'; osc.frequency.value = n;
      gain.gain.setValueAtTime(.001, now);
      gain.gain.linearRampToValueAtTime(.8, now + .025);
      gain.gain.exponentialRampToValueAtTime(.001, now + .28);
      osc.connect(gain).connect(this.musicGain); osc.start(now); osc.stop(now + .3);
    }, 350);
  }
}