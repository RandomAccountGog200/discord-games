export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.musicGain = null;
    this.musicTimer = null;
    this.step = 0;
  }
  unlock() {
    if (!this.ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.18;
      this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.055;
      this.musicGain.connect(this.master);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    if (!this.musicTimer) {
      this.musicTimer = setInterval(() => this.musicTick(), 430);
      this.musicTick();
    }
  }
  tone(freq, duration = .12, type = 'sine', volume = .3, destination = this.master, when = 0) {
    if (!this.ctx || !destination) return;
    const now = this.ctx.currentTime + when;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(.001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(.001, volume), now + .012);
    gain.gain.exponentialRampToValueAtTime(.001, now + duration);
    osc.connect(gain); gain.connect(destination); osc.start(now); osc.stop(now + duration + .03);
  }
  musicTick() {
    if (!this.ctx) return;
    const notes = [220, 277.18, 329.63, 369.99, 329.63, 277.18, 246.94, 185];
    this.tone(notes[this.step++ % notes.length], .28, 'triangle', .8, this.musicGain);
    if (this.step % 4 === 0) this.tone(notes[(this.step / 4) % notes.length] / 2, .38, 'sine', .45, this.musicGain);
  }
  play(name) {
    if (!this.ctx) return;
    if (name === 'click') this.tone(520, .06, 'square', .14);
    if (name === 'gate') { this.tone(660, .1, 'sine', .35); this.tone(990, .18, 'sine', .28, this.master, .07); }
    if (name === 'pickup') { this.tone(740, .09, 'triangle', .3); this.tone(1110, .16, 'triangle', .24, this.master, .08); }
    if (name === 'boost') this.tone(95, .1, 'sawtooth', .15);
    if (name === 'damage') { this.tone(110, .22, 'sawtooth', .5); this.tone(70, .3, 'square', .25, this.master, .08); }
    if (name === 'crash') { this.tone(80, .45, 'sawtooth', .7); this.tone(48, .6, 'triangle', .45, this.master, .12); }
    if (name === 'level') { [440, 554, 659, 880].forEach((n, i) => this.tone(n, .2, 'triangle', .3, this.master, i * .09)); }
  }
}