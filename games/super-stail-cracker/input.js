import { clamp, normalize } from './utils.js';

export class Input {
  constructor(canvas, joystick, knob, dashButton, joystickTwo, knobTwo, dashButtonTwo, fireButton, fireButtonTwo) {
    this.canvas = canvas;
    this.keys = new Set();
    this.pointer = { x: 0, y: 0, down: false, active: false };
    this.joys = [{ x: 0, y: 0, active: false }, { x: 0, y: 0, active: false }];
    this.dashQueued = [false, false];
    this.fireTouch = [false, false];

    window.addEventListener('keydown', e => {
      this.keys.add(e.code);
      if (['Space', 'Enter', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    });
    window.addEventListener('keyup', e => this.keys.delete(e.code));

    const point = e => {
      const r = canvas.getBoundingClientRect();
      this.pointer.x = e.clientX - r.left;
      this.pointer.y = e.clientY - r.top;
      this.pointer.active = true;
    };
    canvas.addEventListener('pointermove', point);
    canvas.addEventListener('pointerdown', e => {
      point(e);
      if (e.pointerType === 'touch') return;
      this.pointer.down = true;
      canvas.setPointerCapture?.(e.pointerId);
    });
    canvas.addEventListener('pointerup', e => { if (e.pointerType !== 'touch') this.pointer.down = false; });
    canvas.addEventListener('pointercancel', () => { this.pointer.down = false; });

    this.bindJoystick(joystick, knob, 0);
    this.bindJoystick(joystickTwo, knobTwo, 1);
    this.bindDash(dashButton, 0);
    this.bindDash(dashButtonTwo, 1);
    this.bindFire(fireButton, 0);
    this.bindFire(fireButtonTwo, 1);
  }
  bindJoystick(el, knob, index) {
    const update = e => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      const d = Math.min(Math.hypot(dx, dy), r.width * .34), n = normalize(dx, dy);
      this.joys[index].x = n.x * d / (r.width * .34);
      this.joys[index].y = n.y * d / (r.width * .34);
      knob.style.transform = `translate(${this.joys[index].x * 33}px, ${this.joys[index].y * 33}px)`;
    };
    el.addEventListener('pointerdown', e => { e.preventDefault(); this.joys[index].active = true; el.setPointerCapture?.(e.pointerId); update(e); });
    el.addEventListener('pointermove', e => { if (this.joys[index].active) update(e); });
    const release = () => { this.joys[index].active = false; this.joys[index].x = 0; this.joys[index].y = 0; knob.style.transform = 'translate(0, 0)'; };
    el.addEventListener('pointerup', release);
    el.addEventListener('pointercancel', release);
  }
  bindDash(el, index) {
    el.addEventListener('pointerdown', e => { e.preventDefault(); this.dashQueued[index] = true; });
  }
  bindFire(el, index) {
    const press = e => { e.preventDefault(); this.fireTouch[index] = true; };
    const release = () => { this.fireTouch[index] = false; };
    el.addEventListener('pointerdown', press);
    el.addEventListener('pointerup', release);
    el.addEventListener('pointercancel', release);
    el.addEventListener('pointerleave', release);
  }
  getMove(index = 0) {
    let x = 0, y = 0;
    if (index === 0) {
      if (this.keys.has('KeyA')) x -= 1;
      if (this.keys.has('KeyD')) x += 1;
      if (this.keys.has('KeyW')) y -= 1;
      if (this.keys.has('KeyS')) y += 1;
    } else {
      if (this.keys.has('ArrowLeft')) x -= 1;
      if (this.keys.has('ArrowRight')) x += 1;
      if (this.keys.has('ArrowUp')) y -= 1;
      if (this.keys.has('ArrowDown')) y += 1;
    }
    x += this.joys[index].x;
    y += this.joys[index].y;
    return normalize(clamp(x, -1, 1), clamp(y, -1, 1));
  }
  isFiring(index = 0) {
    return index === 0
      ? this.pointer.down || this.keys.has('Space') || this.fireTouch[0]
      : this.keys.has('Enter') || this.keys.has('Numpad0') || this.fireTouch[1];
  }
  getAim(x, y, index, enemies = []) {
    if (index === 0) {
      const n = normalize(this.pointer.x - x, this.pointer.y - y);
      return n.x || n.y ? n : { x: 1, y: 0 };
    }
    let ax = 0, ay = 0;
    if (this.keys.has('KeyJ') || this.keys.has('Numpad4')) ax -= 1;
    if (this.keys.has('KeyL') || this.keys.has('Numpad6')) ax += 1;
    if (this.keys.has('KeyI') || this.keys.has('Numpad8')) ay -= 1;
    if (this.keys.has('KeyK') || this.keys.has('Numpad5') || this.keys.has('Numpad2')) ay += 1;
    const manual = normalize(ax, ay);
    if (manual.x || manual.y) return manual;
    let target = null, best = Infinity;
    for (const enemy of enemies) {
      if (enemy.hp <= 0) continue;
      const d = (enemy.x - x) ** 2 + (enemy.y - y) ** 2;
      if (d < best) { best = d; target = enemy; }
    }
    return target ? normalize(target.x - x, target.y - y) : { x: 1, y: 0 };
  }
  consumeDash(index = 0) {
    const keyboard = index === 0 ? this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') : this.keys.has('ShiftRight');
    const value = this.dashQueued[index] || keyboard;
    this.dashQueued[index] = false;
    return value;
  }
}