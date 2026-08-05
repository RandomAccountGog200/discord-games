export class ParticleSystem {
  constructor(){this.items=[];this.rings=[]}
  burst(x,y,color,count=12,power=100){for(let i=0;i<count;i++){const a=Math.random()*Math.PI*2,s=Math.random()*power*.7+power*.3;this.items.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.35+Math.random()*.5,max:.85,size:2+Math.random()*3,color});}}
  ring(x,y,color,r=20){this.rings.push({x,y,color,r,life:.45,max:.45})}
  update(dt){for(const p of this.items){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.95;p.vy*=.95;p.life-=dt}this.items=this.items.filter(p=>p.life>0);for(const r of this.rings){r.r+=260*dt;r.life-=dt}this.rings=this.rings.filter(r=>r.life>0)}
  draw(ctx){for(const r of this.rings){ctx.save();ctx.globalAlpha=r.life/r.max;ctx.strokeStyle=r.color;ctx.lineWidth=3;ctx.shadowBlur=18;ctx.shadowColor=r.color;ctx.beginPath();ctx.arc(r.x,r.y,r.r,0,Math.PI*2);ctx.stroke();ctx.restore()}for(const p of this.items){ctx.save();ctx.globalAlpha=Math.max(0,p.life/p.max);ctx.fillStyle=p.color;ctx.shadowBlur=12;ctx.shadowColor=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill();ctx.restore()}}
}