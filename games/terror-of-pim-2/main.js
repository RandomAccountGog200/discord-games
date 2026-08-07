import { Input } from './input.js';
import { AudioManager } from './audio.js';
import { ParticleSystem } from './particles.js';
import { generateRoom } from './levels.js';
import { UI } from './ui.js';
import { Player, Enemy, Projectile, Pickup, circleHit, circleRectHit } from './entities.js';

const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
const input=new Input(canvas), audio=new AudioManager(), ui=new UI(), particles=new ParticleSystem();
const BEST_KEY='terrorOfPimBest';
let best=Number(localStorage.getItem(BEST_KEY)||0);
let state='menu', last=0, accumulator=0, shake=0, flash=0, bannerTime=0;
let game={player:null,walls:[],enemies:[],shots:[],enemyShots:[],pickups:[],wave:1,score:0,roomTime:0,spawned:false};

const upgrades=[
  {id:'vitality',name:'HEART OF THE HOUSE',desc:'+25 maximum vitality and restore 25 health.'},
  {id:'rapid',name:'QUICKENED FINGERS',desc:'Fire 20% faster. Make the dark blink first.'},
  {id:'power',name:'NASTY LITTLE BULLETS',desc:'+9 damage to every shot.'},
  {id:'swift',name:'RUN LIKE HELL',desc:'+32 movement speed. Corners become suggestions.'},
  {id:'pierce',name:'THROUGH AND THROUGH',desc:'Shots pierce one additional Pim.'},
  {id:'magnet',name:'SWEET STATIC',desc:'Collect dropped courage from much farther away.'},
  {id:'dash',name:'SLIP BETWEEN HEARTBEATS',desc:'Dash cooldown reduced by 0.25 seconds.'}
];

function beginWave(n){
  game.wave=n;game.walls=generateRoom(n).walls;game.enemies=[];game.shots=[];game.enemyShots=[];game.pickups=[];game.spawned=true;game.roomTime=0;game.player.x=480;game.player.y=270;game.player.invuln=1;
  const room=generateRoom(n), points=room.spawns;
  if(n===6){game.enemies.push(new Enemy('boss',points[0].x,points[0].y,n));for(let i=0;i<5;i++)game.enemies.push(new Enemy(i%2?'spitter':'stalker',points[i+4].x,points[i+4].y,n));audio.sfx('boss');ui.banner('THE BIG PIM IS AWAKE');}
  else {const count=4+n*2;for(let i=0;i<count;i++){let type='stalker';if(n>=2&&i%5===0)type='spitter';if(n>=3&&i%7===0)type='brute';game.enemies.push(new Enemy(type,points[i%points.length].x,points[i%points.length].y,n));}ui.banner(`ROOM ${n}  ·  ${count} PIMS`);}
}
function startGame(){audio.unlock();audio.startMusic();game={player:new Player(),walls:[],enemies:[],shots:[],enemyShots:[],pickups:[],wave:1,score:0,roomTime:0,spawned:false};state='playing';ui.showGame();beginWave(1);audio.sfx('click');}
function menu(){state='menu';audio.stopMusic();ui.showMenu(best);}
function pause(){if(state==='playing'){state='paused';ui.showPause();audio.sfx('click');}else if(state==='paused'){state='playing';ui.hidePause();audio.sfx('click');}}
function finishRun(won){state=won?'win':'gameover';audio.stopMusic();best=Math.max(best,game.score);localStorage.setItem(BEST_KEY,best);if(won){audio.sfx('upgrade');ui.showWin(game.score,best);}else{audio.sfx('death');ui.showGameOver(game.score,game.wave,best);}}
function chooseUpgrade(id){game.player.upgrade(id);audio.sfx('upgrade');if(game.wave>=6){finishRun(true);return;}state='playing';ui.showGame();beginWave(game.wave+1);}
function upgradeChoices(){const copy=[...upgrades];const out=[];while(out.length<3){const i=Math.floor(Math.random()*copy.length);out.push(copy.splice(i,1)[0]);}return out;}
function clearWave(){state='upgrade';particles.ring(480,270,'#42e5e5',30);ui.showUpgrade(upgradeChoices(),chooseUpgrade);}

function hurtPlayer(amount,x,y){if(game.player.hurt(amount)){particles.burst(game.player.x,game.player.y,'#ff4f88',16,150);particles.ring(game.player.x,game.player.y,'#ff4f88',16);shake=.25;flash=.12;audio.sfx('hurt');}}
function killEnemy(enemy){const value=enemy.type==='boss'?1000:enemy.type==='brute'?70:enemy.type==='spitter'?45:30;game.score+=value*game.wave;particles.burst(enemy.x,enemy.y,enemy.type==='boss'?'#ff3baf':'#a861ff',enemy.type==='boss'?45:18,enemy.type==='boss'?260:150);particles.ring(enemy.x,enemy.y,enemy.type==='boss'?'#ff3baf':'#a861ff',enemy.radius);shake=enemy.type==='boss'?.35:.08;audio.sfx(enemy.type==='boss'?'boss':'hit');if(enemy.type!=='boss'&&Math.random()<.62)game.pickups.push(new Pickup(enemy.x,enemy.y));}

