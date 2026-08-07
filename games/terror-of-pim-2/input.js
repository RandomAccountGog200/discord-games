export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.pointer = { x: 480, y: 270, down: false, active: false };
    this.joystick = { x: 0, y: 0, active: false };
    this.fireButton = false;
    this.dashQueued = false;
    this.pauseQueued = false;
    this.bindKeyboard();
    this.bindPointer();
    this.bindTouchControls();
  }

  position(event) {
    const rect = this.canvas.getBoundingClientRect();
    return { x: (event.clientX - rect.left) * 960 / rect.width, y: (event.clientY - rect.top) * 540 / rect.height };
  }

  bindKeyboard() {
    window.addEventListener('keydown', e => {
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ','p','P'].includes(e.key)) e.preventDefault();
      this.keys.add(e.key.toLowerCase());
      if (e.key.toLowerCase() === 'p' && !e.repeat) this.pauseQueued = true;
      if (e.key === ' ' && !e.repeat) this.dashQueued = true;
    });
    window.addEventListener('keyup', e => this.keys.delete(e.key.toLowerCase()));
    window.addEventListener('blur', () => { this.keys.clear(); this.pointer.down = false; this.fireButton = false; });
  }

  bindPointer() {
    this.canvas.addEventListener('pointermove', e => { this.pointer = { ...this.position(e), down: this.pointer.down, active: true }; });
    this.canvas.addEventListener('pointerdown', e => {
      if (e.pointerType === 'mouse') this.pointer.down = true;
      this.pointer = { ...this.position(e), down: this.pointer.down || e.pointerType !== 'mouse', active: true };
      this.canvas.setPointerCapture?.(e.pointerId);
    });
    this.canvas.addEventListener('pointerup', e => { if (e.pointerType === 'mouse') this.pointer.down = false; });
    this.canvas.addEventListener('pointercancel', () => { this.pointer.down = false; });
  }

  bindTouchControls() {
    const stick = document.getElementById('joystick');
    const knob = document.getElementById('joystick-knob');
    const setStick = e => {
      const t = e.touches ? e.touches[0] : e;
      const r = stick.getBoundingClientRect();
      let x = t.clientX - (r.left + r.width / 2), y = t.clientY - (r.top + r.height / 2);
      const max = r.width * .34, length = Math.hypot(x, y);
      if (length > max) { x *= max / length; y *= max / length; }
      this.joystick = { x: x / max, y: y / max, active: true };
      knob.style.transform = `translate(${x}px, ${y}px)`;
      e.preventDefault?.();
    };
    const clearStick = e => { this.joystick = { x:0, y:0, active:false }; knob.style.transform = ''; e?.preventDefault?.(); };
    stick.addEventListener('pointerdown', e => { stick.setPointerCapture?.(e.pointerId); setStick(e); });
    stick.addEventListener('pointermove', e => { if (this.joystick.active) setStick(e); });
    stick.addEventListener('pointerup', clearStick); stick.addEventListener('pointercancel', clearStick);
    const fire = document.getElementById('fire-button');
    fire.addEventListener('pointerdown', e => { this.fireButton = true; e.preventDefault(); });
    fire.addEventListener('pointerup', e => { this.fireButton = false; e.preventDefault(); });
    fire.addEventListener('pointercancel', () => this.fireButton = false);
    const dash = document.getElementById('dash-button');
    dash.addEventListener('pointerdown', e => { this.dashQueued = true; e.preventDefault(); });
  }

  movement() {
    let x = 0, y = 0;
    if (this.keys.has('a') || this.keys.has('arrowleft')) x -= 1;
    if (this.keys.has('d') || this.keys.has('arrowright')) x += 1;
    if (this.keys.has('w') || this.keys.has('arrowup')) y -= 1;
    if (this.keys.has('s') || this.keys.has('arrowdown')) y += 1;
    if (this.joystick.active) { x = this.joystick.x; y = this.joystick.y; }
    const l = Math.hypot(x,y);
    return l > 1 ? {x:x/l,y:y/l} : {x,y};
  }

  firing() { return this.pointer.down || this.fireButton || this.keys.has('enter'); }
  consumeDash() { const v = this.dashQueued; this.dashQueued = false; return v; }
  consumePause() { const v = this.pauseQueued; this.pauseQueued = false; return v; }
  aim(px, py, enemies) {
    if (this.pointer.active && (this.pointer.down || !this.joystick.active)) return { x:this.pointer.x, y:this.pointer.y };
    let closest = null, dist = Infinity;
    for (const e of enemies) { const d = (e.x-px)**2+(e.y-py)**2; if (d < dist) { dist=d; closest=e; } }
    return closest ? {x:closest.x,y:closest.y} : {x:px+1,y:py};
  }
}