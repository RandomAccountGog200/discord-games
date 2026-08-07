export class ParticleSystem {
  constructor() { this.items=[]; this.rings=[]; }
  burst(x,y,color,count=12,power=100) {
    for(let i=0;i<count;i++) { const a=Math.random()*Math.PI*2, s=power*(.25+Math.random()*.8); this.items.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.35+Math.random()*.45,max:.8,size:2+Math.random()*4,color}); }
  }
  ring(x,y,color,radius=8) { this.rings.push({x,y,color,r:radius,life:.38,max:.38}); }
  update(dt) {
    for(const p of this.items){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=Math.pow(.04,dt);p.vy*=Math.pow(.04,dt);p.life-=dt;}
    this.items=this.items.filter(p=>p.life>0);
    for(const r of this.rings){r.r+=170*dt;r.life-=dt;}
    this.rings=this.rings.filter(r=>r.life>0);
  }
  draw(ctx) {
    ctx.save();
    for(const r of this.rings){ctx.globalAlpha=r.life/r.max;ctx.strokeStyle=r.color;ctx.lineWidth=3;ctx.shadowBlur=18;ctx.shadowColor=r.color;ctx.beginPath();ctx.arc(r.x,r.y,r.r,0,Math.PI*2);ctx.stroke();}
    for(const p of this.items){ctx.globalAlpha=Math.max(0,p.life/p.max);ctx.fillStyle=p.color;ctx.shadowBlur=10;ctx.shadowColor=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill();}
    ctx.restore();
  }
}