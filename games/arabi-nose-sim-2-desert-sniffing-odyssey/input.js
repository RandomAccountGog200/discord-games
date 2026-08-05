// Keyboard + mouse + touch joystick input.
export const input = {
  moveX: 0, moveY: 0, sniff: false,
  keys: {},
  stickActive: false, stickVec: { x: 0, y: 0 },
  touchSniff: false,
};

let onPause = null;
export function bindInput(pauseCallback) {
  onPause = pauseCallback;
  window.addEventListener('keydown', e => {
    input.keys[e.code] = true;
    if (e.code === 'KeyP' || e.code === 'Escape') { if (onPause) onPause(); }
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault();
  });
  window.addEventListener('keyup', e => { input.keys[e.code] = false; });
  window.addEventListener('blur', () => { input.keys = {}; input.sniff = false; input.touchSniff = false; });

  // Mouse hold to sniff
  const canvas = document.getElementById('game');
  canvas.addEventListener('mousedown', () => { input.sniff = true; });
  window.addEventListener('mouseup', () => { input.sniff = false; });

  // Touch joystick
  const stick = document.getElementById('stick');
  const knob = document.getElementById('stickKnob');
  let stickId = null;
  const R = 40;

  function updateStick(t) {
    const r = stick.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    let dx = t.clientX - cx, dy = t.clientY - cy;
    const len = Math.hypot(dx, dy);
    if (len > R) { dx = dx / len * R; dy = dy / len * R; }
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
    input.stickVec.x = dx / R; input.stickVec.y = dy / R;
    input.stickActive = true;
  }
  stick.addEventListener('touchstart', e => { e.preventDefault(); stickId = e.changedTouches[0].identifier; updateStick(e.changedTouches[0]); }, { passive: false });
  stick.addEventListener('touchmove', e => {
    e.preventDefault();
    for (const t of e.changedTouches) if (t.identifier === stickId) updateStick(t);
  }, { passive: false });
  const endStick = e => {
    for (const t of e.changedTouches) if (t.identifier === stickId) {
      stickId = null; input.stickActive = false;
      input.stickVec.x = 0; input.stickVec.y = 0;
      knob.style.transform = 'translate(0,0)';
    }
  };
  stick.addEventListener('touchend', endStick);
  stick.addEventListener('touchcancel', endStick);

  const sniffBtn = document.getElementById('btnSniff');
  sniffBtn.addEventListener('touchstart', e => { e.preventDefault(); input.touchSniff = true; }, { passive: false });
  sniffBtn.addEventListener('touchend', e => { e.preventDefault(); input.touchSniff = false; }, { passive: false });
  sniffBtn.addEventListener('touchcancel', () => { input.touchSniff = false; });
}

export function pollInput() {
  const k = input.keys;
  let x = 0, y = 0;
  if (k['ArrowLeft'] || k['KeyA']) x -= 1;
  if (k['ArrowRight'] || k['KeyD']) x += 1;
  if (k['ArrowUp'] || k['KeyW']) y -= 1;
  if (k['ArrowDown'] || k['KeyS']) y += 1;
  if (input.stickActive) { x = input.stickVec.x; y = input.stickVec.y; }
  const len = Math.hypot(x, y);
  if (len > 1) { x /= len; y /= len; }
  input.moveX = x; input.moveY = y;
  input.sniffHeld = !!(k['Space'] || input.sniff || input.touchSniff);
}