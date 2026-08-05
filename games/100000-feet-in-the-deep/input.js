export class Input {
  constructor() {
    this.keys = new Set();
    this.buttons = new Set();
    this.dashQueued = false;
    this.pauseQueued = false;
    const keyMap = {ArrowUp:'up', w:'up', W:'up', ArrowDown:'down', s:'down', S:'down', ArrowLeft:'left', a:'left', A:'left', ArrowRight:'right', d:'right', D:'right'};
    window.addEventListener('keydown', e => {
      if (keyMap[e.key]) { this.keys.add(keyMap[e.key]); e.preventDefault(); }
      if (e.key === ' ' || e.key === 'Shift') { if (!e.repeat) this.dashQueued = true; e.preventDefault(); }
      if (e.key.toLowerCase() === 'p' || e.key === 'Escape') { if (!e.repeat) this.pauseQueued = true; }
    });
    window.addEventListener('keyup', e => { if (keyMap[e.key]) this.keys.delete(keyMap[e.key]); });
    ['up','down','left','right','dash'].forEach(name => {
      const el = document.querySelector(`[data-control="${name}"]`);
      if (!el) return;
      const down = ev => { ev.preventDefault(); this.buttons.add(name); if (name === 'dash') this.dashQueued = true; };
      const up = ev => { ev.preventDefault(); this.buttons.delete(name); };
      el.addEventListener('pointerdown', down);
      el.addEventListener('pointerup', up);
      el.addEventListener('pointercancel', up);
      el.addEventListener('pointerleave', up);
    });
  }
  axis() {
    const held = n => this.keys.has(n) || this.buttons.has(n);
    return { x: (held('right') ? 1 : 0) - (held('left') ? 1 : 0), y: (held('down') ? 1 : 0) - (held('up') ? 1 : 0) };
  }
  consumeDash() { const value = this.dashQueued; this.dashQueued = false; return value; }
  consumePause() { const value = this.pauseQueued; this.pauseQueued = false; return value; }
}