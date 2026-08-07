export function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
export function circleHit(a,b){const r=a.radius+b.radius;return (a.x-b.x)**2+(a.y-b.y)**2<r*r;}
export function circleRectHit(c,r){const x=clamp(c.x,r.x,r.x+r.w),y=clamp(c.y,r.y,r.y+r.h);return (c.x-x)**2+(c.y-y)**2<c.radius*c.radius;}
export function resolveCircleRect(o,r){
  const x=clamp(o.x,r.x,r.x+r.w),y=clamp(o.y,r.y,r.y+r.h),dx=o.x-x,dy=o.y-y,d= Math.hypot(dx,dy);
  if(d<o.radius){ if(d===0){const left=Math.abs(o.x-r.x),right=Math.abs(r.x+r.w-o.x),top=Math.abs(o.y-r.y),bottom=Math.abs(r.y+r.h-o.y),m=Math.min(left,right,top,bottom);if(m===left)o.x=r.x-o.radius;else if(m===right)o.x=r.x+r.w+o.radius;else if(m===top)o.y=r.y-o.radius;else o.y=r.y+r.h+o.radius;} else {o.x+=dx/d*(o.radius-d);o.y+=dy/d*(o.radius-d);} return true;} return false;
}
export function moveCircle(o,dx,dy,walls){
  o.x+=dx; for(const w of walls) resolveCircleRect(o,w);
  o.y+=dy; for(const w of walls) resolveCircleRect(o,w);
  o.x=clamp(o.x,o.radius,960-o.radius);o.y=clamp(o.y,o.radius,540-o.radius);
}

