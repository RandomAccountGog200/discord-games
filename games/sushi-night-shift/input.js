export class Input {
  constructor(canvas) {
    this.canvas = canvas;
    this.mouse = { x: 0, y: 0, down: false, justPressed: false, rightJustPressed: false };
    this.touches = new Map();
    this.keyDown = new Set();
    this.keyJustPressed = new Set();
    this.pendingClicks = [];

    canvas.addEventListener('mousedown', (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      const scaleY = CANVAS_HEIGHT / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;
      this.mouse.x = x;
      this.mouse.y = y;
      if (e.button === 2) {
        this.mouse.rightJustPressed = true;
      } else {
        this.mouse.down = true;
        this.mouse.justPressed = true;
        this.pendingClicks.push({ x, y, isRight: false });
      }
    });

    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      const scaleY = CANVAS_HEIGHT / rect.height;
      this.mouse.x = (e.clientX - rect.left) * scaleX;
      this.mouse.y = (e.clientY - rect.top) * scaleY;
    });

    window.addEventListener('mouseup', () => { this.mouse.down = false; });

    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = CANVAS_WIDTH / rect.width;
        const scaleY = CANVAS_HEIGHT / rect.height;
        const x = (t.clientX - rect.left) * scaleX;
        const y = (t.clientY - rect.top) * scaleY;
        this.touches.set(t.identifier, { x, y });
        this.mouse.x = x;
        this.mouse.y = y;
        this.mouse.down = true;
        this.mouse.justPressed = true;
        this.pendingClicks.push({ x, y, isRight: false });
        if (e.changedTouches.length >= 2) {
          this.mouse.rightJustPressed = true;
        }
      }
    }, { passive: false });

    canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        this.touches.delete(t.identifier);
      }
      if (this.touches.size === 0) this.mouse.down = false;
    }, { passive: false });

    window.addEventListener('keydown', (e) => {
      if (!this.keyDown.has(e.code)) {
        this.keyJustPressed.add(e.code);
      }
      this.keyDown.add(e.code);
      if (e.code === 'KeyP' || e.code === 'Escape') {
        this.pendingClicks.push({ x: -1, y: -1, key: e.code });
      }
      if (/^Digit[1-8]$/.test(e.code)) {
        const idx = parseInt(e.code.slice(5)) - 1;
        this.pendingClicks.push({ x: -2, y: idx, key: 'sushi' });
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keyDown.delete(e.code);
    });
  }

  consumeClicks() {
    const clicks = this.pendingClicks;
    this.pendingClicks = [];
    this.mouse.justPressed = false;
    this.mouse.rightJustPressed = false;
    this.keyJustPressed.clear();
    return clicks;
  }

  clear() {
    this.pendingClicks = [];
    this.mouse.justPressed = false;
    this.mouse.rightJustPressed = false;
    this.keyJustPressed.clear();
  }
}

export const CANVAS_WIDTH = 960;
export const CANVAS_HEIGHT = 640;