function update(dt){
  if(input.consumePause())pause();
  particles.update(dt);shake=Math.max(0,shake-dt);flash=Math.max(0,flash-dt);
  if(state!=='playing')return;
  const p=game.player;game.roomTime+=dt;
  p.update(dt,input,game.walls);const target=input.aim(p.x,p.y,game.enemies);p.aimAt(target);
  if(input.firing()){const shot=p.shoot();if(shot){game.shots.push(shot);particles.burst(p.x+p.lastAim.x*17,p.y+p.lastAim.y*17,'#ff9bd0',3,45);audio.sfx('shoot');}}
  for(const e of game.enemies){const shot=e.update(dt,p,game.walls);if(shot)game.enemyShots.push(shot);if(circleHit(e,p)&&e.contact<=0){e.contact=1;hurtPlayer(e.type==='boss'?24:e.type==='brute'?18:10,e.x,e.y);}}
  for(const s of game.shots){s.update(dt,game.walls);if(s.dead)continue;for(const e of game.enemies){if(e.dead||s.hit.has(e))continue;if(circleHit(s,e)){s.hit.add(e);e.damage(s.damage);particles.burst(s.x,s.y,'#ffb0df',6,75);if(e.dead)killEnemy(e);if(s.pierce>0)s.pierce--;else{s.dead=true;break;}audio.sfx('hit');}}}
  for(const s of game.enemyShots){s.update(dt,game.walls);if(!s.dead&&circleHit(s,p)){s.dead=true;hurtPlayer(s.damage,s.x,s.y);}}
  for(const pickup of game.pickups){if(pickup.update(dt,p)){p.heal(4);game.score+=10;pickup.life=0;particles.burst(pickup.x,pickup.y,'#ffd45c',10,80);audio.sfx('pickup');}}
  game.shots=game.shots.filter(s=>!s.dead);game.enemyShots=game.enemyShots.filter(s=>!s.dead);game.pickups=game.pickups.filter(s=>s.life>0);game.enemies=game.enemies.filter(e=>!e.dead);
  if(p.hp<=0){finishRun(false);return;}
  if(game.spawned&&game.enemies.length===0&&game.roomTime>.7)clearWave();
  ui.hud(game.wave,game.score,p.hp,p.maxHp);
}

function drawBackground(){const g=ctx.createRadialGradient(480,280,30,480,280,620);g.addColorStop(0,'#281148');g.addColorStop(.55,'#130b2d');g.addColorStop(1,'#080512');ctx.fillStyle=g;ctx.fillRect(0,0,960,540);ctx.strokeStyle='#4e277044';ctx.lineWidth=1;for(let x=0;x<1000;x+=48){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,540);ctx.stroke();}for(let y=0;y<560;y+=48){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(960,y);ctx.stroke();}}
function draw(){ctx.clearRect(0,0,960,540);drawBackground();if(game.player){ctx.save();if(shake>0)ctx.translate((Math.random()-.5)*shake*28,(Math.random()-.5)*shake*28);for(const w of game.walls){ctx.fillStyle='#0b0718';ctx.shadowColor='#000';ctx.shadowBlur=12;ctx.fillRect(w.x,w.y,w.w,w.h);ctx.shadowBlur=0;ctx.strokeStyle='#72459b';ctx.lineWidth=2;ctx.strokeRect(w.x,w.y,w.w,w.h);ctx.fillStyle='#352052';ctx.fillRect(w.x+4,w.y+4,w.w-8,3);}for(const q of game.pickups)q.draw(ctx);for(const s of game.shots)s.draw(ctx);for(const s of game.enemyShots)s.draw(ctx);for(const e of game.enemies)e.draw(ctx);game.player.draw(ctx);particles.draw(ctx);ctx.restore();}if(flash>0){ctx.fillStyle=`rgba(255,110,170,${flash*2})`;ctx.fillRect(0,0,960,540);}}

function frame(time){if(!last)last=time;let dt=Math.min(.1,(time-last)/1000);last=time;accumulator+=dt;while(accumulator>=1/60){update(1/60);accumulator-=1/60;}draw();requestAnimationFrame(frame);}

document.getElementById('start-button').addEventListener('click',()=>{audio.sfx('click');startGame();});
document.getElementById('resume-button').addEventListener('click',pause);
document.getElementById('pause-menu-button').addEventListener('click',()=>{audio.sfx('click');menu();});
document.getElementById('hud-pause').addEventListener('click',pause);
document.getElementById('retry-button').addEventListener('click',startGame);
document.getElementById('gameover-menu-button').addEventListener('click',menu);
document.getElementById('win-replay-button').addEventListener('click',startGame);
document.getElementById('win-menu-button').addEventListener('click',menu);
ui.showMenu(best);ui.hud(1,0,100,100);requestAnimationFrame(frame);