export class ParticleSystem {
  constructor() { this.items=[]; }
  burst(x,y,color,count=10,power=70) { for(let i=0;i<count;i++){const a=Math.random()*Math.PI*2,s=Math.random()*power+20;this.items.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.35+Math.random()*.5,max:.85,size:2+Math.random()*4,color});} }
  sparkle(x,y,color='#ffd45b') { this.burst(x,y,color,7,45); }
  update(dt) { for(const p of this.items){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.96;p.vy=p.vy*.96+75*dt;} this.items=this.items.filter(p=>p.life>0); }
  draw(ctx) { for(const p of this.items){ctx.globalAlpha=Math.max(0,p.life/p.max);ctx.fillStyle=p.color;ctx.fillRect(Math.round(p.x),Math.round(p.y),Math.ceil(p.size),Math.ceil(p.size));}ctx.globalAlpha=1; }
}