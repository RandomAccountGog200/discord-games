export class ParticleSystem {
  constructor(){ this.items=[]; this.rings=[]; }
  burst(x,y,color,count=12,power=130){
    for(let i=0;i<count;i++){ const a=Math.random()*Math.PI*2, s=power*(.25+Math.random()*.8); this.items.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.35+Math.random()*.45,max:.8,size:2+Math.random()*4,color}); }
  }
  ring(x,y,color){ this.rings.push({x,y,r:8,life:.4,color}); }
  update(dt){
    for(const p of this.items){ p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.965;p.vy*=.965;p.vy+=40*dt; }
    this.items=this.items.filter(p=>p.life>0);
    for(const r of this.rings){r.life-=dt;r.r+=170*dt;}
    this.rings=this.rings.filter(r=>r.life>0);
  }
  draw(ctx){
    for(const r of this.rings){ctx.save();ctx.globalAlpha=r.life/.4;ctx.strokeStyle=r.color;ctx.lineWidth=3;ctx.beginPath();ctx.arc(r.x,r.y,r.r,0,Math.PI*2);ctx.stroke();ctx.restore();}
    for(const p of this.items){ctx.save();ctx.globalAlpha=Math.max(0,p.life/p.max);ctx.fillStyle=p.color;ctx.shadowColor=p.color;ctx.shadowBlur=10;ctx.fillRect(p.x-p.size/2,p.y-p.size/2,p.size,p.size);ctx.restore();}
  }
}