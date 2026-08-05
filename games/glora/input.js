export class Input {
  constructor(canvas, stickArea, stickKnob) {
    this.keys = new Set();
    this.pressed = new Set();
    this.virtual = new Set();
    this.joy = {x:0,y:0};
    this.mousePulse = false;
    this.canvas = canvas;
    window.addEventListener('keydown', e => {
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ','Shift'].includes(e.key)) e.preventDefault();
      if (!this.keys.has(e.key)) this.pressed.add(e.key);
      this.keys.add(e.key);
    });
    window.addEventListener('keyup', e => this.keys.delete(e.key));
    canvas.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'touch' && e.button === 0) this.mousePulse = true;
    });
    this.bindButton(document.getElementById('pulse-button'), 'pulse');
    this.bindButton(document.getElementById('dash-button'), 'dash');
    this.bindStick(stickArea, stickKnob);
  }
  bindButton(el, action) {
    if (!el) return;
    const down = e => { e.preventDefault(); this.virtual.add(action); };
    const up = e => { e.preventDefault(); this.virtual.delete(action); };
    el.addEventListener('pointerdown', down); el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up); el.addEventListener('pointerleave', up);
  }
  bindStick(area, knob) {
    let active = false;
    const move = e => {
      if (!active) return;
      const r = area.getBoundingClientRect(), cx = r.left+r.width/2, cy = r.top+r.height/2;
      let x=(e.clientX-cx)/(r.width*.38), y=(e.clientY-cy)/(r.height*.38);
      const len=Math.hypot(x,y); if(len>1){x/=len;y/=len;}
      this.joy={x,y}; knob.style.transform=`translate(${x*25}px,${y*25}px)`;
    };
    const end = () => { active=false; this.joy={x:0,y:0}; knob.style.transform=''; };
    area.addEventListener('pointerdown',e=>{active=true;area.setPointerCapture(e.pointerId);move(e);});
    area.addEventListener('pointermove',move); area.addEventListener('pointerup',end); area.addEventListener('pointercancel',end);
  }
  axis() {
    let x=0,y=0;
    if(this.keys.has('a')||this.keys.has('A')||this.keys.has('ArrowLeft')) x--;
    if(this.keys.has('d')||this.keys.has('D')||this.keys.has('ArrowRight')) x++;
    if(this.keys.has('w')||this.keys.has('W')||this.keys.has('ArrowUp')) y--;
    if(this.keys.has('s')||this.keys.has('S')||this.keys.has('ArrowDown')) y++;
    x += this.joy.x; y += this.joy.y;
    const l=Math.hypot(x,y); return l>1?{x:x/l,y:y/l}:{x,y};
  }
  consumeAction(action) {
    if(action==='dash' && (this.pressed.has('Shift')||this.virtual.has('dash'))){this.pressed.delete('Shift');return true;}
    if(action==='pulse' && (this.pressed.has(' ')||this.pressed.has('e')||this.pressed.has('E')||this.virtual.has('pulse'))){this.pressed.delete(' ');this.pressed.delete('e');this.pressed.delete('E');this.virtual.delete('pulse');return true;}
    return false;
  }
  consumeKey(key){if(this.pressed.has(key)){this.pressed.delete(key);return true}return false}
  consumeMousePulse(){const v=this.mousePulse;this.mousePulse=false;return v}
}