const COLS=16, ROWS=11, TILE=48, OX=0, OY=88;
export class Farm {
  constructor(){this.tiles=[];this.setup();}
  setup(){this.tiles=[];for(let y=0;y<ROWS;y++){for(let x=0;x<COLS;x++){const plot=x>=3&&x<=12&&y>=2&&y<=8;this.tiles.push({x,y,plot,tilled:false,crop:null,watered:false});}}}
  tileAt(x,y){const tx=Math.floor((x-OX)/TILE),ty=Math.floor((y-OY)/TILE);return this.tiles.find(t=>t.x===tx&&t.y===ty)||null;}
  cropAt(x,y){return this.tiles.find(t=>t.x===x&&t.y===y)||null;}
  center(t){return{x:OX+t.x*TILE+TILE/2,y:OY+t.y*TILE+TILE/2};}
  randomCrop(){const a=this.tiles.filter(t=>t.crop);return a.length?a[Math.floor(Math.random()*a.length)]:null;}
  resetDay(){for(const t of this.tiles){t.watered=false;if(t.crop)t.crop.damaged=false;}}
  grow(dt,rain){for(const t of this.tiles){if(t.crop&&t.crop.stage<3&&((t.watered)||rain)){t.crop.growth+=dt*(rain?1.3:1);t.crop.stage=t.crop.growth<18?0:t.crop.growth<38?1:t.crop.growth<58?2:3;}}}
  draw(ctx,day){
    ctx.fillStyle='#2a7957';ctx.fillRect(0,88,960,552);
    for(const t of this.tiles){const x=t.x*TILE,y=OY+t.y*TILE;
      ctx.fillStyle=(t.x+t.y)%2?'#31825c':'#2e7b57';ctx.fillRect(x,y,TILE,TILE);
      if(t.plot){ctx.fillStyle=t.tilled?'#9a633f':'#86553d';ctx.fillRect(x+3,y+3,TILE-6,TILE-6);ctx.fillStyle=t.tilled?'#704535':'#a36b45';for(let i=0;i<4;i++)ctx.fillRect(x+8+i*10,y+12+(i%2)*17,6,2);}
      else if(t.x<3&&t.y>1){ctx.fillStyle='#c99a53';ctx.fillRect(x+3,y+3,TILE-6,TILE-6);ctx.fillStyle='#e6ba68';ctx.fillRect(x+12,y+12,8,4);ctx.fillRect(x+30,y+30,9,4);}
      if(t.crop)this.drawCrop(ctx,t);
      if(t.watered){ctx.fillStyle='rgba(80,170,220,.8)';ctx.fillRect(x+5,y+5,5,5);ctx.fillRect(x+TILE-10,y+TILE-10,5,5);}
    }
    // pond
    ctx.fillStyle='#195e75';ctx.fillRect(700,106,190,72);ctx.fillStyle='#3f9eb0';ctx.fillRect(710,116,170,8);ctx.fillRect(735,143,90,5);ctx.fillStyle='#f3c969';ctx.fillRect(760,130,15,5);ctx.fillRect(780,130,10,5);
    // farmhouse and barn
    this.house(ctx,25,112,110,100,'#d66d58');this.house(ctx,810,480,125,100,'#8d638d');
    ctx.fillStyle='#fff0bd';ctx.font='bold 11px monospace';ctx.fillText('HOME',53,207);ctx.fillText('BARN',850,575);
    // market sign
    ctx.fillStyle='#513d55';ctx.fillRect(22,282,110,67);ctx.fillStyle='#ffd45b';ctx.fillRect(30,290,94,43);ctx.fillStyle='#292344';ctx.font='bold 12px monospace';ctx.fillText('MARKET',44,316);ctx.fillStyle='#6b463f';ctx.fillRect(69,349,9,28);
  }
  house(ctx,x,y,w,h,color){ctx.fillStyle='#292344';ctx.fillRect(x+5,y+10,w-10,h);ctx.fillStyle=color;ctx.fillRect(x,y+17,w,h-17);ctx.fillStyle='#e4a85e';ctx.fillRect(x-7,y,w+14,22);ctx.fillStyle='#594267';ctx.fillRect(x+w/2-12,y+h-32,24,32);ctx.fillStyle='#ffd45b';ctx.fillRect(x+w/2+7,y+h-16,5,5);}
  drawCrop(ctx,t){const p=this.center(t),x=p.x,y=p.y;
    ctx.fillStyle='#438f4f';ctx.fillRect(x-3,y-17,6,20);ctx.fillRect(x-12,y-14,7,5);ctx.fillRect(x+5,y-10,8,5);
    if(t.crop.stage>=1){ctx.fillStyle='#62ad55';ctx.fillRect(x-15,y-24,9,6);ctx.fillRect(x+7,y-22,9,6);}
    if(t.crop.stage>=2){ctx.fillStyle='#80c65e';ctx.fillRect(x-19,y-29,10,7);ctx.fillRect(x+10,y-28,10,7);}
    if(t.crop.stage>=3){ctx.fillStyle='#f08a49';ctx.fillRect(x-6,y-7,12,20);ctx.fillStyle='#ffc85d';ctx.fillRect(x-3,y-3,6,12);ctx.fillStyle='#9ce27c';ctx.fillRect(x-10,y-18,7,5);ctx.fillRect(x+5,y-19,8,5);ctx.fillStyle='#fff0bd';ctx.fillRect(x-21,y-35,7,3);ctx.fillRect(x+15,y-35,7,3);}
    if(t.crop.damaged){ctx.fillStyle='#df6957';ctx.fillRect(x+16,y+11,5,5);}
  }
  neighborsBlocked(x,y,w,h){
    const solid=[{x:25,y:112,w:110,h:100},{x:810,y:480,w:125,h:100},{x:700,y:106,w:190,h:72},{x:22,y:282,w:110,h:67}];
    return solid.some(r=>x-w/2<r.x+r.w&&x+w/2>r.x&&y-h/2<r.y+r.h&&y+h/2>r.y);
  }
}
export {TILE,OY};