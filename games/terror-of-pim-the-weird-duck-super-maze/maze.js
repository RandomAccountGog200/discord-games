export class Maze {
  constructor(cols, rows) {
    this.cols=cols; this.rows=rows; this.grid=Array.from({length:rows},()=>Array(cols).fill(1)); this.generate();
  }
  generate() {
    const stack=[[1,1]]; this.grid[1][1]=0;
    while(stack.length){ const [x,y]=stack[stack.length-1], choices=[];
      [[2,0],[-2,0],[0,2],[0,-2]].forEach(([dx,dy])=>{const nx=x+dx,ny=y+dy;if(nx>0&&ny>0&&nx<this.cols-1&&ny<this.rows-1&&this.grid[ny][nx]) choices.push([nx,ny,dx,dy]);});
      if(!choices.length){stack.pop();continue;} const [nx,ny,dx,dy]=choices[Math.floor(Math.random()*choices.length)]; this.grid[y+dy/2][x+dx/2]=0;this.grid[ny][nx]=0;stack.push([nx,ny]);
    }
  }
  isWall(x,y){return x<0||y<0||x>=this.cols||y>=this.rows||this.grid[y][x]===1;}
  floors(){const out=[];for(let y=1;y<this.rows-1;y++)for(let x=1;x<this.cols-1;x++)if(!this.grid[y][x])out.push({x,y});return out;}
  scattered(count, start={x:1,y:1}, blocked=[]) {
    const candidates=this.floors().filter(c=>!blocked.some(b=>b.x===c.x&&b.y===c.y));
    candidates.sort((a,b)=>Math.hypot(b.x-start.x,b.y-start.y)-Math.hypot(a.x-start.x,a.y-start.y));
    const chosen=[]; for(const c of candidates){if(chosen.every(q=>Math.hypot(q.x-c.x,q.y-c.y)>Math.min(5,this.cols/4))){chosen.push(c);if(chosen.length===count)break;}}
    while(chosen.length<count) chosen.push(candidates[Math.floor(Math.random()*candidates.length)]); return chosen;
  }
  neighbors(c){return [[c.x+1,c.y],[c.x-1,c.y],[c.x,c.y+1],[c.x,c.y-1]].filter(([x,y])=>!this.isWall(x,y)).map(([x,y])=>({x,y}));}
  path(from,to){
    const key=p=>p.x+','+p.y, q=[from], came=new Map([[key(from),null]]); let end=null;
    while(q.length){const cur=q.shift();if(cur.x===to.x&&cur.y===to.y){end=cur;break;}for(const n of this.neighbors(cur)){if(!came.has(key(n))){came.set(key(n),cur);q.push(n);}}}
    if(!end)return[];const route=[];let cur=end;while(cur){route.unshift(cur);cur=came.get(key(cur));}return route;
  }
  draw(ctx,L) {
    ctx.save(); ctx.shadowBlur=0;
    for(let y=0;y<this.rows;y++)for(let x=0;x<this.cols;x++){const sx=L.ox+x*L.t,sy=L.oy+y*L.t;
      if(this.grid[y][x]){ctx.fillStyle='#160d2d';ctx.fillRect(sx,sy,L.t+.5,L.t+.5);ctx.fillStyle='rgba(135,75,218,.12)';ctx.fillRect(sx+L.t*.1,sy+L.t*.1,L.t*.8,L.t*.1);}
      else{ctx.fillStyle=(x+y)%2?'#281743':'#2b194a';ctx.fillRect(sx,sy,L.t+.5,L.t+.5);ctx.strokeStyle='rgba(152,105,219,.09)';ctx.strokeRect(sx,sy,L.t, L.t);}
    }
    ctx.strokeStyle='rgba(205,122,255,.42)';ctx.lineWidth=2;ctx.strokeRect(L.ox,L.oy,this.cols*L.t,this.rows*L.t);ctx.restore();
  }
}