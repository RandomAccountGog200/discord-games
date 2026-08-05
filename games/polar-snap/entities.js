export class Player {
  constructor(x,y){this.x=x;this.y=y;this.vx=0;this.vy=0;this.r=18;this.maxHealth=100;this.health=100;this.speed=470;this.snapDamage=1;this.snapCooldown=.42;this.cooldown=0;this.snapRange=142;this.magnet=1;this.invuln=0}
  update(input,dt,w,h){const m=input.getMove();const accel=2200;this.vx+=m.x*accel*dt;this.vy+=m.y*accel*dt;const max=this.speed,sp=Math.hypot(this.vx,this.vy);if(sp>max){this.vx=this.vx/sp*max;this.vy=this.vy/sp*max}this.vx*=Math.pow(.0008,dt);this.vy*=Math.pow(.0008,dt);this.x+=this.vx*dt;this.y+=this.vy*dt;this.x=Math.max(this.r,Math.min(w-this.r,this.x));this.y=Math.max(this.r+55,Math.min(h-this.r,this.y));this.cooldown=Math.max(0,this.cooldown-dt);this.invuln=Math.max(0,this.invuln-dt)}
  aim(input,enemies){let x=input.pointer.x-this.x,y=input.pointer.y-this.y;if(!input.pointer.active||Math.hypot(x,y)<10){const m=input.getMove();if(Math.hypot(m.x,m.y)>0){x=m.x;y=m.y}else if(enemies.length){const e=enemies[0];x=e.x-this.x;y=e.y-this.y}else{x=1;y=0}}const d=Math.hypot(x,y)||1;return{x:x/d,y:y/d}
  }
  hurt(amount){if(this.invuln>0)return false;this.health-=amount;this.invuln=.8;return true}
  draw(ctx,aim,time){ctx.save();ctx.translate(this.x,this.y);ctx.rotate(Math.atan2(aim.y,aim.x));ctx.globalAlpha=this.invuln>0&&Math.floor(time*18)%2?0.35:1;ctx.shadowBlur=25;ctx.shadowColor='#5ceaff';ctx.fillStyle='#b9f8ff';ctx.beginPath();ctx.arc(0,0,this.r,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#173b75';ctx.beginPath();ctx.arc(5,-5,5,0,Math.PI*2);ctx.arc(5,5,5,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ff5ca7';ctx.beginPath();ctx.moveTo(18,0);ctx.lineTo(8,-7);ctx.lineTo(8,7);ctx.closePath();ctx.fill();ctx.restore()}
}
export class Enemy {
  constructor(x,y,type,wave){this.x=x;this.y=y;this.type=type;this.r=type==='brute'?25:type==='dasher'?14:16;this.maxHp=type==='brute'?3:1;this.hp=this.maxHp;this.speed=(type==='runner'?105:type==='brute'?48:78)+wave*5;this.damage=type==='brute'?18:10;this.knockX=0;this.knockY=0;this.flash=0;this.phase=Math.random()*8}
  update(player,dt){let dx=player.x-this.x,dy=player.y-this.y,d=Math.hypot(dx,dy)||1;let boost=this.type==='dasher'&&Math.sin(this.phase+performance.now()/380)>0.7?1.9:1;this.x+=dx/d*this.speed*boost*dt+this.knockX*dt;this.y+=dy/d*this.speed*boost*dt+this.knockY*dt;this.knockX*=Math.pow(.001,dt);this.knockY*=Math.pow(.001,dt);this.flash=Math.max(0,this.flash-dt)}
  hit(dmg,kx,ky){this.hp-=dmg;this.flash=.12;this.knockX=kx;this.knockY=ky;return this.hp<=0}
  draw(ctx){const c=this.type==='brute'?'#ff557d':this.type==='dasher'?'#c178ff':'#ff9b61';ctx.save();ctx.translate(this.x,this.y);ctx.rotate(Math.atan2(this.y,this.x));ctx.shadowBlur=18;ctx.shadowColor=c;ctx.fillStyle=this.flash>0?'#fff':c;ctx.beginPath();if(this.type==='brute')ctx.roundRect(-this.r,-this.r,this.r*2,this.r*2,8);else{ctx.moveTo(0,-this.r);ctx.lineTo(this.r,this.r);ctx.lineTo(-this.r,this.r);ctx.closePath()}ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#180d32';ctx.beginPath();ctx.arc(-5,-3,3,0,Math.PI*2);ctx.arc(5,-3,3,0,Math.PI*2);ctx.fill();if(this.maxHp>1){ctx.fillStyle='#31182f';ctx.fillRect(-this.r,-this.r-8,this.r*2,3);ctx.fillStyle='#ffcf6b';ctx.fillRect(-this.r,-this.r-8,this.r*2*(this.hp/this.maxHp),3)}ctx.restore()}
}
export class Gem {
  constructor(x,y){this.x=x;this.y=y;this.r=7;this.t=Math.random()*6}
  update(dt){this.t+=dt*4}
  draw(ctx){ctx.save();ctx.translate(this.x,this.y+Math.sin(this.t)*3);ctx.rotate(Math.PI/4);ctx.shadowBlur=18;ctx.shadowColor='#ffe477';ctx.fillStyle='#ffe477';ctx.fillRect(-6,-6,12,12);ctx.restore()}
}