import { Input } from './input.js';
import { AudioEngine } from './audio.js';
import { ParticleSystem } from './particles.js';
import { Maze } from './maze.js';
import { Player, Pim } from './entities.js';
import { UI } from './ui.js';

class Game {
  constructor(){
    this.canvas=document.getElementById('gameCanvas');this.ctx=this.canvas.getContext('2d');this.input=new Input();this.audio=new AudioEngine();this.particles=new ParticleSystem();
    this.state='title';this.level=1;this.score=0;this.hearts=3;this.shards=[];this.pickups=[];this.waves=[];this.shake=0;this.last=performance.now();this.acc=0;this.resize();window.addEventListener('resize',()=>this.resize());
    this.ui=new UI({start:()=>this.startCampaign(),resume:()=>this.setState('playing'),pause:()=>this.togglePause(),menu:()=>this.toMenu(),next:()=>this.nextLevel(),retry:()=>this.startCampaign()});
    this.ui.title(this.best());requestAnimationFrame(t=>this.loop(t));
  }
  best(){return Number(localStorage.getItem('pimMazeBest')||0)}
  saveBest(){if(this.score>this.best())localStorage.setItem('pimMazeBest',String(this.score));}
  resize(){const w=this.canvas.clientWidth,h=this.canvas.clientHeight,d=Math.min(window.devicePixelRatio||1,2);this.W=w;this.H=h;this.canvas.width=w*d;this.canvas.height=h*d;this.ctx.setTransform(d,0,0,d,0,0);}
  layout(){const t=Math.min((this.W-46)/this.maze.cols,(this.H-116)/this.maze.rows);return {t,ox:(this.W-this.maze.cols*t)/2,oy:(this.H-this.maze.rows*t)/2+22};}
  setState(state){this.state=state;if(state==='playing'){this.audio.startMusic();this.ui.playing();}else if(state==='paused')this.ui.paused();}
  startCampaign(){this.audio.ensure();this.audio.startMusic();this.level=1;this.score=0;this.hearts=3;this.makeLevel();this.setState('playing');this.audio.click();}
  makeLevel(){const cols=Math.min(25,15+(this.level-1)*2),rows=Math.min(21,11+(this.level-1)*2);this.maze=new Maze(cols,rows);const start={x:1,y:1};const points=this.maze.scattered(5,start);this.exit=points[0];this.shards=points.slice(1,4).map(c=>({x:c.x+.5,y:c.y+.5,got:false,spin:Math.random()*6}));this.pickups=[{x:points[4].x+.5,y:points[4].y+.5,got:false}];const pimCell=this.maze.scattered(1,start,[this.exit,...this.shards.map(s=>({x:Math.floor(s.x),y:Math.floor(s.y)})),points[4]])[0];this.player=new Player(start);this.player.quacks=Math.min(3,1+Math.floor(this.level/3));this.pim=new Pim(pimCell,this.level);this.levelTime=0;this.updateHud();}
  nextLevel(){this.level++;this.makeLevel();this.setState('playing');this.audio.level();}
  toMenu(){this.audio.stopMusic();this.input.clear();this.state='title';this.ui.title(this.best());}
  togglePause(){if(this.state==='playing')this.setState('paused');else if(this.state==='paused')this.setState('playing');}
  loop(now){let dt=Math.min(.1,(now-this.last)/1000);this.last=now;this.acc+=dt;while(this.acc>=1/60){this.fixedUpdate(1/60);this.acc-=1/60;}this.render();requestAnimationFrame(t=>this.loop(t));}
  fixedUpdate(dt){
    if(this.input.consume('pause'))this.togglePause();
    if(this.state!=='playing')return;
    this.levelTime+=dt;
    if(this.input.consume('quack'))this.quack();
    const axis=this.input.axis();this.player.update(dt,this.maze,axis,this.input.sprinting());this.pim.update(dt,this.maze,this.player);
    for(const shard of this.shards)if(!shard.got&&this.dist(this.player,shard)<.58){shard.got=true;this.score+=100*this.level;this.particles.burst(shard.x,shard.y,'#77edff',20,1.3);this.audio.pickup();}
    for(const item of this.pickups)if(!item.got&&this.dist(this.player,item)<.58){item.got=true;this.player.quacks=Math.min(5,this.player.quacks+1);this.score+=50;this.particles.burst(item.x,item.y,'#ff70b4',18,1.1);this.audio.pickup();}
    if(this.shards.every(s=>s.got)&&this.dist(this.player,{x:this.exit.x+.5,y:this.exit.y+.5})<.72)this.clearLevel();
    if(this.dist(this.player,this.pim)<.57&&this.player.invuln<=0){this.hearts--;this.shake=.65;this.audio.hit();this.particles.burst(this.player.x,this.player.y,'#ff3b96',28,1.5);if(this.hearts<=0)this.gameOver();else{this.player.respawn();this.pim.reset();}}
    this.particles.update(dt);for(const w of this.waves){w.r+=dt*5;w.life-=dt;}this.waves=this.waves.filter(w=>w.life>0);this.shake=Math.max(0,this.shake-dt*1.8);this.updateHud();
  }
  dist(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
  quack(){if(this.player.quacks<=0){this.audio.click();return;}this.player.quacks--;this.audio.quack();this.waves.push({x:this.player.x,y:this.player.y,r:.2,life:.8});this.particles.burst(this.player.x,this.player.y,'#ff80c2',30,1.7);if(this.dist(this.player,this.pim)<3.4){this.pim.stun=2.6;this.score+=25;this.particles.burst(this.pim.x,this.pim.y,'#ffd45b',24,1.4);}this.shake=.18;this.updateHud();}
  clearLevel(){this.score+=Math.max(0,500-Math.floor(this.levelTime*8));this.saveBest();this.audio.level();this.particles.burst(this.player.x,this.player.y,'#ffe06d',45,2);this.setState('win');this.ui.win(this.level,this.score);}
  gameOver(){this.saveBest();this.audio.stopMusic();this.audio.lose();this.state='gameover';this.ui.over(this.score,this.best());}
  updateHud(){if(this.player)this.ui.hudData(this.level,this.score,this.shards.filter(s=>s.got).length,this.shards.length,this.player.stamina,this.hearts,this.player.quacks);}
  toScreen(x,y){return{x:this.layout().ox+x*this.layout().t,y:this.layout().oy+y*this.layout().t,scale:this.layout().t}}
  render(){
    const c=this.ctx,L=this.maze?this.layout():null;c.clearRect(0,0,this.W,this.H);const bg=c.createLinearGradient(0,0,this.W,this.H);bg.addColorStop(0,'#0c071d');bg.addColorStop(.5,'#140a2b');bg.addColorStop(1,'#05040e');c.fillStyle=bg;c.fillRect(0,0,this.W,this.H);if(!L)return;
    c.save();if(this.shake){c.translate((Math.random()-.5)*this.shake*16,(Math.random()-.5)*this.shake*16);}this.maze.draw(c,L);this.drawExit(c,L);this.drawItems(c,L);this.pim.draw(c,L);
    const ps=this.toScreen(this.player.x,this.player.y);const fog=c.createRadialGradient(ps.x,ps.y, L.t*2.1,ps.x,ps.y,L.t*7.2);fog.addColorStop(0,'rgba(3,2,11,0)');fog.addColorStop(.55,'rgba(3,2,11,.12)');fog.addColorStop(1,'rgba(3,2,11,.82)');c.fillStyle=fog;c.fillRect(0,0,this.W,this.H);this.player.draw(c,L);this.drawWaves(c,L);this.particles.draw(c,p=>this.toScreen(p.x,p.y));c.restore();
  }
  drawExit(c,L){const x=L.ox+this.exit.x*L.t,y=L.oy+this.exit.y*L.t,open=this.shards.every(s=>s.got),pulse=1+Math.sin(performance.now()/240)*.08;c.save();c.translate(x+L.t/2,y+L.t/2);c.shadowColor=open?'#77f7e8':'#7049a7';c.shadowBlur=open?25:10;c.strokeStyle=open?'#77f7e8':'#70519d';c.lineWidth=3;c.beginPath();c.arc(0,0,L.t*.34*pulse,0,Math.PI*2);c.stroke();c.fillStyle=open?'rgba(80,255,219,.18)':'rgba(120,75,190,.1)';c.fill();c.fillStyle='#d9c8ff';c.font=`${L.t*.3}px Arial`;c.textAlign='center';c.textBaseline='middle';c.fillText('✦',0,1);c.restore();}
  drawItems(c,L){for(const s of this.shards)if(!s.got){s.spin+=.05;const p=this.toScreen(s.x,s.y),r=L.t*(.24+Math.sin(s.spin)*.04);c.save();c.translate(p.x,p.y);c.rotate(s.spin);c.shadowColor='#6defff';c.shadowBlur=22;c.fillStyle='#9ff7ff';c.beginPath();c.moveTo(0,-r);c.lineTo(r*.6,0);c.lineTo(0,r);c.lineTo(-r*.6,0);c.closePath();c.fill();c.restore();}for(const q of this.pickups)if(!q.got){const p=this.toScreen(q.x,q.y),r=L.t*.3;c.save();c.translate(p.x,p.y);c.shadowColor='#ff65b5';c.shadowBlur=19;c.fillStyle='#ff69b5';c.beginPath();c.arc(0,0,r,0,Math.PI*2);c.fill();c.fillStyle='#fff0a4';c.font=`bold ${L.t*.28}px Arial`;c.textAlign='center';c.textBaseline='middle';c.fillText('Q',0,1);c.restore();}}
  drawWaves(c,L){for(const w of this.waves){const p=this.toScreen(w.x,w.y);c.save();c.globalAlpha=w.life/.8;c.strokeStyle='#ff82c4';c.lineWidth=3;c.shadowColor='#ff4fa3';c.shadowBlur=15;c.beginPath();c.arc(p.x,p.y,w.r*L.t,0,Math.PI*2);c.stroke();c.restore();}}
}
new Game();