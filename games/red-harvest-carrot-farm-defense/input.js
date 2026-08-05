// input.js — unified mouse/touch/keyboard input

export class InputManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.mouse = { x: 0, y: 0, down: false, clicked: false, rightClicked: false };
        this.keyMap = {};
        this.rect = canvas.getBoundingClientRect();

        canvas.addEventListener('mousemove', (e) => this._updateMouse(e));
        canvas.addEventListener('mousedown', (e) => {
            this._updateMouse(e);
            if (e.button === 0) this.mouse.down = true;
            if (e.button === 2) { this.mouse.rightClicked = true; this.mouse.down = false; }
        });
        canvas.addEventListener('mouseup', (e) => {
            this._updateMouse(e);
            if (e.button === 0) {
                if (this.mouse.down) this.mouse.clicked = true;
                this.mouse.down = false;
            }
        });
        canvas.addEventListener('contextmenu', (e) => e.preventDefault());

        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const t = e.touches[0];
            this._updateMouse({ clientX: t.clientX, clientY: t.clientY });
            this.mouse.down = true;
            this.mouse.clicked = true;
        }, { passive: false });
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const t = e.touches[0];
            this._updateMouse({ clientX: t.clientX, clientY: t.clientY });
        }, { passive: false });
        canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.mouse.down = false;
            this.mouse.clicked = false;
        }, { passive: false });

        window.addEventListener('keydown', (e) => {
            this.keyMap[e.code] = true;
            if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
        });
        window.addEventListener('keyup', (e) => {
            this.keyMap[e.code] = false;
        });

        window.addEventListener('resize', () => this._updateRect());
        window.addEventListener('scroll', () => this._updateRect());
    }

    _updateRect() {
        this.rect = this.canvas.getBoundingClientRect();
    }

    _updateMouse(e) {
        this._updateRect();
        const rx = this.canvas.width / this.rect.width;
        const ry = this.canvas.height / this.rect.height;
        this.mouse.x = (e.clientX - this.rect.left) * rx;
        this.mouse.y = (e.clientY - this.rect.top) * ry;
    }

    isKeyPressed(code) {
        return !!this.keyMap[code];
    }

    consumeClick() {
        const c = this.mouse.clicked;
        this.mouse.clicked = false;
        return c;
    }

    consumeRightClick() {
        const c = this.mouse.rightClicked;
        this.mouse.rightClicked = false;
        return c;
    }

    registerDown() { this.mouse.down = true; }
    clearDown() { this.mouse.down = false; this.mouse.clicked = false; }
}