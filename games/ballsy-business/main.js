import { Input } from './input.js';
import { AudioManager } from './audio.js';
import { UI } from './ui.js';
import { Game } from './game.js';
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
const ui=new UI(),audio=new AudioManager();
const input=new Input(canvas,document.getElementById('joystick'),document.getElementById('stick'),document.getElementById('dashButton'));
const game=new Game(input,audio);let state='menu';let best=Number(localStorage.getItem('ballsy-business-best')||0);
function begin(){audio.init();audio.startMusic();game.start();state='playing';ui.playing();ui.update(game);audio.click();}
function toMenu(){audio.stopMusic();state='menu';ui.menu(best);}
function pause(){if(state==='playing'){state='paused';ui.paused();audio.click();}else if(state==='paused'){state='playing';ui.playing();audio.click();}}
function finish(win){state=win?'won':'gameover';audio.stopMusic();if(!win)audio.fail();best=Math.max(best,Math.floor(game.score));localStorage.setItem('ballsy-business-best',best);ui.end(win,Math.floor(game.score),best);}
game.on('waveClear',()=>{state='upgrade';ui.showUpgrade(game.getUpgradeOptions(),id=>{game.applyUpgrade(id);game.nextWave();if(state!=='won'){state='playing';ui.playing();ui.update(game);}});});
game.on('gameOver',()=>finish(false));game.on('win',()=>finish(true));
document.getElementById('startButton').onclick=begin;document.getElementById('restartButton').onclick=begin;document.getElementById('resumeButton').onclick=pause;document.getElementById('pauseButton').onclick=pause;document.getElementById('pauseMenuButton').onclick=toMenu;document.getElementById('endMenuButton').onclick=toMenu;
window.addEventListener('keydown',e=>{if(e.key.toLowerCase()==='p'||e.key==='Escape')pause();if(e.key==='Enter'&&(state==='menu'||state==='gameover'||state==='won'))begin();});
let last=performance.now(),acc=0;const fixed=1/120;
function frame(now){const dt=Math.min(.05,(now-last)/1000);last=now;if(state==='playing'){acc+=dt;while(acc>=fixed){game.update(fixed);acc-=fixed;}ui.update(game);}else acc=0;game.draw(ctx,now/1000);requestAnimationFrame(frame);}requestAnimationFrame(frame);ui.menu(best);