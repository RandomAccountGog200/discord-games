export class Input {
  constructor(canvas, joystick, stick, dashButton) {
    this.keys = new Set();
    this.mouse = { x: 500, y: 325, down: false };
    this.joy = { x: 0, y: 0, active: false, id: null };
    this.dashRequested = false;
    window.addEventListener('keydown', e => {
      this.keys.add(e.key.toLowerCase());
      if (e.key === ' ' || e.key.toLowerCase() === 'shift') this.dashRequested = true;
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();
    });
    window.addEventListener('keyup', e => this.keys.delete(e.key.toLowerCase()));
    canvas.addEventListener('pointermove', e => {
      const r = canvas.getBoundingClientRect();
      this.mouse.x = (e.clientX - r.left) * 1000 / r.width;
      this.mouse.y = (e.clientY - r.top) * 650 / r.height;
      if (this.joy.active && e.pointerId === this.joy.id) this.updateJoy(e, joystick, stick);
    });
    canvas.addEventListener('pointerdown', e => { if (e.button === 0) this.mouse.down = true; });
    window.addEventListener('pointerup', e => {
      if (e.button === 0) this.mouse.down = false;
      if (e.pointerId === this.joy.id) this.resetJoy(joystick, stick);
    });
    joystick.addEventListener('pointerdown', e => {
      e.preventDefault(); this.joy.active = true; this.joy.id = e.pointerId; joystick.setPointerCapture(e.pointerId); this.updateJoy(e, joystick, stick);
    });
    dashButton.addEventListener('pointerdown', e => { e.preventDefault(); this.dashRequested = true; });
  }
  updateJoy(e, joystick, stick) {
    const r = joystick.getBoundingClientRect();
    let x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2);
    const len = Math.hypot(x, y), max = r.width * .31;
    if (len > max) { x *= max / len; y *= max / len; }
    this.joy.x = x / max; this.joy.y = y / max;
    stick.style.transform = `translate(${x}px, ${y}px)`;
  }
  resetJoy(joystick, stick) {
    this.joy.active = false; this.joy.id = null; this.joy.x = this.joy.y = 0; stick.style.transform = '';
  }
  axis(player) {
    let x = 0, y = 0;
    if (this.keys.has('a') || this.keys.has('arrowleft')) x -= 1;
    if (this.keys.has('d') || this.keys.has('arrowright')) x += 1;
    if (this.keys.has('w') || this.keys.has('arrowup')) y -= 1;
    if (this.keys.has('s') || this.keys.has('arrowdown')) y += 1;
    if (x === 0 && y === 0 && this.joy.active) { x = this.joy.x; y = this.joy.y; }
    if (x === 0 && y === 0 && this.mouse.down) { x = this.mouse.x - player.x; y = this.mouse.y - player.y; }
    const len = Math.hypot(x, y);
    return len > 1 ? { x: x / len, y: y / len, strength: 1 } : { x, y, strength: Math.min(1, len) };
  }
  consumeDash() { const v = this.dashRequested; this.dashRequested = false; return v; }
}