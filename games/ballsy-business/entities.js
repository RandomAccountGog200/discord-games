import { resolveCircleRect } from './player.js';
export class Deal {
  constructor(x, y, value = 100) { this.x=x; this.y=y; this.radius=11; this.value=value; this.phase=Math.random()*6; }
  update(dt) { this.phase += dt * 3; }
  draw(ctx, time) { const bob = Math.sin(this.phase) * 3; ctx.save(); ctx.translate(this.x,this.y+bob); ctx.rotate(Math.sin(this.phase)*.08); ctx.shadowColor='#ffd166'; ctx.shadowBlur=20; ctx.fillStyle='#ffd166'; ctx.beginPath(); ctx.arc(0,0,this.radius,0,Math.PI*2); ctx.fill(); ctx.shadowBlur=0; ctx.fillStyle='#553d13'; ctx.font='900 11px system-ui'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText('$',0,1); ctx.strokeStyle='rgba(255,255,255,.7)'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(0,0,7,0,Math.PI*2); ctx.stroke(); ctx.restore(); }
}
export class Obstacle {
  constructor(x,y,w,h) { this.x=x;this.y=y;this.w=w;this.h=h; }
  draw(ctx) { ctx.save(); ctx.shadowColor='rgba(30,190,225,.3)';ctx.shadowBlur=14;ctx.fillStyle='#122b49';ctx.strokeStyle='#326080';ctx.lineWidth=2;roundRect(ctx,this.x,this.y,this.w,this.h,8);ctx.fill();ctx.stroke();ctx.shadowBlur=0;ctx.strokeStyle='rgba(77,233,255,.18)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(this.x+12,this.y+10);ctx.lineTo(this.x+this.w-12,this.y+10);ctx.stroke();ctx.restore(); }
}
export class Enemy {
  constructor(x,y,type=0) { this.x=x;this.y=y;this.type=type;this.radius=type===2?22:16;this.vx=0;this.vy=0;this.angle=Math.random()*6.28;this.speed=type===2?92:(type===1?125:145);this.phase=Math.random()*6; }
  update(dt, player, obstacles, time) {
    let tx=player.x, ty=player.y;
    if (this.type===1) { this.angle += dt * .8; tx=500+Math.cos(this.angle)*170; ty=325+Math.sin(this.angle)*150; }
    let dx=tx-this.x,dy=ty-this.y,len=Math.hypot(dx,dy)||1; this.vx += dx/len*this.speed*2.2*dt; this.vy += dy/len*this.speed*2.2*dt;
    const s=Math.hypot(this.vx,this.vy);if(s>this.speed){this.vx*=this.speed/s;this.vy*=this.speed/s;} this.x+=this.vx*dt;this.y+=this.vy*dt;
    if(this.x<25+this.radius){this.x=25+this.radius;this.vx=Math.abs(this.vx);} if(this.x>975-this.radius){this.x=975-this.radius;this.vx=-Math.abs(this.vx);} if(this.y<25+this.radius){this.y=25+this.radius;this.vy=Math.abs(this.vy);} if(this.y>625-this.radius){this.y=625-this.radius;this.vy=-Math.abs(this.vy);}
    for(const o of obstacles) resolveCircleRect(this,o); this.phase+=dt*4;
  }
  draw(ctx,time) { ctx.save();ctx.translate(this.x,this.y);if(this.type===2){ctx.rotate(this.phase*.12);ctx.fillStyle='#ff4f91';ctx.shadowColor='#ff4f91';ctx.shadowBlur=24;ctx.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4;const r=i%2?this.radius*.72:this.radius;ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);}ctx.closePath();ctx.fill();}else{ctx.shadowColor=this.type===1?'#c56cff':'#ff4f91';ctx.shadowBlur=20;ctx.fillStyle=this.type===1?'#c56cff':'#e83c80';ctx.beginPath();ctx.arc(0,0,this.radius,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle='#ffd4e5';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,this.radius-4,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#3e102e';ctx.fillRect(-5,-3,3,5);ctx.fillRect(3,-3,3,5);}ctx.restore(); }
}
function roundRect(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}