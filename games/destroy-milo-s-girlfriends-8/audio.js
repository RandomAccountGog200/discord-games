// audio.js - Procedural sound effects using Web Audio API

export class AudioManager {
    constructor() {
        this.audioCtx = null;
        this.masterGain = null;
        this.enabled = true;
    }

    init() {
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioCtx.createGain();
            this.masterGain.gain.value = 0.5;
            this.masterGain.connect(this.audioCtx.destination);
        }
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
    }

    playTone(freq, duration, type = 'sine', volume = 0.3, delay = 0, falloff = 0.001) {
        if (!this.enabled || !this.audioCtx) return;
        const t = this.audioCtx.currentTime + delay;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(volume, t);
        gain.gain.exponentialRampToValueAtTime(falloff, t + duration);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + duration + 0.1);
    }

    shoot() { this.playTone(880, 0.1, 'square', 0.15); }
    hit() { this.playTone(300, 0.05, 'sawtooth', 0.2); }
    explosion() {
        this.playTone(120, 0.3, 'sawtooth', 0.4);
        this.playTone(70, 0.5, 'sawtooth', 0.3, 0.1);
    }
    playerHit() {
        this.playTone(50, 0.4, 'sawtooth', 0.5);
        this.playTone(30, 0.5, 'sine', 0.4, 0.1);
    }
    levelUp() {
        this.playTone(523.25, 0.1, 'square', 0.3);
        this.playTone(659.25, 0.1, 'square', 0.3, 0.1);
        this.playTone(783.99, 0.2, 'square', 0.3, 0.2);
    }
    gameOver() {
        this.playTone(200, 0.2, 'sawtooth', 0.4);
        this.playTone(150, 0.3, 'sawtooth', 0.4, 0.2);
        this.playTone(100, 0.5, 'sawtooth', 0.4, 0.4);
    }
    click() { this.playTone(500, 0.05, 'square', 0.2); }

    // Background music loop (simple bass line)
    startMusic() {
        if (!this.audioCtx) return;
        this.musicInterval = setInterval(() => {
            this.playTone(55, 0.2, 'sawtooth', 0.1, 0);
            this.playTone(110, 0.2, 'sawtooth', 0.05, 0.1);
        }, 500);
    }

    stopMusic() {
        if (this.musicInterval) clearInterval(this.musicInterval);
        this.musicInterval = null;
    }
}