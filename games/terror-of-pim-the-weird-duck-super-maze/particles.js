export class ParticleSystem {
  constructor() { this.items=[]; }
  burst(x,y,color,count=14,power=1) {
    for(let i=0;i<count;i++){ const a=Math.random()*Math.PI*2, s=(.45+Math.random()*1.8)*power; this.items.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.45+Math.random()*.5,max:.9,size:.035+Math.random()*.07,color}); }
  }
  update(dt) { for(const p of this.items){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=Math.pow(.08,dt);p.vy*=Math.pow(.08,dt);p.life-=dt;} this.items=this.items.filter(p=>p.life>0); }
  draw(ctx,toScreen) { for(const p of this.items){const s=toScreen(p.x,p.y), a=Math.max(0,p.life/p.max);ctx.globalAlpha=a;ctx.fillStyle=p.color;ctx.shadowColor=p.color;ctx.shadowBlur=12;ctx.beginPath();ctx.arc(s.x,s.y,p.size*(.4+a)*toScreen.scale,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;ctx.shadowBlur=0; }
}