import {Input} from './input.js';
import {AudioSystem} from './audio.js';
import {ParticleSystem} from './particles.js';
import {Player,Pest} from './entities.js';
import {Farm,TILE,OY} from './farm.js';
import {UI} from './ui.js';

const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
const input=new Input(canvas),audio=new AudioSystem(),particles=new ParticleSystem(),ui=new UI();ui.bind();
let state='menu',last=performance.now(),acc=0,shake=0,flash=0;
let game={};let farm,player,pests=[];
let best=Number(localStorage.getItem('carrotCountryBest')||0);

function newGame(){
  farm=new Farm();player=new Player(180,555);pests=[];
  game={day:1,time:150,gold:80,energy:100,seeds:20,fertilizer:2,carrots:0,todayHarvested:0,goal:4,tool:'hoe',rain:Math.random()<.25,canLevel:0,misses:0,earned:0};
  state='playing';audio.unlock();audio.startMusic();ui.hud(game);particles.items=[];
}
function setState(s){state=s;if(s==='menu')ui.menu(best);if(s==='paused')ui.show('pause-screen');}
function beginDay(){game.day++;game.time=150;game.energy=100;game.todayHarvested=0;game.goal=3+Math.ceil(game.day*.75);game.rain=Math.random()<(.18+game.day*.035);game.earned=0;farm.resetDay();pests=[];state='playing';ui.hud(game);audio.click();}
function blocked(x,y,w,h){return farm.neighborsBlocked(x,y,w,h);}
function spawnPests(){const count=Math.min(1+Math.floor(game.day/2),6);for(let i=0;i<count;i++){const t=farm.randomCrop();if(t){const p=farm.center(t);pests.push(new Pest(p.x+Math.random()*160-80,p.y+Math.random()*160-80));}}}
function update(dt){
  if(state!=='playing')return;
  game.time-=dt;game.energy=Math.min(100,game.energy+dt*.35);
  player.update(dt,input,blocked);farm.grow(dt,game.rain);particles.update(dt);shake=Math.max(0,shake-dt*2.8);flash=Math.max(0,flash-dt*3.5);
  for(const p of pests)p.update(dt,farm);
  if(game.time<120 && pests.length===0)spawnPests();
  if(input.pressed('1'))game.tool='hoe';if(input.pressed('2'))game.tool='seed';if(input.pressed('3'))game.tool='water';if(input.pressed('4'))game.tool='harvest';if(input.pressed('5'))game.tool='fertilizer';
  if(input.pressed('Escape')){state='paused';ui.show('pause-screen');audio.click();return;}
  if(input.consumeAction())useTool();
  if(game.time<=0)endDay();
  ui.hud(game);input.endFrame();
}
function useTool(){
  if(game.energy<3){audio.hit();flash=.18;particles.sparkle(player.x,player.y,'#df6957');return;}
  // A pest in arm's reach can always be shooed away, rewarding awareness.
  const near=pests.findIndex(p=>Math.hypot(p.x-player.x,p.y-player.y)<48);
  if(near>=0){const p=pests.splice(near,1)[0];game.energy-=3;particles.burst(p.x,p.y,'#ff9670',14,100);audio.hit();shake=.18;return;}
  const pos=player.target(),t=farm.tileAt(pos.x,pos.y);if(!t||!t.plot)return;
  const c=farm.center(t);
  if(game.tool==='hoe'&&!t.crop){if(!t.tilled){t.tilled=true;game.energy-=4;particles.burst(c.x,c.y,'#c88a52',8,40);audio.plant();}}
  else if(game.tool==='seed'&&t.tilled&&!t.crop&&game.seeds>0){t.crop={growth:0,stage:0,damaged:false};game.seeds--;game.energy-=2;particles.burst(c.x,c.y,'#9ce27c',8,45);audio.plant();}
  else if(game.tool==='water'&&t.crop&&!t.watered){t.watered=true;game.energy-=3;particles.burst(c.x,c.y,'#66c7e5',12,60);audio.water();}
  else if(game.tool==='fertilizer'&&t.crop&&t.crop.stage<3&&game.fertilizer>0){t.crop.growth+=24;t.crop.stage=Math.min(3,Math.floor(t.crop.growth/20));game.fertilizer--;game.energy-=5;particles.sparkle(c.x,c.y,'#ffd45b');audio.coin();}
  else if(game.tool==='harvest'&&t.crop&&t.crop.stage>=3){const quality=t.crop.damaged?.8:1;const value=Math.round((16+game.day*2)*quality);game.gold+=value;game.earned+=value;game.carrots++;game.todayHarvested++;t.crop=null;t.watered=false;game.energy-=4;particles.burst(c.x,c.y,'#f08a49',18,100);particles.sparkle(c.x,c.y,'#ffd45b');audio.harvest();shake=.1;flash=.08;}
}
function endDay(){
  game.time=0;const bonus=game.todayHarvested>=game.goal?35+game.day*5:0;const earn=game.earned;game.gold+=bonus;game.misses+=game.todayHarvested<game.goal?1:0;
  if(game.day>=10){finish(true);return;} state='summary';ui.summary(game,earn,bonus);audio.coin();
}
function finish(win){state=win?'win':'gameover';best=Math.max(best,game.carrots);localStorage.setItem('carrotCountryBest',best);ui.end(game,win,best);audio.stopMusic();if(win){particles.burst(480,340,'#ffd45b',40,170);}}
function shop(kind){
  if(state!=='summary')return;
  if(kind==='seeds'&&game.gold>=20){game.gold-=20;game.seeds+=10;audio.coin();}
  if(kind==='fertilizer'&&game.gold>=35){game.gold-=35;game.fertilizer+=2;audio.coin();}
  if(kind==='can'&&game.gold>=80&&game.canLevel<1){game.gold-=80;game.canLevel=1;game.energy=Math.min(100,game.energy+20);audio.coin();}
  ui.summary(game,game.earned,game.todayHarvested>=game.goal?35+game.day*5:0);
}
ui.on('start',()=>{audio.unlock();audio.click();newGame();});
ui.on('restart',()=>{audio.click();newGame();});
ui.on('pause',()=>{if(state==='playing'){state='paused';ui.show('pause-screen');audio.click();}});
ui.on('resume',()=>{if(state==='paused'){state='playing';ui.hud(game);audio.click();}});
ui.on('menu',()=>{audio.stopMusic();state='menu';ui.menu(best);audio.click();});
ui.on('next',()=>{if(state==='summary')beginDay();});
ui.on('seeds',()=>shop('seeds'));ui.on('fertilizer',()=>shop('fertilizer'));ui.on('can',()=>shop('can'));
ui.on('click',()=>audio.click());ui.on('tool:seed',()=>game.tool='seed');ui.on('tool:water',()=>game.tool='water');

function draw(){
  ctx.save();if(shake)ctx.translate((Math.random()-.5)*shake*35,(Math.random()-.5)*shake*35);
  farm?.draw(ctx,game.day);
  if(state!=='menu'&&farm){for(const p of pests)p.draw(ctx);player.draw(ctx);particles.draw(ctx);drawWorldLabels();}
  if(flash){ctx.fillStyle=`rgba(255,245,180,${flash})`;ctx.fillRect(0,0,960,640);}ctx.restore();
}
function drawWorldLabels(){ctx.font='bold 10px monospace';ctx.fillStyle='#fff0bd';ctx.globalAlpha=.72;ctx.fillText('PLOT A',155,205);ctx.fillText('PLOT B',585,205);ctx.globalAlpha=1;}
function loop(now){let dt=Math.min(.1,(now-last)/1000);last=now;acc+=dt;while(acc>=1/60){update(1/60);acc-=1/60;}draw();requestAnimationFrame(loop);}
ui.menu(best);requestAnimationFrame(loop);