export class AudioManager {
  constructor() {
    this.context = null;
    this.master = null;
    this.musicTimer = null;
    this.musicStep = 0;
  }

  resume() {
    if (!this.context) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      this.context = new AudioContext();
      this.master = this.context.createGain();
      this.master.gain.value = 0.16;
      this.master.connect(this.context.destination);
    }
    if (this.context.state === 'suspended') this.context.resume();
  }

  tone(frequency, duration, type = 'sine', volume = .12, slide = 0) {
    this.resume();
    if (!this.context) return;
    const now = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);
    if (slide) oscillator.frequency.exponentialRampToValueAtTime(Math.max(30, frequency + slide), now + duration);
    gain.gain.setValueAtTime(.001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + .012);
    gain.gain.exponentialRampToValueAtTime(.001, now + duration);
    oscillator.connect(gain).connect(this.master);
    oscillator.start(now);
    oscillator.stop(now + duration + .03);
  }

  click() { this.tone(430, .06, 'square', .045, 90); }
  flap() { this.tone(175, .08, 'triangle', .035, 100); }
  collect() { this.tone(620, .11, 'sine', .08, 260); }
  crystal() { this.tone(360, .2, 'sine', .1, 480); }
  hit() { this.tone(92, .28, 'sawtooth', .13, -40); }
  shield() { this.tone(260, .24, 'triangle', .11, 300); }
  cry() { this.tone(120, .55, 'sine', .12, 500); setTimeout(() => this.tone(480, .5, 'triangle', .075, -170), 90); }
  win() { [440, 554, 659, 880].forEach((note, i) => setTimeout(() => this.tone(note, .3, 'sine', .1), i * 130)); }

  startMusic() {
    this.resume();
    if (this.musicTimer || !this.context) return;
    const notes = [110, 138.59, 164.81, 138.59, 98, 123.47, 146.83, 123.47];
    this.musicTimer = setInterval(() => {
      const note = notes[this.musicStep++ % notes.length];
      this.tone(note, .32, 'triangle', .018, note * .04);
      if (this.musicStep % 4 === 0) this.tone(note / 2, .5, 'sine', .018);
    }, 370);
  }

  stopMusic() {
    if (this.musicTimer) clearInterval(this.musicTimer);
    this.musicTimer = null;
    this.musicStep = 0;
  }
}