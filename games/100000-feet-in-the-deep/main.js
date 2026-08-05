import { Input } from './input.js';
import { AudioEngine } from './audio.js';
import { ParticleSystem } from './particles.js';
import { Player } from './player.js';
import { Hazard, Pearl, Projectile, IceCreamOctopus, spawnHazard } from './entities.js';
import { ZONE_LENGTH, TARGET_DEPTH, zoneFor, upgradeOptions } from './levels.js';
import { UI } from './ui.js';

class DeepGame {
  constructor(){
    this.canvas=document.getElementById('game-canvas');this.ctx=this.canvas.getContext('2d');this.width=innerWidth;this.height=innerHeight;this.dpr=1;this.resize();
    this.input=new Input();this.audio=new AudioEngine();this.particles=new ParticleSystem();this.player=new Player();this.ui=new UI();
    this.state='menu';this.entities=[];this.boss=null;this.zone=0;this.depth=0;this.score=0;this.spawnTimer=0;this.pearlTimer=0;this.shake=0;this.flash=0;this.upgrades={};this.best=Number(localStorage.getItem('cookieSharkBest')||0);
    this.bindUI();this.ui.setMenuBest(this.best);this.last=performance.now();this.acc=0;requestAnimationFrame(t=>this.frame(t));
  }
  resize(){this.dpr=Math.min(2,devicePixelRatio||1);this.width=innerWidth;this.height=innerHeight;this.canvas.width=this.width*this.dpr;this.canvas.height=this.height*this.dpr;this.ctx.setTransform(this.dpr,0,0,this.dpr,0,0);}
  bindUI(){
    addEventListener('resize',()=>this.resize());
    document.getElementById('start-button').onclick=()=>this.start();document.getElementById('retry-button').onclick=()=>this.start();document.getElementById('win-button').onclick=()=>this.start();
    document.getElementById('pause-button').onclick=()=>this.togglePause();document.getElementById('resume-button').onclick=()=>this.togglePause();
    document.getElementById('pause-menu-button').onclick=()=>this.toMenu();document.getElementById('gameover-menu-button').onclick=()=>this.toMenu();
    for(const b of document.querySelectorAll('button'))b.addEventListener('click',()=>this.audio.boot(),{once:false});
  }
  start(){this.audio.boot();this.audio.startMusic();this.player.reset();this.player.x=this.width/2;this.player.y=this.height*.63;this.entities=[];this.boss=null;this.zone=0;this.depth=0;this.score=0;this.spawnTimer=.4;this.pearlTimer=.9;this.shake=0;this.flash=0;this.upgrades={};this.state='playing';this.ui.playing();}
  toMenu(){this.audio.stopMusic();this.state='menu';this.ui.hud.classList.add('hidden');this.ui.touch.classList.add('hidden');this.ui.showPanel('menu');this.ui.setMenuBest(this.best);}
  togglePause(){if(this.state==='playing'){this.state='pause';this.ui.showPanel('pause');this.ui.touch.classList.add('hidden');}else if(this.state==='pause'){this.state='playing';this.ui.playing();}this.audio.click();}
  frame(now){let delta=Math.min(.1,(now-this.last)/1000);this.last=now;this.acc+=delta;let loops=0;while(this.acc>=1/60&&loops<6){this.fixedUpdate(1/60);this.acc-=1/60;loops++;}this.draw();requestAnimationFrame(t=>this.frame(t));}
  fixedUpdate(dt){if(this.input.consumePause()&&(this.state==='playing'||this.state==='pause'))this.togglePause();if(this.state!=='playing'){this.particles.update(dt);return;}
    this.shake=Math.max(0,this.shake-dt*28);this.flash=Math.max(0,this.flash-dt);this.particles.update(dt);this.player.update(dt,this.input,this.width,this.height,this);
    const bossThreshold=(this.zone+1)*ZONE_LENGTH-2300;
    if(!this.boss&&this.depth>=bossThreshold){this.boss=new IceCreamOctopus(this.width/2,this.zone);this.entities.push(this.boss);this.audio.boss();this.particles.burst(this.width/2,155,'#ff9dcc',25,180);}
    if(this.boss&&this.depth>(this.zone+1)*ZONE_LENGTH-550)this.depth=(this.zone+1)*ZONE_LENGTH-550;else this.depth+=((this.boss?250:440)+this.zone*35)*dt;
    this.spawnTimer-=dt;this.pearlTimer-=dt;
    if(!this.boss&&this.spawnTimer<=0){this.spawnTimer=Math.max(.45,1.12-this.zone*.1);this.entities.push(spawnHazard(this.width,this.zone));}
    if(this.pearlTimer<=0){this.pearlTimer=1.5+Math.random()*1.2;this.entities.push(new Pearl(35+Math.random()*(this.width-70),-20,this.zone));}
    for(const e of this.entities)e.update(dt,this);
    this.collisions();this.entities=this.entities.filter(e=>!e.dead);
    if(this.boss&&this.boss.dead&&this.state==='playing')this.finishZone();
    this.ui.hudData(this.depth,this.score,this.player.health,this.player.maxHealth,zoneFor(this.zone).name,this.boss&&!this.boss.dead?this.boss:null);
    if(this.player.health<=0)this.gameOver();
  }
  collisions(){for(const e of this.entities){if(e.dead)continue;const dist=Math.hypot(e.x-this.player.x,e.y-this.player.y);
      if(e instanceof Pearl&&dist<e.radius+this.player.radius){e.dead=true;this.score+=100+this.zone*30;this.audio.pickup();this.particles.burst(e.x,e.y,'#ffe38d',18,190);}
      else if(e instanceof Hazard&&dist<e.radius+this.player.radius){e.dead=true;this.player.hurt(this);}
      else if(e instanceof Projectile&&dist<e.radius+this.player.radius){e.dead=true;this.player.hurt(this);}
      else if(e instanceof IceCreamOctopus&&this.player.dashTime>0&&dist<e.radius+this.player.radius){e.damage(this.player.dashDamage,this);}
    }}
  finishZone(){this.entities=this.entities.filter(e=>!(e instanceof IceCreamOctopus));this.boss=null;this.score+=500*(this.zone+1);if(this.zone>=4){this.depth=TARGET_DEPTH;this.win();return;}this.state='upgrade';this.ui.touch.classList.add('hidden');this.ui.showPanel('upgrade');this.ui.upgrade(upgradeOptions(),id=>this.chooseUpgrade(id));this.audio.upgrade();}
  chooseUpgrade(id){if(id==='armor'){this.upgrades.armor=true;this.player.maxHealth++;this.player.health=Math.min(this.player.maxHealth,this.player.health+1);}if(id==='fins'){this.upgrades.fins={cooldown:.75};this.player.speed*=1.2;}if(id==='bite'){this.upgrades.bite=true;this.player.dashDamage*=2;}this.zone++;this.depth=this.zone*ZONE_LENGTH+100;this.spawnTimer=1;this.pearlTimer=.4;this.state='playing';this.ui.playing();this.audio.click();}
  gameOver(){if(this.state==='gameover')return;this.state='gameover';this.audio.stopMusic();this.audio.lose();this.best=Math.max(this.best,this.depth);localStorage.setItem('cookieSharkBest',this.best);this.ui.result('gameover',this.depth,this.score,this.best);this.ui.showPanel('gameover');this.ui.touch.classList.add('hidden');this.ui.hud.classList.add('hidden');}
  win(){this.state='win';this.audio.stopMusic();this.audio.win();this.best=Math.max(this.best,TARGET_DEPTH);localStorage.setItem('cookieSharkBest',this.best);this.ui.result('win',TARGET_DEPTH,this.score,this.best);this.ui.showPanel('win');this.ui.touch.classList.add('hidden');this.ui.hud.classList.add('hidden');}
  draw(){const ctx=this.ctx,z=zoneFor(this.zone);ctx.save();let g=ctx.createLinearGradient(0,0,0,this.height);g.addColorStop(0,z.colors[0]);g.addColorStop(1,z.colors[1]);ctx.fillStyle=g;ctx.fillRect(0,0,this.width,this.height);
    this.drawWater(ctx,z);let sx=this.shake?(Math.random()-.5)*this.shake:0,sy=this.shake?(Math.random()-.5)*this.shake:0;ctx.translate(sx,sy);for(const e of this.entities)e.draw(ctx);this.particles.draw(ctx);this.player.draw(ctx);ctx.restore();
    if(this.flash>0){ctx.fillStyle=`rgba(255,238,184,${this.flash*2})`;ctx.fillRect(0,0,this.width,this.height);} }
  drawWater(ctx,z){ctx.globalAlpha=.17;ctx.strokeStyle=z.accent;ctx.lineWidth=1;const offset=(this.depth*.08)%95;for(let y=-95+offset;y<this.height+95;y+=95){ctx.beginPath();ctx.moveTo(0,y);for(let x=0;x<this.width;x+=35)ctx.lineTo(x,y+Math.sin(x*.025+y*.03)*5);ctx.stroke();}for(let i=0;i<20;i++){const x=(i*137+this.depth*.025)%this.width,y=(i*83-this.depth*.17)%this.height,r=2+(i%4);ctx.fillStyle=i%3?'#b3edee':'#ffe39e';ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;const vignette=ctx.createRadialGradient(this.width/2,this.height*.45,80,this.width/2,this.height*.5,Math.max(this.width,this.height)*.75);vignette.addColorStop(0,'transparent');vignette.addColorStop(1,'rgba(1,5,25,.55)');ctx.fillStyle=vignette;ctx.fillRect(0,0,this.width,this.height);}
}
new DeepGame();