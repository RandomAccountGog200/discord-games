export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.justPressed = new Set();
    this.canvas = canvas;
    this.actionQueued = false;
    window.addEventListener('keydown', e => {
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ','e','q','1','2','3','4','5','Escape'].includes(k)) e.preventDefault();
      if (!this.keys.has(k)) this.justPressed.add(k);
      this.keys.add(k);
    });
    window.addEventListener('keyup', e => this.keys.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key));
    canvas.addEventListener('pointerdown', e => {
      if (e.pointerType === 'mouse') this.actionQueued = true;
    });
    document.querySelectorAll('[data-key]').forEach(btn => {
      const key = btn.dataset.key;
      const down = e => { e.preventDefault(); this.keys.add(key); };
      const up = e => { e.preventDefault(); this.keys.delete(key); };
      btn.addEventListener('pointerdown', down); btn.addEventListener('pointerup', up); btn.addEventListener('pointercancel', up); btn.addEventListener('pointerleave', up);
    });
    document.querySelectorAll('[data-action="interact"]').forEach(btn => btn.addEventListener('pointerdown', e => { e.preventDefault(); this.actionQueued = true; }));
  }
  isDown(...names) { return names.some(n => this.keys.has(n)); }
  pressed(...names) { return names.some(n => this.justPressed.has(n)); }
  queueAction() { this.actionQueued = true; }
  consumeAction() { const result = this.actionQueued || this.pressed(' ','e'); this.actionQueued = false; return result; }
  endFrame() { this.justPressed.clear(); }
}