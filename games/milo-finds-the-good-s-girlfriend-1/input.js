export class Input {
  constructor({ onPause } = {}) {
    this.keys = new Set();
    this.jumpQueued = false;
    this.dashQueued = false;
    this.onPause = onPause || (() => {});
    this.touch = { left: false, right: false };

    window.addEventListener('keydown', (event) => {
      const key = event.key.toLowerCase();
      if (['arrowleft', 'arrowright', 'arrowup', ' ', 'a', 'd', 'w', 'shift', 'p'].includes(key)) event.preventDefault();
      this.keys.add(key);
      if (!event.repeat && (key === ' ' || key === 'arrowup' || key === 'w')) this.jumpQueued = true;
      if (!event.repeat && (key === 'shift' || key === 'x')) this.dashQueued = true;
      if (!event.repeat && key === 'p') this.onPause();
    });
    window.addEventListener('keyup', (event) => this.keys.delete(event.key.toLowerCase()));

    document.querySelectorAll('.touch-button').forEach((button) => {
      const action = button.dataset.action;
      const press = (event) => {
        event.preventDefault();
        button.classList.add('active');
        if (action === 'left' || action === 'right') this.touch[action] = true;
        if (action === 'jump') this.jumpQueued = true;
        if (action === 'dash') this.dashQueued = true;
      };
      const release = (event) => {
        event.preventDefault();
        button.classList.remove('active');
        if (action === 'left' || action === 'right') this.touch[action] = false;
      };
      button.addEventListener('pointerdown', press);
      button.addEventListener('pointerup', release);
      button.addEventListener('pointercancel', release);
      button.addEventListener('pointerleave', release);
    });
  }

  get axis() {
    const left = this.keys.has('arrowleft') || this.keys.has('a') || this.touch.left;
    const right = this.keys.has('arrowright') || this.keys.has('d') || this.touch.right;
    return (right ? 1 : 0) - (left ? 1 : 0);
  }

  consumeJump() {
    const value = this.jumpQueued;
    this.jumpQueued = false;
    return value;
  }

  consumeDash() {
    const value = this.dashQueued;
    this.dashQueued = false;
    return value;
  }
}