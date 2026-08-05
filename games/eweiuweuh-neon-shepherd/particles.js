export class ParticleSystem {
  constructor() { this.items=[]; this.texts=[]; }
  burst(x,y,color,count=12,speed=150) { for(let i=0;i<count;i++){const a=Math.random()*Math.PI*2,s=(.25+.75*Math.random())*speed;this.items.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.35+.45*Math.random(),max:.8,size:2+Math.random()*4,color});} }
  spark(x,y,color,count=5) { this.burst(x,y,color,count,80); }
  text(x,y,value,color='#fff') { this.texts.push({x,y,value,color,life:1,vy:-28}); }
  update(dt) { for(const p of this.items){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.96;p.vy*=.96;p.life-=dt;} this.items=this.items.filter(p=>p.life>0); for(const t of this.texts){t.y+=t.vy*dt;t.life-=dt;}this.texts=this.texts.filter(t=>t.life>0); }
  draw(ctx) { for(const p of this.items){ctx.globalAlpha=Math.max(0,p.life/p.max);ctx.fillStyle=p.color;ctx.shadowBlur=12;ctx.shadowColor=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.size*(p.life/.8),0,Math.PI*2);ctx.fill();} for(const t of this.texts){ctx.globalAlpha=t.life;ctx.shadowBlur=10;ctx.shadowColor=t.color;ctx.fillStyle=t.color;ctx.font='bold 14px Arial';ctx.textAlign='center';ctx.fillText(t.value,t.x,t.y);}ctx.globalAlpha=1;ctx.shadowBlur=0; }
}