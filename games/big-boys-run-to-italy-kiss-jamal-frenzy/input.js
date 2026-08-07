export class InputController {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.pointer = { active: false, x: 0, y: 0 };
    this.joystick = { x: 0, y: 0, active: false };
    this.dashQueued = false;
    this.bindKeyboard();
    this.bindPointer();
  }

  bindKeyboard() {
    window.addEventListener('keydown', (event) => {
      const key = event.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'shift', 'w', 'a', 's', 'd'].includes(key)) event.preventDefault();
      this.keys.add(key);
      if (key === ' ' || key === 'shift') this.dashQueued = true;
    });
    window.addEventListener('keyup', (event) => this.keys.delete(event.key.toLowerCase()));
    window.addEventListener('blur', () => this.reset());
  }

  canvasPoint(event) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * this.canvas.width / rect.width,
      y: (event.clientY - rect.top) * this.canvas.height / rect.height
    };
  }

  bindPointer() {
    this.canvas.addEventListener('pointerdown', (event) => {
      if (event.pointerType === 'mouse' || event.pointerType === 'pen') {
        const p = this.canvasPoint(event);
        this.pointer = { active: true, x: p.x, y: p.y };
        this.canvas.setPointerCapture?.(event.pointerId);
      }
    });
    this.canvas.addEventListener('pointermove', (event) => {
      if (this.pointer.active) {
        const p = this.canvasPoint(event);
        this.pointer.x = p.x;
        this.pointer.y = p.y;
      }
    });
    const release = () => { this.pointer.active = false; };
    this.canvas.addEventListener('pointerup', release);
    this.canvas.addEventListener('pointercancel', release);
  }

  bindTouchControls(joystickElement, knobElement, dashButton) {
    let touchId = null;
    const updateStick = (event) => {
      const rect = joystickElement.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const limit = rect.width * .34;
      let x = event.clientX - cx;
      let y = event.clientY - cy;
      const length = Math.hypot(x, y) || 1;
      if (length > limit) { x *= limit / length; y *= limit / length; }
      this.joystick.x = x / limit;
      this.joystick.y = y / limit;
      knobElement.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
    };
    const endStick = (event) => {
      if (touchId === null || (event.changedTouches && ![...event.changedTouches].some(t => t.identifier === touchId))) return;
      touchId = null;
      this.joystick.x = 0; this.joystick.y = 0; this.joystick.active = false;
      knobElement.style.transform = 'translate(-50%, -50%)';
    };
    joystickElement.addEventListener('touchstart', (event) => {
      event.preventDefault();
      const touch = event.changedTouches[0];
      touchId = touch.identifier;
      this.joystick.active = true;
      updateStick(touch);
    }, { passive: false });
    joystickElement.addEventListener('touchmove', (event) => {
      event.preventDefault();
      const touch = [...event.changedTouches].find(t => t.identifier === touchId);
      if (touch) updateStick(touch);
    }, { passive: false });
    joystickElement.addEventListener('touchend', endStick, { passive: false });
    joystickElement.addEventListener('touchcancel', endStick, { passive: false });
    dashButton.addEventListener('touchstart', (event) => { event.preventDefault(); this.dashQueued = true; }, { passive: false });
    dashButton.addEventListener('mousedown', () => { this.dashQueued = true; });
  }

  getMove(player) {
    let x = 0, y = 0;
    if (this.keys.has('a') || this.keys.has('arrowleft')) x -= 1;
    if (this.keys.has('d') || this.keys.has('arrowright')) x += 1;
    if (this.keys.has('w') || this.keys.has('arrowup')) y -= 1;
    if (this.keys.has('s') || this.keys.has('arrowdown')) y += 1;
    if (x === 0 && y === 0 && this.joystick.active) { x = this.joystick.x; y = this.joystick.y; }
    if (x === 0 && y === 0 && this.pointer.active) { x = this.pointer.x - player.x; y = this.pointer.y - player.y; }
    const length = Math.hypot(x, y);
    return length > 0 ? { x: x / length, y: y / length, strength: Math.min(1, length) } : { x: 0, y: 0, strength: 0 };
  }

  consumeDash() {
    const value = this.dashQueued;
    this.dashQueued = false;
    return value;
  }

  reset() {
    this.keys.clear();
    this.pointer.active = false;
    this.joystick.active = false;
    this.joystick.x = 0; this.joystick.y = 0;
    this.dashQueued = false;
  }
}