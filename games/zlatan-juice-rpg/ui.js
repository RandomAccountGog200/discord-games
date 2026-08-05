export class UI {
  constructor(){
    this.panels={menu:document.querySelector('#menu'),pause:document.querySelector('#pause'),upgrade:document.querySelector('#upgrade'),gameOver:document.querySelector('#gameOver'),win:document.querySelector('#win')};
    this.best=document.querySelector('#menuBest');
  }
  hideAll(){Object.values(this.panels).forEach(p=>p.classList.add('hidden'));}
  showMenu(best){this.hideAll();this.panels.menu.classList.remove('hidden');this.best.textContent=best;}
  showPause(){this.hideAll();this.panels.pause.classList.remove('hidden');}
  showUpgrade(options,choose){this.hideAll();const box=document.querySelector('#upgradeChoices');box.innerHTML='';options.forEach(o=>{const b=document.createElement('button');b.className='choice';b.innerHTML=`<b>${o.name}</b><small>${o.description}</small>`;b.onclick=()=>choose(o);box.appendChild(b);});this.panels.upgrade.classList.remove('hidden');}
  showGameOver(score,best){this.hideAll();document.querySelector('#gameOverScore').textContent=score;document.querySelector('#gameOverBest').textContent=best;this.panels.gameOver.classList.remove('hidden');}
  showWin(score,best){this.hideAll();document.querySelector('#winScore').textContent=score;document.querySelector('#winBest').textContent=best;this.panels.win.classList.remove('hidden');}
  bind(callbacks){
    document.querySelector('#startButton').onclick=callbacks.start;document.querySelector('#resumeButton').onclick=callbacks.resume;document.querySelector('#pauseMenuButton').onclick=callbacks.menu;
    document.querySelector('#retryButton').onclick=callbacks.start;document.querySelector('#gameOverMenuButton').onclick=callbacks.menu;document.querySelector('#winRetryButton').onclick=callbacks.start;document.querySelector('#winMenuButton').onclick=callbacks.menu;
  }
}