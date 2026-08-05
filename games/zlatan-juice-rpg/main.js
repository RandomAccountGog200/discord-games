import { Input } from './input.js';
import { UI } from './ui.js';
import { Player } from './player.js';
import { Enemy, EnemyShot, Pickup, circleHit } from './entities.js';
import { ParticleSystem } from './particles.js';
import { makeWave, waveName, MAX_LEVEL } from './levels.js';
import { initAudio, startMusic, stopMusic, clickSound, pickupSound } from './audio.js';

const canvas=document.querySelector('#gameCanvas'),ctx=canvas.getContext('2d');
const input=new Input(canvas),ui=new UI(),particles=new ParticleSystem();
const game={state:'menu',level:1,score:0,best:Number(localStorage.getItem('zlatanJuiceBest')||0),player:null,enemies:[],balls:[],enemyShots:[],pickups:[],shake:0,flash:0,banner:'',bannerTime:0,roundCleared:false};

const upgrades=[
 {name:'BIGGER BOOT',description:'+9 kick damage. Every shot hits like a highlight reel.',apply:p=>p.power+=9},
 {name:'SECOND WIND',description:'+25 maximum health and recover 25 health immediately.',apply:p=>{p.maxHp+=25;p.hp=Math.min(p.maxHp,p.hp+25)}},
 {name:'TURBO LEGS',description:'+35 movement speed and a faster dash cooldown.',apply:p=>{p.speed+=35;p.dashCooldown-=.25}},
 {name:'MAGNETIC JUICE',description:'Juice bottles heal 10 more health and pull toward you.',apply:p=>p.juice+=10},
 {name:'ICE IN THE VEINS',description:'+8% critical kick chance. Critical shots deal double damage.',apply:p=>p.crit+=.08}
];
function shuffledChoices(){return [...upgrades].sort(()=>Math.random()-.5).slice(0,3);}
function startGame(){
  initAudio();clickSound();startMusic();game.state='playing';game.level=1;game.score=0;game.player=new Player();game.balls=[];game.enemyShots=[];game.pickups=[];particles.items=[];particles.rings=[];loadLevel();ui.hideAll();
}
function loadLevel(){
  game.enemies=makeWave(game.level).map(e=>new Enemy(e.type,e.x,e.y,game.level));game.roundCleared=false;game.banner=`ROUND ${game.level}  •  ${waveName(game.level)}`;game.bannerTime=2.8;game.player.x=480;game.player.y=530;game.player.vx=0;game.player.vy=0;
  particles.burst(480,300,'#63d9ff',25,100);
}
function pause(){if(game.state==='playing'){game.state='paused';stopMusic();ui.showPause();}else if(game.state==='paused'){game.state='playing';startMusic();ui.hideAll();}}
function toMenu(){stopMusic();game.state='menu';ui.showMenu(game.best);}
function selectUpgrade(o){clickSound();o.apply(game.player);game.level++;if(game.level>MAX_LEVEL){win();}else{game.state='playing';ui.hideAll();loadLevel();}}
function clearRound(){
  if(game.roundCleared)return;game.roundCleared=true;game.score+=game.level*250;particles.burst(480,180,'#ffc84a',45,230);particles.ring(480,180,'#ffc84a');
  if(game.level>=MAX_LEVEL){win();return;}
  game.state='upgrade';ui.showUpgrade(shuffledChoices(),selectUpgrade);
}
function endGame(){game.state='gameover';stopMusic();game.best=Math.max(game.best,game.score);localStorage.setItem('zlatanJuiceBest',game.best);ui.showGameOver(game.score,game.best);}
function win(){game.state='win';stopMusic();game.best=Math.max(game.best,game.score+1000);game.score+=1000;localStorage.setItem('zlatanJuiceBest',game.best);ui.showWin(game.score,game.best);}
function damageEnemy(enemy,damage,ball){
  const dead=enemy.takeDamage(damage);particles.burst(ball.x,ball.y,ball.critical?'#fff1a0':enemy.color,ball.critical?18:9,ball.critical?230:130);particles.ring(ball.x,ball.y,ball.critical?'#fff1a0':'#ff9c57');game.shake=Math.max(game.shake,ball.critical?.13:.06);game.flash=Math.max(game.flash,ball.critical?.07:.025);
  if(dead){game.score+=enemy.type==='king'?1000:enemy.type==='bruiser'?180:100;particles.burst(enemy.x,enemy.y,'#ffc84a',28,260);if(Math.random()<.42||enemy.type==='king')game.pickups.push(new Pickup(enemy.x,enemy.y));}
}
function update(dt){
  particles.update(dt);game.shake=Math.max(0,game.shake-dt);game.flash=Math.max(0,game.flash-dt);if(game.bannerTime>0)game.bannerTime-=dt;
  if(game.state!=='playing')return;
  const shot=game.player.update(dt,input);if(shot){game.balls.push(shot);particles.burst(game.player.x+Math.cos(game.player.facing)*22,game.player.y+Math.sin(game.player.facing)*22,'#fff3bd',5,70);}
  for(const b of game.balls){b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;for(const e of game.enemies){if(e.alive&&circleHit(b,e)){if(damageEnemy(e,b.damage,b))e.alive=false;b.life=0;break;}}}
  game.balls=game.balls.filter(b=>b.life>0&&b.x>-30&&b.x<990&&b.y>-30&&b.y<630);
  for(const e of game.enemies){if(!e.alive)continue;const s=e.update(dt,game.player);if(s)game.enemyShots.push(new EnemyShot(s));if(circleHit(e,game.player)&&e.contact<=0){e.contact=1;game.player.hurt(e.type==='bruiser'||e.type==='king'?18:10);game.shake=.14;particles.burst(game.player.x,game.player.y,'#ff5b55',15,150);}}
  game.enemies=game.enemies.filter(e=>e.alive);
  for(const s of game.enemyShots){s.update(dt);if(circleHit(s,game.player)){game.player.hurt(s.damage);s.life=0;game.shake=.1;particles.burst(s.x,s.y,'#ff714c',10,130);}}
  game.enemyShots=game.enemyShots.filter(s=>s.life>0&&s.x>-30&&s.x<990&&s.y>-30&&s.y<630);
  for(const p of game.pickups){p.update(dt);let d=Math.hypot(p.x-game.player.x,p.y-game.player.y);if(game.player.juice>0&&d<150){p.x+=(game.player.x-p.x)*dt*2.2;p.y+=(game.player.y-p.y)*dt*2.2;}if(circleHit(p,game.player)){game.player.hp=Math.min(game.player.maxHp,game.player.hp+25+game.player.juice);game.score+=35;pickupSound();particles.burst(p.x,p.y,'#9affd0',18,150);p.life=0;}}
  game.pickups=game.pickups.filter(p=>p.life>0);
  if(game.player.hp<=0){endGame();return;}
  if(game.enemies.length===0)clearRound();
}
function drawArena(){
  const bg=ctx.createLinearGradient(0,0,0,600);bg.addColorStop(0,'#182c3b');bg.addColorStop(.52,'#123c42');bg.addColorStop(1,'#09212d');ctx.fillStyle=bg;ctx.fillRect(0,0,960,600);
  ctx.save();ctx.globalAlpha=.16;ctx.strokeStyle='#8deaff';ctx.lineWidth=1;
  for(let x=30;x<960;x+=40){ctx.beginPath();ctx.moveTo(x,50);ctx.lineTo(x,600);ctx.stroke();}for(let y=65;y<600;y+=40){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(960,y);ctx.stroke();}
  ctx.globalAlpha=.5;ctx.strokeStyle='#d8f6dd';ctx.lineWidth=3;ctx.strokeRect(25,55,910,520);ctx.beginPath();ctx.moveTo(25,310);ctx.lineTo(935,310);ctx.stroke();ctx.beginPath();ctx.arc(480,310,78,0,Math.PI*2);ctx.stroke();ctx.strokeRect(330,55,300,95);ctx.strokeRect(390,55,180,45);ctx.restore();
  ctx.fillStyle='#f7f0cb';ctx.globalAlpha=.8;ctx.fillRect(405,58,150,7);ctx.globalAlpha=1;
}
function drawBall(b){ctx.save();ctx.fillStyle=b.critical?'#fff1a0':'#fff8da';ctx.shadowColor=b.critical?'#ffc84a':'#fff';ctx.shadowBlur=15;ctx.beginPath();ctx.arc(b.x,b.y,b.r,0,Math.PI*2);ctx.fill();ctx.restore();}
function drawHUD(){
  if(!game.player)return;const p=game.player;
  ctx.save();ctx.fillStyle='rgba(5,12,24,.78)';ctx.fillRect(0,0,960,54);ctx.font='900 14px Arial';ctx.fillStyle='#ffc84a';ctx.fillText(`ROUND ${game.level}/5`,25,23);ctx.fillStyle='#d9e6e8';ctx.font='bold 13px Arial';ctx.fillText(waveName(game.level).toUpperCase(),25,42);
  ctx.fillStyle='#728a9b';ctx.fillText('SCORE',720,21);ctx.fillStyle='#fff3bd';ctx.font='900 20px Arial';ctx.fillText(game.score,775,23);ctx.fillStyle='#728a9b';ctx.font='bold 11px Arial';ctx.fillText('BEST '+game.best,850,22);
  ctx.fillStyle='#271d2c';ctx.fillRect(320,18,230,12);ctx.fillStyle=p.hp>35?'#6df0ae':'#ff5f63';ctx.fillRect(320,18,230*Math.max(0,p.hp/p.maxHp),12);ctx.strokeStyle='#d6f6df';ctx.strokeRect(320,18,230,12);ctx.fillStyle='#fff';ctx.font='bold 11px Arial';ctx.fillText(`JUICE ${Math.ceil(Math.max(0,p.hp))}/${p.maxHp}`,385,28);
  ctx.fillStyle='#91a9b6';ctx.font='bold 10px Arial';ctx.fillText(`POWER ${p.power}  CRIT ${Math.round(p.crit*100)}%`,320,46);ctx.restore();
}
function render(){
  ctx.save();if(game.shake>0)ctx.translate((Math.random()-.5)*game.shake*55,(Math.random()-.5)*game.shake*55);drawArena();
  for(const p of game.pickups)p.draw(ctx);for(const b of game.balls)drawBall(b);for(const s of game.enemyShots)s.draw(ctx);for(const e of game.enemies)e.draw(ctx);if(game.player)game.player.draw(ctx);particles.draw(ctx);drawHUD();
  if(game.bannerTime>0&&game.state==='playing'){ctx.save();ctx.globalAlpha=Math.min(1,game.bannerTime<.5?game.bannerTime*2:1);ctx.fillStyle='rgba(5,12,24,.72)';ctx.fillRect(250,270,460,65);ctx.fillStyle='#63d9ff';ctx.font='900 13px Arial';ctx.textAlign='center';ctx.fillText('ENTER THE ARENA',480,294);ctx.fillStyle='#fff6d1';ctx.font='900 25px Arial';ctx.fillText(game.banner,480,320);ctx.restore();}
  ctx.restore();if(game.flash>0){ctx.fillStyle=`rgba(255,235,180,${game.flash*2})`;ctx.fillRect(0,0,960,600);}
}
ui.bind({start:startGame,resume:pause,menu:toMenu});ui.showMenu(game.best);
let last=performance.now(),acc=0;const step=1/60;
function loop(now){let dt=Math.min(.1,(now-last)/1000);last=now;acc+=dt;if(input.consumePause()&&(game.state==='playing'||game.state==='paused'))pause();while(acc>=step){update(step);acc-=step;}render();requestAnimationFrame(loop);}
requestAnimationFrame(loop);