export class Player {
  constructor(){this.x=480;this.y=270;this.radius=15;this.maxHp=100;this.hp=100;this.speed=205;this.fireRate=.23;this.cooldown=0;this.damage=22;this.projectileSpeed=570;this.pierce=0;this.magnet=70;this.dashCooldown=0;this.dashTime=0;this.dashDir={x:0,y:0};this.invuln=0;this.flash=0;this.lastAim={x:1,y:0};}
  update(dt,input,walls){
    this.cooldown=Math.max(0,this.cooldown-dt);this.dashCooldown=Math.max(0,this.dashCooldown-dt);this.invuln=Math.max(0,this.invuln-dt);this.flash=Math.max(0,this.flash-dt);
    const move=input.movement();
    if(input.consumeDash()&&this.dashCooldown<=0&&(move.x||move.y)){this.dashTime=.14;this.dashCooldown=1.15;this.dashDir={...move};this.invuln=.22;}
    if(this.dashTime>0){this.dashTime-=dt;moveCircle(this,this.dashDir.x*650*dt,this.dashDir.y*650*dt,walls);}
    else moveCircle(this,move.x*this.speed*dt,move.y*this.speed*dt,walls);
  }
  aimAt(target){const dx=target.x-this.x,dy=target.y-this.y,l=Math.hypot(dx,dy)||1;this.lastAim={x:dx/l,y:dy/l};}
  shoot(){if(this.cooldown>0)return null;this.cooldown=this.fireRate;return new Projectile(this.x+this.lastAim.x*19,this.y+this.lastAim.y*19,this.lastAim.x*this.projectileSpeed,this.lastAim.y*this.projectileSpeed,this.damage,true,this.pierce);}
  hurt(amount){if(this.invuln>0)return false;this.hp-=amount;this.invuln=.65;this.flash=.18;return true;}
  heal(amount){this.hp=Math.min(this.maxHp,this.hp+amount);}
  upgrade(id){if(id==='vitality'){this.maxHp+=25;this.hp=Math.min(this.maxHp,this.hp+25);}if(id==='rapid'){this.fireRate=Math.max(.09,this.fireRate-.045);}if(id==='power')this.damage+=9;if(id==='swift')this.speed+=32;if(id==='pierce')this.pierce+=1;if(id==='magnet')this.magnet+=65;if(id==='dash')this.dashCooldown=Math.max(.55,this.dashCooldown-.25);}
  draw(ctx){ctx.save();ctx.translate(this.x,this.y);if(this.flash>0&&Math.floor(this.flash*30)%2===0)ctx.globalAlpha=.35;ctx.shadowBlur=24;ctx.shadowColor='#b56cff';ctx.fillStyle='#c98cff';ctx.beginPath();ctx.arc(0,0,this.radius,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#f9edff';ctx.beginPath();ctx.arc(0,0,7,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.rotate(Math.atan2(this.lastAim.y,this.lastAim.x));ctx.beginPath();ctx.moveTo(9,0);ctx.lineTo(22,0);ctx.stroke();if(this.dashTime>0){ctx.strokeStyle='#42e5e5';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,23,0,Math.PI*2);ctx.stroke();}ctx.restore();}
}

export class Projectile {
  constructor(x,y,vx,vy,damage,friendly=true,pierce=0){this.x=x;this.y=y;this.vx=vx;this.vy=vy;this.radius=friendly?5:7;this.damage=damage;this.friendly=friendly;this.life=1.5;this.pierce=pierce;this.hit=new Set();this.dead=false;}
  update(dt,walls){this.x+=this.vx*dt;this.y+=this.vy*dt;this.life-=dt;if(this.life<=0||this.x<-20||this.x>980||this.y<-20||this.y>560)this.dead=true;for(const w of walls)if(circleRectHit(this,w))this.dead=true;}
  draw(ctx){ctx.save();ctx.fillStyle=this.friendly?'#ffb0df':'#ff765c';ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=15;ctx.beginPath();ctx.arc(this.x,this.y,this.radius,0,Math.PI*2);ctx.fill();ctx.restore();}
}

export class Enemy {
  constructor(type,x,y,wave){this.type=type;this.x=x;this.y=y;this.wave=wave;this.radius=type==='brute'?23:type==='boss'?43:17;this.maxHp=type==='boss'?700+wave*100:type==='brute'?120+wave*18:type==='spitter'?48+wave*9:42+wave*8;this.hp=this.maxHp;this.speed=type==='brute'?48:type==='boss'?35:type==='spitter'?70:86+wave*3;this.cooldown=1+Math.random();this.contact=0;this.hitFlash=0;this.dead=false;}
  update(dt,player,walls){this.cooldown-=dt;this.contact=Math.max(0,this.contact-dt);this.hitFlash=Math.max(0,this.hitFlash-dt);let dx=player.x-this.x,dy=player.y-this.y,d=Math.hypot(dx,dy)||1, vx=dx/d,vy=dy/d;
    if(this.type==='spitter'){if(d<175){vx=-vx;vy=-vy;}else if(d>280){}else{vx=-vy*.65;vy=vx*.65;}}
    if(this.type==='boss'&&d<210){vx=-vx;vy=-vy;}
    moveCircle(this,vx*this.speed*dt,vy*this.speed*dt,walls);
    if((this.type==='spitter'||this.type==='boss')&&this.cooldown<=0){this.cooldown=this.type==='boss'?1.25:1.8;return new Projectile(this.x,this.y,dx/d*(this.type==='boss'?230:190),dy/d*(this.type==='boss'?230:190),this.type==='boss'?18:11,false);}
    return null;
  }
  damage(n){this.hp-=n;this.hitFlash=.1;if(this.hp<=0)this.dead=true;}
  draw(ctx){const color=this.type==='boss'?'#fc3baf':this.type==='brute'?'#ff754a':this.type==='spitter'?'#45dfd4':'#9d67ef';ctx.save();ctx.translate(this.x,this.y);ctx.shadowColor=color;ctx.shadowBlur=this.type==='boss'?32:18;ctx.fillStyle=this.hitFlash>0?'#fff':color;ctx.beginPath();ctx.arc(0,0,this.radius,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#160b29';ctx.beginPath();ctx.arc(-this.radius*.28,-2,this.radius*.34,0,Math.PI*2);ctx.arc(this.radius*.28,-2,this.radius*.34,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(-this.radius*.28,-2,this.radius*.13,0,Math.PI*2);ctx.arc(this.radius*.28,-2,this.radius*.13,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#210b30';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,5,this.radius*.42,0,Math.PI);ctx.stroke();if(this.type==='boss'){ctx.strokeStyle='#ffc1ee';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,0,this.radius+6,0,Math.PI*2);ctx.stroke();}ctx.restore();}
}

export class Pickup {
  constructor(x,y){this.x=x;this.y=y;this.radius=8;this.life=12;this.phase=Math.random()*6;}
  update(dt,player){this.life-=dt;this.phase+=dt*5;const dx=player.x-this.x,dy=player.y-this.y,d=Math.hypot(dx,dy)||1;if(d<player.magnet){const force=(1-d/player.magnet)*400;this.x+=dx/d*force*dt;this.y+=dy/d*force*dt;}return d<player.radius+this.radius;}
  draw(ctx){ctx.save();ctx.translate(this.x,this.y+Math.sin(this.phase)*3);ctx.fillStyle='#ffd45c';ctx.shadowColor='#ffd45c';ctx.shadowBlur=18;ctx.rotate(Math.PI/4);ctx.fillRect(-6,-6,12,12);ctx.restore();}
}