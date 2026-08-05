let ctx = null;
let master = null;
let muted = false;
let musicTimer = null;
let step = 0;

function ac() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function initAudio() { ac(); }

function env(g, t, a, d, vol) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
}

function tone(freq, dur, type = 'sine', vol = 0.3, slide = 0, delay = 0) {
  const c = ac();
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  const t = c.currentTime + delay;
  o.frequency.setValueAtTime(Math.max(20, freq), t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t + dur);
  env(g, t, 0.01, dur, vol);
  o.connect(g); g.connect(master);
  o.start(t); o.stop(t + dur + 0.15);
}

function noise(dur, vol = 0.2, filterFreq = 1000, delay = 0) {
  const c = ac();
  const len = Math.max(1, Math.floor(c.sampleRate * dur));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const s = c.createBufferSource();
  s.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = filterFreq;
  const g = c.createGain();
  env(g, c.currentTime + delay, 0.005, dur, vol);
  s.connect(f); f.connect(g); g.connect(master);
  s.start(c.currentTime + delay);
}

export function sfx(name) {
  if (muted) return;
  try {
    switch (name) {
      case 'click':   tone(700, 0.06, 'square', 0.12); break;
      case 'buy':     tone(520, 0.07, 'square', 0.15); tone(780, 0.09, 'square', 0.15, 0, 0.07); break;
      case 'pick':    tone(480, 0.07, 'triangle', 0.2); break;
      case 'serve':   tone(600, 0.08, 'triangle', 0.22); tone(900, 0.12, 'triangle', 0.22, 0, 0.08); break;
      case 'coin':    tone(1250, 0.06, 'square', 0.16); tone(1650, 0.1, 'square', 0.14, 0, 0.06); break;
      case 'angry':   tone(300, 0.3, 'sawtooth', 0.25, -180); break;
      case 'bad':     tone(160, 0.2, 'sawtooth', 0.22, -60); break;
      case 'rat':     tone(1400, 0.08, 'square', 0.14, 500); tone(1600, 0.08, 'square', 0.12, 400, 0.09); break;
      case 'squash':  noise(0.12, 0.3, 500); tone(120, 0.1, 'sine', 0.25, -40); break;
      case 'fire':    noise(0.4, 0.22, 400); break;
      case 'ext':     noise(0.25, 0.3, 2500); break;
      case 'clean':   tone(950, 0.07, 'triangle', 0.2); break;
      case 'alarm':   tone(880, 0.12, 'square', 0.16); tone(880, 0.12, 'square', 0.16, 0, 0.18); break;
      case 'dayend':  tone(523, 0.12, 'triangle', 0.22); tone(659, 0.12, 'triangle', 0.22, 0, 0.12); tone(784, 0.12, 'triangle', 0.22, 0, 0.24); tone(1047, 0.25, 'triangle', 0.24, 0, 0.36); break;
      case 'gameover': tone(400, 0.25, 'sawtooth', 0.22, -80); tone(300, 0.25, 'sawtooth', 0.22, -80, 0.25); tone(200, 0.5, 'sawtooth', 0.24, -100, 0.5); break;
    }
  } catch (e) { /* audio not ready */ }
}

const SCALE = [523, 587, 659, 784, 880, 1047];
const MELODY = [0, 2, 4, 3, 5, 4, 2, 1, 0, 2, 3, 4, 3, 2, 1, 0];
const BASS = [131, 131, 165, 196];

export function startMusic() {
  if (musicTimer) return;
  step = 0;
  musicTimer = setInterval(() => {
    if (muted) return;
    try {
      const n = MELODY[step % MELODY.length];
      tone(SCALE[n], 0.16, 'triangle', 0.07);
      if (step % 4 === 0) tone(BASS[(step / 4) % BASS.length | 0], 0.3, 'sine', 0.1);
      if (step % 8 === 6) tone(SCALE[(n + 2) % SCALE.length], 0.1, 'triangle', 0.05);
      step++;
    } catch (e) { /* ignore */ }
  }, 190);
}

export function stopMusic() {
  if (musicTimer) { clearInterval(musicTimer); musicTimer = null; }
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

export function isMuted() { return muted; }