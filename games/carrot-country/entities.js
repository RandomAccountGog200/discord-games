export class Player {
  constructor(x,y){this.x=x;this.y=y;this.w=22;this.h=25;this.speed=155;this.dir='down';this.energy=100;this.tool='hoe';this.anim=0;}
  update(dt,input,blocked){
    let dx=(input.isDown('d','ArrowRight')?1:0)-(input.isDown('a','ArrowLeft')?1:0),dy=(input.isDown('s','ArrowDown')?1:0)-(input.isDown('w','ArrowUp')?1:0);
    if(dx||dy){const len=Math.hypot(dx,dy);dx/=len;dy/=len;if(Math.abs(dx)>Math.abs(dy))this.dir=dx>0?'right':'left';else this.dir=dy>0?'down':'up';const nx=this.x+dx*this.speed*dt,ny=this.y+dy*this.speed*dt;if(!blocked(nx,this.y,this.w,this.h))this.x=nx;if(!blocked(this.x,ny,this.w,this.h))this.y=ny;this.anim+=dt*10;}else this.anim=0;
    this.x=Math.max(28,Math.min(932,this.x));this.y=Math.max(102,Math.min(616,this.y));
  }
  target(){let x=this.x,y=this.y;if(this.dir==='left')x-=40;if(this.dir==='right')x+=40;if(this.dir==='up')y-=40;if(this.dir==='down')y+=40;return{x,y};}
  draw(ctx){const bob=this.anim?Math.floor(this.anim)%2:0,x=Math.round(this.x),y=Math.round(this.y)+bob;ctx.fillStyle='#17162c';ctx.fillRect(x-12,y+15,24,7);ctx.fillStyle='#efa66c';ctx.fillRect(x-8,y-10,16,14);ctx.fillStyle='#e8bd49';ctx.fillRect(x-11,y-14,22,6);ctx.fillRect(x-7,y-18,15,5);ctx.fillStyle='#332649';ctx.fillRect(x-6,y-5,3,3);ctx.fillRect(x+4,y-5,3,3);ctx.fillStyle='#df6957';ctx.fillRect(x-10,y+4,20,14);ctx.fillStyle='#78a95e';ctx.fillRect(x-10,y+18,7,7);ctx.fillRect(x+3,y+18,7,7);}
}

export class Pest {
  constructor(x,y){this.x=x;this.y=y;this.w=18;this.h=14;this.target=null;this.bite=0;this.wiggle=Math.random()*7;}
  update(dt,farm){
    if(!this.target || !farm.cropAt(this.target.x,this.target.y)?.crop) this.target=farm.randomCrop();
    if(!this.target)return;
    const dx=this.target.x-this.x,dy=this.target.y-this.y,d=Math.hypot(dx,dy)||1;
    if(d>20){this.x+=dx/d*28*dt;this.y+=dy/d*28*dt;}else{this.bite+=dt;if(this.bite>3){const tile=farm.cropAt(this.target.x,this.target.y);if(tile?.crop){tile.crop.growth=Math.max(0,tile.crop.growth-12);tile.crop.damaged=true;}this.bite=0;}}
    this.wiggle+=dt*8;
  }
  draw(ctx){const x=Math.round(this.x),y=Math.round(this.y+Math.sin(this.wiggle)*2);ctx.fillStyle='#17162c';ctx.fillRect(x-9,y-6,18,13);ctx.fillStyle='#d96d55';ctx.fillRect(x-7,y-8,14,12);ctx.fillStyle='#ffd45b';ctx.fillRect(x-5,y-5,3,3);ctx.fillRect(x+3,y-5,3,3);ctx.fillStyle='#17162c';ctx.fillRect(x-10,y+6,4,3);ctx.fillRect(x+6,y+6,4,3);}
}