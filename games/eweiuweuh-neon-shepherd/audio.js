export class AudioManager {
  constructor() { this.ctx = null; this.master = null; this.musicClock = 0; this.step = 0; }
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    this.ctx = new (window.AudioContext || window.webkitAudioContext)(); this.master = this.ctx.createGain(); this.master.gain.value = .12; this.master.connect(this.ctx.destination);
  }
  tone(freq, duration=.08, type='sine', volume=.2, slide=1) {
    if (!this.ctx) return;
    const o=this.ctx.createOscillator(), g=this.ctx.createGain(); o.type=type; o.frequency.setValueAtTime(freq,this.ctx.currentTime); o.frequency.exponentialRampToValueAtTime(Math.max(30,freq*slide),this.ctx.currentTime+duration); g.gain.setValueAtTime(volume,this.ctx.currentTime); g.gain.exponentialRampToValueAtTime(.001,this.ctx.currentTime+duration); o.connect(g);g.connect(this.master);o.start();o.stop(this.ctx.currentTime+duration+.02);
  }
  ui() { this.tone(520,.06,'sine',.16,1.3); }
  shoot() { this.tone(260,.055,'square',.1,1.8); }
  hit() { this.tone(105,.12,'sawtooth',.2,.45); }
  hurt() { this.tone(72,.22,'sawtooth',.25,.7); }
  pickup() { this.tone(680,.16,'triangle',.18,1.7); this.tone(1020,.16,'sine',.11,1.1); }
  upgrade() { this.tone(430,.18,'triangle',.18,1.8); }
  update(dt, playing) {
    if (!this.ctx || !playing) return;
    this.musicClock -= dt; if (this.musicClock <= 0) { this.musicClock = .78; const notes=[110,138.6,164.8,123.5]; this.tone(notes[this.step++%notes.length],.28,'triangle',.025,.99); }
  }
}