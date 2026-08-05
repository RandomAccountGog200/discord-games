import { GAME_WIDTH, GAME_HEIGHT } from './constants.js';

export class InputManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.keys = {};
        this.justPressed = {};
        this.mouseDown = false;
        this.mouseX = 0;
        this.mouseY = 0;
        this.touchActive = false;
        this.touchX = 0;
        this.touchY = 0;

        window.addEventListener('keydown', (e) => {
            if (!this.keys[e.key]) this.justPressed[e.key] = true;
            this.keys[e.key] = true;
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });

        canvas.addEventListener('mousedown', (e) => {
            const rect = canvas.getBoundingClientRect();
            this.mouseDown = true;
            this.mouseX = (e.clientX - rect.left) / rect.width * GAME_WIDTH;
            this.mouseY = (e.clientY - rect.top) / rect.height * GAME_HEIGHT;
        });
        canvas.addEventListener('mouseup', () => { this.mouseDown = false; });
        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            this.mouseX = (e.clientX - rect.left) / rect.width * GAME_WIDTH;
            this.mouseY = (e.clientY - rect.top) / rect.height * GAME_HEIGHT;
        });

        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (e.touches.length > 0) {
                const rect = canvas.getBoundingClientRect();
                this.touchX = (e.touches[0].clientX - rect.left) / rect.width * GAME_WIDTH;
                this.touchY = (e.touches[0].clientY - rect.top) / rect.height * GAME_HEIGHT;
                this.touchActive = true;
            }
        });
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (e.touches.length > 0) {
                const rect = canvas.getBoundingClientRect();
                this.touchX = (e.touches[0].clientX - rect.left) / rect.width * GAME_WIDTH;
                this.touchY = (e.touches[0].clientY - rect.top) / rect.height * GAME_HEIGHT;
            }
        });
        canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.touchActive = false;
        });
    }

    update() { this.justPressed = {}; }

    isDown(key) { return this.keys[key] === true; }
    isJustPressed(key) { return this.justPressed[key] === true; }
}