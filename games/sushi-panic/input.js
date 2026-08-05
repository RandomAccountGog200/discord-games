export class Input {
  constructor(canvas, getView) {
    this.canvas = canvas;
    this.getView = getView;
    this.pos = { x: 0, y: 0 };
    this.presses = [];
    this.keys = [];

    canvas.addEventListener('pointerdown', (e) => {
      const p = this.map(e);
      this.pos = p;
      this.presses.push(p);
      e.preventDefault();
    });
    canvas.addEventListener('pointermove', (e) => {
      this.pos = this.map(e);
      e.preventDefault();
    });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('keydown', (e) => {
      if (e.key === ' ') e.preventDefault();
      this.keys.push(e.key.toLowerCase());
    });
  }

  map(e) {
    const v = this.getView();
    const r = this.canvas.getBoundingClientRect();
    const dpr = this.canvas.width / Math.max(1, r.width);
    return {
      x: ((e.clientX - r.left) * dpr - v.ox) / v.scale,
      y: ((e.clientY - r.top) * dpr - v.oy) / v.scale,
    };
  }

  takePresses() {
    const p = this.presses;
    this.presses = [];
    return p;
  }

  takeKeys() {
    const k = this.keys;
    this.keys = [];
    return k;
  }
}