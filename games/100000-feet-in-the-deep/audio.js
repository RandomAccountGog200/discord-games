export class AudioEngine {
  constructor() { this.ctx = null; this.master = null; this.musicTimer = null; this.step = 0; }
  boot() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain(); this.master.gain.value = 0.12; this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }
  tone(freq, duration=.12, type='sine', volume=.15, slide=1) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime, osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, now); osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq * slide), now + duration);
    gain.gain.setValueAtTime(volume, now); gain.gain.exponentialRampToValueAtTime(.001, now + duration);
    osc.connect(gain); gain.connect(this.master); osc.start(now); osc.stop(now + duration + .02);
  }
  click() { this.tone(420,.06,'square',.13,1.25); }
  pickup() { this.tone(660,.09,'sine',.16,1.45); setTimeout(()=>this.tone(990,.12,'sine',.12,1.1),45); }
  dash() { this.tone(150,.2,'sawtooth',.18,.35); }
  hit() { this.tone(90,.18,'sawtooth',.24,.55); }
  bossHit() { this.tone(230,.1,'square',.2,.45); }
  boss() { this.tone(110,.35,'triangle',.2,.65); setTimeout(()=>this.tone(82,.4,'triangle',.16,.55),150); }
  upgrade() { this.tone(440,.1,'triangle',.15,1.5); setTimeout(()=>this.tone(660,.18,'triangle',.15,1.2),90); }
  win() { [523,659,784,1046].forEach((n,i)=>setTimeout(()=>this.tone(n,.24,'sine',.18,1.04),i*120)); }
  lose() { this.tone(220,.5,'sawtooth',.2,.35); }
  startMusic() {
    this.boot(); if (this.musicTimer) return;
    const notes = [146.8,174.6,220,174.6,130.8,164.8,196,164.8];
    this.musicTimer = setInterval(() => { this.tone(notes[this.step++ % notes.length],.32,'triangle',.035,1.01); }, 360);
  }
  stopMusic() { clearInterval(this.musicTimer); this.musicTimer = null; }
}