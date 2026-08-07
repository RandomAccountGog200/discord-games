export class Input {
  constructor() {
    this.keys = new Set();
    this.actions = new Set();
    this.virtual = new Set();
    const down = (e) => {
      const key = e.key.toLowerCase();
      if (['arrowup','arrowdown','arrowleft','arrowright',' ','shift','escape','w','a','s','d','q'].includes(key)) e.preventDefault();
      this.keys.add(key);
      if (key === ' ' || key === 'q') this.actions.add('quack');
      if (key === 'escape') this.actions.add('pause');
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', e => this.keys.delete(e.key.toLowerCase()));
    document.querySelectorAll('[data-key]').forEach(button => {
      const key = button.dataset.key;
      const press = e => { e.preventDefault(); this.virtual.add(key); button.setPointerCapture?.(e.pointerId); };
      const release = e => { e.preventDefault(); this.virtual.delete(key); };
      button.addEventListener('pointerdown', press); button.addEventListener('pointerup', release);
      button.addEventListener('pointercancel', release); button.addEventListener('pointerleave', release);
    });
    document.getElementById('quackButton').addEventListener('pointerdown', e => { e.preventDefault(); this.actions.add('quack'); });
  }
  axis() {
    let x = 0, y = 0;
    if (this.keys.has('a') || this.keys.has('arrowleft') || this.virtual.has('left')) x--;
    if (this.keys.has('d') || this.keys.has('arrowright') || this.virtual.has('right')) x++;
    if (this.keys.has('w') || this.keys.has('arrowup') || this.virtual.has('up')) y--;
    if (this.keys.has('s') || this.keys.has('arrowdown') || this.virtual.has('down')) y++;
    const length = Math.hypot(x, y) || 1;
    return {x: x / length, y: y / length, moving: !!(x || y)};
  }
  sprinting() { return this.keys.has('shift') || this.virtual.has('sprint'); }
  consume(action) { if (!this.actions.has(action)) return false; this.actions.delete(action); return true; }
  clear() { this.actions.clear(); this.virtual.clear(); }
}