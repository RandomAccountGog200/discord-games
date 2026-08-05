export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.virtual = { x: 0, y: 0 };
    this.actionQueued = false;
    this.pointer = { x: 480, y: 300 };
    this.joyTouch = null;
    this.bindKeyboard();
    this.bindPointer();
    this.bindTouch();
  }

  bindKeyboard() {
    window.addEventListener('keydown', e => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) e.preventDefault();
      this.keys.add(e.code);
      if (e.code === 'Space') this.actionQueued = true;
    });
    window.addEventListener('keyup', e => this.keys.delete(e.code));
  }

  mapPointer(e) {
    const rect = this.canvas.getBoundingClientRect();
    this.pointer.x = (e.clientX - rect.left) * 960 / rect.width;
    this.pointer.y = (e.clientY - rect.top) * 600 / rect.height;
  }

  bindPointer() {
    this.canvas.addEventListener('pointermove', e => this.mapPointer(e));
    this.canvas.addEventListener('pointerdown', e => {
      this.mapPointer(e);
      if (e.pointerType === 'mouse') this.actionQueued = true;
    });
  }

  bindTouch() {
    const joy = document.querySelector('#joystick');
    const knob = document.querySelector('#joystick-knob');
    const action = document.querySelector('#touch-action');
    const setJoy = e => {
      const rect = joy.getBoundingClientRect();
      const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
      const max = rect.width * .34;
      let dx = e.clientX - cx, dy = e.clientY - cy;
      const len = Math.hypot(dx, dy);
      if (len > max) { dx *= max / len; dy *= max / len; }
      this.virtual.x = dx / max; this.virtual.y = dy / max;
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
    };
    joy.addEventListener('pointerdown', e => { this.joyTouch = e.pointerId; joy.setPointerCapture(e.pointerId); setJoy(e); });
    joy.addEventListener('pointermove', e => { if (e.pointerId === this.joyTouch) setJoy(e); });
    const reset = e => { if (e.pointerId === this.joyTouch) { this.joyTouch = null; this.virtual.x = 0; this.virtual.y = 0; knob.style.transform = ''; } };
    joy.addEventListener('pointerup', reset); joy.addEventListener('pointercancel', reset);
    action.addEventListener('pointerdown', e => { e.preventDefault(); this.actionQueued = true; });
  }

  getMove() {
    let x = this.virtual.x, y = this.virtual.y;
    if (this.keys.has('ArrowLeft') || this.keys.has('KeyA')) x -= 1;
    if (this.keys.has('ArrowRight') || this.keys.has('KeyD')) x += 1;
    if (this.keys.has('ArrowUp') || this.keys.has('KeyW')) y -= 1;
    if (this.keys.has('ArrowDown') || this.keys.has('KeyS')) y += 1;
    const length = Math.hypot(x, y);
    return length > 1 ? { x: x / length, y: y / length } : { x, y };
  }

  consumeAction() {
    const result = this.actionQueued;
    this.actionQueued = false;
    return result;
  }

  getAim() {
    return { x: this.pointer.x, y: this.pointer.y };
  }
}