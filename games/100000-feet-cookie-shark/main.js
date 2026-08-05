import { Input } from './input.js';
import { AudioManager } from './audio.js';
import { ParticleSystem } from './particles.js';
import { Player } from './player.js';
import { Projectile, CookieShark, Jellyfish, CookieMine, Sprinkle, circleHit } from './entities.js';
import { zoneConfig, depthZone, zoneProgress } from './levels.js';
import { showScreen, setMenuStats, updateHUD, showUpgrade, showResult } from './ui.js';

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const input = new Input(canvas);
const audio = new AudioManager();
let state = 'menu';
let model = null;
let last = performance.now();
let accumulator = 0;
let time = 0;

const upgrades = [
  {id:'health',icon:'❤',name:'DOUBLE SCOOP',desc:'+1 maximum health and restore it.',apply:p=>{p.maxHp++;p.hp=p.maxHp;}},
  {id:'speed',icon:'⚡',name:'TURBO CONE',desc:'Steering is 28% faster and more agile.',apply:p=>{p.maxSpeed+=78;p.accel+=180;}},
  {id:'cannon',icon:'✦',name:'SPRINKLE CANNON',desc:'Scoop-shots deal +1 damage.',apply:p=>{p.damage++;}},
  {id:'rapid',icon:'☄',name:'RAPID SWIRL',desc:'Fire 22% faster. More shots, more skill.',apply:p=>{p.fireRate*=.78;}},
  {id:'shield',icon:'◇',name:'FROZEN SHIELD',desc:'The next two collisions are harmless.',apply:p=>{p.shield+=2;}},
  {id:'magnet',icon:'✧',name:'SPRINKLE MAGNET',desc:'Collectible sprinkles pull in from farther away.',apply:p=>{p.magnet+=18;}}
];

function resize() {
  const r = canvas.getBoundingClientRect();
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.max(1, Math.floor(r.width * dpr)); canvas.height = Math.max(1, Math.floor(r.height * dpr));
  if (model) { model.width = r.width; model.height = r.height; model.player.y = r.height * .7; }
}
window.addEventListener('resize', resize);

