export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.pressedKeys = new Set();
    this.tapHandler = null;
    window.addEventListener('keydown', (event) => {
      if (!event.repeat) this.pressedKeys.add(event.code);
      this.keys.add(event.code);
      if (['Space', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.code)) event.preventDefault();
    });
    window.addEventListener('keyup', (event) => this.keys.delete(event.code));
    canvas.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const x = (event.clientX - rect.left) * 1280 / rect.width;
      const y = (event.clientY - rect.top) * 720 / rect.height;
      if (this.tapHandler) this.tapHandler(x, y);
    }, { passive: false });
  }
  onCanvasTap(handler) { this.tapHandler = handler; }
  consume(code) {
    if (this.pressedKeys.has(code)) {
      this.pressedKeys.delete(code);
      return true;
    }
    return false;
  }
  bindButton(element, callback) {
    element.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      callback();
    }, { passive: false });
  }
}