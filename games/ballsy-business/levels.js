import { Deal, Enemy, Obstacle } from './entities.js';
function rng(seed) { let s=seed>>>0; return () => { s=(s*1664525+1013904223)>>>0; return s/4294967296; }; }
function safePoint(x,y,obstacles,margin=30) { return !obstacles.some(o=>x>o.x-margin&&x<o.x+o.w+margin&&y>o.y-margin&&y<o.y+o.h+margin); }
function point(r, obstacles, avoidX=500, avoidY=325) { for(let i=0;i<100;i++){const x=60+r()*880,y=95+r()*500;if(Math.hypot(x-avoidX,y-avoidY)>120&&safePoint(x,y,obstacles))return{x,y};} return{x:80+r()*840,y:110+r()*450}; }
export function generateWave(wave) {
  const r=rng(9182+wave*771); const obstacles=[]; const count=3+wave;
  for(let i=0;i<count;i++){let x=120+r()*690,y=105+r()*390,w=70+r()*100,h=24+r()*32;if(safePoint(x+w/2,y+h/2,obstacles,25)&&!(x<390&&x+w>350&&y<390&&y+h>260))obstacles.push(new Obstacle(x,y,w,h));}
  const deals=[];const dealCount=6+wave*2;for(let i=0;i<dealCount;i++){const p=point(r,obstacles);deals.push(new Deal(p.x,p.y,100+wave*20));}
  const enemies=[];const enemyCount=2+Math.floor(wave*1.25);for(let i=0;i<enemyCount;i++){const p=point(r,obstacles);let type=wave>1&&i%4===0?1:0;if(wave>3&&i===enemyCount-1)type=2;enemies.push(new Enemy(p.x,p.y,type));}
  return {obstacles,deals,enemies,time:48-wave*2};
}