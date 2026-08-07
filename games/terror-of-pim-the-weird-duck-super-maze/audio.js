export class AudioEngine {
  constructor() { this.ctx = null; this.master = null; this.musicTimer = null; this.musicStep = 0; }
  ensure() {
    if (!this.ctx) { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); this.master = this.ctx.createGain(); this.master.gain.value = .16; this.master.connect(this.ctx.destination); }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }
  tone(freq, duration=.12, type='sine', volume=.16, delay=0) {
    this.ensure(); const now = this.ctx.currentTime + delay, osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, now); gain.gain.setValueAtTime(.0001, now); gain.gain.exponentialRampToValueAtTime(volume, now+.012); gain.gain.exponentialRampToValueAtTime(.0001, now+duration);
    osc.connect(gain); gain.connect(this.master); osc.start(now); osc.stop(now+duration+.03);
  }
  startMusic() {
    this.ensure(); if (this.musicTimer) return;
    const notes = [110,0,147,0,165,0,131,0,110,0,196,0,165,0,147,0];
    this.musicTimer = setInterval(() => { const n=notes[this.musicStep++%notes.length]; if(n) this.tone(n,.32,'triangle',.035); }, 260);
  }
  stopMusic() { clearInterval(this.musicTimer); this.musicTimer=null; }
  click() { this.tone(420,.05,'square',.07); }
  pickup() { this.tone(660,.1,'sine',.14); this.tone(990,.16,'sine',.1,.07); }
  hit() { this.tone(90,.32,'sawtooth',.2); this.tone(52,.4,'square',.12,.05); }
  quack() { this.tone(190,.16,'sawtooth',.2); this.tone(120,.22,'square',.14,.06); }
  level() { [440,554,659,880].forEach((n,i)=>this.tone(n,.2,'triangle',.12,i*.09)); }
  lose() { this.tone(180,.5,'sawtooth',.18); this.tone(100,.7,'triangle',.15,.25); }
}