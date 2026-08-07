function random(seed) { let t = seed + 0x6D2B79F5; return () => { t += 0x6D2B79F5; let r=Math.imul(t^t>>>15,1|t); r^=r+Math.imul(r^r>>>7,61|r); return ((r^r>>>14)>>>0)/4294967296; }; }
function overlaps(a,b,pad=18) { return a.x < b.x+b.w+pad && a.x+a.w+pad > b.x && a.y < b.y+b.h+pad && a.y+a.h+pad > b.y; }
export function generateRoom(wave, width=960, height=540) {
  const rand=random(7731+wave*997), walls=[];
  const count=5+Math.min(5,wave);
  for(let i=0;i<count;i++){
    let tries=0, wall;
    do { const horizontal=rand()>.45; wall={x:100+rand()*680,y:85+rand()*350,w:horizontal?90+rand()*125:24+rand()*25,h:horizontal?24+rand()*25:70+rand()*115}; tries++; }
    while(tries<30 && (overlaps(wall,{x:350,y:185,w:260,h:170},20) || walls.some(w=>overlaps(wall,w,14))));
    if(tries<30) walls.push(wall);
  }
  const spawns=[];
  for(let i=0;i<18;i++){ const side=i%4; spawns.push(side===0?{x:48,y:85+rand()*370}:side===1?{x:912,y:85+rand()*370}:side===2?{x:110+rand()*740,y:55}: {x:110+rand()*740,y:485}); }
  return { walls, spawns, seed:7731+wave*997 };
}