export class AudioManager {
  constructor() { this.ctx = null; this.master = null; this.musicTimer = null; this.step = 0; }
  unlock() {
    if (!this.ctx) { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); this.master = this.ctx.createGain(); this.master.gain.value = .16; this.master.connect(this.ctx.destination); }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }
  tone(freq, duration=.1, type='sine', volume=.18, slide=0) {
    if (!this.ctx) return;
    const now = this.ctx.currentTime, osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, now); osc.frequency.linearRampToValueAtTime(Math.max(30,freq+slide), now+duration);
    gain.gain.setValueAtTime(volume, now); gain.gain.exponentialRampToValueAtTime(.001, now+duration);
    osc.connect(gain); gain.connect(this.master); osc.start(now); osc.stop(now+duration+.02);
  }
  sfx(kind) {
    this.unlock();
    if (kind === 'shoot') this.tone(280,.055,'square',.08,100);
    if (kind === 'hit') { this.tone(110,.12,'sawtooth',.16,-65); this.tone(530,.07,'triangle',.08,-180); }
    if (kind === 'hurt') this.tone(95,.22,'sawtooth',.2,-45);
    if (kind === 'pickup') { this.tone(500,.08,'sine',.11,260); setTimeout(()=>this.tone(760,.1,'sine',.08,180),45); }
    if (kind === 'dash') this.tone(180,.16,'triangle',.12,420);
    if (kind === 'upgrade') { this.tone(360,.12,'sine',.11,260); setTimeout(()=>this.tone(620,.2,'sine',.12,150),100); }
    if (kind === 'boss') { this.tone(70,.5,'sawtooth',.2,-25); this.tone(140,.5,'square',.08,-60); }
    if (kind === 'click') this.tone(420,.05,'square',.07,50);
    if (kind === 'death') { this.tone(170,.4,'sawtooth',.2,-120); this.tone(80,.6,'triangle',.12,-40); }
  }
  startMusic() {
    this.unlock();
    if (this.musicTimer) return;
    const notes = [110,0,146.8,0,98,0,130.8,0,87.3,0,116.5,0,98,0,73.4,0];
    this.musicTimer = setInterval(() => { const n=notes[this.step++%notes.length]; if(n) this.tone(n,.22,'triangle',.025,2); }, 230);
  }
  stopMusic() { if (this.musicTimer) { clearInterval(this.musicTimer); this.musicTimer=null; } }
}