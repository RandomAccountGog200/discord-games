export class Input {
  constructor(canvas) {
    this.left = false;
    this.right = false;
    this.jump = false;
    this.jumpPressed = false; // one-frame edge trigger
    this.steer = 0;
    this.lastJumpEdge = 0;
    this.onPause = null;

    window.addEventListener('keydown', e => {
      if (e.repeat) return;
      const c = e.code;
      if (c === 'ArrowLeft' || c === 'KeyA') this.left = true;
      if (c === 'ArrowRight' || c === 'KeyD') this.right = true;
      if (c === 'Space' || c === 'ArrowUp' || c === 'KeyW') {
        if (!this.jump) {
          this.jump = true;
          this.jumpPressed = true;
        }
      }
      if (c === 'KeyP' || c === 'Escape') { this.onPause && this.onPause(); }
      if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(c)) e.preventDefault();
    });

    window.addEventListener('keyup', e => {
      const c = e.code;
      if (c === 'ArrowLeft' || c === 'KeyA') this.left = false;
      if (c === 'ArrowRight' || c === 'KeyD') this.right = false;
      if (c === 'Space' || c === 'ArrowUp' || c === 'KeyW') this.jump = false;
    });

    // canvas tap = jump
    canvas.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'mouse') {
        this.jump = true;
        this.jumpPressed = true;
      }
    });
    canvas.addEventListener('pointerup', e => {
      if (e.pointerType !== 'mouse') this.jump = false;
    });

    // touch buttons
    const btnL = document.getElementById('btnLeft');
    const btnR = document.getElementById('btnRight');
    const btnJ = document.getElementById('btnJump');
    const bind = (el, on, off) => {
      el.addEventListener('pointerdown', e => { e.preventDefault(); on(); });
      el.addEventListener('pointerup', e => { e.preventDefault(); off(); });
      el.addEventListener('pointerleave', () => off());
      el.addEventListener('pointercancel', () => off());
    };
    bind(btnL, () => this.left = true, () => this.left = false);
    bind(btnR, () => this.right = true, () => this.right = false);
    bind(btnJ, () => { this.jump = true; this.jumpPressed = true; }, () => { this.jump = false; });
  }

  update() {
    this.steer = 0;
    if (this.left) this.steer -= 1;
    if (this.right) this.steer += 1;
  }

  consumeJump() {
    const j = this.jumpPressed;
    this.jumpPressed = false;
    return j;
  }

  clearJump() { this.jumpPressed = false; }
}