export class AudioManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.musicTimer = null;
    this.musicStep = 0;
    this.nextNoteTime = 0;
    this.isNightMusic = false;
    this.musicStarted = false;
    this.bank = null;
  }

  init() {
    if (this.ctx) return;
    const AE = window.AudioContext || window.webkitAudioContext;
    if (!AE) return;
    this.ctx = new AE();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.7;
    this.masterGain.connect(this.ctx.destination);
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.5;
    this.musicGain.connect(this.masterGain);
    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.8;
    this.sfxGain.connect(this.masterGain);
    this.bank = new SFXBank(this.ctx, this.sfxGain);
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  }

  playClick() { this.bank?.click(); }
  playCorrect(isGhost) { this.bank?.correct(isGhost); }
  playWrong() { this.bank?.wrong(); }
  playGhostReveal() { this.bank?.ghostReveal(); }
  playLeaveAngry() { this.bank?.leaveAngry(); }
  playNightStart() { this.bank?.nightStart(); }
  playGameOver() { this.bank?.gameOver(); }
  playWin() { this.bank?.win(); }

  startMusic() {
    if (this.musicStarted || !this.ctx) return;
    this.musicStarted = true;
    this.musicStep = 0;
    this.nextNoteTime = this.ctx.currentTime + 0.05;
    this.musicTimer = setInterval(() => this.scheduleMusic(), 25);
  }

  setMusicNight(isNight) {
    this.isNightMusic = isNight;
  }

  scheduleMusic() {
    if (!this.ctx || !this.musicGain) return;
    while (this.nextNoteTime < this.ctx.currentTime + 0.15) {
      const time = this.nextNoteTime;
      if (this.isNightMusic) {
        this.scheduleNightNote(time);
      } else {
        this.scheduleDayNote(time);
      }
      this.nextNoteTime += 60 / 100 / 2; // 100 bpm, 8th notes
      this.musicStep++;
    }
  }

  scheduleDayNote(t) {
    const scale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25];
    const bassScale = [130.81, 146.83, 164.81, 196.00];
    const patterns = [
      { type: 'bass', note: bassScale[0], dur: 0.4 },
      { type: 'arp', note: scale[this.musicStep % 4 + 1], dur: 0.2 },
      { type: 'arp', note: scale[(this.musicStep % 5) + 1], dur: 0.2 },
      { type: 'bass', note: bassScale[1], dur: 0.4 },
      { type: 'arp', note: scale[(this.musicStep % 3) + 2], dur: 0.2 },
      { type: 'arp', note: scale[(this.musicStep % 4) + 2], dur: 0.2 },
    ];
    const p = patterns[this.musicStep % patterns.length];
    this.pluck(t, p.note, p.dur, p.type === 'bass' ? 0.12 : 0.06, p.type === 'bass' ? 'sine' : 'triangle');
  }

  scheduleNightNote(t) {
    const scale = [110.00, 123.47, 138.59, 164.81, 185.00, 220.00];
    const bassScale = [55.00, 61.74, 46.25, 49.00];
    const patterns = [
      { type: 'bass', note: bassScale[this.musicStep % 4], dur: 0.6 },
      { type: 'arp', note: scale[(this.musicStep % 5) + 1], dur: 0.15 },
      { type: 'arp', note: scale[(this.musicStep % 4) + 2], dur: 0.15 },
      { type: 'arp', note: scale[(this.musicStep % 3) + 1], dur: 0.3 },
    ];
    const p = patterns[this.musicStep % patterns.length];
    this.pluck(t, p.note, p.dur, p.type === 'bass' ? 0.14 : 0.05, p.type === 'bass' ? 'sawtooth' : 'triangle');
    if (this.musicStep % 8 === 0) {
      // Dark drone layer
      this.drone(t, 36.71, 1.5, 0.06);
    }
  }

  pluck(t, freq, dur = 0.3, vol = 0.1, type = 'sine') {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.99, t + dur);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g);
    g.connect(this.musicGain);
    osc.start(t);
    osc.stop(t + dur + 0.1);
  }

  drone(t, freq, dur, vol) {
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 1);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g);
    g.connect(this.musicGain);
    osc.start(t);
    osc.stop(t + dur + 0.1);
  }

  stopMusic() {
    if (this.musicTimer) clearInterval(this.musicTimer);
    this.musicTimer = null;
    this.musicStarted = false;
  }
}

class SFXBank {
  constructor(ctx, output) {
    this.ctx = ctx;
    this.output = output;
  }

  click() { this.tone(600, 0.06, 'square', 0.08); }

  correct(isGhost) {
    if (isGhost) {
      this.tone(520, 0.12, 'sine', 0.12);
      setTimeout(() => this.tone(780, 0.15, 'sine', 0.1), 60);
      setTimeout(() => this.tone(1040, 0.2, 'sine', 0.08), 120);
    } else {
      this.tone(740, 0.1, 'sine', 0.1);
      setTimeout(() => this.tone(980, 0.15, 'sine', 0.08), 50);
    }
  }

  wrong() {
    this.tone(200, 0.2, 'sawtooth', 0.12);
    setTimeout(() => this.tone(150, 0.25, 'sawtooth', 0.1), 80);
  }

  ghostReveal() {
    this.tone(80, 0.3, 'sawtooth', 0.15);
    setTimeout(() => this.tone(220, 0.15, 'square', 0.08), 50);
    setTimeout(() => this.tone(55, 0.4, 'sawtooth', 0.12), 100);
  }

  leaveAngry() {
    this.tone(300, 0.15, 'square', 0.1);
    setTimeout(() => this.tone(250, 0.2, 'square', 0.08), 60);
  }

  nightStart() {
    this.tone(440, 0.2, 'sine', 0.1);
    setTimeout(() => this.tone(220, 0.3, 'sawtooth', 0.12), 100);
    setTimeout(() => this.tone(110, 0.5, 'sawtooth', 0.1), 250);
  }

  gameOver() {
    this.tone(400, 0.3, 'sawtooth', 0.1);
    setTimeout(() => this.tone(300, 0.3, 'sawtooth', 0.1), 150);
    setTimeout(() => this.tone(200, 0.5, 'sawtooth', 0.1), 300);
  }

  win() {
    this.tone(523, 0.1, 'sine', 0.1);
    setTimeout(() => this.tone(659, 0.1, 'sine', 0.1), 80);
    setTimeout(() => this.tone(784, 0.2, 'sine', 0.1), 160);
  }

  tone(freq, dur = 0.1, type = 'sine', vol = 0.1) {
    if (!this.ctx || !this.output) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    const t = this.ctx.currentTime;
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(g);
    g.connect(this.output);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }
}