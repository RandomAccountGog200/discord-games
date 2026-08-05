export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.virtual = new Set();
    this.pointerActive = false;
    this.pointerY = 0;
    this.pauseFlag = false;
    window.addEventListener('keydown', (e) => {
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space','KeyW','KeyA','KeyS','KeyD'].includes(e.code)) e.preventDefault();
      this.keys.add(e.code);
      if (e.code === 'Escape' && !e.repeat) this.pauseFlag = true;
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    const position = (e) => {
      const r = canvas.getBoundingClientRect();
      this.pointerY = e.clientY - r.top;
    };
    canvas.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      this.pointerActive = true;
      canvas.setPointerCapture?.(e.pointerId);
      position(e);
    });
    canvas.addEventListener('pointermove', (e) => { if (this.pointerActive) position(e); });
    const release = () => { this.pointerActive = false; };
    canvas.addEventListener('pointerup', release);
    canvas.addEventListener('pointercancel', release);
    window.addEventListener('blur', () => { this.keys.clear(); this.virtual.clear(); this.pointerActive = false; });
    document.querySelectorAll('[data-control]').forEach((button) => {
      const control = button.dataset.control;
      const on = (e) => { e.preventDefault(); this.virtual.add(control); };
      const off = (e) => { e.preventDefault(); this.virtual.delete(control); };
      button.addEventListener('pointerdown', on);
      button.addEventListener('pointerup', off);
      button.addEventListener('pointercancel', off);
      button.addEventListener('pointerleave', off);
    });
  }
  up() { return this.keys.has('ArrowUp') || this.keys.has('KeyW') || this.virtual.has('up'); }
  down() { return this.keys.has('ArrowDown') || this.keys.has('KeyS') || this.virtual.has('down'); }
  boost() { return this.keys.has('Space') || this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') || this.virtual.has('boost'); }
  vertical(planeY) {
    let v = (this.down() ? 1 : 0) - (this.up() ? 1 : 0);
    if (!v && this.pointerActive) {
      const d = this.pointerY - planeY;
      if (Math.abs(d) > 14) v = Math.sign(d);
    }
    return v;
  }
  consumePause() { const value = this.pauseFlag; this.pauseFlag = false; return value; }
}