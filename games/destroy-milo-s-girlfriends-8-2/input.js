// Unified keyboard / mouse / touch input
export const Input = {
  keys: {},
  mouse: { x: 0, y: 0, down: false },
  moveX: 0, moveY: 0,
  dashQueued: false,
  pauseQueued: false,
  moveStick: null, // {id, sx, sy, dx, dy}
  aimStick: null,
  isTouch: false,

  init(canvas) {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (e.code === 'Space' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        this.dashQueued = true;
        e.preventDefault();
      }
      if (e.code === 'Escape' || e.code === 'KeyP') this.pauseQueued = true;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    });
    window.addEventListener('keyup', (e) => { this.keys[e.code] = false; });

    canvas.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });
    canvas.addEventListener('mousedown', (e) => { if (e.button === 0) this.mouse.down = true; });
    window.addEventListener('mouseup', () => { this.mouse.down = false; });
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // Touch: left half = move stick, right half = aim/fire stick
    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.isTouch = true;
      for (const t of e.changedTouches) {
        if (t.clientX < window.innerWidth / 2 && !this.moveStick) {
          this.moveStick = { id: t.identifier, sx: t.clientX, sy: t.clientY, dx: 0, dy: 0 };
        } else if (t.clientX >= window.innerWidth / 2 && !this.aimStick) {
          this.aimStick = { id: t.identifier, sx: t.clientX, sy: t.clientY, dx: 0, dy: 0 };
        }
      }
    }, { passive: false });

    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        for (const key of ['moveStick', 'aimStick']) {
          const s = this[key];
          if (s && s.id === t.identifier) {
            let dx = t.clientX - s.sx, dy = t.clientY - s.sy;
            const m = Math.hypot(dx, dy);
            const max = 60;
            if (m > max) { dx = dx / m * max; dy = dy / m * max; }
            s.dx = dx; s.dy = dy;
          }
        }
      }
    }, { passive: false });

    const endTouch = (e) => {
      for (const t of e.changedTouches) {
        if (this.moveStick && this.moveStick.id === t.identifier) this.moveStick = null;
        if (this.aimStick && this.aimStick.id === t.identifier) this.aimStick = null;
      }
    };
    canvas.addEventListener('touchend', endTouch);
    canvas.addEventListener('touchcancel', endTouch);

    window.addEventListener('blur', () => {
      this.keys = {};
      this.mouse.down = false;
      this.moveStick = null;
      this.aimStick = null;
    });
  },

  update() {
    let mx = 0, my = 0;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) mx -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) mx += 1;
    if (this.keys['KeyW'] || this.keys['ArrowUp']) my -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) my += 1;
    if (this.moveStick) {
      mx += this.moveStick.dx / 60;
      my += this.moveStick.dy / 60;
    }
    this.moveX = mx;
    this.moveY = my;
  },

  // Returns {x, y} normalized aim direction and firing flag
  getAim(player, cam) {
    if (this.aimStick) {
      const m = Math.hypot(this.aimStick.dx, this.aimStick.dy);
      if (m > 10) return { x: this.aimStick.dx / m, y: this.aimStick.dy / m, firing: true };
      return { x: player.aimX, y: player.aimY, firing: false };
    }
    const wx = this.mouse.x + cam.x;
    const wy = this.mouse.y + cam.y;
    const dx = wx - player.x, dy = wy - player.y;
    const m = Math.hypot(dx, dy) || 1;
    return { x: dx / m, y: dy / m, firing: this.mouse.down };
  },

  consumeDash() { const d = this.dashQueued; this.dashQueued = false; return d; },
  consumePause() { const p = this.pauseQueued; this.pauseQueued = false; return p; }
};