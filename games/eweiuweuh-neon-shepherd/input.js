export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.pointer = { x: 500, y: 325, down: false, active: false };
    this.touchMove = null;
    this.touchAim = null;
    this.hasTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    window.addEventListener('keydown', e => { this.keys.add(e.key.toLowerCase()); if ([' ', 'arrowup','arrowdown','arrowleft','arrowright'].includes(e.key.toLowerCase())) e.preventDefault(); });
    window.addEventListener('keyup', e => this.keys.delete(e.key.toLowerCase()));
    canvas.addEventListener('pointermove', e => { if (e.pointerType !== 'touch') this.setPointer(e); });
    canvas.addEventListener('pointerdown', e => { if (e.pointerType !== 'touch') { this.setPointer(e); this.pointer.down = true; } });
    window.addEventListener('pointerup', e => { if (e.pointerType !== 'touch') this.pointer.down = false; });
    canvas.addEventListener('touchstart', e => { e.preventDefault(); this.readTouches(e.touches); }, { passive:false });
    canvas.addEventListener('touchmove', e => { e.preventDefault(); this.readTouches(e.touches); }, { passive:false });
    canvas.addEventListener('touchend', e => { e.preventDefault(); this.readTouches(e.touches); }, { passive:false });
    canvas.addEventListener('touchcancel', e => this.readTouches(e.touches), { passive:false });
  }
  setPointer(e) {
    const r = this.canvas.getBoundingClientRect();
    this.pointer.x = (e.clientX - r.left) * 1000 / r.width;
    this.pointer.y = (e.clientY - r.top) * 650 / r.height;
    this.pointer.active = true;
  }
  touchPoint(t) {
    const r = this.canvas.getBoundingClientRect();
    return { x:(t.clientX-r.left)*1000/r.width, y:(t.clientY-r.top)*650/r.height };
  }
  readTouches(touches) {
    this.touchMove = null; this.touchAim = null;
    for (const t of touches) { const p = this.touchPoint(t); if (p.x < 500 && !this.touchMove) this.touchMove = p; else if (!this.touchAim) this.touchAim = p; }
  }
  movement() {
    let x = 0, y = 0;
    if (this.keys.has('a') || this.keys.has('arrowleft')) x -= 1;
    if (this.keys.has('d') || this.keys.has('arrowright')) x += 1;
    if (this.keys.has('w') || this.keys.has('arrowup')) y -= 1;
    if (this.keys.has('s') || this.keys.has('arrowdown')) y += 1;
    if (this.touchMove) { x = (this.touchMove.x - 120) / 70; y = (this.touchMove.y - 530) / 70; }
    const len = Math.hypot(x,y); return len > 1 ? {x:x/len,y:y/len} : {x,y};
  }
  aim(player) { return this.touchAim || (this.pointer.active ? {x:this.pointer.x,y:this.pointer.y} : {x:player.x+Math.cos(player.angle)*100,y:player.y+Math.sin(player.angle)*100}); }
  firing() { return this.pointer.down || this.keys.has(' ') || !!this.touchAim; }
}