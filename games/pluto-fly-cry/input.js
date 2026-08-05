export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.thrust = false;
    this.cryPressed = false;
    this.pausePressed = false;
    this.pointerThrust = false;
    this.keys = new Set();

    window.addEventListener('keydown', (event) => {
      if (['Space', 'ArrowUp', 'KeyW', 'KeyC', 'Escape'].includes(event.code)) event.preventDefault();
      this.keys.add(event.code);
      if (event.code === 'Space' || event.code === 'ArrowUp' || event.code === 'KeyW') this.thrust = true;
      if (event.code === 'KeyC' && !event.repeat) this.cryPressed = true;
      if (event.code === 'Escape' && !event.repeat) this.pausePressed = true;
    });
    window.addEventListener('keyup', (event) => {
      this.keys.delete(event.code);
      if (event.code === 'Space' || event.code === 'ArrowUp' || event.code === 'KeyW') this.thrust = false;
    });
    canvas.addEventListener('pointerdown', (event) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      this.pointerThrust = true;
      this.thrust = true;
      canvas.setPointerCapture?.(event.pointerId);
    });
    const endPointer = () => {
      this.pointerThrust = false;
      this.thrust = this.keys.has('Space') || this.keys.has('ArrowUp') || this.keys.has('KeyW');
    };
    canvas.addEventListener('pointerup', endPointer);
    canvas.addEventListener('pointercancel', endPointer);
    canvas.addEventListener('pointerleave', (event) => { if (event.pointerType === 'mouse') endPointer(); });
  }

  bindHoldButton(button) {
    const down = (event) => {
      event.preventDefault();
      this.pointerThrust = true;
      this.thrust = true;
    };
    const up = (event) => {
      event.preventDefault();
      this.pointerThrust = false;
      this.thrust = this.keys.has('Space') || this.keys.has('ArrowUp') || this.keys.has('KeyW');
    };
    button.addEventListener('pointerdown', down);
    button.addEventListener('pointerup', up);
    button.addEventListener('pointercancel', up);
    button.addEventListener('pointerleave', up);
  }

  requestCry() { this.cryPressed = true; }
  consumeCry() { const value = this.cryPressed; this.cryPressed = false; return value; }
  consumePause() { const value = this.pausePressed; this.pausePressed = false; return value; }
  clear() { this.thrust = false; this.pointerThrust = false; this.cryPressed = false; this.pausePressed = false; this.keys.clear(); }
}