import { hitSound } from './audio.js';
export class Enemy {
  constructor(type,x,y,level){
    this.type=type;this.x=x;this.y=y;this.r=type==='king'?34:type==='bruiser'?27:22;this.level=level;this.alive=true;this.flash=0;this.contact=0;this.shotTimer=1+Math.random();
    const data={blocker:[48,36,'#e85a62'],keeper:[26,58,'#54c7df'],bruiser:[105,75,'#a76bdf'],king:[420,110,'#ffc84a']}[type];
    this.hp=data[0]+level*6;this.maxHp=this.hp;this.speed=data[1]+level*3;this.color=data[2];
  }
  update(dt,player){
    this.flash-=dt;this.contact-=dt;this.shotTimer-=dt; let dx=player.x-this.x,dy=player.y-this.y,d=Math.hypot(dx,dy)||1;
    if(this.type==='keeper'){ if(this.x<player.x-25)this.x+=this.speed*dt; if(this.x>player.x+25)this.x-=this.speed*dt; if(this.y>125)this.y-=this.speed*.35*dt; }
    else if(this.type==='king'){ if(d>190){this.x+=dx/d*this.speed*dt;this.y+=dy/d*this.speed*dt;} else {this.x+=-dy/d*this.speed*.35*dt;this.y+=dx/d*this.speed*.35*dt;} }
    else {this.x+=dx/d*this.speed*dt;this.y+=dy/d*this.speed*dt;}
    let shot=null;
    if((this.type==='keeper'||this.type==='king') && this.shotTimer<=0){this.shotTimer=this.type==='king'?1.25:2.1;const a=Math.atan2(dy,dx);shot={x:this.x+Math.cos(a)*22,y:this.y+Math.sin(a)*22,vx:Math.cos(a)*210,vy:Math.sin(a)*210,r:7,damage:this.type==='king'?15:9,life:4};}
    return shot;
  }
  takeDamage(n){this.hp-=n;this.flash=.09;hitSound(this.type==='king');return this.hp<=0;}
  draw(ctx){
    ctx.save();ctx.translate(this.x,this.y);ctx.shadowColor=this.color;ctx.shadowBlur=16;ctx.fillStyle=this.flash>0?'#fff':this.color;
    if(this.type==='keeper'){ctx.fillRect(-21,-18,42,36);ctx.fillStyle='#17243a';ctx.fillRect(-13,-5,8,5);ctx.fillRect(6,-5,8,5);ctx.fillStyle='#ffc84a';ctx.fillRect(-17,-26,34,7);}
    else if(this.type==='king'){ctx.beginPath();ctx.arc(0,0,this.r,0,Math.PI*2);ctx.fill();ctx.fillStyle='#30203a';ctx.fillRect(-18,-3,10,7);ctx.fillRect(8,-3,10,7);ctx.fillStyle='#ffc84a';ctx.beginPath();ctx.moveTo(-20,-28);ctx.lineTo(-10,-43);ctx.lineTo(0,-29);ctx.lineTo(11,-43);ctx.lineTo(20,-28);ctx.closePath();ctx.fill();}
    else {ctx.beginPath();ctx.arc(0,0,this.r,0,Math.PI*2);ctx.fill();ctx.fillStyle='#17243a';ctx.fillRect(-12,-4,7,5);ctx.fillRect(5,-4,7,5);if(this.type==='bruiser'){ctx.strokeStyle='#f0d2ff';ctx.lineWidth=4;ctx.stroke();}}
    ctx.restore();
    if(this.hp<this.maxHp){ctx.fillStyle='rgba(0,0,0,.55)';ctx.fillRect(this.x-25,this.y-this.r-12,50,5);ctx.fillStyle=this.color;ctx.fillRect(this.x-25,this.y-this.r-12,50*Math.max(0,this.hp/this.maxHp),5);}
  }
}
export class EnemyShot { constructor(o){Object.assign(this,o);} update(dt){this.x+=this.vx*dt;this.y+=this.vy*dt;this.life-=dt;} draw(ctx){ctx.save();ctx.fillStyle='#ff714c';ctx.shadowColor='#ff513e';ctx.shadowBlur=15;ctx.beginPath();ctx.arc(this.x,this.y,this.r,0,Math.PI*2);ctx.fill();ctx.restore();} }
export class Pickup { constructor(x,y){this.x=x;this.y=y;this.r=11;this.life=8;this.t=Math.random()*6;} update(dt){this.life-=dt;this.t+=dt;} draw(ctx){ctx.save();ctx.translate(this.x,this.y+Math.sin(this.t*4)*3);ctx.rotate(-.25);ctx.fillStyle='#9affd0';ctx.shadowColor='#5dffb4';ctx.shadowBlur=18;ctx.fillRect(-8,-13,16,25);ctx.fillStyle='#1b8f72';ctx.fillRect(-5,-8,10,12);ctx.fillStyle='#fff';ctx.fillRect(-4,-18,8,5);ctx.restore();} }
export function circleHit(a,b){const rr=a.r+b.r;return (a.x-b.x)**2+(a.y-b.y)**2<rr*rr;}