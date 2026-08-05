export class Player {
  constructor() { this.reset(); }
  reset() { this.x=0; this.y=0; this.vx=0; this.vy=0; this.radius=22; this.speed=380; this.maxHealth=3; this.health=3; this.invuln=0; this.dashTime=0; this.dashCooldown=0; this.dashDamage=2; this.facing=1; }
  update(dt,input,width,height,game) {
    const axis=input.axis();
    if (input.consumeDash() && this.dashCooldown<=0) {
      let dx=axis.x,dy=axis.y; if (!dx&&!dy) dx=this.facing;
      const len=Math.hypot(dx,dy)||1; this.vx=dx/len*940; this.vy=dy/len*940; this.dashTime=.19; this.dashCooldown=1.0*(game.upgrades.fins?.cooldown||1); game.audio.dash(); game.shake=8;
      game.particles.burst(this.x,this.y,'#ffe08b',15,210);
    }
    const boost=this.dashTime>0?1.25:1;
    if (this.dashTime<=0) { this.vx += axis.x*this.speed*7*dt; this.vy += axis.y*this.speed*7*dt; }
    const limit=this.speed*boost; const vel=Math.hypot(this.vx,this.vy); if (vel>limit) { this.vx=this.vx/vel*limit; this.vy=this.vy/vel*limit; }
    this.x+=this.vx*dt; this.y+=this.vy*dt; this.vx*=Math.pow(.0008,dt); this.vy*=Math.pow(.0008,dt);
    this.x=Math.max(this.radius,Math.min(width-this.radius,this.x)); this.y=Math.max(105,Math.min(height-40,this.y));
    if(axis.x) this.facing=axis.x;
    this.invuln=Math.max(0,this.invuln-dt); this.dashTime=Math.max(0,this.dashTime-dt); this.dashCooldown=Math.max(0,this.dashCooldown-dt);
    if (Math.random()<.7) game.particles.trail(this.x-this.facing*20,this.y+7,'#fff0af');
  }
  hurt(game,amount=1) { if(this.invuln>0)return false; this.health-=amount; this.invuln=.9; game.audio.hit(); game.shake=13; game.flash=.16; game.particles.burst(this.x,this.y,'#ff6e91',22,240); return true; }
  draw(ctx) {
    if(this.invuln>0 && Math.floor(this.invuln*16)%2===0)return;
    ctx.save(); ctx.translate(this.x,this.y); ctx.scale(this.facing,1);
    ctx.shadowBlur=18;ctx.shadowColor='#ffb678';
    ctx.fillStyle='#e98d58';ctx.beginPath();ctx.moveTo(-24,4);ctx.lineTo(-43,-13);ctx.lineTo(-39,14);ctx.closePath();ctx.fill();
    ctx.fillStyle='#e9a061';ctx.beginPath();ctx.ellipse(0,0,29,20,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#f8c27b';ctx.beginPath();ctx.ellipse(5,-1,23,16,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#d8794e';ctx.beginPath();ctx.moveTo(-2,-16);ctx.lineTo(8,-31);ctx.lineTo(16,-13);ctx.closePath();ctx.fill();
    ctx.fillStyle='#fff8d4';ctx.beginPath();ctx.arc(17,-8,6,0,Math.PI*2);ctx.fill();ctx.fillStyle='#142340';ctx.beginPath();ctx.arc(19,-8,3,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#a85d42'; for(const [x,y,r] of [[-8,4,2.5],[7,7,2],[-1,-7,2],[14,5,1.7],[-15,-4,1.5]]){ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
    ctx.restore(); ctx.shadowBlur=0;
  }
}