export function circleHit(a, b) { const dx = a.x - b.x, dy = a.y - b.y; const r = a.radius + b.radius; return dx * dx + dy * dy < r * r; }
export class Projectile {
  constructor(x, y, speed, damage) { this.x=x;this.y=y;this.vy=-speed;this.radius=5;this.damage=damage;this.dead=false; }
  update(dt) { this.y += this.vy * dt; if (this.y < -30) this.dead = true; }
  draw(ctx) { ctx.save();ctx.strokeStyle='#ffe38b';ctx.lineWidth=4;ctx.shadowColor='#ffcf68';ctx.shadowBlur=14;ctx.beginPath();ctx.moveTo(this.x,this.y+11);ctx.lineTo(this.x,this.y-9);ctx.stroke();ctx.fillStyle='#fff7c8';ctx.beginPath();ctx.arc(this.x,this.y-9,4,0,Math.PI*2);ctx.fill();ctx.restore(); }
}
class Hazard {
  constructor(x,y,radius,hp) { this.x=x;this.y=y;this.radius=radius;this.hp=hp;this.dead=false;this.isHazard=true;this.hitCooldown=0; }
  hit(damage, game) { this.hp -= damage; this.hitCooldown=.08; game.particles.sparkle(this.x,this.y,'#fff0a0'); if(this.hp<=0){this.dead=true;game.kills++;game.score+=120;game.particles.burst(this.x,this.y,this.type==='shark'?'#c47c5d':'#82eff0',24,170);game.audio.enemyDown();game.shake=5;} }
}
export class CookieShark extends Hazard {
  constructor(x,y,hp,zone) { super(x,y,27,hp);this.type='shark';this.zone=zone;this.phase=Math.random()*7;this.vx=(Math.random()-.5)*70; }
  update(dt,game) { this.hitCooldown-=dt;this.phase+=dt*2;this.y+=game.scrollSpeed*.82*dt;const steer=(game.player.x-this.x)*.26+Math.sin(this.phase)*65;this.vx+=(steer-this.vx)*dt*1.4;this.vx=Math.max(-150,Math.min(150,this.vx));this.x+=this.vx*dt;this.x=Math.max(30,Math.min(game.width-30,this.x));if(this.y>game.height+70)this.dead=true; }
  draw(ctx) { ctx.save();ctx.translate(this.x,this.y);ctx.scale(this.vx<0?-1:1,1);ctx.shadowColor='#d78959';ctx.shadowBlur=16;ctx.fillStyle='#9c593e';ctx.beginPath();ctx.ellipse(0,0,31,19,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#d98a58';ctx.beginPath();ctx.moveTo(-17,-12);ctx.lineTo(-34,-29);ctx.lineTo(-28,-5);ctx.moveTo(-14,12);ctx.lineTo(-31,25);ctx.lineTo(-24,5);ctx.fill();ctx.fillStyle='#f3c37b';for(let i=-12;i<18;i+=12){ctx.beginPath();ctx.arc(i,-5+(i%3)*3,3,0,Math.PI*2);ctx.fill()}ctx.fillStyle='#fff2d0';ctx.beginPath();ctx.arc(18,-7,5,0,Math.PI*2);ctx.fill();ctx.fillStyle='#111d2d';ctx.beginPath();ctx.arc(19,-7,2,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ffe7c1';ctx.beginPath();ctx.moveTo(3,12);ctx.lineTo(27,10);ctx.lineTo(8,18);ctx.fill();ctx.fillStyle='#6d3540';for(let i=8;i<24;i+=7){ctx.beginPath();ctx.moveTo(i,12);ctx.lineTo(i+3,16);ctx.lineTo(i+4,11);ctx.fill()}ctx.restore(); }
}
export class Jellyfish extends Hazard {
  constructor(x,y,hp) { super(x,y,21,hp);this.type='jelly';this.phase=Math.random()*8;this.origin=x; }
  update(dt,game) { this.hitCooldown-=dt;this.phase+=dt*2.3;this.y+=game.scrollSpeed*1.08*dt;this.x=this.origin+Math.sin(this.phase)*55;this.x=Math.max(25,Math.min(game.width-25,this.x));if(this.y>game.height+60)this.dead=true; }
  draw(ctx) { ctx.save();ctx.translate(this.x,this.y);ctx.shadowColor='#78f5ef';ctx.shadowBlur=20;ctx.fillStyle='#71d8dfcc';ctx.beginPath();ctx.arc(0,-5,20,Math.PI,0);ctx.lineTo(20,0);ctx.quadraticCurveTo(0,9,-20,0);ctx.fill();ctx.strokeStyle='#b0ffff';ctx.lineWidth=3;for(let x=-12;x<16;x+=9){ctx.beginPath();ctx.moveTo(x,1);ctx.quadraticCurveTo(x-6,16,x,25);ctx.stroke()}ctx.restore(); }
}
export class CookieMine extends Hazard {
  constructor(x,y,hp) { super(x,y,19,hp);this.type='mine';this.phase=Math.random()*5; }
  update(dt,game) { this.hitCooldown-=dt;this.phase+=dt*2;this.y+=game.scrollSpeed*1.16*dt;if(this.y>game.height+60)this.dead=true; }
  draw(ctx) { ctx.save();ctx.translate(this.x,this.y);ctx.rotate(this.phase);ctx.shadowColor='#ff8c77';ctx.shadowBlur=15;ctx.strokeStyle='#ff9a78';ctx.lineWidth=5;for(let i=0;i<8;i++){ctx.rotate(Math.PI/4);ctx.beginPath();ctx.moveTo(13,0);ctx.lineTo(25,0);ctx.stroke()}ctx.fillStyle='#8d4050';ctx.beginPath();ctx.arc(0,0,16,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ffc478';ctx.beginPath();ctx.arc(-5,-5,3,0,Math.PI*2);ctx.arc(6,4,2.5,0,Math.PI*2);ctx.fill();ctx.restore(); }
}
export class Sprinkle {
  constructor(x,y) { this.x=x;this.y=y;this.radius=11;this.dead=false;this.phase=Math.random()*5;this.hue=['#ff8da1','#ffe18a','#7eeaff','#b892ff'][Math.floor(Math.random()*4)]; }
  update(dt,game) { this.phase+=dt*4;this.y+=game.scrollSpeed*1.05*dt;if(this.y>game.height+40)this.dead=true; }
  draw(ctx) { ctx.save();ctx.translate(this.x,this.y);ctx.rotate(this.phase);ctx.shadowColor=this.hue;ctx.shadowBlur=13;ctx.strokeStyle=this.hue;ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(-6,0);ctx.lineTo(6,0);ctx.stroke();ctx.restore(); }
}