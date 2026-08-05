export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.buttons = new Set();
    this.pointer = { x:480, y:300 };
    this.fireHeld = false;
    this.dashPressed = false;
    this.pausePressed = false;
    window.addEventListener('keydown', e => {
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault();
      this.keys.add(e.code);
      if (e.code === 'Space') this.dashPressed = true;
      if (e.code === 'Escape') this.pausePressed = true;
    });
    window.addEventListener('keyup', e => this.keys.delete(e.code));
    canvas.addEventListener('pointermove', e => this.setPointer(e));
    canvas.addEventListener('pointerdown', e => { this.setPointer(e); this.fireHeld = true; canvas.setPointerCapture?.(e.pointerId); });
    canvas.addEventListener('pointerup', e => { this.fireHeld = false; canvas.releasePointerCapture?.(e.pointerId); });
    canvas.addEventListener('pointercancel', () => this.fireHeld = false);
    document.querySelectorAll('[data-key]').forEach(button => {
      const key = button.dataset.key;
      const down = e => { e.preventDefault(); this.buttons.add(key); if (key === 'dash') this.dashPressed = true; };
      const up = e => { e.preventDefault(); this.buttons.delete(key); };
      button.addEventListener('pointerdown', down);
      button.addEventListener('pointerup', up);
      button.addEventListener('pointercancel', up);
      button.addEventListener('pointerleave', up);
    });
  }
  setPointer(e) {
    const r = this.canvas.getBoundingClientRect();
    this.pointer.x = (e.clientX - r.left) * 960 / r.width;
    this.pointer.y = (e.clientY - r.top) * 600 / r.height;
  }
  getMove() {
    let x = 0, y = 0;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft') || this.buttons.has('left')) x--;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight') || this.buttons.has('right')) x++;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp') || this.buttons.has('up')) y--;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown') || this.buttons.has('down')) y++;
    const len = Math.hypot(x,y) || 1;
    return {x:x/len, y:y/len, active:x !== 0 || y !== 0};
  }
  firing() { return this.fireHeld || this.keys.has('KeyJ') || this.keys.has('Enter') || this.buttons.has('fire'); }
  consumeDash() { const v=this.dashPressed; this.dashPressed=false; return v; }
  consumePause() { const v=this.pausePressed; this.pausePressed=false; return v; }
}