export class Input {
  constructor(canvas){
    this.canvas=canvas; this.keys=new Set(); this.pointer={x:innerWidth/2,y:innerHeight/2,active:false};
    this.attack=false; this.pause=false; this.joy={x:0,y:0}; this.joyPointer=null;
    addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ','w','a','s','d','W','A','S','D'].includes(e.key))e.preventDefault();this.keys.add(e.key);if(e.key===' ')this.attack=true;if(e.key==='Escape')this.pause=true});
    addEventListener('keyup',e=>this.keys.delete(e.key));
    canvas.addEventListener('pointermove',e=>this.setPointer(e));
    canvas.addEventListener('pointerdown',e=>{this.setPointer(e);if(e.pointerType!=='touch')this.attack=true});
    const joy=document.getElementById('joystick'), knob=document.getElementById('joystickKnob');
    const moveJoy=e=>{if(this.joyPointer!==e.pointerId)return;const r=joy.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let x=e.clientX-cx,y=e.clientY-cy;const d=Math.hypot(x,y),max=38;if(d>max){x=x/d*max;y=y/d*max}this.joy.x=x/max;this.joy.y=y/max;knob.style.transform=`translate(${x}px,${y}px)`};
    joy.addEventListener('pointerdown',e=>{this.joyPointer=e.pointerId;joy.setPointerCapture(e.pointerId);moveJoy(e)});joy.addEventListener('pointermove',moveJoy);joy.addEventListener('pointerup',()=>{this.joyPointer=null;this.joy.x=this.joy.y=0;knob.style.transform='translate(0,0)'});joy.addEventListener('pointercancel',()=>{this.joyPointer=null;this.joy.x=this.joy.y=0;knob.style.transform='translate(0,0)'});
    document.getElementById('attackButton').addEventListener('pointerdown',e=>{e.preventDefault();this.attack=true});
  }
  setPointer(e){const r=this.canvas.getBoundingClientRect();this.pointer.x=(e.clientX-r.left)*this.canvas.width/r.width;this.pointer.y=(e.clientY-r.top)*this.canvas.height/r.height;this.pointer.active=true}
  getMove(){let x=0,y=0;if(this.keys.has('a')||this.keys.has('A')||this.keys.has('ArrowLeft'))x--;if(this.keys.has('d')||this.keys.has('D')||this.keys.has('ArrowRight'))x++;if(this.keys.has('w')||this.keys.has('W')||this.keys.has('ArrowUp'))y--;if(this.keys.has('s')||this.keys.has('S')||this.keys.has('ArrowDown'))y++;if(!x&&!y){x=this.joy.x;y=this.joy.y}const d=Math.hypot(x,y);return d>1?{x:x/d,y:y/d}:{x,y}}
  consumeAttack(){const a=this.attack;this.attack=false;return a}
  consumePause(){const p=this.pause;this.pause=false;return p}
  reset(){this.keys.clear();this.attack=false;this.pause=false;this.joy.x=this.joy.y=0}
}