// Procedural audio: SFX + desert-flavored background music via Web Audio API.
let ctx = null, master = null, musicGain = null;
let musicTimer = null, nextNoteTime = 0, beatIndex = 0;
let musicOn = false;

export function ensureAudio() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = 0.5; master.connect(ctx.destination);
    musicGain = ctx.createGain(); musicGain.gain.value = 0.32; musicGain.connect(master);
  }
  if (ctx.state === 'suspended') ctx.resume();
}

function env(g, t, a, d, peak) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(peak, t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
}

function tone(freq, type, dur, vol, slide = 0, delay = 0) {
  if (!ctx) return;
  const t = ctx.currentTime + delay;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
  env(g, t, 0.008, dur, vol);
  o.connect(g).connect(master);
  o.start(t); o.stop(t + dur + 0.1);
}

function noiseBurst(dur, vol, filterFreq, delay = 0) {
  if (!ctx) return;
  const t = ctx.currentTime + delay;
  const len = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource(); src.buffer = buf;
  const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = filterFreq; f.Q.value = 1;
  const g = ctx.createGain(); env(g, t, 0.005, dur, vol);
  src.connect(f).connect(g).connect(master);
  src.start(t);
}

export const sfx = {
  sniff() { noiseBurst(0.25, 0.22, 900); tone(300, 'sine', 0.22, 0.08, 250); },
  pickup(v = 1) { tone(520 + v * 80, 'sine', 0.12, 0.16, 300); tone(780 + v * 80, 'sine', 0.14, 0.1, 260, 0.05); },
  hurt() { tone(160, 'sawtooth', 0.3, 0.25, -100); noiseBurst(0.2, 0.2, 400); },
  sneeze() { noiseBurst(0.45, 0.4, 1800); tone(600, 'square', 0.12, 0.15, 500, 0.05); noiseBurst(0.3, 0.35, 700, 0.15); },
  wave() { [440, 554, 659, 880].forEach((f, i) => tone(f, 'triangle', 0.25, 0.18, 0, i * 0.1)); },
  upgrade() { [523, 659, 784, 1046].forEach((f, i) => tone(f, 'sine', 0.3, 0.18, 0, i * 0.08)); },
  click() { tone(700, 'square', 0.06, 0.1); },
  over() { [392, 330, 262, 196].forEach((f, i) => tone(f, 'triangle', 0.4, 0.2, -20, i * 0.18)); },
  dash() { noiseBurst(0.15, 0.15, 2500); }
};

// Hijazi-ish scale for desert flavor (double harmonic feel)
const SCALE = [0, 1, 4, 5, 7, 8, 11];
const BASE = 220; // A3
function noteFreq(deg) {
  const oct = Math.floor(deg / 7);
  return BASE * Math.pow(2, oct + SCALE[((deg % 7) + 7) % 7] / 12);
}

let melodyDeg = 4;
function scheduleMusic() {
  if (!ctx || !musicOn) return;
  const SPB = 60 / 96 / 2; // 96 bpm, eighth notes
  while (nextNoteTime < ctx.currentTime + 0.25) {
    const t = nextNoteTime, b = beatIndex;
    // bass drone every 4
    if (b % 8 === 0) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'triangle'; o.frequency.value = noteFreq(0) / 2;
      env(g, t, 0.05, SPB * 7, 0.18);
      o.connect(g).connect(musicGain); o.start(t); o.stop(t + SPB * 8);
    }
    // pluck melody (random walk)
    if (b % 2 === 0 && Math.random() < 0.75) {
      melodyDeg += Math.floor(Math.random() * 5) - 2;
      melodyDeg = Math.max(0, Math.min(13, melodyDeg));
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'square'; o.frequency.value = noteFreq(melodyDeg);
      env(g, t, 0.01, 0.18, 0.06);
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 2200;
      o.connect(f).connect(g).connect(musicGain); o.start(t); o.stop(t + 0.3);
    }
    // shaker
    if (b % 2 === 1) {
      const len = Math.floor(ctx.sampleRate * 0.05);
      const buf = ctx.createBuffer(1, len, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
      const src = ctx.createBufferSource(); src.buffer = buf;
      const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 6000;
      const g = ctx.createGain(); env(g, t, 0.003, 0.05, 0.05);
      src.connect(f).connect(g).connect(musicGain); src.start(t);
    }
    nextNoteTime += SPB;
    beatIndex++;
  }
}

export function startMusic() {
  ensureAudio();
  if (musicOn) return;
  musicOn = true;
  nextNoteTime = ctx.currentTime + 0.1;
  beatIndex = 0;
  musicTimer = setInterval(scheduleMusic, 80);
}
export function stopMusic() {
  musicOn = false;
  if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
}