// Procedural audio: SFX + simple music loop via Web Audio API
export const AudioSys = {
  ctx: null,
  master: null,
  musicGain: null,
  musicOn: false,
  nextNoteTime: 0,
  step: 0,

  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(this.ctx.destination);
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.22;
    this.musicGain.connect(this.master);
  },

  tone(freq, dur, type = 'square', vol = 0.3, slideTo = null, delay = 0) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slideTo !== null) o.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(this.master);
    o.start(t); o.stop(t + dur + 0.02);
  },

  noise(dur, vol = 0.3, freqFrom = 2000, freqTo = 200, delay = 0) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const len = Math.max(1, Math.floor(this.ctx.sampleRate * dur));
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(freqFrom, t);
    f.frequency.exponentialRampToValueAtTime(Math.max(40, freqTo), t + dur);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f); f.connect(g); g.connect(this.master);
    src.start(t);
  },

  shoot() { this.tone(720, 0.09, 'square', 0.12, 240); },
  eshoot() { this.tone(340, 0.14, 'sawtooth', 0.1, 140); },
  hit() { this.noise(0.07, 0.18, 3000, 800); this.tone(220, 0.06, 'triangle', 0.15, 120); },
  explode() { this.noise(0.35, 0.4, 1400, 60); this.tone(120, 0.3, 'sawtooth', 0.25, 40); },
  hurt() { this.tone(200, 0.25, 'sawtooth', 0.3, 60); this.noise(0.2, 0.2, 900, 100); },
  pickup() { this.tone(520, 0.08, 'sine', 0.25); this.tone(780, 0.12, 'sine', 0.25, null, 0.07); },
  dash() { this.noise(0.18, 0.22, 3500, 400); },
  click() { this.tone(880, 0.05, 'square', 0.18); },
  upgrade() { this.tone(440, 0.1, 'triangle', 0.25); this.tone(660, 0.1, 'triangle', 0.25, null, 0.09); this.tone(880, 0.16, 'triangle', 0.25, null, 0.18); },
  waveClear() { [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.14, 'triangle', 0.22, null, i * 0.09)); },
  gameOver() { [440, 349, 293, 220].forEach((f, i) => this.tone(f, 0.25, 'sawtooth', 0.2, null, i * 0.18)); },
  bossHit() { this.tone(90, 0.15, 'square', 0.28, 45); this.noise(0.12, 0.2, 1200, 200); },

  // --- Music: moody minor-key loop, 8th-note sequencer with lookahead ---
  startMusic() {
    if (!this.ctx) return;
    this.musicOn = true;
    this.step = 0;
    this.nextNoteTime = this.ctx.currentTime + 0.1;
  },
  stopMusic() { this.musicOn = false; },

  mnote(freq, t, dur, type, vol) {
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(this.musicGain);
    o.start(t); o.stop(t + dur + 0.02);
  },

  update() {
    if (!this.ctx || !this.musicOn) return;
    const stepDur = 60 / 116 / 2; // 116 BPM, 8th notes
    // A minor progression: Am, F, C, G (roots)
    const bassRoots = [55, 43.65, 65.41, 49];
    const leadScale = [220, 261.63, 293.66, 329.63, 392, 440, 523.25];
    while (this.nextNoteTime < this.ctx.currentTime + 0.15) {
      const s = this.step;
      const bar = Math.floor(s / 8) % 4;
      if (s % 4 === 0) this.mnote(bassRoots[bar] * 2, this.nextNoteTime, stepDur * 3.4, 'sawtooth', 0.5);
      if (s % 8 === 4) this.mnote(bassRoots[bar] * 4, this.nextNoteTime, stepDur * 1.8, 'triangle', 0.3);
      // sparse lead arp
      if (s % 2 === 0 && Math.floor(s / 2) % 4 !== 3) {
        const n = leadScale[(s * 3 + bar * 2) % leadScale.length];
        this.mnote(n * 2, this.nextNoteTime, stepDur * 1.5, 'square', 0.10);
      }
      // hat tick
      if (s % 2 === 1) {
        const len = Math.floor(this.ctx.sampleRate * 0.03);
        const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * 0.4;
        const src = this.ctx.createBufferSource();
        src.buffer = buf;
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.08, this.nextNoteTime);
        g.gain.exponentialRampToValueAtTime(0.001, this.nextNoteTime + 0.03);
        src.connect(g); g.connect(this.musicGain);
        src.start(this.nextNoteTime);
      }
      this.nextNoteTime += stepDur;
      this.step++;
    }
  }
};