export class ParticleSystem {
  constructor(){this.items=[]}
  burst(x,y,color,count=12,force=170){for(let i=0;i<count;i++){const a=Math.random()*Math.PI*2,s=force*(.25+Math.random()*.75);this.items.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.35+Math.random()*.5,max:.85,size:2+Math.random()*4,color})}}
  spark(x,y,color,count=6){this.burst(x,y,color,count,280)}
  update(dt){for(let i=this.items.length-1;i>=0;i--){const p=this.items[i];p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=Math.pow(.035,dt);p.vy*=Math.pow(.035,dt);p.vy+=35*dt;if(p.life<=0)this.items.splice(i,1)}}
  draw(ctx){for(const p of this.items){ctx.globalAlpha=Math.max(0,p.life/p.max);ctx.fillStyle=p.color;ctx.shadowBlur=12;ctx.shadowColor=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.size*(.5+p.life/p.max),0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1;ctx.shadowBlur=0}
}