export class Hazard {
  constructor(x,y,type,level) { this.x=x;this.y=y;this.type=type;this.level=level;this.radius=type==='jelly'?24:20;this.t=Math.random()*8;this.vy=75+level*15;this.dead=false; }
  update(dt,game) { this.t+=dt; this.y+=this.vy*dt; if(this.type==='jelly')this.x+=Math.sin(this.t*2.2)*38*dt; if(this.y>game.height+70)this.dead=true; }
  draw(ctx) { ctx.save();ctx.translate(this.x,this.y);ctx.shadowBlur=17;ctx.shadowColor=this.type==='jelly'?'#ff71c9':'#ff9b72';
    if(this.type==='jelly'){ctx.fillStyle='#ef70bb';ctx.globalAlpha=.85;ctx.beginPath();ctx.arc(0,-4,18,Math.PI,0);ctx.lineTo(18,10);ctx.quadraticCurveTo(9,4,0,13);ctx.quadraticCurveTo(-9,4,-18,10);ctx.closePath();ctx.fill();ctx.strokeStyle='#ffb4dc';ctx.lineWidth=2;for(let i=-10;i<15;i+=8){ctx.beginPath();ctx.moveTo(i,9);ctx.bezierCurveTo(i-4,22,i+7,22,i+2,31);ctx.stroke();}}
    else{ctx.fillStyle='#ed775d';ctx.beginPath();ctx.arc(0,0,18,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#ffc071';ctx.lineWidth=2;for(let i=0;i<8;i++){const a=i*Math.PI/4;ctx.beginPath();ctx.moveTo(Math.cos(a)*8,Math.sin(a)*8);ctx.lineTo(Math.cos(a)*19,Math.sin(a)*19);ctx.stroke();}ctx.fillStyle='#512d54';ctx.beginPath();ctx.arc(-6,-4,3,0,Math.PI*2);ctx.arc(6,4,3,0,Math.PI*2);ctx.fill();}
    ctx.restore();ctx.globalAlpha=1;ctx.shadowBlur=0;
  }
}
export class Pearl {
  constructor(x,y,level){this.x=x;this.y=y;this.level=level;this.radius=11;this.t=Math.random()*6;this.dead=false;this.vy=45+level*8;}
  update(dt,game){this.t+=dt;this.y+=this.vy*dt;if(this.y>game.height+30)this.dead=true;}
  draw(ctx){ctx.save();ctx.translate(this.x,this.y+Math.sin(this.t*3)*4);ctx.shadowBlur=20;ctx.shadowColor='#fff1a0';ctx.fillStyle='#ffe68e';ctx.beginPath();ctx.arc(0,0,9,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fffde0';ctx.beginPath();ctx.arc(-3,-3,3,0,Math.PI*2);ctx.fill();ctx.restore();ctx.shadowBlur=0;}
}
export class Projectile {
  constructor(x,y,vx,vy){this.x=x;this.y=y;this.vx=vx;this.vy=vy;this.radius=8;this.dead=false;}
  update(dt,game){this.x+=this.vx*dt;this.y+=this.vy*dt;if(this.x<-30||this.x>game.width+30||this.y>game.height+30)this.dead=true;}
  draw(ctx){ctx.save();ctx.shadowBlur=13;ctx.shadowColor='#a66dff';ctx.fillStyle='#d39aff';ctx.beginPath();ctx.arc(this.x,this.y,this.radius,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.globalAlpha=.7;ctx.beginPath();ctx.arc(this.x-3,this.y-3,2,0,Math.PI*2);ctx.fill();ctx.restore();}
}
export class IceCreamOctopus {
  constructor(x,level){this.x=x;this.y=170;this.level=level;this.maxHealth=10+level*4;this.health=this.maxHealth;this.radius=58;this.t=0;this.fire=1.2;this.hitTimer=0;this.dead=false;}
  update(dt,game){this.t+=dt;this.x=game.width/2+Math.sin(this.t*.7)*Math.min(170,game.width*.25);this.y=158+Math.sin(this.t*1.7)*18;this.fire-=dt;this.hitTimer=Math.max(0,this.hitTimer-dt);if(this.fire<=0){this.fire=1.25-Math.min(.35,this.level*.05);const dx=game.player.x-this.x,dy=game.player.y-this.y,len=Math.hypot(dx,dy)||1;game.entities.push(new Projectile(this.x,this.y,dx/len*(155+this.level*20),dy/len*(155+this.level*20)));game.particles.burst(this.x,this.y,'#d99cff',6,80);}}
  damage(amount,game){if(this.hitTimer>0)return;this.hitTimer=.18;this.health-=amount;game.audio.bossHit();game.shake=10;game.flash=.08;game.particles.burst(this.x,this.y,'#ffd27a',13,190);if(this.health<=0){this.dead=true;game.audio.upgrade();game.particles.burst(this.x,this.y,'#ff9cc7',65,340);}}
  draw(ctx){ctx.save();ctx.translate(this.x,this.y);ctx.shadowBlur=24;ctx.shadowColor='#ff82c1';ctx.strokeStyle='#db68ac';ctx.lineWidth=10;for(let i=0;i<8;i++){const a=-Math.PI*.9+i*Math.PI*1.8/7;ctx.beginPath();ctx.moveTo(Math.cos(a)*27,28);ctx.bezierCurveTo(Math.cos(a)*65,47,Math.cos(a)*72,75+Math.sin(this.t+i)*8,Math.cos(a)*48,91);ctx.stroke();}ctx.fillStyle='#ff91c3';ctx.beginPath();ctx.arc(0,0,46,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ffd4e4';ctx.beginPath();ctx.moveTo(-37,-11);ctx.quadraticCurveTo(-45,-52,-15,-51);ctx.quadraticCurveTo(3,-80,22,-50);ctx.quadraticCurveTo(50,-49,38,-9);ctx.closePath();ctx.fill();ctx.fillStyle='#f3b069';ctx.beginPath();ctx.moveTo(-25,-43);ctx.lineTo(25,-43);ctx.lineTo(0,17);ctx.closePath();ctx.fill();ctx.fillStyle='#402552';ctx.beginPath();ctx.arc(-14,5,5,0,Math.PI*2);ctx.arc(14,5,5,0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(-12,3,2,0,Math.PI*2);ctx.arc(16,3,2,0,Math.PI*2);ctx.fill();ctx.restore();ctx.shadowBlur=0;}
}
export function spawnHazard(width,level){const type=Math.random()<.42?'jelly':'mine';return new Hazard(35+Math.random()*(width-70),-45,type,level);}