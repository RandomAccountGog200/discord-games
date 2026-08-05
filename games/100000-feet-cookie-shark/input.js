export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.buttons = new Set();
    this.pointer = { down: false, x: 0, y: 0 };
    window.addEventListener('keydown', e => {
      this.keys.add(e.code);
      if (['Space','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.code)) e.preventDefault();
    });
    window.addEventListener('keyup', e => this.keys.delete(e.code));
    canvas.addEventListener('pointerdown', e => {
      this.pointer.down = true;
      this.updatePointer(e);
      canvas.setPointerCapture?.(e.pointerId);
    });
    canvas.addEventListener('pointermove', e => this.updatePointer(e));
    canvas.addEventListener('pointerup', e => { this.pointer.down = false; canvas.releasePointerCapture?.(e.pointerId); });
    canvas.addEventListener('pointercancel', () => this.pointer.down = false);
    document.querySelectorAll('[data-control]').forEach(button => {
      const control = button.dataset.control;
      const down = e => { e.preventDefault(); this.buttons.add(control); };
      const up = e => { e.preventDefault(); this.buttons.delete(control); };
      button.addEventListener('pointerdown', down);
      button.addEventListener('pointerup', up);
      button.addEventListener('pointercancel', up);
      button.addEventListener('pointerleave', up);
    });
  }
  updatePointer(e) {
    const r = this.canvas.getBoundingClientRect();
    this.pointer.x = e.clientX - r.left;
    this.pointer.y = e.clientY - r.top;
  }
  axis() {
    let value = 0;
    if (this.keys.has('ArrowLeft') || this.keys.has('KeyA') || this.buttons.has('left')) value -= 1;
    if (this.keys.has('ArrowRight') || this.keys.has('KeyD') || this.buttons.has('right')) value += 1;
    if (this.pointer.down && !this.buttons.has('fire')) {
      value = this.pointer.x < this.canvas.clientWidth * .45 ? -1 : this.pointer.x > this.canvas.clientWidth * .55 ? 1 : 0;
    }
    return value;
  }
  fire() { return this.keys.has('Space') || this.keys.has('Enter') || this.buttons.has('fire') || this.pointer.down; }
  boost() { return this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') || this.keys.has('KeyB') || this.buttons.has('boost'); }
}