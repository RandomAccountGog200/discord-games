export class ParticleSystem {
  constructor() { this.items = []; }
  burst(x,y,color,count=12,speed=150) {
    for (let i=0;i<count;i++) { const a=Math.random()*Math.PI*2, s=speed*(.35+Math.random()*.8); this.items.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.35+Math.random()*.5,max:.8,size:2+Math.random()*4,color}); }
  }
  trail(x,y,color) { this.items.push({x,y,vx:(Math.random()-.5)*25,vy:20+Math.random()*30,life:.25,max:.25,size:2+Math.random()*3,color}); }
  update(dt) { for (const p of this.items) { p.life-=dt; p.x+=p.vx*dt; p.y+=p.vy*dt; p.vx*=.985; p.vy*=.985; } this.items=this.items.filter(p=>p.life>0); }
  draw(ctx) { for (const p of this.items) { ctx.globalAlpha=Math.max(0,p.life/p.max); ctx.fillStyle=p.color; ctx.shadowBlur=12; ctx.shadowColor=p.color; ctx.beginPath(); ctx.arc(p.x,p.y,p.size,0,Math.PI*2); ctx.fill(); } ctx.globalAlpha=1; ctx.shadowBlur=0; }
}