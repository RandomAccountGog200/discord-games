import { kickSound, hurtSound } from './audio.js';
export class Player {
  constructor(){
    this.x=480;this.y=530;this.r=19;this.speed=245;this.accel=1600;this.friction=.82;this.vx=0;this.vy=0;
    this.hp=100;this.maxHp=100;this.power=22;this.crit=.08;this.fireRate=.28;this.cooldown=0;this.dashCooldown=0;this.invuln=0;this.flash=0;this.facing=0;this.juice=0;
  }
  update(dt,input){
    const m=input.getMove();
    if(m.active){this.vx+=m.x*this.accel*dt;this.vy+=m.y*this.accel*dt;}
    else {this.vx*=Math.pow(this.friction,dt*60);this.vy*=Math.pow(this.friction,dt*60);}
    const sp=Math.hypot(this.vx,this.vy); if(sp>this.speed){this.vx=this.vx/sp*this.speed;this.vy=this.vy/sp*this.speed;}
    if(input.consumeDash() && this.dashCooldown<=0){
      const dx=m.active?m.x:Math.cos(this.facing),dy=m.active?m.y:Math.sin(this.facing); this.vx=dx*650;this.vy=dy*650;this.dashCooldown=1.4;this.invuln=.32;
    }
    this.x+=this.vx*dt;this.y+=this.vy*dt;this.x=Math.max(35,Math.min(925,this.x));this.y=Math.max(65,Math.min(565,this.y));
    this.cooldown-=dt;this.dashCooldown-=dt;this.invuln-=dt;this.flash-=dt;
    this.facing=Math.atan2(input.pointer.y-this.y,input.pointer.x-this.x);
    if(input.firing() && this.cooldown<=0){this.cooldown=this.fireRate;kickSound();return this.shoot();}
    return null;
  }
  shoot(){
    const critical=Math.random()<this.crit, damage=this.power*(critical?2:1), speed=590;
    return {x:this.x+Math.cos(this.facing)*25,y:this.y+Math.sin(this.facing)*25,vx:Math.cos(this.facing)*speed,vy:Math.sin(this.facing)*speed,r:8,damage,critical,life:1.3};
  }
  hurt(amount){ if(this.invuln>0)return false;this.hp-=amount;this.invuln=.55;this.flash=.16;hurtSound();return true; }
  draw(ctx){
    ctx.save();ctx.translate(this.x,this.y);ctx.rotate(this.facing);
    if(this.invuln>0)ctx.globalAlpha=.55+Math.sin(performance.now()/45)*.2;
    ctx.shadowColor='#ffc84a';ctx.shadowBlur=20;ctx.fillStyle='#f6bf3e';ctx.beginPath();ctx.arc(0,0,this.r,0,Math.PI*2);ctx.fill();
    ctx.shadowBlur=0;ctx.fillStyle='#e8433f';ctx.fillRect(-13,-13,25,26);ctx.fillStyle='#fff3c5';ctx.fillRect(0,-13,4,26);
    ctx.fillStyle='#e8b37c';ctx.beginPath();ctx.arc(7,0,9,0,Math.PI*2);ctx.fill();ctx.fillStyle='#24192a';ctx.beginPath();ctx.arc(9,-5,6,Math.PI,Math.PI*2);ctx.fill();
    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(25,0,6,0,Math.PI*2);ctx.fill();ctx.restore();
  }
}