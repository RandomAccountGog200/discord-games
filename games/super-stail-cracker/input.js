import { clamp, normalize } from './utils.js';

export class Input {
  constructor(canvas, joystick, knob, dashButton) {
    this.canvas = canvas; this.keys = new Set(); this.pointer = { x: 0, y: 0, down: false, active: false };
    this.joy = { x: 0, y: 0, active: false }; this.dashQueued = false;
    window.addEventListener('keydown', e => { this.keys.add(e.code); if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) e.preventDefault(); });
    window.addEventListener('keyup', e => this.keys.delete(e.code));
    const point = e => { const r = canvas.getBoundingClientRect(); this.pointer.x = e.clientX - r.left; this.pointer.y = e.clientY - r.top; this.pointer.active = true; };
    canvas.addEventListener('pointermove', point);
    canvas.addEventListener('pointerdown', e => { point(e); if (e.pointerType === 'touch' && this.pointer.x < canvas.clientWidth * .43) return; this.pointer.down = true; canvas.setPointerCapture?.(e.pointerId); });
    canvas.addEventListener('pointerup', e => { if (e.pointerType !== 'touch') this.pointer.down = false; });
    canvas.addEventListener('pointercancel', () => { this.pointer.down = false; });
    joystick.addEventListener('pointerdown', e => { this.joy.active = true; joystick.setPointerCapture?.(e.pointerId); this.updateJoystick(e, joystick, knob); });
    joystick.addEventListener('pointermove', e => { if (this.joy.active) this.updateJoystick(e, joystick, knob); });
    const releaseJoy = () => { this.joy.active = false; this.joy.x = 0; this.joy.y = 0; knob.style.transform = 'translate(0, 0)'; };
    joystick.addEventListener('pointerup', releaseJoy); joystick.addEventListener('pointercancel', releaseJoy);
    dashButton.addEventListener('pointerdown', e => { e.preventDefault(); this.dashQueued = true; });
  }
  updateJoystick(e, el, knob) {
    const r = el.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    const d = Math.min(Math.hypot(dx, dy), r.width * .34), n = normalize(dx, dy); this.joy.x = n.x * d / (r.width * .34); this.joy.y = n.y * d / (r.width * .34);
    knob.style.transform = `translate(${this.joy.x * 33}px, ${this.joy.y * 33}px)`;
  }
  getMove() {
    let x = 0, y = 0;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) x -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) x += 1;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) y -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) y += 1;
    x += this.joy.x; y += this.joy.y; return normalize(clamp(x, -1, 1), clamp(y, -1, 1));
  }
  isFiring() { return this.pointer.down || this.keys.has('Space'); }
  getAim(x, y) { const n = normalize(this.pointer.x - x, this.pointer.y - y); return n.x || n.y ? n : { x: 1, y: 0 }; }
  consumeDash() { const value = this.dashQueued || this.keys.has('ShiftLeft') || this.keys.has('ShiftRight'); this.dashQueued = false; return value; }
}