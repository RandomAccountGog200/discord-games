// audio.js — procedural audio via WebAudio API

export class AudioManager {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.musicRunning = false;
        this.musicTimer = null;
        this.bassTimer = null;
        this.sfxGain = null;
        this.musicGain = null;
        this._melodyIdx = 0;
        this._bassIdx = 0;
    }

    init() {
        if (this.ctx) return;
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) { this.enabled = false; return; }
        this.ctx = new AC();

        const master = this.ctx.createGain();
        master.gain.value = 0.75;
        master.connect(this.ctx.destination);

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.value = 0.9;
        this.sfxGain.connect(master);

        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.value = 0.35;
        this.musicGain.connect(master);
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    }

    _tone(freq, dur, type = 'sine', vol = 0.3, slideTo = null, dest = null) {
        if (!this.ctx || !this.enabled) return;
        const t0 = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, t0);
        if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(slideTo, 20), t0 + dur);
        g.gain.setValueAtTime(vol, t0);
        g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
        osc.connect(g);
        g.connect(dest || this.sfxGain);
        osc.start(t0);
        osc.stop(t0 + dur);
    }

    _noise(dur, vol = 0.3, filterType = 'lowpass', freq = 800, q = 1, dest = null) {
        if (!this.ctx || !this.enabled) return;
        const t0 = this.ctx.currentTime;
        const buf = this.ctx.createBuffer(1, Math.max(1, Math.floor(this.ctx.sampleRate * dur)), this.ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
        const src = this.ctx.createBufferSource();
        src.buffer = buf;
        const filt = this.ctx.createBiquadFilter();
        filt.type = filterType;
        filt.frequency.value = freq;
        filt.Q.value = q;
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(vol, t0);
        g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
        src.connect(filt); filt.connect(g); g.connect(dest || this.sfxGain);
        src.start(t0);
    }

    // ---- SFX ----

    plant() {
        this._noise(0.08, 0.25, 'lowpass', 400);
        this._tone(120, 0.1, 'sine', 0.15, 80);
    }

    harvest() {
        this._tone(660, 0.12, 'triangle', 0.3, 1320);
        this._tone(990, 0.08, 'sine', 0.2, 1800);
    }

    tractorEat() {
        this._noise(0.15, 0.4, 'bandpass', 200, 0.5);
        this._tone(90, 0.2, 'sawtooth', 0.2, 60);
    }

    tractorDeath() {
        this._noise(0.3, 0.5, 'lowpass', 800);
        this._noise(0.2, 0.3, 'bandpass', 300, 1);
        this._tone(220, 0.3, 'sawtooth', 0.3, 40);
    }

    turretShot() {
        this._tone(1400, 0.05, 'square', 0.12, 900);
    }

    waveHorn() {
        this._tone(440, 0.3, 'sawtooth', 0.25, 440);
        this._tone(554, 0.3, 'sawtooth', 0.2, 554);
        this._noise(0.3, 0.15, 'highpass', 2000);
    }

    uiClick() {
        this._tone(880, 0.06, 'square', 0.15, 660);
    }

    buildDefense() {
        this._noise(0.1, 0.3, 'bandpass', 600, 2);
        this._tone(220, 0.15, 'triangle', 0.25, 440);
    }

    heartLost() {
        this._tone(300, 0.2, 'sawtooth', 0.3, 150);
        this._noise(0.15, 0.3, 'bandpass', 200);
    }

    gameOver() {
        this._tone(440, 0.4, 'sawtooth', 0.3, 220);
        this._tone(330, 0.4, 'sawtooth', 0.25, 165);
        this._tone(220, 0.6, 'sawtooth', 0.2, 110);
    }

    victory() {
        [523, 659, 784, 1046].forEach((f, i) => {
            setTimeout(() => this._tone(f, 0.3, 'triangle', 0.25), i * 120);
        });
    }

    // ---- Music ----

    startMusic() {
        if (this.musicRunning || !this.ctx) return;
        this.musicRunning = true;

        // Bass drone
        const bassNotes = [55, 55, 65.4, 73.4]; // A1, A1, C2, D2
        this._bassIdx = 0;
        this.bassTimer = setInterval(() => {
            const f = bassNotes[this._bassIdx % bassNotes.length];
            this._bassIdx++;
            this._tone(f, 1.2, 'triangle', 0.15, null, this.musicGain);
            if (this._bassIdx % 4 === 0) this._tone(f * 2, 0.6, 'sine', 0.06, null, this.musicGain);
        }, 1200);

        // Melody (minor folk feel)
        const melody = [
            220, 277, 330, 294, 330, 277, 247, 220,
            220, 277, 330, 392, 440, 392, 330, 277
        ];
        this._melodyIdx = 0;
        this.musicTimer = setInterval(() => {
            const f = melody[this._melodyIdx % melody.length];
            this._melodyIdx++;
            this._tone(f, 0.55, 'triangle', 0.1, null, this.musicGain);
            // Occasionally add a harmony note
            if (this._melodyIdx % 4 === 1) {
                this._tone(f * 1.5, 0.3, 'sine', 0.05, null, this.musicGain);
            }
        }, 550);
    }

    stopMusic() {
        this.musicRunning = false;
        if (this.musicTimer) clearInterval(this.musicTimer);
        if (this.bassTimer) clearInterval(this.bassTimer);
        this.musicTimer = null;
        this.bassTimer = null;
    }
}