function newGame() {
  model = {width:canvas.clientWidth,height:canvas.clientHeight,depth:0,score:0,kills:0,sprinkles:0,entities:[],projectiles:[],particles:new ParticleSystem(),player:new Player(),baseScroll:78,scrollSpeed:78,currentZone:0,spawnTimer:.5,shake:0,hitFlash:0,win:false};
  model.player.reset(model.width*.5, model.height*.7);
  resize();
}
function begin() {
  audio.click(); audio.startMusic(); newGame(); state='playing'; showScreen('playing');
}
function bestData() { return {depth:Number(localStorage.getItem('cookieSharkDepth')||0),score:Number(localStorage.getItem('cookieSharkScore')||0)}; }
function saveBest() {
  const old=bestData();
  if(model.depth>old.depth) localStorage.setItem('cookieSharkDepth',String(Math.floor(model.depth)));
  if(model.score>old.score) localStorage.setItem('cookieSharkScore',String(model.score));
}
function finish(win=false) {
  if (state==='gameover') return;
  model.win=win; if(win){model.depth=100000;audio.win();model.particles.burst(model.width/2,model.height*.45,'#ffe18a',70,250);} saveBest();state='gameover';showResult(win,model);
}
function pause() { if(state==='playing'){state='paused';showScreen('pause');audio.click();} }
function resume() { if(state==='paused'){state='playing';showScreen('playing');audio.click();} }
function openUpgrade(nextZone) {
  state='upgrade'; audio.upgrade(); model.particles.burst(model.width*.5,model.height*.35,'#ffe18a',30,120);
  const picked=[...upgrades].sort(()=>Math.random()-.5).slice(0,3);
  showUpgrade(zoneConfig(nextZone),picked);
}
function applyUpgrade(id) {
  const u=upgrades.find(x=>x.id===id); if(!u||state!=='upgrade') return;
  u.apply(model.player); audio.click(); state='playing'; showScreen('playing');
}
function spawnEntity() {
  const cfg=zoneConfig(model.currentZone); const x=38+Math.random()*(model.width-76); const y=-35-Math.random()*50;
  const type=cfg.hazards[Math.floor(Math.random()*cfg.hazards.length)];
  if(type==='shark') model.entities.push(new CookieShark(x,y,cfg.hp,model.currentZone));
  else if(type==='jelly') model.entities.push(new Jellyfish(x,y,Math.max(1,cfg.hp-1)));
  else model.entities.push(new CookieMine(x,y,Math.max(1,cfg.hp-1)));
  if(Math.random()<.3) model.entities.push(new Sprinkle(35+Math.random()*(model.width-70),y-75-Math.random()*80));
}
function fire(x,y,speed,damage) { if(model.projectiles.length<45) model.projectiles.push(new Projectile(x,y,speed,damage)); }
function update(dt) {
  if(!model) return;
  const cfg=zoneConfig(model.currentZone); model.baseScroll=cfg.scrollSpeed;
  model.player.update(dt,input,model); model.depth+=model.scrollSpeed*dt;
  model.spawnTimer-=dt;
  if(model.spawnTimer<=0){spawnEntity();model.spawnTimer=cfg.interval*(.72+Math.random()*.55);}
  for(const p of model.projectiles)p.update(dt);
  for(const e of model.entities)e.update(dt,model);
  for(const p of model.projectiles){
    if(p.dead)continue;
    for(const e of model.entities){if(!e.dead&&e.isHazard&&circleHit(p,e)){p.dead=true;e.hit(p.damage,model);break;}}
  }
  for(const e of model.entities){
    if(e.dead)continue;
    if(e instanceof Sprinkle){
      const reach=model.player.radius+e.radius+model.player.magnet;
      const dx=model.player.x-e.x,dy=model.player.y-e.y;
      if(dx*dx+dy*dy<reach*reach){e.dead=true;model.sprinkles++;model.score+=35;model.particles.burst(e.x,e.y,e.hue,10,90);audio.pickup();}
    } else if(e.isHazard&&circleHit(model.player,e)&&e.hitCooldown<=0){e.hitCooldown=.8;if(model.player.hurt(model))e.dead=true;}
  }
  model.projectiles=model.projectiles.filter(p=>!p.dead);model.entities=model.entities.filter(e=>!e.dead);model.particles.update(dt);
  model.score=Math.max(model.score,Math.floor(model.depth*.8)+model.kills*120+model.sprinkles*35);
  const reached=depthZone(model.depth);
  if(reached>model.currentZone){
    if(model.depth>=100000){finish(true);return;}
    model.currentZone=reached;openUpgrade(reached);return;
  }
  if(model.depth>=100000){finish(true);return;}
  model.shake=Math.max(0,model.shake-dt*28);model.hitFlash=Math.max(0,model.hitFlash-dt);
  updateHUD(model,zoneConfig(model.currentZone),zoneProgress(model.depth));
}
function drawBackground(c,w,h,depth,cfg) {
  const gradient=c.createLinearGradient(0,0,0,h);gradient.addColorStop(0,cfg.colorB);gradient.addColorStop(1,cfg.colorA);c.fillStyle=gradient;c.fillRect(0,0,w,h);
  const glow=c.createRadialGradient(w*.5,h*.05,0,w*.5,h*.05,h*.8);glow.addColorStop(0,'#80f8ef16');glow.addColorStop(1,'transparent');c.fillStyle=glow;c.fillRect(0,0,w,h);
  c.globalAlpha=.11;c.strokeStyle='#8ce9e9';c.lineWidth=2;for(let x=-h;x<w+h;x+=110){c.beginPath();c.moveTo(x,0);c.lineTo(x+h*.32,h);c.stroke()}c.globalAlpha=1;
  for(let i=0;i<25;i++){const x=((i*97+31)%Math.max(1,w));const y=((i*173-depth*(.18+(i%4)*.04))%(h+100)+h+100)%(h+100)-50;const r=2+(i%4)*1.4;c.fillStyle=i%5===0?'#ffe29b55':'#9ceff033';c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();}
  c.globalAlpha=.25;c.fillStyle='#071225';for(let i=0;i<7;i++){const x=(i+.5)*w/7;const y=h*.88+(i%2)*12;c.beginPath();c.moveTo(x-55,y+60);c.quadraticCurveTo(x-20,y-25,x,y);c.quadraticCurveTo(x+20,y-38,x+55,y+60);c.fill();}c.globalAlpha=1;
}
function draw() {
  if(!model)return;const dpr=Math.min(2,window.devicePixelRatio||1);ctx.setTransform(dpr,0,0,dpr,0,0);const w=model.width,h=model.height;ctx.clearRect(0,0,w,h);
  const cfg=zoneConfig(model.currentZone);ctx.save();if(model.shake>0)ctx.translate((Math.random()-.5)*model.shake,(Math.random()-.5)*model.shake);drawBackground(ctx,w,h,model.depth,cfg);for(const e of model.entities)e.draw(ctx);for(const p of model.projectiles)p.draw(ctx);model.player.draw(ctx,time);model.particles.draw(ctx);ctx.restore();
  if(model.hitFlash>0){ctx.fillStyle=`rgba(255,90,115,${model.hitFlash*.55})`;ctx.fillRect(0,0,w,h);}
}

document.getElementById('start-button').addEventListener('click',begin);
document.getElementById('restart-button').addEventListener('click',begin);
document.getElementById('pause-button').addEventListener('click',pause);
document.getElementById('resume-button').addEventListener('click',resume);
document.getElementById('quit-button').addEventListener('click',()=>{state='menu';audio.stopMusic();setMenuStats(bestData().depth,bestData().score);showScreen('menu');});
document.getElementById('menu-button').addEventListener('click',()=>{state='menu';audio.stopMusic();setMenuStats(bestData().depth,bestData().score);showScreen('menu');});
document.getElementById('upgrade-cards').addEventListener('click',e=>{const card=e.target.closest('[data-upgrade]');if(card)applyUpgrade(card.dataset.upgrade);});
window.addEventListener('keydown',e=>{if(e.code==='KeyP'||e.code==='Escape'){if(state==='playing')pause();else if(state==='paused')resume();}if(e.code==='Enter'&&state==='menu')begin();});

newGame();setMenuStats(bestData().depth,bestData().score);showScreen('menu');
function loop(now){const frame=Math.min(.1,(now-last)/1000);last=now;accumulator+=frame;while(accumulator>=1/60){if(state==='playing')update(1/60);accumulator-=1/60;}time+=frame;draw();requestAnimationFrame(loop);}
requestAnimationFrame(loop);