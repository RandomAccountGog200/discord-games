export class AudioSystem {
  constructor() { this.ctx = null; this.master = null; this.musicTimer = null; this.step = 0; }
  unlock() {
    if (!this.ctx) { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); this.master = this.ctx.createGain(); this.master.gain.value = .12; this.master.connect(this.ctx.destination); }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }
  tone(freq, duration=.1, type='square', volume=.18, slide=0) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime, osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, now); osc.frequency.linearRampToValueAtTime(Math.max(20, freq + slide), now + duration);
    gain.gain.setValueAtTime(volume, now); gain.gain.exponentialRampToValueAtTime(.001, now + duration);
    osc.connect(gain); gain.connect(this.master); osc.start(now); osc.stop(now + duration + .02);
  }
  click() { this.tone(420,.045,'square',.1,110); }
  plant() { this.tone(230,.09,'triangle',.15,80); }
  water() { this.tone(620,.18,'sine',.12,-280); }
  harvest() { this.tone(360,.08,'square',.16,180); setTimeout(()=>this.tone(690,.14,'square',.13,100),55); }
  hit() { this.tone(90,.18,'sawtooth',.2,-50); }
  coin() { this.tone(880,.08,'square',.12,180); }
  startMusic() {
    if (this.musicTimer || !this.ctx) return;
    const notes=[196,247,294,247,220,277,330,277];
    this.musicTimer=setInterval(()=>{ if (this.ctx && document.visibilityState !== 'hidden') this.tone(notes[this.step++%notes.length],.16,'triangle',.035); },480);
  }
  stopMusic() { clearInterval(this.musicTimer); this.musicTimer=null; }
}